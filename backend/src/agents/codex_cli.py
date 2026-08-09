from __future__ import annotations

import asyncio
import json
import logging
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from src.agents.base import AgentRunResult
from src.agents.contract import ContractError, extract

logger = logging.getLogger("bridge.agents.codex")


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


def _error_text(error: Any) -> str:
    if isinstance(error, dict):
        return str(error.get("message") or error.get("data") or error)
    return str(error)


class CodexCLIAdapter:
    """Codex App Server를 통해 VS Code/CLI와 같은 thread 저장소를 사용한다."""

    def __init__(self, binary: str = "codex", *, timeout_seconds: float = 1800) -> None:
        self._binary = binary
        self._timeout = timeout_seconds

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

    async def _send(
        self, process: asyncio.subprocess.Process, message: dict[str, Any]
    ) -> None:
        assert process.stdin is not None
        process.stdin.write(
            (json.dumps(message, ensure_ascii=False, separators=(",", ":")) + "\n").encode()
        )
        await process.stdin.drain()

    async def _read(
        self, process: asyncio.subprocess.Process, *, deadline: float
    ) -> dict[str, Any]:
        assert process.stdout is not None
        remaining = deadline - asyncio.get_running_loop().time()
        if remaining <= 0:
            raise asyncio.TimeoutError
        line = await asyncio.wait_for(process.stdout.readline(), timeout=remaining)
        if not line:
            raise EOFError("Codex App Server가 응답을 보내기 전에 종료되었습니다.")
        try:
            return json.loads(line)
        except json.JSONDecodeError as exc:
            raise RuntimeError("Codex App Server가 잘못된 JSON을 보냈습니다.") from exc

    async def _response(
        self,
        process: asyncio.subprocess.Process,
        request_id: int,
        *,
        deadline: float,
        notifications: list[dict[str, Any]],
    ) -> dict[str, Any]:
        while True:
            message = await self._read(process, deadline=deadline)
            if message.get("id") == request_id:
                if "error" in message:
                    raise RuntimeError(_error_text(message["error"]))
                return message.get("result") or {}
            notifications.append(message)

    async def resume_and_run(
        self,
        repo_path: Path,
        session_id: str | None,
        prompt: str,
        *,
        test_commands: list[str] | None = None,
        image_paths: list[Path] | None = None,
    ) -> AgentRunResult:
        del test_commands  # 허용 테스트 명령은 prompt에 포함된다.
        if shutil.which(self._binary) is None and not Path(self._binary).exists():
            return AgentRunResult(error=f"Codex CLI 실행 파일을 찾을 수 없습니다: {self._binary}")

        repo_path = repo_path.expanduser().resolve()
        process = await asyncio.create_subprocess_exec(
            self._binary,
            "app-server",
            "--stdio",
            cwd=repo_path,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        assert process.stderr is not None
        # App Server 로그가 파이프 버퍼를 채워 응답 처리를 막지 않게 계속 비운다.
        stderr_task = asyncio.create_task(process.stderr.read())
        deadline = asyncio.get_running_loop().time() + self._timeout
        notifications: list[dict[str, Any]] = []
        messages: list[str] = []
        active_session_id = session_id

        try:
            await self._send(
                process,
                {
                    "id": 1,
                    "method": "initialize",
                    "params": {
                        "clientInfo": {
                            "name": "vibex",
                            "title": "Vibex",
                            "version": "0.1.0",
                        }
                    },
                },
            )
            await self._response(
                process, 1, deadline=deadline, notifications=notifications
            )
            await self._send(process, {"method": "initialized", "params": {}})

            if session_id:
                await self._send(
                    process,
                    {
                        "id": 2,
                        "method": "thread/resume",
                        "params": {
                            "threadId": session_id,
                            "cwd": str(repo_path),
                            "approvalPolicy": "never",
                        },
                    },
                )
            else:
                await self._send(
                    process,
                    {
                        "id": 2,
                        "method": "thread/start",
                        "params": {
                            "cwd": str(repo_path),
                            "approvalPolicy": "never",
                            "sandbox": "workspace-write",
                            "runtimeWorkspaceRoots": [str(repo_path)],
                            "ephemeral": False,
                        },
                    },
                )

            thread_result = await self._response(
                process, 2, deadline=deadline, notifications=notifications
            )
            thread = thread_result.get("thread") or {}
            active_session_id = str(thread.get("id") or active_session_id or "") or None
            if active_session_id is None:
                raise RuntimeError("Codex가 thread id를 반환하지 않았습니다.")

            inputs: list[dict[str, Any]] = [{"type": "text", "text": prompt}]
            inputs += [
                {"type": "localImage", "path": str(path.expanduser().resolve())}
                for path in (image_paths or [])
            ]
            await self._send(
                process,
                {
                    "id": 3,
                    "method": "turn/start",
                    "params": {
                        "threadId": active_session_id,
                        "input": inputs,
                        "cwd": str(repo_path),
                        "approvalPolicy": "never",
                        "sandboxPolicy": {
                            "type": "workspaceWrite",
                            "writableRoots": [str(repo_path)],
                            "networkAccess": False,
                        },
                    },
                },
            )
            turn_result = await self._response(
                process, 3, deadline=deadline, notifications=notifications
            )
            turn_id = str((turn_result.get("turn") or {}).get("id") or "")

            while True:
                event = notifications.pop(0) if notifications else await self._read(
                    process, deadline=deadline
                )
                method = event.get("method")
                params = event.get("params") or {}
                if params.get("threadId") not in {None, active_session_id}:
                    continue
                if method == "item/completed":
                    item = params.get("item") or {}
                    if item.get("type") == "agentMessage" and item.get("text"):
                        messages.append(str(item["text"]))
                elif method == "turn/completed":
                    turn = params.get("turn") or {}
                    if turn_id and turn.get("id") not in {None, turn_id}:
                        continue
                    status = turn.get("status")
                    if status == "completed":
                        break
                    raise RuntimeError(
                        _error_text(turn.get("error") or f"turn 상태: {status}")
                    )

            return self._result(active_session_id, messages[-1] if messages else "")
        except asyncio.TimeoutError:
            return AgentRunResult(
                session_id=active_session_id,
                error=f"Codex가 {self._timeout:.0f}초 안에 작업을 끝내지 않았습니다.",
            )
        except (EOFError, OSError, RuntimeError) as exc:
            detail = str(exc)
            if "active writer" in detail or "thread-store conflict" in detail:
                detail = (
                    "선택된 Codex 세션이 현재 VS Code 또는 터미널에서 다른 작업을 "
                    "처리 중입니다. 그 작업이 끝난 뒤 다시 전송해 주세요. "
                    "Vibex는 대화를 보존하기 위해 새 세션으로 우회하지 않았습니다."
                )
            return AgentRunResult(
                session_id=active_session_id,
                error=f"Codex 세션을 실행하지 못했습니다: {detail}",
            )
        finally:
            if process.returncode is None:
                try:
                    process.terminate()
                except ProcessLookupError:
                    pass
                try:
                    await asyncio.wait_for(process.wait(), timeout=3)
                except asyncio.TimeoutError:
                    process.kill()
                    await process.wait()
            await stderr_task

    def _result(self, session_id: str, raw_output: str) -> AgentRunResult:
        try:
            report = extract(raw_output)
        except ContractError as exc:
            return AgentRunResult(
                session_id=session_id, raw_output=raw_output, error=str(exc)
            )
        return AgentRunResult(
            session_id=session_id,
            report=report,
            ok=True,
            raw_output=raw_output,
        )
