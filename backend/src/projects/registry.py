from __future__ import annotations

import json
import os
import re
from pathlib import Path

from pydantic import BaseModel, Field, field_validator

_PROJECT_ID_SEPARATOR = "--"
_NON_PROJECT_ID = re.compile(r"[^a-z0-9가-힣]+")
_IGNORED_DIRECTORIES = {
    ".git",
    ".next",
    ".venv",
    "__pycache__",
    "build",
    "dist",
    "node_modules",
    "venv",
}


class Project(BaseModel):
    project_id: str = Field(alias="projectId")
    display_name: str = Field(alias="displayName")
    repo_path: Path = Field(alias="repoPath")
    enabled: bool = True
    agent: str = "claude-code"
    test_commands: list[str] = Field(default_factory=list, alias="testCommands")
    preview_command: list[str] = Field(default_factory=list, alias="previewCommand")
    preview_port: int | None = Field(
        default=None, alias="previewPort", ge=1024, le=65535
    )

    model_config = {"populate_by_name": True}

    @field_validator("repo_path")
    @classmethod
    def _expand(cls, value: Path) -> Path:
        return value.expanduser()

    @property
    def exists(self) -> bool:
        return self.repo_path.is_dir()

    @property
    def is_git_repo(self) -> bool:
        """Git 저장소인지. 아니면 작업을 실행하지 않는다."""
        return (self.repo_path / ".git").exists()


class UnknownProjectError(LookupError):
    pass


class DuplicateProjectError(ValueError):
    pass


class ProjectRegistry:
    def __init__(
        self,
        projects: list[Project],
        path: Path | None = None,
        *,
        workspace_root: Path | None = None,
        configured_projects: list[dict] | None = None,
    ) -> None:
        self._by_id = {project.project_id: project for project in projects}
        self._path = path
        self._workspace_root = (
            workspace_root.expanduser().resolve() if workspace_root is not None else None
        )
        self._configured_projects = configured_projects or []

    @classmethod
    def load(
        cls, path: Path, workspace_root: Path | None = None
    ) -> ProjectRegistry:
        """선택 설정과 작업 루트의 Git 저장소를 하나의 목록으로 합친다."""
        data = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
        configured = data.get("projects", [])
        discovered = cls._discover(workspace_root)
        discovered_by_id = {project.project_id: project for project in discovered}

        projects: list[Project] = []
        claimed_paths: set[Path] = set()
        for item in configured:
            configured_item = dict(item)
            repo_path = configured_item.get("repoPath")
            if repo_path is None:
                discovered_project = discovered_by_id.get(
                    configured_item.get("projectId")
                )
                if discovered_project is None:
                    # 경로 없는 설정은 작업 루트에서 실제 저장소가
                    # 발견될 때만 유효하다.
                    continue
                payload = discovered_project.model_dump(by_alias=True, mode="json")
                payload.update(configured_item)
                payload["repoPath"] = discovered_project.repo_path
                project = Project.model_validate(payload)
            else:
                # 기존 절대 경로 설정도 호환성을 위해 계속 지원한다.
                project = Project.model_validate(configured_item)
            projects.append(project)
            claimed_paths.add(project.repo_path.expanduser().resolve())

        claimed_ids = {project.project_id for project in projects}
        for project in discovered:
            resolved = project.repo_path.resolve()
            if resolved in claimed_paths or project.project_id in claimed_ids:
                continue
            projects.append(project)

        return cls(
            projects,
            path,
            workspace_root=workspace_root,
            configured_projects=[dict(item) for item in configured],
        )

    @classmethod
    def _discover(cls, workspace_root: Path | None) -> list[Project]:
        """BRIDGE_WORKSPACE_ROOT 아래의 Git 저장소를 프로젝트로 자동 등록한다."""
        if workspace_root is None:
            return []
        root = workspace_root.expanduser().resolve()
        if not root.is_dir():
            return []

        repositories: list[Path] = []
        for current, directories, files in os.walk(root, followlinks=False):
            directories.sort()
            current_path = Path(current)
            if ".git" in directories or ".git" in files:
                repositories.append(current_path)
                # 한 Git 저장소 내부의 의존성·서브모듈까지 별도
                # Vibex 프로젝트로 세지 않는다.
                directories[:] = []
                continue
            directories[:] = [
                name
                for name in directories
                if name not in _IGNORED_DIRECTORIES
                and not name.startswith(".")
                and not (current_path / name).is_symlink()
            ]

        return [cls._project_from_path(root, repo) for repo in repositories]

    @staticmethod
    def _project_from_path(root: Path, repo: Path) -> Project:
        relative = repo.relative_to(root)
        parts = relative.parts or (repo.name,)
        normalized = []
        for part in parts:
            slug = _NON_PROJECT_ID.sub("-", part.lower()).strip("-")
            if slug:
                normalized.append(slug)
        project_id = _PROJECT_ID_SEPARATOR.join(normalized) or "project"
        return Project(
            projectId=project_id,
            displayName=repo.name,
            repoPath=repo,
            enabled=True,
            agent="claude-code",
        )

    def list_enabled(self) -> list[Project]:
        return [project for project in self._by_id.values() if project.enabled]

    def resolve(self, project_id: str) -> Project:
        """projectId → 신뢰할 수 있는 Project. 이 함수만 repoPath를 만든다."""
        project = self._by_id.get(project_id)
        if project is None or not project.enabled:
            raise UnknownProjectError(project_id)
        return project

    def has(self, project_id: str) -> bool:
        return project_id in self._by_id

    def set_agent(self, project_id: str, agent: str) -> Project:
        project = self.resolve(project_id)
        updated = project.model_copy(update={"agent": agent})
        self._by_id[project_id] = updated

        configured = next(
            (
                item
                for item in self._configured_projects
                if item.get("projectId") == project_id
            ),
            None,
        )
        if configured is None:
            configured = {"projectId": project_id}
            self._configured_projects.append(configured)
        configured["agent"] = agent
        self._save()
        return updated

    def add(self, project: Project) -> Project:
        if project.project_id in self._by_id:
            raise DuplicateProjectError(project.project_id)
        self._by_id[project.project_id] = project

        configured = project.model_dump(by_alias=True, mode="json")
        if self._workspace_root is not None:
            resolved = project.repo_path.expanduser().resolve()
            if resolved.is_relative_to(self._workspace_root):
                # 경로는 작업 루트에서 재발견할 수 있으므로 중복
                # 저장하지 않고 프로젝트별 설정만 남긴다.
                configured.pop("repoPath", None)
        self._configured_projects.append(configured)
        self._save()
        return project

    def _save(self) -> None:
        if self._path is None:
            return
        payload = {"projects": self._configured_projects}
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
