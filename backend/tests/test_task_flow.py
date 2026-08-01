"""작업 실행 전 구간 (CLAUDE.md §9.4, §11, §12, §14, §16).

Phase 2 완료 기준:
    텍스트 명령 → 선택 프로젝트 최신 세션 → 실행 → 파일 수정 → 결과 반환

에이전트는 가짜다. 여기서 검증하는 것은 Bridge의 중계 로직이지 모델이 아니다.
"""

from __future__ import annotations

import asyncio
import threading

import pytest

from src.agents.base import AgentRunResult
from src.agents.contract import AgentReport
from src.tasks.models import ChangedFile, Question, QuestionOption, TaskStatus
from src.tasks.runner import run_task
from src.tasks.store import TaskStore
from tests.conftest import AUTH


class FakeAgent:
    """지정한 결과를 돌려주고, 부수효과로 파일을 건드린다.

    `gate`를 주면 그 이벤트가 set될 때까지 실행 중 상태로 머문다 —
    "작업이 진행 중일 때" 동작(lock, cancel)을 경쟁 없이 검사하기 위한 것이다.
    """

    def __init__(
        self,
        result: AgentRunResult,
        *,
        writes: dict[str, str] | None = None,
        gate: threading.Event | None = None,
    ):
        self._result = result
        self._writes = writes or {}
        self._gate = gate
        self.calls: list[tuple] = []
        # TestClient는 앱을 별도 스레드의 이벤트 루프에서 돌린다.
        # asyncio.Event는 루프를 넘나들 수 없으므로 threading.Event를 쓴다.
        self.started = threading.Event()

    async def find_latest_session(self, repo_path):
        return "existing-session"

    async def resume_and_run(self, repo_path, session_id, prompt, *, test_commands=None):
        self.calls.append((repo_path, session_id, prompt, test_commands))
        self.started.set()
        while self._gate is not None and not self._gate.is_set():
            await asyncio.sleep(0.005)
        for relative, content in self._writes.items():
            target = repo_path / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")
        return self._result


def completed(**report_kwargs) -> AgentRunResult:
    report = AgentReport(
        status="completed", summary="수정 완료", **report_kwargs
    )
    return AgentRunResult(session_id="s1", report=report, ok=True)


@pytest.fixture
def store(tmp_path):
    s = TaskStore()
    yield s
    s.close()


@pytest.fixture
def project(settings):
    from src.projects.registry import ProjectRegistry

    return ProjectRegistry.load(settings.projects_file).resolve("demo")


# --- runner ---


async def test_completed_run_records_git_truth(store, project):
    """변경 파일 목록의 근거는 에이전트의 말이 아니라 git이다."""
    agent = FakeAgent(
        completed(changedFiles=[ChangedFile(path="src/app.js", summary="수정함")]),
        writes={"src/app.js": "에이전트가 바꿈\n"},
    )
    task = store.create("demo")
    await run_task(task_id=task.task_id, project=project, prompt="p",
                   adapter=agent, store=store)

    done = store.get(task.task_id)
    assert done.status is TaskStatus.COMPLETED
    assert [c.path for c in done.changed_files] == ["src/app.js"]
    assert done.changed_files[0].summary == "수정함"
    assert done.session_id == "s1"


async def test_agent_claiming_changes_it_did_not_make_is_not_believed(store, project):
    """실측 사례: 권한에 막혀도 모델은 수정했다고 말할 수 있다."""
    agent = FakeAgent(
        completed(changedFiles=[ChangedFile(path="src/app.js", summary="바꿨다고 주장")]),
        writes={},  # 실제로는 아무것도 안 바꿨다
    )
    task = store.create("demo")
    await run_task(task_id=task.task_id, project=project, prompt="p",
                   adapter=agent, store=store)

    assert store.get(task.task_id).changed_files == []


async def test_preexisting_changes_are_reported_as_warning(store, project, repo):
    """§16.6 — 사용자의 미커밋 변경이 있었다는 사실을 남긴다."""
    (repo / "src" / "app.js").write_text("사용자가 먼저 고침\n", encoding="utf-8")
    agent = FakeAgent(completed(), writes={"src/other.js": "x\n"})
    task = store.create("demo")
    await run_task(task_id=task.task_id, project=project, prompt="p",
                   adapter=agent, store=store)

    done = store.get(task.task_id)
    assert any("미커밋" in w for w in done.warnings)
    # 사용자 파일은 에이전트의 변경으로 기록되지 않는다
    assert [c.path for c in done.changed_files] == ["src/other.js"]


async def test_user_changes_are_not_destroyed(store, project, repo):
    """§23.17 — 실행 후에도 사용자의 수정이 그대로 남아야 한다."""
    (repo / "src" / "app.js").write_text("사용자 코드\n", encoding="utf-8")
    agent = FakeAgent(completed(), writes={"src/other.js": "x\n"})
    task = store.create("demo")
    await run_task(task_id=task.task_id, project=project, prompt="p",
                   adapter=agent, store=store)

    assert (repo / "src" / "app.js").read_text() == "사용자 코드\n"


async def test_failure_still_reports_changed_files(store, project):
    """§20 Agent Failure — 변경사항을 숨기지 않는다."""
    agent = FakeAgent(
        AgentRunResult(session_id="s1", ok=False, error="권한이 거부되어...",
                       denied_tools=["Bash"]),
        writes={"src/app.js": "반쯤 바뀜\n"},
    )
    task = store.create("demo")
    await run_task(task_id=task.task_id, project=project, prompt="p",
                   adapter=agent, store=store)

    done = store.get(task.task_id)
    assert done.status is TaskStatus.FAILED
    assert "권한이 거부" in done.error
    assert [c.path for c in done.changed_files] == ["src/app.js"]
    assert any("실패했지만 파일이 변경" in w for w in done.warnings)


async def test_questions_move_task_to_awaiting(store, project):
    """§14 — 답을 받아야 계속할 수 있다."""
    report = AgentReport(
        status="needs_answer",
        summary="확인 필요",
        questions=[Question(questionId="q1", text="어느 쪽?",
                            options=[QuestionOption(optionId="a", label="A안")])],
    )
    agent = FakeAgent(AgentRunResult(session_id="s1", report=report, ok=True))
    task = store.create("demo")
    await run_task(task_id=task.task_id, project=project, prompt="p",
                   adapter=agent, store=store)

    done = store.get(task.task_id)
    assert done.status is TaskStatus.AWAITING_CONFIRMATION
    assert done.questions[0].options[0].label == "A안"


async def test_missing_repo_fails_before_running_the_agent(store, project, repo):
    """§16.1 — 경로가 없으면 에이전트를 부르지 않는다."""
    import shutil

    shutil.rmtree(repo)
    agent = FakeAgent(completed())
    task = store.create("demo")
    await run_task(task_id=task.task_id, project=project, prompt="p",
                   adapter=agent, store=store)

    assert store.get(task.task_id).status is TaskStatus.FAILED
    assert agent.calls == []


async def test_unexpected_error_does_not_leave_the_project_locked(store, project):
    """§15 — 작업이 queued에 남으면 프로젝트 lock이 영원히 풀리지 않는다.

    실제로 그런 일이 있었다: 커밋 없는 새 저장소에서 git 호출이 실패해 작업이
    queued에 갇히고, 그 프로젝트로는 다시 작업을 만들 수 없었다.
    """

    class Exploding:
        async def find_latest_session(self, repo_path):
            raise RuntimeError("예상치 못한 실패")

        async def resume_and_run(self, *a, **k):  # pragma: no cover
            raise AssertionError("여기까지 오지 않는다")

    task = store.create("demo")
    await run_task(task_id=task.task_id, project=project, prompt="p",
                   adapter=Exploding(), store=store)

    done = store.get(task.task_id)
    assert done.status is TaskStatus.FAILED
    assert "예상치 못한 실패" in done.error
    # lock이 풀렸으므로 새 작업을 만들 수 있다
    assert store.create("demo").task_id != task.task_id


async def test_project_test_commands_are_passed_to_the_agent(store, project):
    agent = FakeAgent(completed())
    task = store.create("demo")
    await run_task(task_id=task.task_id, project=project, prompt="p",
                   adapter=agent, store=store)
    assert agent.calls[0][3] == ["npx vitest"]


# --- API ---


@pytest.fixture
def api(client):
    """가짜 에이전트를 끼운 클라이언트."""
    client.app.state.adapter = FakeAgent(
        completed(changedFiles=[ChangedFile(path="src/app.js", summary="수정")]),
        writes={"src/app.js": "바뀜\n"},
    )
    return client


async def _wait_started(agent):
    """가짜 에이전트가 실행에 들어갈 때까지 기다린다(스레드 경계를 넘는다)."""
    for _ in range(400):
        if agent.started.is_set():
            return
        await asyncio.sleep(0.01)
    raise AssertionError("에이전트가 시작되지 않았습니다")


async def _settle(client):
    """백그라운드 작업이 끝날 때까지 기다린다."""
    for _ in range(200):
        if not client.app.state.running:
            return
        await asyncio.sleep(0.01)
    raise AssertionError("백그라운드 작업이 끝나지 않았습니다")


async def test_text_command_end_to_end(api):
    """Phase 2 완료 기준."""
    created = api.post(
        "/api/v1/tasks",
        headers=AUTH,
        data={"projectId": "demo", "typedNote": "로그인 버튼을 아래로 옮겨줘"},
    )
    assert created.status_code == 202
    task_id = created.json()["taskId"]

    await _settle(api)

    body = api.get(f"/api/v1/tasks/{task_id}", headers=AUTH).json()
    assert body["status"] == "completed"
    assert body["changedFiles"][0]["path"] == "src/app.js"
    assert body["sessionId"] == "s1"


def test_task_creation_requires_auth(client):
    r = client.post("/api/v1/tasks", data={"projectId": "demo", "typedNote": "x"})
    assert r.status_code == 401


def test_unknown_project_is_rejected(api):
    r = api.post("/api/v1/tasks", headers=AUTH,
                 data={"projectId": "nope", "typedNote": "x"})
    assert r.status_code == 404


def test_empty_note_is_rejected(api):
    r = api.post("/api/v1/tasks", headers=AUTH,
                 data={"projectId": "demo", "typedNote": "   "})
    assert r.status_code == 400


def test_drawing_without_vision_configured_is_refused(api):
    """키가 없으면 그림을 조용히 무시하지 않고 명확히 거절한다."""
    api.app.state.vision = None
    r = api.post(
        "/api/v1/tasks",
        headers=AUTH,
        data={"projectId": "demo", "mode": "annotate_existing_screen"},
        files={"canvasImage": ("c.png", b"\x89PNG\r\n", "image/png")},
    )
    assert r.status_code == 503
    assert "BRIDGE_OPENAI_API_KEY" in r.json()["detail"]


def test_request_without_note_or_image_is_rejected(api):
    r = api.post("/api/v1/tasks", headers=AUTH, data={"projectId": "demo"})
    assert r.status_code == 400


async def test_second_task_gets_409(client):
    """§15 — 프로젝트당 하나. 첫 작업이 **실제로 진행 중일 때** 확인한다."""
    gate = threading.Event()
    client.app.state.adapter = FakeAgent(completed(), gate=gate)

    first = client.post("/api/v1/tasks", headers=AUTH,
                        data={"projectId": "demo", "typedNote": "a"})
    assert first.status_code == 202
    await _wait_started(client.app.state.adapter)

    second = client.post("/api/v1/tasks", headers=AUTH,
                         data={"projectId": "demo", "typedNote": "b"})
    assert second.status_code == 409

    gate.set()
    await _settle(client)


async def test_resent_client_task_id_does_not_run_twice(api):
    payload = {"projectId": "demo", "typedNote": "a", "clientTaskId": "same"}
    first = api.post("/api/v1/tasks", headers=AUTH, data=payload)
    await _settle(api)
    second = api.post("/api/v1/tasks", headers=AUTH, data=payload)

    assert first.json()["taskId"] == second.json()["taskId"]
    assert len(api.app.state.adapter.calls) == 1


async def test_answer_resumes_the_task(client, repo):
    """§12.6 · §14 — iPad에서 고른 답이 세션으로 전달된다."""
    report = AgentReport(
        status="needs_answer", summary="확인",
        questions=[Question(questionId="q1", text="어느 쪽?",
                            options=[QuestionOption(optionId="a", label="A안")])],
    )
    asking = FakeAgent(AgentRunResult(session_id="s1", report=report, ok=True))
    client.app.state.adapter = asking

    task_id = client.post("/api/v1/tasks", headers=AUTH,
                          data={"projectId": "demo", "typedNote": "x"}).json()["taskId"]
    await _settle(client)
    assert client.get(f"/api/v1/tasks/{task_id}", headers=AUTH).json()["status"] == (
        "awaiting_confirmation"
    )

    answering = FakeAgent(completed(), writes={"src/app.js": "답 반영\n"})
    client.app.state.adapter = answering
    r = client.post(
        f"/api/v1/tasks/{task_id}/answer",
        headers=AUTH,
        json={"questionId": "q1", "selectedOptionId": "a"},
    )
    assert r.status_code == 200
    await _settle(client)

    assert client.get(f"/api/v1/tasks/{task_id}", headers=AUTH).json()["status"] == "completed"
    # 고른 선택지의 라벨이 프롬프트에 담겨야 한다
    assert "A안" in answering.calls[0][2]


async def test_answer_rejected_when_not_waiting(api):
    task_id = api.post("/api/v1/tasks", headers=AUTH,
                       data={"projectId": "demo", "typedNote": "x"}).json()["taskId"]
    await _settle(api)
    r = api.post(f"/api/v1/tasks/{task_id}/answer", headers=AUTH,
                 json={"questionId": "q1", "selectedOptionId": "a"})
    assert r.status_code == 409


async def test_cancel_does_not_revert_files(client, repo):
    """§16 — 취소가 파괴적 동작이 되면 안 된다."""
    gate = threading.Event()
    client.app.state.adapter = FakeAgent(completed(), gate=gate)

    task_id = client.post("/api/v1/tasks", headers=AUTH,
                          data={"projectId": "demo", "typedNote": "x"}).json()["taskId"]
    await _wait_started(client.app.state.adapter)
    (repo / "src" / "app.js").write_text("작업 중 생긴 변경\n", encoding="utf-8")

    body = client.post(f"/api/v1/tasks/{task_id}/cancel", headers=AUTH).json()
    assert body["status"] == "cancelled"
    assert any("되돌리지 않았습니다" in w for w in body["warnings"])
    assert (repo / "src" / "app.js").read_text() == "작업 중 생긴 변경\n"

    gate.set()
    await _settle(client)


def test_unknown_task_is_404(api):
    assert api.get("/api/v1/tasks/nope", headers=AUTH).status_code == 404
