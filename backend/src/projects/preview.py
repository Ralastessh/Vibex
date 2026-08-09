from __future__ import annotations

import asyncio
import json
import logging
import os
import socket
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import BinaryIO
from urllib.parse import urlunsplit

from src.projects.registry import Project

logger = logging.getLogger("bridge.preview")


class PreviewUnavailableError(RuntimeError):
    pass


class PreviewStartError(RuntimeError):
    pass


@dataclass
class PreviewSession:
    project_id: str
    port: int
    process: asyncio.subprocess.Process | None
    log_file: BinaryIO | None = None


def _log_tail(log_file: BinaryIO, limit: int = 2_000) -> str:
    try:
        log_file.flush()
        log_file.seek(0, os.SEEK_END)
        size = log_file.tell()
        log_file.seek(max(0, size - limit))
        return log_file.read().decode("utf-8", "replace").strip()
    except (OSError, ValueError):
        return ""


def _with_log(message: str, log_file: BinaryIO) -> str:
    tail = _log_tail(log_file)
    return f"{message}\n\n실행 로그:\n{tail}" if tail else message


def _package_json(project: Project) -> dict:
    path = project.repo_path / "package.json"
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
        return value if isinstance(value, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


def _auto_command(project: Project, port: int) -> list[str] | None:
    package = _package_json(project)
    scripts = package.get("scripts") or {}
    dev = str(scripts.get("dev") or "")
    start = str(scripts.get("start") or "")

    if (project.repo_path / "pnpm-lock.yaml").exists():
        runner = ["pnpm", "run"]
    elif (project.repo_path / "yarn.lock").exists():
        runner = ["yarn"]
    else:
        runner = ["npm", "run"]

    if dev:
        if "next" in dev:
            return [*runner, "dev", "--", "--hostname", "0.0.0.0", "--port", str(port)]
        return [*runner, "dev", "--", "--host", "0.0.0.0", "--port", str(port)]
    if start:
        return [*runner, "start"]
    return None


def _configured_command(project: Project, port: int) -> list[str] | None:
    if not project.preview_command:
        return None
    return [
        part.replace("{host}", "0.0.0.0").replace("{port}", str(port))
        for part in project.preview_command
    ]


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


async def _accepting(port: int) -> bool:
    try:
        reader, writer = await asyncio.open_connection("127.0.0.1", port)
        writer.close()
        await writer.wait_closed()
        return True
    except OSError:
        return False


def public_url(host: str, port: int) -> str:
    netloc = f"[{host}]:{port}" if ":" in host else f"{host}:{port}"
    return urlunsplit(("http", netloc, "/", "", ""))


class PreviewManager:
    """프로젝트 dev server를 PC에서 시작하고 iPad가 열 URL을 관리한다."""

    def __init__(self, *, start_timeout: float = 180.0) -> None:
        self._start_timeout = start_timeout
        self._sessions: dict[str, PreviewSession] = {}
        self._lock = asyncio.Lock()

    def can_preview(self, project: Project) -> bool:
        return bool(project.preview_command or _auto_command(project, project.preview_port or 4173))

    async def start(self, project: Project, *, public_host: str) -> PreviewSession:
        async with self._lock:
            current = self._sessions.get(project.project_id)
            if current and (
                current.process is None or current.process.returncode is None
            ) and await _accepting(current.port):
                return current

            if not self.can_preview(project) and project.preview_port is None:
                raise PreviewUnavailableError(
                    "실행 가능한 프론트엔드가 없습니다. package.json의 dev/start 스크립트나 "
                    "previewCommand를 설정하세요."
                )

            port = project.preview_port or _free_port()
            if await _accepting(port):
                session = PreviewSession(project.project_id, port, None)
                self._sessions[project.project_id] = session
                return session

            command = _configured_command(project, port) or _auto_command(project, port)
            if command is None:
                raise PreviewUnavailableError(
                    "실행 가능한 프론트엔드가 없습니다. package.json의 dev/start 스크립트나 "
                    "previewCommand를 설정하세요."
                )

            env = os.environ.copy()
            env.update({"HOST": "0.0.0.0", "PORT": str(port), "BROWSER": "none"})
            log_file = tempfile.TemporaryFile(mode="w+b")
            try:
                process = await asyncio.create_subprocess_exec(
                    *command,
                    cwd=project.repo_path,
                    env=env,
                    stdin=asyncio.subprocess.DEVNULL,
                    stdout=log_file,
                    stderr=asyncio.subprocess.STDOUT,
                )
            except OSError as exc:
                log_file.close()
                raise PreviewStartError(f"프론트엔드 실행에 실패했습니다: {exc}") from exc

            deadline = asyncio.get_running_loop().time() + self._start_timeout
            while asyncio.get_running_loop().time() < deadline:
                if process.returncode is not None:
                    await process.wait()
                    message = _with_log(
                        f"프론트엔드가 시작 중 종료되었습니다(코드 {process.returncode}).",
                        log_file,
                    )
                    log_file.close()
                    raise PreviewStartError(message)
                if await _accepting(port):
                    session = PreviewSession(project.project_id, port, process, log_file)
                    self._sessions[project.project_id] = session
                    logger.info("%s 프리뷰 시작: %s", project.project_id, public_url(public_host, port))
                    return session
                await asyncio.sleep(0.15)

            process.terminate()
            await process.wait()
            message = _with_log(
                "프론트엔드가 제한 시간 안에 준비되지 않았습니다.", log_file
            )
            log_file.close()
            raise PreviewStartError(message)

    async def stop(self, project_id: str) -> None:
        async with self._lock:
            session = self._sessions.pop(project_id, None)
            if session is None or session.process is None or session.process.returncode is not None:
                if session is not None and session.log_file is not None:
                    session.log_file.close()
                return
            session.process.terminate()
            try:
                await asyncio.wait_for(session.process.wait(), timeout=3)
            except asyncio.TimeoutError:
                session.process.kill()
                await session.process.wait()
            if session.log_file is not None:
                session.log_file.close()

    async def close(self) -> None:
        for project_id in list(self._sessions):
            await self.stop(project_id)
