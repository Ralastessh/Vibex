from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from src.agents.base import AgentProgress, AgentRunResult, ProgressCallback
from src.agents.codex_app_server import (
    CodexAppServerClient,
    CodexAppServerError,
    CodexAppServerUnavailable,
    error_text,
)
from src.agents.contract import ContractError, extract
from src.tasks.models import ActivityItem

logger = logging.getLogger("bridge.agents.codex")

THREAD_SOURCE_KINDS = ["vscode", "cli", "appServer"]


def sessions_root() -> Path:
    return Path.home() / ".codex" / "sessions"


@dataclass(frozen=True)
class CodexSession:
    session_id: str
    cwd: Path
    source: str
    rollout_path: Path
    modified_at: float


def _session_metadata(path: Path) -> CodexSession | None:
    try:
        with path.open("r", encoding="utf-8") as stream:
            first = json.loads(stream.readline())
        payload = first.get("payload") or {}
        session_id = payload.get("session_id") or payload.get("id")
        cwd = payload.get("cwd")
        if session_id and cwd:
            return CodexSession(
                session_id=str(session_id),
                cwd=Path(cwd).expanduser().resolve(),
                source=str(payload.get("source") or "unknown"),
                rollout_path=path,
                modified_at=path.stat().st_mtime,
            )
    except (OSError, ValueError, TypeError, json.JSONDecodeError):
        return None
    return None


class CodexThreadOutsideProjectError(LookupError):
    """선택한 thread가 요청한 프로젝트 cwd에 속하지 않는다."""


def _text(value: Any) -> str:
    """App Server의 문자열/배열 content를 사람이 읽을 수 있는 텍스트로 합친다."""
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return "\n".join(filter(None, (_text(item) for item in value)))
    if isinstance(value, dict):
        for key in ("text", "summary", "content", "message", "error", "result"):
            if key in value:
                rendered = _text(value[key])
                if rendered:
                    return rendered
    return ""


class _ProgressCollector:
    """App Server 알림을 Task가 보관할 누적 스냅샷으로 정규화한다."""

    def __init__(self, callback: ProgressCallback | None) -> None:
        self._callback = callback
        self._messages: dict[str, str] = {}
        self._items: dict[str, ActivityItem] = {}
        self._thread_id: str | None = None
        self._turn_id: str | None = None

    @property
    def agent_reply(self) -> str:
        return "\n\n".join(text for text in self._messages.values() if text)

    @property
    def activity_items(self) -> list[ActivityItem]:
        return [item.model_copy(deep=True) for item in self._items.values()]

    def set_context(self, thread_id: str, turn_id: str) -> None:
        self._thread_id = thread_id
        self._turn_id = turn_id
        self._emit()

    def handle(self, event: dict[str, Any]) -> None:
        method = str(event.get("method") or "")
        params = event.get("params") or {}

        if method in {"item/started", "item/completed"}:
            item = params.get("item") or {}
            item_id = str(item.get("id") or params.get("itemId") or "")
            item_type = str(item.get("type") or "")
            if not item_id or not item_type:
                return
            if item_type == "agentMessage":
                self._messages[item_id] = str(item.get("text") or "")
                self._emit()
                return
            if item_type == "userMessage":
                return
            self._set_activity(
                item_id,
                item_type,
                item,
                lifecycle_status=(
                    "completed" if method == "item/completed" else "inProgress"
                ),
            )
            self._emit()
            return

        item_id = str(params.get("itemId") or "")
        delta = str(params.get("delta") or "")
        if method == "item/agentMessage/delta" and item_id:
            self._messages.setdefault(item_id, "")
            self._messages[item_id] += delta
            self._emit()
            return

        if method in {
            "item/reasoning/summaryTextDelta",
            "item/reasoning/textDelta",
            "item/reasoning/summaryPartAdded",
        } and item_id:
            current = self._activity(item_id, "reasoning")
            separator = (
                "\n\n"
                if method.endswith("summaryPartAdded") and current.text
                else ""
            )
            self._items[item_id] = current.model_copy(
                update={"text": current.text + separator + delta}
            )
            self._emit()
            return

        if method == "item/commandExecution/outputDelta" and item_id:
            current = self._activity(item_id, "commandExecution")
            self._items[item_id] = current.model_copy(
                update={"output": current.output + delta}
            )
            self._emit()
            return

        if method == "item/plan/delta" and item_id:
            current = self._activity(item_id, "plan")
            self._items[item_id] = current.model_copy(
                update={"text": current.text + delta}
            )
            self._emit()

    def _activity(self, item_id: str, item_type: str) -> ActivityItem:
        current = self._items.get(item_id)
        if current is not None:
            return current
        current = ActivityItem(itemId=item_id, type=item_type)
        self._items[item_id] = current
        return current

    def _set_activity(
        self,
        item_id: str,
        item_type: str,
        data: dict[str, Any],
        *,
        lifecycle_status: str,
    ) -> None:
        current = self._activity(item_id, item_type)
        rendered = ""
        if item_type == "reasoning":
            rendered = _text(data.get("summary")) or _text(data.get("content"))
        elif item_type == "plan":
            rendered = _text(data.get("text"))
        elif item_type in {
            "mcpToolCall",
            "dynamicToolCall",
            "collabToolCall",
            "webSearch",
            "imageView",
            "enteredReviewMode",
            "exitedReviewMode",
        }:
            rendered = (
                _text(data.get("result"))
                or _text(data.get("error"))
                or _text(data.get("review"))
            )
        output = _text(data.get("aggregatedOutput")) or current.output
        self._items[item_id] = ActivityItem(
            itemId=item_id,
            type=item_type,
            status=str(data.get("status") or lifecycle_status),
            text=rendered or current.text,
            output=output,
            data=dict(data),
        )

    def _emit(self) -> None:
        if self._callback is None:
            return
        try:
            self._callback(
                AgentProgress(
                    agent_reply=self.agent_reply,
                    activity_items=self.activity_items,
                    threadId=self._thread_id,
                    turnId=self._turn_id,
                )
            )
        except Exception:
            logger.debug("Codex 진행 이벤트 전달 실패", exc_info=True)


class CodexCLIAdapter:
    """Codex App Server를 통해 VS Code/CLI와 같은 thread 저장소를 사용한다."""

    def __init__(self, binary: str = "codex", *, timeout_seconds: float = 1800) -> None:
        self._binary = binary
        self._timeout = timeout_seconds

    def _command(self, speed_mode: str | None = None) -> list[str]:
        command = [self._binary, "app-server", "--stdio"]
        if speed_mode == "fast":
            command += ["-c", 'service_tier="fast"', "--enable", "fast_mode"]
        return command

    async def find_latest_session(self, repo_path: Path) -> str | None:
        """정확한 cwd의 세션을 찾되 VS Code 세션을 우선한다."""
        root = sessions_root()
        if not root.is_dir():
            return None
        target = repo_path.expanduser().resolve()

        def scan() -> str | None:
            candidates: list[CodexSession] = []
            for path in root.rglob("*.jsonl"):
                metadata = _session_metadata(path)
                if metadata is not None and metadata.cwd == target:
                    candidates.append(metadata)
            if not candidates:
                return None
            # 사용자가 PC로 돌아왔을 때 사이드바에서 그대로 이어갈 수 있도록
            # VS Code가 만든 thread를 다른 interactive thread보다 먼저 선택한다.
            selected = max(
                candidates,
                key=lambda item: (item.source == "vscode", item.modified_at),
            )
            return selected.session_id

        return await asyncio.to_thread(scan)

    def _client(
        self,
        repo_path: Path,
        *,
        speed_mode: str | None = None,
        timeout_seconds: float | None = None,
    ) -> CodexAppServerClient:
        return CodexAppServerClient(
            self._command(speed_mode),
            cwd=repo_path,
            timeout_seconds=(
                self._timeout if timeout_seconds is None else timeout_seconds
            ),
        )

    @staticmethod
    def _validate_thread_cwd(thread: dict[str, Any], repo_path: Path) -> None:
        raw_cwd = thread.get("cwd")
        if not isinstance(raw_cwd, str) or not raw_cwd:
            raise CodexThreadOutsideProjectError("thread cwd가 없습니다.")
        try:
            thread_cwd = Path(raw_cwd).expanduser().resolve()
        except (OSError, ValueError) as exc:
            raise CodexThreadOutsideProjectError("thread cwd가 올바르지 않습니다.") from exc
        if thread_cwd != repo_path.expanduser().resolve():
            raise CodexThreadOutsideProjectError(
                "선택한 Codex thread가 이 프로젝트에 속하지 않습니다."
            )

    async def list_threads(
        self,
        repo_path: Path,
        *,
        cursor: str | None = None,
        limit: int = 30,
        search_term: str | None = None,
        archived: bool = False,
    ) -> dict[str, Any]:
        """VS Code·CLI·Vibex App Server thread를 정확한 cwd로 조회한다."""
        repo_path = repo_path.expanduser().resolve()
        params: dict[str, Any] = {
            "cursor": cursor,
            "limit": limit,
            "sortKey": "recency_at",
            "sortDirection": "desc",
            "sourceKinds": THREAD_SOURCE_KINDS,
            "archived": archived,
            "cwd": str(repo_path),
        }
        if search_term:
            params["searchTerm"] = search_term
        async with self._client(
            repo_path, timeout_seconds=min(self._timeout, 30)
        ) as client:
            result = await client.request("thread/list", params)

        data = result.get("data")
        if not isinstance(data, list):
            raise CodexAppServerError("thread/list 응답에 data 목록이 없습니다.")
        # cwd 필터는 App Server에서도 걸지만 응답 경계에서 한 번 더
        # 검증해 타 프로젝트 이력이 섞일 가능성을 막는다.
        filtered: list[dict[str, Any]] = []
        for item in data:
            if not isinstance(item, dict):
                continue
            try:
                self._validate_thread_cwd(item, repo_path)
            except CodexThreadOutsideProjectError:
                continue
            filtered.append(item)
        return {**result, "data": filtered}

    async def _read_thread(
        self,
        client: CodexAppServerClient,
        repo_path: Path,
        thread_id: str,
        *,
        include_turns: bool,
    ) -> dict[str, Any]:
        result = await client.request(
            "thread/read",
            {"threadId": thread_id, "includeTurns": include_turns},
        )
        thread = result.get("thread")
        if not isinstance(thread, dict):
            raise CodexAppServerError("thread/read 응답에 thread가 없습니다.")
        self._validate_thread_cwd(thread, repo_path)
        return thread

    async def read_thread(
        self,
        repo_path: Path,
        thread_id: str,
        *,
        include_turns: bool = True,
    ) -> dict[str, Any]:
        repo_path = repo_path.expanduser().resolve()
        async with self._client(
            repo_path, timeout_seconds=min(self._timeout, 30)
        ) as client:
            return await self._read_thread(
                client,
                repo_path,
                thread_id,
                include_turns=include_turns,
            )

    async def set_thread_name(
        self, repo_path: Path, thread_id: str, name: str
    ) -> None:
        repo_path = repo_path.expanduser().resolve()
        async with self._client(
            repo_path, timeout_seconds=min(self._timeout, 30)
        ) as client:
            await self._read_thread(
                client, repo_path, thread_id, include_turns=False
            )
            await client.request(
                "thread/name/set", {"threadId": thread_id, "name": name}
            )

    async def archive_thread(self, repo_path: Path, thread_id: str) -> None:
        repo_path = repo_path.expanduser().resolve()
        async with self._client(
            repo_path, timeout_seconds=min(self._timeout, 30)
        ) as client:
            await self._read_thread(
                client, repo_path, thread_id, include_turns=False
            )
            await client.request("thread/archive", {"threadId": thread_id})

    async def resume_and_run(
        self,
        repo_path: Path,
        session_id: str | None,
        prompt: str,
        *,
        test_commands: list[str] | None = None,
        image_paths: list[Path] | None = None,
        model: str | None = None,
        effort: str | None = None,
        speed_mode: str | None = None,
        on_progress: ProgressCallback | None = None,
    ) -> AgentRunResult:
        del test_commands  # 허용 테스트 명령은 prompt에 포함된다.
        repo_path = repo_path.expanduser().resolve()
        progress = _ProgressCollector(on_progress)
        active_thread_id = session_id
        active_turn_id: str | None = None

        try:
            # 작업마다 독립된 App Server transport를 사용하되, handshake와 JSONL
            # 처리는 목록/읽기 API와 완전히 같은 client 구현을 공유한다.
            async with self._client(repo_path, speed_mode=speed_mode) as client:
                deadline = client.deadline()
                if session_id:
                    thread_result = await client.request(
                        "thread/resume",
                        {
                            "threadId": session_id,
                            "cwd": str(repo_path),
                            "approvalPolicy": "never",
                        },
                        deadline=deadline,
                    )
                else:
                    thread_result = await client.request(
                        "thread/start",
                        {
                            "cwd": str(repo_path),
                            "approvalPolicy": "never",
                            "sandbox": "workspace-write",
                            "ephemeral": False,
                        },
                        deadline=deadline,
                    )

                thread = thread_result.get("thread") or {}
                active_thread_id = (
                    str(thread.get("id") or active_thread_id or "") or None
                )
                if active_thread_id is None:
                    raise CodexAppServerError(
                        "Codex가 thread id를 반환하지 않았습니다."
                    )

                inputs: list[dict[str, Any]] = [
                    {"type": "text", "text": prompt}
                ]
                inputs += [
                    {
                        "type": "localImage",
                        "path": str(path.expanduser().resolve()),
                    }
                    for path in (image_paths or [])
                ]
                turn_params: dict[str, Any] = {
                    "threadId": active_thread_id,
                    "input": inputs,
                    "cwd": str(repo_path),
                    "approvalPolicy": "never",
                    "sandboxPolicy": {
                        "type": "workspaceWrite",
                        "writableRoots": [str(repo_path)],
                        "networkAccess": False,
                    },
                }
                if model:
                    turn_params["model"] = model
                if effort:
                    turn_params["effort"] = effort
                turn_result = await client.request(
                    "turn/start", turn_params, deadline=deadline
                )
                active_turn_id = (
                    str((turn_result.get("turn") or {}).get("id") or "") or None
                )
                progress.set_context(active_thread_id, active_turn_id or "")

                while True:
                    event = await client.receive(deadline=deadline)
                    method = event.get("method")
                    params = event.get("params") or {}
                    if params.get("threadId") not in {None, active_thread_id}:
                        continue
                    progress.handle(event)
                    if method == "turn/completed":
                        turn = params.get("turn") or {}
                        if active_turn_id and turn.get("id") not in {
                            None,
                            active_turn_id,
                        }:
                            continue
                        status = turn.get("status")
                        if status == "completed":
                            break
                        raise CodexAppServerError(
                            error_text(
                                turn.get("error") or f"turn 상태: {status}"
                            )
                        )

            return self._result(
                active_thread_id,
                progress.agent_reply,
                turn_id=active_turn_id,
                activity_items=progress.activity_items,
            )
        except asyncio.TimeoutError:
            return AgentRunResult(
                session_id=active_thread_id,
                thread_id=active_thread_id,
                turn_id=active_turn_id,
                error=f"Codex가 {self._timeout:.0f}초 안에 작업을 끝내지 않았습니다.",
            )
        except (CodexAppServerError, CodexAppServerUnavailable, OSError) as exc:
            detail = str(exc)
            if "active writer" in detail or "thread-store conflict" in detail:
                detail = (
                    "선택된 Codex 세션이 현재 VS Code 또는 터미널에서 다른 작업을 "
                    "처리 중입니다. 그 작업이 끝난 뒤 다시 전송해 주세요. "
                    "Vibex는 대화를 보존하기 위해 새 세션으로 우회하지 않았습니다."
                )
            return AgentRunResult(
                session_id=active_thread_id,
                thread_id=active_thread_id,
                turn_id=active_turn_id,
                error=f"Codex 세션을 실행하지 못했습니다: {detail}",
            )

    def _result(
        self,
        session_id: str,
        raw_output: str,
        *,
        turn_id: str | None = None,
        activity_items: list[ActivityItem] | None = None,
    ) -> AgentRunResult:
        try:
            report = extract(raw_output)
        except ContractError as exc:
            return AgentRunResult(
                session_id=session_id,
                thread_id=session_id,
                turn_id=turn_id,
                raw_output=raw_output,
                activity_items=activity_items or [],
                error=str(exc),
            )
        return AgentRunResult(
            session_id=session_id,
            thread_id=session_id,
            turn_id=turn_id,
            report=report,
            ok=True,
            raw_output=raw_output,
            activity_items=activity_items or [],
        )
