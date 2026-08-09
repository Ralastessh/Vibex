from __future__ import annotations

import asyncio
import json
import logging
import shutil
from pathlib import Path

from src.agents.base import AgentRunResult
from src.agents.contract import ContractError, extract

logger = logging.getLogger("bridge.agents.codex")


def sessions_root() -> Path:
    return Path.home() / ".codex" / "sessions"


def _session_metadata(path: Path) -> tuple[str, Path] | None:
    try:
        with path.open("r", encoding="utf-8") as stream:
            first = json.loads(stream.readline())
        payload = first.get("payload") or {}
        session_id = payload.get("session_id") or payload.get("id")
        cwd = payload.get("cwd")
        if session_id and cwd:
            return str(session_id), Path(cwd).expanduser().resolve()
    except (OSError, ValueError, TypeError, json.JSONDecodeError):
        return None
    return None


class CodexCLIAdapter:
    """Codex CLI의 비대화형 이미지 입력과 세션 resume 어댑터."""

    def __init__(self, binary: str = "codex", *, timeout_seconds: float = 1800) -> None:
        self._binary = binary
        self._timeout = timeout_seconds

    async def find_latest_session(self, repo_path: Path) -> str | None:
        root = sessions_root()
        if not root.is_dir():
            return None
        target = repo_path.expanduser().resolve()

        def scan() -> str | None:
            candidates: list[tuple[float, str]] = []
            for path in root.rglob("*.jsonl"):
                metadata = _session_metadata(path)
                if metadata is None or metadata[1] != target:
                    continue
                try:
                    candidates.append((path.stat().st_mtime, metadata[0]))
                except OSError:
                    continue
            return max(candidates, default=(0, None))[1]

        return await asyncio.to_thread(scan)

    def _command(
        self,
        session_id: str | None,
        prompt: str,
        image_paths: list[Path],
    ) -> list[str]:
        common = [
            "--json",
            "-c", 'approval_policy="never"',
            "-c", 'sandbox_mode="workspace-write"',
        ]
        images = [item for path in image_paths for item in ("-i", str(path.resolve()))]
        if session_id:
            return [
                self._binary, "exec", "resume", *common, *images, session_id, prompt
            ]
        return [
            self._binary, "exec", *common, *images, prompt
        ]

    async def resume_and_run(
        self,
        repo_path: Path,
        session_id: str | None,
        prompt: str,
        *,
        test_commands: list[str] | None = None,
        image_paths: list[Path] | None = None,
    ) -> AgentRunResult:
        if shutil.which(self._binary) is None and not Path(self._binary).exists():
            return AgentRunResult(error=f"Codex CLI 실행 파일을 찾을 수 없습니다: {self._binary}")

        command = self._command(session_id, prompt, image_paths or [])
        process = await asyncio.create_subprocess_exec(
            *command,
            cwd=repo_path,
            stdin=asyncio.subprocess.DEVNULL,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(), timeout=self._timeout
            )
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()
            return AgentRunResult(
                session_id=session_id,
                error=f"Codex CLI가 {self._timeout:.0f}초 안에 끝나지 않았습니다.",
            )
        return self._parse(
            stdout.decode("utf-8", "replace"),
            stderr.decode("utf-8", "replace"),
            return_code=process.returncode,
            fallback_session_id=session_id,
        )

    def _parse(
        self,
        stdout: str,
        stderr: str,
        *,
        return_code: int | None,
        fallback_session_id: str | None,
    ) -> AgentRunResult:
        session_id = fallback_session_id
        messages: list[str] = []
        errors: list[str] = []
        parsed_any = False
        for line in stdout.splitlines():
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue
            parsed_any = True
            event_type = event.get("type")
            if event_type == "thread.started":
                session_id = event.get("thread_id") or session_id
            elif event_type == "item.completed":
                item = event.get("item") or {}
                if item.get("type") == "agent_message" and item.get("text"):
                    messages.append(str(item["text"]))
            elif event_type in {"turn.failed", "error"}:
                detail = event.get("error") or event.get("message") or event
                errors.append(str(detail))

        if not parsed_any:
            return AgentRunResult(
                session_id=session_id,
                raw_output=stdout,
                error=f"Codex CLI 출력을 해석할 수 없습니다. {stderr.strip()[:300]}",
            )

        raw_output = messages[-1] if messages else ""
        if return_code not in {0, None} or errors:
            detail = "; ".join(errors) or stderr.strip() or f"종료 코드 {return_code}"
            return AgentRunResult(
                session_id=session_id,
                raw_output=raw_output,
                error=f"Codex CLI가 오류로 종료했습니다: {detail[:500]}",
            )

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
