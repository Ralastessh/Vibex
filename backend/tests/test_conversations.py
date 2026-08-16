from __future__ import annotations

from tests.conftest import AUTH
from tests.test_task_flow import _settle, api  # noqa: F401 - pytest fixture import
from src.tasks.store import TaskStore


async def test_one_vibex_conversation_accepts_turns_from_both_agents(api):
    created = api.post(
        "/api/v1/projects/demo/conversations",
        headers=AUTH,
        json={"title": "공용 대화"},
    )
    assert created.status_code == 201
    conversation_id = created.json()["conversationId"]

    first = api.post(
        "/api/v1/tasks",
        headers=AUTH,
        data={
            "projectId": "demo",
            "conversationId": conversation_id,
            "agentId": "claude-code",
            "typedNote": "Claude에게 묻기",
            "origin": "vscode",
        },
    )
    assert first.status_code == 202
    assert first.json()["conversationId"] == conversation_id
    await _settle(api)
    assert api.app.state.adapter.calls[-1][2] == "Claude에게 묻기"

    second = api.post(
        "/api/v1/tasks",
        headers=AUTH,
        data={
            "projectId": "demo",
            "conversationId": conversation_id,
            "agentId": "codex-cli",
            "typedNote": "이번에는 Codex에게 묻기",
            "origin": "ipad",
        },
    )
    assert second.status_code == 202
    await _settle(api)
    codex_prompt = api.app.state.adapter.calls[-1][2]
    assert "<vibex-shared-context>" in codex_prompt
    assert "Claude에게 묻기" in codex_prompt
    assert "이번에는 Codex에게 묻기" in codex_prompt

    detail = api.get(
        f"/api/v1/projects/demo/conversations/{conversation_id}", headers=AUTH
    )
    assert detail.status_code == 200
    body = detail.json()
    assert [task["agentId"] for task in body["tasks"]] == [
        "claude-code",
        "codex-cli",
    ]
    assert [task["userMessage"] for task in body["tasks"]] == [
        "Claude에게 묻기",
        "이번에는 Codex에게 묻기",
    ]
    assert set(body["conversation"]["agentSessions"]) == {
        "claude-code",
        "codex-cli",
    }
    assert body["conversation"]["agentContextCursors"] == {
        "claude-code": body["tasks"][0]["taskId"],
        "codex-cli": body["tasks"][1]["taskId"],
    }
    assert body["tasks"][1]["sharedContextTokens"] > 0


def test_conversation_task_listing_is_isolated(api):
    first = api.post(
        "/api/v1/projects/demo/conversations", headers=AUTH, json={"title": "첫 대화"}
    ).json()
    second = api.post(
        "/api/v1/projects/demo/conversations", headers=AUTH, json={"title": "둘째 대화"}
    ).json()

    response = api.get(
        "/api/v1/tasks",
        headers=AUTH,
        params={
            "projectId": "demo",
            "conversationId": second["conversationId"],
        },
    )
    assert response.status_code == 200
    assert response.json()["tasks"] == []
    assert first["conversationId"] != second["conversationId"]


def test_conversation_and_per_agent_sessions_survive_restart(tmp_path):
    path = tmp_path / "conversations.json"
    first = TaskStore(path=path)
    conversation = first.create_conversation("demo", "PC와 iPad 공용")
    first.bind_agent_session(conversation.conversation_id, "codex-cli", "codex-thread")
    first.bind_agent_session(conversation.conversation_id, "claude-code", "claude-session")
    task = first.create(
        "demo",
        user_message="같은 화면에 남을 턴",
        agent_id="claude-code",
        conversation_id=conversation.conversation_id,
    )
    first.close()

    reopened = TaskStore(path=path)
    restored = reopened.get_conversation("demo", conversation.conversation_id)
    assert restored is not None
    assert restored.agent_sessions == {
        "codex-cli": "codex-thread",
        "claude-code": "claude-session",
    }
    turns = reopened.recent_for_conversation("demo", conversation.conversation_id)
    assert [turn.task_id for turn in turns] == [task.task_id]
    assert turns[0].agent_id == "claude-code"
    reopened.close()
