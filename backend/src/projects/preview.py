"""프로젝트에서 프론트엔드를 띄울 방법을 탐색해 미리보기 서버를 실행"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import socket
import sys
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

@dataclass(frozen=True)
class PreviewLaunch:
    command: list[str]
    cwd: Path

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

def _package_json(path: Path) -> dict:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
        return value if isinstance(value, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}

_IGNORED_FRONTEND_DIRECTORIES = {
    ".git",
    ".next",
    ".venv",
    "__pycache__",
    "build",
    "coverage",
    "node_modules",
    "venv",
}
_PREFERRED_FRONTEND_DIRECTORIES = {"frontend", "web", "client", "app", "site"}
_MAX_FRONTEND_DEPTH = 5

def _frontend_directories(project: Project) -> list[Path]:
    """실행 가능한 프론트엔드가 있을 법한 폴더 순서로 탐색
    LLM이 프로젝트 루트가 아닌 frontend/나 web/ 아래에 결과물을 만들 수 있으므로 루트만 검사하지 않음"""
    root = project.repo_path.resolve()
    candidates: list[Path] = []
    for current, directories, files in os.walk(root):
        path = Path(current)
        depth = len(path.relative_to(root).parts)
        directories[:] = [
            name
            for name in directories
            if name not in _IGNORED_FRONTEND_DIRECTORIES
            and not name.startswith(".")
            and depth < _MAX_FRONTEND_DEPTH
        ]
        if "package.json" in files or "index.html" in files:
            candidates.append(path)

    def priority(path: Path) -> tuple[int, int, str]:
        relative = path.relative_to(root)
        parts = relative.parts
        preferred = 0 if any(part.lower() in _PREFERRED_FRONTEND_DIRECTORIES for part in parts) else 1
        return (len(parts), preferred, str(relative))

    return sorted(candidates, key=priority)

def _package_launch(directory: Path, port: int) -> PreviewLaunch | None:
    package = _package_json(directory / "package.json")
    scripts = package.get("scripts") or {}
    dev = str(scripts.get("dev") or "")
    start = str(scripts.get("start") or "")

    if (directory / "pnpm-lock.yaml").exists():
        runner = ["pnpm", "run"]
    elif (directory / "yarn.lock").exists():
        runner = ["yarn"]
    else:
        runner = ["npm", "run"]

    if dev:
        if "next" in dev:
            command = [*runner, "dev"]
            extra: list[str] = []
            if "--hostname" not in dev and "--host" not in dev:
                extra += ["--hostname", "0.0.0.0"]
            if "--port" not in dev and " -p " not in f" {dev} ":
                extra += ["--port", str(port)]
        else:
            command = [*runner, "dev"]
            extra = []
            if "--host" not in dev:
                extra += ["--host", "0.0.0.0"]
            if "--port" not in dev:
                extra += ["--port", str(port)]
        if extra:
            command += ["--", *extra]
        return PreviewLaunch(command, directory)
    if start:
        return PreviewLaunch([*runner, "start"], directory)
    return None


def _dependency_install_command(launch: PreviewLaunch) -> list[str] | None:
    """패키지 실행인데 의존성이 아직 없으면 설치 명령
    새 프로젝트는 LLM이 package.json까지만 만든 직후 iPad가 프리뷰를 요청하는 경우가 있음 -> vite 같은 PC의 실행 파일이 없을 때 실패할 가능성
    프론트엔드 프리뷰가 선택한 frontend 디렉터리에 한 번 설치하면 이후 요청은 기존 node_modules를 재사용"""
    if not launch.command or launch.command[0] not in {"npm", "pnpm", "yarn"}:
        return None
    if not (launch.cwd / "package.json").is_file():
        return None
    if (launch.cwd / "node_modules").is_dir():
        return None

    runner = launch.command[0]
    if runner == "npm":
        return ["npm", "install", "--no-audit", "--no-fund"]
    if runner == "pnpm":
        return ["pnpm", "install", "--no-frozen-lockfile"]
    return ["yarn", "install"]

def _auto_launch(project: Project, port: int) -> PreviewLaunch | None:
    directories = _frontend_directories(project)

    # 실행 스크립트가 있는 앱을 정적 HTML보다 우선
    for directory in directories:
        if (directory / "package.json").is_file():
            launch = _package_launch(directory, port)
            if launch is not None:
                return launch

    # package.json 없는 LLM 생성 결과도 즉시 프리뷰
    for directory in directories:
        if (directory / "index.html").is_file():
            return PreviewLaunch(
                [
                    sys.executable,
                    "-m",
                    "http.server",
                    str(port),
                    "--bind",
                    "0.0.0.0",
                ],
                directory,
            )
    return None

def _configured_launch(project: Project, port: int) -> PreviewLaunch | None:
    if not project.preview_command:
        return None
    return PreviewLaunch(
        [
            part.replace("{host}", "0.0.0.0").replace("{port}", str(port))
            for part in project.preview_command
        ],
        project.repo_path,
    )

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

def vite_allowed_host(public_host: str) -> str:
    """Vite가 허용할 현재 tailnet 호스트 범위를 계산"""
    host = public_host.strip().strip("[]").rstrip(".").lower()
    labels = host.split(".")
    if len(labels) >= 3 and labels[-2:] == ["ts", "net"]:
        return "." + ".".join(labels[1:])
    return host

class PreviewManager:
    """프로젝트마다 미리보기 서버가 하나만 실행되도록 관리
    시작과 종료 요청이 동시에 들어와도 순서대로 처리 서버가 제한 시간 안에 접속을 받지 못하면 실패 로그를 남기고 방금 만든 프로세스도 종료"""
    def __init__(self, *, start_timeout: float = 180.0) -> None:
        self._start_timeout = start_timeout
        self._sessions: dict[str, PreviewSession] = {}
        self._lock = asyncio.Lock()

    def can_preview(self, project: Project) -> bool:
        return bool(
            project.preview_command
            or _auto_launch(project, project.preview_port or 4173)
        )

    async def start(self, project: Project, *, public_host: str) -> PreviewSession:
        async with self._lock:
            current = self._sessions.get(project.project_id)
            if current and (
                current.process is None or current.process.returncode is None
            ) and await _accepting(current.port):
                return current

            if not self.can_preview(project) and project.preview_port is None:
                raise PreviewUnavailableError(
                    "실행 가능한 프론트엔드를 찾지 못했습니다. 프로젝트 또는 하위 폴더에 "
                    "index.html을 만들거나 package.json의 dev/start 스크립트, "
                    "previewCommand를 설정하세요."
                )

            port = project.preview_port or _free_port()
            if await _accepting(port):
                session = PreviewSession(project.project_id, port, None)
                self._sessions[project.project_id] = session
                return session

            launch = _configured_launch(project, port) or _auto_launch(project, port)
            if launch is None:
                raise PreviewUnavailableError(
                    "실행 가능한 프론트엔드를 찾지 못했습니다. 프로젝트 또는 하위 폴더에 "
                    "index.html을 만들거나 package.json의 dev/start 스크립트, "
                    "previewCommand를 설정하세요."
                )

            env = os.environ.copy()
            env.update({
                "HOST": "0.0.0.0",
                "PORT": str(port),
                "BROWSER": "none",
                "__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS": vite_allowed_host(public_host),
            })
            log_file = tempfile.TemporaryFile(mode="w+b")

            install_command = _dependency_install_command(launch)
            if install_command is not None:
                logger.info(
                    "%s 프론트엔드 의존성 자동 설치: %s",
                    project.project_id,
                    launch.cwd,
                )
                try:
                    installer = await asyncio.create_subprocess_exec(
                        *install_command,
                        cwd=launch.cwd,
                        env=env,
                        stdin=asyncio.subprocess.DEVNULL,
                        stdout=log_file,
                        stderr=asyncio.subprocess.STDOUT,
                    )
                    try:
                        await asyncio.wait_for(
                            installer.wait(), timeout=max(self._start_timeout, 300.0)
                        )
                    except asyncio.TimeoutError:
                        installer.kill()
                        await installer.wait()
                        raise PreviewStartError(
                            _with_log(
                                "프론트엔드 의존성 설치가 제한 시간 안에 끝나지 않았습니다.",
                                log_file,
                            )
                        )
                    if installer.returncode != 0:
                        raise PreviewStartError(
                            _with_log(
                                f"프론트엔드 의존성 설치에 실패했습니다(코드 {installer.returncode}).",
                                log_file,
                            )
                        )
                    log_file.seek(0)
                    log_file.truncate(0)
                except PreviewStartError:
                    log_file.close()
                    raise
                except OSError as exc:
                    log_file.close()
                    raise PreviewStartError(
                        f"프론트엔드 의존성 설치 명령을 실행하지 못했습니다: {exc}"
                    ) from exc

            try:
                process = await asyncio.create_subprocess_exec(
                    *launch.command,
                    cwd=launch.cwd,
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
