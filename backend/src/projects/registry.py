from __future__ import annotations
import json
from pathlib import Path
from pydantic import BaseModel, Field, field_validator

class Project(BaseModel):
    project_id: str = Field(alias="projectId")
    display_name: str = Field(alias="displayName")
    repo_path: Path = Field(alias="repoPath")
    enabled: bool = True
    agent: str = "claude-code"
    test_commands: list[str] = Field(default_factory=list, alias="testCommands")

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
        """§16.2 — Git 저장소인지. 아니면 작업을 실행하지 않는다."""
        return (self.repo_path / ".git").exists()


class UnknownProjectError(LookupError):
    pass

class DuplicateProjectError(ValueError):
    pass

class ProjectRegistry:
    def __init__(self, projects: list[Project], path: Path | None = None) -> None:
        self._by_id = {p.project_id: p for p in projects}
        self._path = path

    @classmethod
    def load(cls, path: Path) -> ProjectRegistry:
        if not path.exists():
            return cls([], path)
        data = json.loads(path.read_text(encoding="utf-8"))
        return cls(
            [Project.model_validate(item) for item in data.get("projects", [])], path
        )

    def list_enabled(self) -> list[Project]:
        return [p for p in self._by_id.values() if p.enabled]

    def resolve(self, project_id: str) -> Project:
        """projectId → 신뢰 가능한 Project. 이 함수만이 repoPath를 만들어낸다."""
        project = self._by_id.get(project_id)
        if project is None or not project.enabled:
            raise UnknownProjectError(project_id)
        return project

    def has(self, project_id: str) -> bool:
        return project_id in self._by_id

    def add(self, project: Project) -> Project:
        if project.project_id in self._by_id:
            raise DuplicateProjectError(project.project_id)
        self._by_id[project.project_id] = project
        self._save()
        return project

    def _save(self) -> None:
        if self._path is None:
            return
        payload = {
            "projects": [
                p.model_dump(by_alias=True, mode="json") for p in self._by_id.values()
            ]
        }
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
