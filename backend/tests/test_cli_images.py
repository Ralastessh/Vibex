from __future__ import annotations

import pytest
from pydantic import ValidationError

from src.agents.base import AgentRunResult
from src.agents.contract import AgentReport
from src.tasks.models import OverlayTarget, Question, QuestionOption
from src.tasks.assets import TaskAssetStore
from tests.conftest import AUTH
from tests.test_task_flow import FakeAgent, _settle, completed


def image_request(client, *, canvas=b"drawing", rendered=b"rendered"):
    return client.post(
        "/api/v1/tasks",
        headers=AUTH,
        data={"projectId": "demo", "typedNote": "로그인 버튼을 옮겨줘"},
        files={
            "canvasImage": ("drawing.png", canvas, "image/png"),
            "renderedViewImage": ("rendered.jpg", rendered, "image/jpeg"),
        },
    )


async def test_images_go_directly_to_the_selected_cli(client):
    agent = FakeAgent(completed())
    client.app.state.adapter = agent

    created = image_request(client)
    assert created.status_code == 202
    await _settle(client)

    assert agent.image_contents == [b"rendered", b"drawing"]
    paths = agent.calls[0][4]
    assert [path.name for path in paths] == ["rendered-view.jpg", "drawing-overlay.png"]
    # 같은 대화를 VS Code에서도 그대로 보여줄 수 있도록 서버 종료 전까지 보존한다.
    assert all(path.exists() for path in paths)
    task_id = created.json()["taskId"]
    task = client.get(f"/api/v1/tasks/{task_id}", headers=AUTH).json()
    assert [item["kind"] for item in task["attachments"]] == [
        "rendered_view", "drawing_overlay",
    ]
    for attachment, expected in zip(task["attachments"], [b"rendered", b"drawing"]):
        response = client.get(attachment["url"], headers=AUTH)
        assert response.status_code == 200
        assert response.content == expected


async def test_cli_can_ask_a_coordinate_based_question(client):
    question = Question(
        questionId="q1",
        text="이 버튼의 역할은 무엇인가요?",
        overlay=OverlayTarget(
            shape="rectangle", x=0.2, y=0.5, width=0.3, height=0.08,
            label="하단 버튼",
        ),
        options=[
            QuestionOption(optionId="back", label="뒤로가기"),
            QuestionOption(optionId="next", label="앞으로 가기"),
        ],
    )
    client.app.state.adapter = FakeAgent(
        AgentRunResult(
            session_id="visual-session",
            report=AgentReport(status="needs_answer", questions=[question]),
            ok=True,
        )
    )

    task_id = image_request(client).json()["taskId"]
    await _settle(client)
    body = client.get(f"/api/v1/tasks/{task_id}", headers=AUTH).json()
    assert body["status"] == "awaiting_confirmation"
    assert body["questions"][0]["overlay"]["x"] == 0.2
    assert body["questions"][0]["options"][1]["label"] == "앞으로 가기"


@pytest.mark.parametrize(
    "field,filename,mime",
    [
        ("canvasImage", "drawing.svg", "image/svg+xml"),
        ("renderedViewImage", "rendered.gif", "image/gif"),
    ],
)
def test_unsupported_image_type_is_rejected(client, field, filename, mime):
    client.app.state.adapter = FakeAgent(completed())
    files = {
        "canvasImage": ("drawing.png", b"x", "image/png"),
        "renderedViewImage": ("rendered.jpg", b"x", "image/jpeg"),
    }
    files[field] = (filename, b"x", mime)
    response = client.post(
        "/api/v1/tasks", headers=AUTH, data={"projectId": "demo"}, files=files
    )
    assert response.status_code == 415


def test_oversized_image_is_rejected(client):
    client.app.state.adapter = FakeAgent(completed())
    client.app.state.settings.max_image_bytes = 16
    response = image_request(client, canvas=b"x" * 100)
    assert response.status_code == 413


def test_empty_image_is_rejected(client):
    client.app.state.adapter = FakeAgent(completed())
    response = image_request(client, canvas=b"")
    assert response.status_code == 400


def test_overlay_coordinates_must_be_normalized():
    with pytest.raises(ValidationError):
        OverlayTarget(shape="rectangle", x=1.1, y=0, width=0.2, height=0.2)


def test_asset_shutdown_cleanup_never_removes_unrelated_directories(tmp_path):
    store = TaskAssetStore(tmp_path / "assets")
    task_id = "04b73d78-d4cc-48e3-9967-f06c9ca963e4"
    store.save(task_id, [("rendered-view.jpg", b"x")])
    unrelated = store.root / "keep-me"
    unrelated.mkdir()
    (unrelated / "file.txt").write_text("keep", encoding="utf-8")

    store.cleanup_all()

    assert not (store.root / task_id).exists()
    assert (unrelated / "file.txt").read_text(encoding="utf-8") == "keep"
