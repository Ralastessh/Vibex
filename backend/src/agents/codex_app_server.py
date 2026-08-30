"""Codex app-server 프로세스와 JSON 메시지를 주고받는 부분입니다.

보낸 요청과 받은 답을 ID로 맞추고, 응답 제한 시간을 확인한다. 프로세스 오류 메시지를
모으거나 종료하는 일도 여기서 처리합니다.
"""

from __future__ import annotations

import asyncio
import json
import shutil
from collections import deque
from contextlib import suppress
from pathlib import Path
from typing import Any


APP_SERVER_STREAM_LIMIT = 32 * 1024 * 1024


class CodexAppServerError(RuntimeError):
    """App Server가 요청을 거절했거나 올바른 응답을 보내지 못했다."""


class CodexAppServerUnavailable(CodexAppServerError):
    """Codex 실행 파일을 찾지 못했거나 App Server를 시작하지 못했다."""


def error_text(error: Any) -> str:
    if isinstance(error, dict):
        return str(error.get("message") or error.get("data") or error)
    return str(error)


class CodexAppServerClient:
    """한 App Server stdio 연결의 handshake·request·event 수명을 관리한다.

    목록/읽기 같은 one-shot 요청과 실제 turn 실행이 같은 JSONL 구현을 사용해야
    프로토콜 한도, 오류 처리, 초기화 순서가 서로 달라지지 않는다.
    """

    def __init__(
        self,
        command: list[str],
        *,
        cwd: Path,
        timeout_seconds: float,
        client_name: str = "vibex",
        client_title: str = "Vibex",
        client_version: str = "0.1.0",
    ) -> None:
        self._command = list(command)
        self._cwd = cwd.expanduser().resolve()
        self._timeout = timeout_seconds
        self._client_info = {
            "name": client_name,
            "title": client_title,
            "version": client_version,
        }
        self._process: asyncio.subprocess.Process | None = None
        self._stderr_task: asyncio.Task[bytes] | None = None
        self._notifications: deque[dict[str, Any]] = deque()
        self._next_request_id = 1

    async def __aenter__(self) -> CodexAppServerClient:
        if not self._command:
            raise CodexAppServerUnavailable("Codex App Server 명령이 비어 있습니다.")
        binary = self._command[0]
        if shutil.which(binary) is None and not Path(binary).exists():
            raise CodexAppServerUnavailable(
                f"Codex CLI 실행 파일을 찾을 수 없습니다: {binary}"
            )
        try:
            self._process = await asyncio.create_subprocess_exec(
                *self._command,
                cwd=self._cwd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                limit=APP_SERVER_STREAM_LIMIT,
            )
        except OSError as exc:
            raise CodexAppServerUnavailable(
                f"Codex App Server를 시작하지 못했습니다: {exc}"
            ) from exc

        assert self._process.stderr is not None
        self._stderr_task = asyncio.create_task(self._process.stderr.read())
        try:
            await self.request(
                "initialize",
                {"clientInfo": self._client_info},
            )
            await self.notify("initialized", {})
        except BaseException:
            await self.close()
            raise
        return self

    async def __aexit__(self, exc_type, exc, traceback) -> None:
        await self.close()

    @property
    def process(self) -> asyncio.subprocess.Process:
        if self._process is None:
            raise CodexAppServerError("Codex App Server가 시작되지 않았습니다.")
        return self._process

    def deadline(self, timeout_seconds: float | None = None) -> float:
        timeout = self._timeout if timeout_seconds is None else timeout_seconds
        return asyncio.get_running_loop().time() + timeout

    async def notify(self, method: str, params: dict[str, Any]) -> None:
        await self._send({"method": method, "params": params})

    async def request(
        self,
        method: str,
        params: dict[str, Any] | None = None,
        *,
        deadline: float | None = None,
    ) -> dict[str, Any]:
        request_id = self._next_request_id
        self._next_request_id += 1
        message: dict[str, Any] = {"id": request_id, "method": method}
        if params is not None:
            message["params"] = params
        await self._send(message)
        target_deadline = deadline if deadline is not None else self.deadline()
        while True:
            response = await self._read(deadline=target_deadline)
            if response.get("id") == request_id:
                if "error" in response:
                    raise CodexAppServerError(error_text(response["error"]))
                result = response.get("result")
                return result if isinstance(result, dict) else {}
            self._notifications.append(response)

    async def receive(self, *, deadline: float) -> dict[str, Any]:
        if self._notifications:
            return self._notifications.popleft()
        return await self._read(deadline=deadline)

    async def _send(self, message: dict[str, Any]) -> None:
        process = self.process
        if process.returncode is not None:
            raise CodexAppServerError(
                f"Codex App Server가 종료되었습니다(코드 {process.returncode})."
            )
        assert process.stdin is not None
        encoded = (
            json.dumps(message, ensure_ascii=False, separators=(",", ":")) + "\n"
        ).encode()
        try:
            process.stdin.write(encoded)
            await process.stdin.drain()
        except (BrokenPipeError, ConnectionResetError) as exc:
            raise CodexAppServerError(
                "Codex App Server에 요청을 보내지 못했습니다."
            ) from exc

    async def _read(self, *, deadline: float) -> dict[str, Any]:
        process = self.process
        assert process.stdout is not None
        remaining = deadline - asyncio.get_running_loop().time()
        if remaining <= 0:
            raise asyncio.TimeoutError
        try:
            line = await asyncio.wait_for(process.stdout.readline(), timeout=remaining)
        except ValueError as exc:
            raise CodexAppServerError(
                "Codex App Server의 단일 응답이 32MB 읽기 한도를 초과했습니다."
            ) from exc
        if not line:
            detail = ""
            if self._stderr_task is not None and self._stderr_task.done():
                with suppress(Exception):
                    detail = self._stderr_task.result().decode(errors="replace").strip()
            suffix = f": {detail}" if detail else ""
            raise CodexAppServerError(
                f"Codex App Server가 응답을 보내기 전에 종료되었습니다{suffix}"
            )
        try:
            payload = json.loads(line)
        except json.JSONDecodeError as exc:
            raise CodexAppServerError(
                "Codex App Server가 잘못된 JSON을 보냈습니다."
            ) from exc
        if not isinstance(payload, dict):
            raise CodexAppServerError("Codex App Server 응답이 객체가 아닙니다.")
        return payload

    async def close(self) -> None:
        process = self._process
        if process is None:
            return
        self._process = None
        if process.returncode is None:
            with suppress(ProcessLookupError):
                process.terminate()
            try:
                await asyncio.wait_for(process.wait(), timeout=3)
            except asyncio.TimeoutError:
                with suppress(ProcessLookupError):
                    process.kill()
                await process.wait()
        else:
            await process.wait()

        if self._stderr_task is not None:
            with suppress(Exception):
                await self._stderr_task
        self._stderr_task = None
