"""프로젝트 레지스트리와 목록 API (CLAUDE.md §6, §12.2)."""

from __future__ import annotations

import pytest

from src.projects.registry import ProjectRegistry, UnknownProjectError
from tests.conftest import AUTH


def test_lists_only_enabled_projects(client):
    ids = [p["projectId"] for p in client.get("/api/v1/projects", headers=AUTH).json()["projects"]]
    assert "demo" in ids
    assert "disabled" not in ids


def test_repo_path_is_never_exposed(client, repo):
    """§6의 핵심. iPad는 실제 경로를 알 수 없어야 한다."""
    body = client.get("/api/v1/projects", headers=AUTH).text
    assert str(repo) not in body
    assert "repoPath" not in body


def test_unknown_project_is_rejected(client):
    r = client.get("/api/v1/projects/does-not-exist", headers=AUTH)
    assert r.status_code == 404
    assert "등록되어 있지" in r.json()["detail"]


def test_disabled_project_is_treated_as_unknown(client):
    """비활성 프로젝트의 존재를 알려주지 않는다."""
    assert client.get("/api/v1/projects/disabled", headers=AUTH).status_code == 404


def test_missing_repo_is_reported_as_unavailable(client):
    """§16.1 — 경로가 없으면 작업할 수 없다. 그 사실을 iPad에 알린다."""
    body = client.get("/api/v1/projects/missing", headers=AUTH).json()
    assert body["status"] == "unavailable"
    assert "경로" in body["reason"]


def test_non_git_repo_is_unavailable(client, tmp_path, settings):
    """§16.2 — Git 저장소가 아니면 변경사항 보존을 보장할 수 없다."""
    import json

    plain = tmp_path / "plain"
    plain.mkdir()
    settings.projects_file.write_text(
        json.dumps({"projects": [{"projectId": "plain", "displayName": "P",
                                  "repoPath": str(plain)}]}),
        encoding="utf-8",
    )
    from fastapi.testclient import TestClient

    from src.main import create_app

    with TestClient(create_app(settings)) as c:
        body = c.get("/api/v1/projects/plain", headers=AUTH).json()
    assert body["status"] == "unavailable"
    assert "Git" in body["reason"]


def test_idle_when_no_active_task(client):
    assert client.get("/api/v1/projects/demo", headers=AUTH).json()["status"] == "idle"


def test_busy_while_a_task_is_active(client, tasks):
    task = tasks.create("demo")
    body = client.get("/api/v1/projects/demo", headers=AUTH).json()
    assert body["status"] == "busy"
    assert body["activeTaskId"] == task.task_id


# --- 레지스트리 자체 ---


def test_registry_resolve_gives_trusted_path(settings, repo):
    registry = ProjectRegistry.load(settings.projects_file)
    assert registry.resolve("demo").repo_path == repo


def test_registry_refuses_unknown_id(settings):
    registry = ProjectRegistry.load(settings.projects_file)
    with pytest.raises(UnknownProjectError):
        registry.resolve("../../etc")


def test_missing_registry_file_is_not_fatal(tmp_path):
    """레지스트리가 없어도 서버는 뜬다 — 작업만 못 한다."""
    assert ProjectRegistry.load(tmp_path / "none.json").list_enabled() == []
