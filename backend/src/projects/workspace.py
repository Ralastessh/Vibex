from __future__ import annotations
import re
import subprocess
from pathlib import Path
from backend.src.projects.registry import Project

_SLUG_STRIP = re.compile(r"[^a-z0-9가-힣]+")
MAX_SLUG_LENGTH = 48

class InvalidProjectNameError(ValueError):
    pass

class WorkspaceNotConfiguredError(RuntimeError):
    pass

def slugify(display_name: str) -> str:
    slug = _SLUG_STRIP.sub("-", display_name.strip().lower()).strip("-")
    slug = slug[:MAX_SLUG_LENGTH].strip("-")
    if not slug:
        raise InvalidProjectNameError(
            "프로젝트 이름에 사용할 수 있는 문자가 없습니다."
        )
    return slug

def create_project(
    display_name: str,
    *,
    workspace_root: Path | None,
    agent: str = "claude-code",
    test_commands: list[str] | None = None,
    init_git: bool = True,
) -> Project:
    if workspace_root is None:
        raise WorkspaceNotConfiguredError(
            "BRIDGE_WORKSPACE_ROOT 가 설정되지 않아 새 프로젝트를 만들 수 없습니다."
        )
    
    root = workspace_root.expanduser().resolve()
    root.mkdir(parents=True, exist_ok=True)

    project_id = slugify(display_name)
    repo_path = (root / project_id).resolve()

    # 폴더 경로가 맞는지 재확인
    if not repo_path.is_relative_to(root):
        raise InvalidProjectNameError("허용된 작업 폴더를 벗어납니다.")
    if repo_path.exists():
        raise InvalidProjectNameError(f"이미 존재하는 폴더입니다: {project_id}")

    repo_path.mkdir(parents=True)

    if init_git:
        subprocess.run(
            ["git", "init", "-q"], cwd=repo_path, check=True, capture_output=True, timeout=30
        )

    return Project(
        projectId=project_id,
        displayName=display_name.strip(),
        repoPath=repo_path,
        enabled=True,
        agent=agent,
        testCommands=test_commands or [],
    )
