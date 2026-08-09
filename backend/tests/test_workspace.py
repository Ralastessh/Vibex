"""새 프로젝트 생성 · 에이전트 조회 · 이벤트 (§6 확장, §9.1, §12.8).

프로젝트 생성은 명세 §6("iPad는 절대 실제 경로를 보내지 않는다")과 정면으로
부딪힐 수 있는 기능이다. iPad가 이름만 보내고 위치는 iMac이 정한다는 규칙이
지켜지는지가 이 파일의 핵심이다.
"""

from __future__ import annotations

import json

import pytest
from fastapi.testclient import TestClient

from src.main import create_app
from src.projects.workspace import (
    InvalidProjectNameError,
    WorkspaceNotConfiguredError,
    create_project,
    slugify,
)
from src.tasks.events import EventBroker, status_event
from tests.conftest import AUTH


@pytest.fixture
def workspace(tmp_path, settings):
    settings.workspace_root = tmp_path / "workspace"
    return settings.workspace_root


@pytest.fixture
def wclient(settings, workspace):
    with TestClient(create_app(settings)) as c:
        yield c


# --- 슬러그 ---


@pytest.mark.parametrize(
    "name,expected",
    [
        ("Moonwalk", "moonwalk"),
        ("My Cool App", "my-cool-app"),
        ("문워크", "문워크"),
        ("  spaced  ", "spaced"),
        ("a/../../etc", "a-etc"),
        ("....", ""),
    ],
)
def test_slugify(name, expected):
    if expected == "":
        with pytest.raises(InvalidProjectNameError):
            slugify(name)
    else:
        assert slugify(name) == expected


def test_slug_strips_path_separators():
    """경로 조작 문자가 살아남으면 §18.4가 무너진다."""
    slug = slugify("../../../etc/passwd")
    assert "/" not in slug and ".." not in slug


def test_long_name_is_truncated():
    assert len(slugify("a" * 200)) <= 48


# --- 생성 ---


def test_creates_directory_and_git_repo(tmp_path):
    root = tmp_path / "ws"
    project = create_project("Moonwalk", workspace_root=root)

    assert project.project_id == "moonwalk"
    assert project.display_name == "Moonwalk"
    assert project.repo_path == (root.resolve() / "moonwalk")
    assert project.repo_path.is_dir()
    assert project.is_git_repo  # §16은 Git 저장소를 전제한다


def test_never_escapes_the_workspace(tmp_path):
    """이름으로 상위 디렉터리를 노려도 작업 폴더 안에 머물러야 한다."""
    root = tmp_path / "ws"
    project = create_project("../../escape", workspace_root=root)
    assert project.repo_path.is_relative_to(root.resolve())


def test_duplicate_directory_is_refused(tmp_path):
    root = tmp_path / "ws"
    create_project("Moonwalk", workspace_root=root)
    with pytest.raises(InvalidProjectNameError, match="이미 존재"):
        create_project("Moonwalk", workspace_root=root)


def test_creation_requires_configured_workspace():
    """설정이 없으면 만들지 않는다 — 임의 위치에 폴더를 흩뿌리지 않는다."""
    with pytest.raises(WorkspaceNotConfiguredError):
        create_project("X", workspace_root=None)


# --- API ---


def test_create_project_endpoint(wclient, workspace):
    r = wclient.post(
        "/api/v1/projects", headers=AUTH,
        json={"displayName": "Moonwalk", "testCommands": ["npx vitest"]},
    )
    assert r.status_code == 201
    body = r.json()
    assert body["projectId"] == "moonwalk"
    assert body["status"] == "idle"
    # §6 — 경로는 응답에 없다
    assert "repoPath" not in r.text
    assert str(workspace) not in r.text


def test_created_project_appears_in_the_list(wclient):
    wclient.post("/api/v1/projects", headers=AUTH, json={"displayName": "New One"})
    ids = [p["projectId"] for p in wclient.get("/api/v1/projects", headers=AUTH).json()["projects"]]
    assert "new-one" in ids


def test_created_project_survives_restart(settings, workspace):
    """레지스트리 파일에 남지 않으면 재시작 후 사라진다."""
    with TestClient(create_app(settings)) as first:
        first.post("/api/v1/projects", headers=AUTH, json={"displayName": "Persisted"})

    saved = json.loads(settings.projects_file.read_text(encoding="utf-8"))
    assert any(p["projectId"] == "persisted" for p in saved["projects"])

    with TestClient(create_app(settings)) as second:
        ids = [p["projectId"] for p in second.get("/api/v1/projects", headers=AUTH).json()["projects"]]
    assert "persisted" in ids


def test_creating_an_existing_project_is_refused(wclient):
    wclient.post("/api/v1/projects", headers=AUTH, json={"displayName": "Dup"})
    r = wclient.post("/api/v1/projects", headers=AUTH, json={"displayName": "Dup"})
    assert r.status_code in {400, 409}


def test_creation_needs_auth(wclient):
    assert wclient.post("/api/v1/projects", json={"displayName": "X"}).status_code == 401


def test_creation_disabled_without_workspace(client):
    """작업 폴더 미설정 시 명확히 거절한다 — 조용히 실패하지 않는다."""
    r = client.post("/api/v1/projects", headers=AUTH, json={"displayName": "X"})
    assert r.status_code == 503
    assert "BRIDGE_WORKSPACE_ROOT" in r.json()["detail"]


def test_blank_name_is_rejected(wclient):
    assert wclient.post("/api/v1/projects", headers=AUTH,
                        json={"displayName": "..."}).status_code == 400


# --- 에이전트 (§9.1) ---


def test_agents_report_claude_as_usable(client):
    agents = {a["agentId"]: a for a in client.get("/api/v1/agents", headers=AUTH).json()["agents"]}
    assert agents["claude-code"]["verified"]
    assert set(agents) == {"claude-code", "codex-cli", "gemini-cli"}


def test_unverified_agents_are_not_usable(client):
    """실측 검증을 거치지 않은 CLI를 고를 수 있게 두면 왜 실패했는지 알 수 없다."""
    agents = {a["agentId"]: a for a in client.get("/api/v1/agents", headers=AUTH).json()["agents"]}
    assert agents["codex-cli"]["verified"]
    assert agents["codex-cli"]["usable"] == agents["codex-cli"]["installed"]
    assert not agents["gemini-cli"]["usable"]
    assert agents["gemini-cli"]["note"]


def test_agents_need_auth(client):
    assert client.get("/api/v1/agents").status_code == 401


async def test_unsupported_agent_is_refused_at_task_time(settings, workspace):
    """검증되지 않은 에이전트로 지정된 프로젝트는 작업을 만들지 못한다."""
    with TestClient(create_app(settings)) as c:
        c.post("/api/v1/projects", headers=AUTH,
               json={"displayName": "Gem", "agent": "gemini-cli"})
        c.app.state.adapter = None
        r = c.post("/api/v1/tasks", headers=AUTH,
                   data={"projectId": "gem", "typedNote": "뭐 좀 해줘"})
    assert r.status_code == 501


# --- 이벤트 브로커 (§12.8) ---


async def test_broker_delivers_to_subscribers():
    broker = EventBroker()
    queue = broker.subscribe()
    broker.publish(status_event("t1", "demo", "running_agent"))
    event = await queue.get()
    assert event["taskId"] == "t1"
    assert event["message"]  # §19 Progress 문구가 채워진다


def test_broker_drops_events_when_a_subscriber_is_slow():
    """느린 구독자가 작업 실행을 막으면 안 된다."""
    broker = EventBroker()
    broker.subscribe()
    for i in range(500):
        broker.publish(status_event(f"t{i}", "demo", "running_agent"))  # 예외 없이 통과


def test_unsubscribe_stops_delivery():
    broker = EventBroker()
    queue = broker.subscribe()
    broker.unsubscribe(queue)
    broker.publish(status_event("t1", "demo", "queued"))
    assert queue.empty()


def test_events_websocket_requires_token(client):
    from starlette.websockets import WebSocketDisconnect

    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect("/api/v1/events") as ws:
            ws.receive_json()


def test_events_websocket_streams_status(client, repo):
    """iPad가 진행 상태를 실시간으로 받는다."""
    from tests.conftest import TOKEN

    with client.websocket_connect(f"/api/v1/events?token={TOKEN}") as ws:
        client.app.state.tasks.create("demo")
        event = ws.receive_json()
        assert event["type"] == "task.status"
        assert event["projectId"] == "demo"
        assert event["status"] == "queued"


# --- 작업 목록 (대화 흐름) ---


def test_task_list_is_oldest_first(client, tasks):
    from src.tasks.models import TaskStatus

    first = tasks.create("demo")
    tasks.update(first.task_id, status=TaskStatus.COMPLETED)
    second = tasks.create("demo")

    ids = [t["taskId"] for t in client.get(
        "/api/v1/tasks?projectId=demo", headers=AUTH).json()["tasks"]]
    assert ids == [first.task_id, second.task_id]


def test_task_list_rejects_unknown_project(client):
    assert client.get("/api/v1/tasks?projectId=nope", headers=AUTH).status_code == 404


def test_task_list_needs_auth(client):
    assert client.get("/api/v1/tasks?projectId=demo").status_code == 401
