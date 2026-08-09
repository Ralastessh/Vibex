"""테스트는 실제 레지스트리·DB를 건드리지 않는다."""

from __future__ import annotations

import json

import pytest
from fastapi.testclient import TestClient

from src.config.settings import Settings
from src.main import create_app

TOKEN = "test-device-token"
AUTH = {"Authorization": f"Bearer {TOKEN}"}


@pytest.fixture
def repo(tmp_path):
    """실제 git 저장소. runner가 git status를 진짜로 실행한다."""
    import subprocess

    path = tmp_path / "demo-repo"
    (path / "src").mkdir(parents=True)
    (path / "src" / "app.js").write_text("original\n", encoding="utf-8")

    def git(*args):
        subprocess.run(["git", *args], cwd=path, check=True, capture_output=True)

    git("init", "-q")
    git("config", "user.email", "t@e.st")
    git("config", "user.name", "t")
    git("add", "-A")
    git("commit", "-q", "-m", "init")
    return path


@pytest.fixture
def settings(tmp_path, repo) -> Settings:
    registry_file = tmp_path / "projects.json"
    registry_file.write_text(
        json.dumps(
            {
                "projects": [
                    {
                        "projectId": "demo",
                        "displayName": "Demo",
                        "repoPath": str(repo),
                        "enabled": True,
                        "agent": "claude-code",
                        "testCommands": ["npx vitest"],
                    },
                    {
                        "projectId": "missing",
                        "displayName": "경로 없음",
                        "repoPath": str(tmp_path / "nope"),
                    },
                    {
                        "projectId": "disabled",
                        "displayName": "비활성",
                        "repoPath": str(repo),
                        "enabled": False,
                    },
                ]
            }
        ),
        encoding="utf-8",
    )
    return Settings(
        # 개발자의 로컬 .env를 읽지 않는다. 읽으면 기기마다 테스트 결과가 달라진다 —
        # 실제로 .env에 BRIDGE_WORKSPACE_ROOT를 넣자 "작업 폴더 미설정" 테스트가 깨졌다.
        _env_file=None,
        device_token=TOKEN,
        projects_file=registry_file,
        task_assets_root=tmp_path / "task-assets",
    )


@pytest.fixture
def client(settings):
    with TestClient(create_app(settings)) as c:
        yield c


@pytest.fixture
def tasks(client):
    """앱이 쓰는 것과 같은 TaskStore."""
    return client.app.state.tasks
