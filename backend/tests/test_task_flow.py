from __future__ import annotations

import asyncio
import threading

import pytest

from src.agents.base import AgentProgress, AgentRunResult
from src.agents.contract import AgentReport
from src.tasks.models import ActivityItem, ChangedFile, Question, QuestionOption, TaskStatus
from src.tasks.runner import run_task
from src.tasks.store import TaskStore
from tests.conftest import AUTH


class FakeAgent:
    def __init__(
        self,
        result: AgentRunResult,
        *,
        writes: dict[str, str] | None = None,
        gate: threading.Event | None = None,
        progress_updates: list[AgentProgress] | None = None,
    ):
        self._result = result
        self._writes = writes or {}
        self._gate = gate
        self._progress_updates = progress_updates or []
        self.calls: list[tuple] = []
        self.image_contents: list[bytes] = []
        self.find_calls = 0
        self.thread_names: list[tuple] = []
        # TestClient는 앱을 별도 스레드의 이벤트 루프에서 돌림
        # asyncio.Event는 루프를 넘나들 수 없으므로 threading.Event를 씀
        self.started = threading.Event()

    async def find_latest_session(self, repo_path):
        self.find_calls += 1
        return "existing-session"

    async def set_thread_name(self, repo_path, thread_id, name):
        self.thread_names.append((repo_path, thread_id, name))

    async def resume_and_run(
        self, repo_path, session_id, prompt, *, test_commands=None, image_paths=None,
        model=None, effort=None, speed_mode=None,
        on_progress=None,
    ):
        self.calls.append((
            repo_path, session_id, prompt, test_commands, image_paths or [],
            {"model": model, "effort": effort, "speedMode": speed_mode},
        ))
        self.image_contents = [path.read_bytes() for path in (image_paths or [])]
        if on_progress is not None:
            for update in self._progress_updates:
                on_progress(update)
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
    assert agent.calls[0][1] == "existing-session"
    assert [c.path for c in done.changed_files] == ["src/app.js"]
    assert done.changed_files[0].summary == "수정함"
    assert done.session_id == "s1"


async def test_agent_reply_is_kept(store, project):
    reply = "로그인 버튼 배경을 빨강으로 바꿨습니다.\n대비를 위해 글자색은 흰색으로 두었습니다."
    agent = FakeAgent(
        AgentRunResult(
            session_id="s1",
            report=AgentReport(status="completed", summary="버튼 색 변경"),
            ok=True,
            raw_output=f'{reply}\n\n```bridge\n{{"status": "completed"}}\n```',
        )
    )
    task = store.create("demo")
    await run_task(task_id=task.task_id, project=project, prompt="p",
                   adapter=agent, store=store)

    done = store.get(task.task_id)
    assert done.agent_reply == reply    
    assert "```bridge" not in done.agent_reply
    assert done.summary == "버튼 색 변경" 


async def test_structured_reply_is_used_when_only_bridge_block_is_returned(
    store, project
):
    report = AgentReport(status="completed", summary="확인", reply="VIBEX UI 확인")
    raw = (
        '```bridge\n'
        '{"status":"completed","reply":"VIBEX UI 확인",'
        '"summary":"확인","changedFiles":[],"tests":[],"questions":[],"warnings":[]}'
        '\n```'
    )
    agent = FakeAgent(
        AgentRunResult(
            session_id="s1",
            report=report,
            ok=True,
            raw_output=raw,
        )
    )
    task = store.create("demo")

    await run_task(
        task_id=task.task_id,
        project=project,
        prompt="확인만 답해줘",
        adapter=agent,
        store=store,
    )

    assert store.get(task.task_id).agent_reply == "VIBEX UI 확인"


async def test_agent_reply_is_kept_on_failure(store, project):
    """실패했을 때야말로 에이전트가 뭐라고 했는지 확인해야 함"""
    agent = FakeAgent(
        AgentRunResult(
            session_id="s1",
            ok=False,
            error="에이전트가 오류로 종료했습니다",
            raw_output="설정 파일을 찾지 못해 중단했습니다.",
        )
    )
    task = store.create("demo")
    await run_task(task_id=task.task_id, project=project, prompt="p",
                   adapter=agent, store=store)

    done = store.get(task.task_id)
    assert done.status is TaskStatus.FAILED
    assert done.agent_reply == "설정 파일을 찾지 못해 중단했습니다."


async def test_natural_reply_without_bridge_block_completes_and_is_preserved(
    store, project
):
    """구조화 꼬리표 하나 때문에 정상 대화를 실패 화면으로 바꾸지 않는다."""
    reply = "프로젝트는 React 프론트엔드와 FastAPI 백엔드로 구성되어 있습니다."
    agent = FakeAgent(
        AgentRunResult(
            session_id="s1",
            raw_output=reply,
            error="에이전트 응답에서 bridge 결과 블록을 찾지 못했습니다.",
        ),
        writes={"src/app.js": "자연어 답변과 함께 변경됨\n"},
    )
    task = store.create("demo")

    await run_task(
        task_id=task.task_id,
        project=project,
        prompt="p",
        adapter=agent,
        store=store,
    )

    done = store.get(task.task_id)
    assert done.status is TaskStatus.COMPLETED
    assert done.agent_reply == reply
    assert done.error is None
    assert done.review_available is True
    assert [changed.path for changed in done.changed_files] == ["src/app.js"]


async def test_progress_is_queryable_while_agent_is_running(client):
    gate = threading.Event()
    progress = AgentProgress(
        agent_reply="파일을 확인하고 있습니다.",
        activity_items=[
            ActivityItem(
                itemId="cmd-1",
                type="commandExecution",
                status="inProgress",
                output="src/app.js\n",
                data={"command": "find src -type f"},
            )
        ],
    )
    agent = FakeAgent(completed(), gate=gate, progress_updates=[progress])
    client.app.state.adapter = agent

    task_id = client.post(
        "/api/v1/tasks",
        headers=AUTH,
        data={"projectId": "demo", "typedNote": "구조를 확인해줘"},
    ).json()["taskId"]
    await _wait_started(agent)

    running = client.get(f"/api/v1/tasks/{task_id}", headers=AUTH).json()
    assert running["status"] == "running_agent"
    assert running["agentReply"] == "파일을 확인하고 있습니다."
    assert running["activityItems"][0]["itemId"] == "cmd-1"
    assert running["activityItems"][0]["output"] == "src/app.js\n"

    gate.set()
    await _settle(client)


async def test_long_reply_is_preserved_exactly(store, project):
    original = "가" * 100_000
    agent = FakeAgent(
        AgentRunResult(session_id="s1", report=AgentReport(status="completed"),
                       ok=True, raw_output=original)
    )
    task = store.create("demo")
    await run_task(task_id=task.task_id, project=project, prompt="p",
                   adapter=agent, store=store)

    assert store.get(task.task_id).agent_reply == original


async def test_agent_claiming_changes_it_did_not_make_is_not_believed(store, project):
    agent = FakeAgent(
        completed(changedFiles=[ChangedFile(path="src/app.js", summary="바꿨다고 주장")]),
        writes={},  # 실제로는 아무것도 안 바꿨다
    )
    task = store.create("demo")
    await run_task(task_id=task.task_id, project=project, prompt="p",
                   adapter=agent, store=store)

    assert store.get(task.task_id).changed_files == []


async def test_preexisting_changes_are_reported_as_warning(store, project, repo):
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
    (repo / "src" / "app.js").write_text("사용자 코드\n", encoding="utf-8")
    agent = FakeAgent(completed(), writes={"src/other.js": "x\n"})
    task = store.create("demo")
    await run_task(task_id=task.task_id, project=project, prompt="p",
                   adapter=agent, store=store)

    assert (repo / "src" / "app.js").read_text() == "사용자 코드\n"


async def test_failure_still_reports_changed_files(store, project):
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


async def test_vscode_question_is_rendered_as_normal_reply_not_confirmation(
    store, project
):
    report = AgentReport(
        status="needs_answer",
        summary="확인 필요",
        questions=[Question(
            questionId="q1",
            text="어느 쪽으로 진행할까요?",
            options=[QuestionOption(optionId="a", label="A안")],
        )],
    )
    agent = FakeAgent(AgentRunResult(session_id="s1", report=report, ok=True))
    task = store.create("demo", origin="vscode")

    await run_task(
        task_id=task.task_id,
        project=project,
        prompt="p",
        adapter=agent,
        store=store,
    )

    done = store.get(task.task_id)
    assert done.status is TaskStatus.COMPLETED
    assert done.agent_reply == "어느 쪽으로 진행할까요?"
    assert done.questions == []


async def test_missing_repo_fails_before_running_the_agent(store, project, repo):
    import shutil

    shutil.rmtree(repo)
    agent = FakeAgent(completed())
    task = store.create("demo")
    await run_task(task_id=task.task_id, project=project, prompt="p",
                   adapter=agent, store=store)

    assert store.get(task.task_id).status is TaskStatus.FAILED
    assert agent.calls == []


async def test_unexpected_error_does_not_leave_the_project_locked(store, project):
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
    assert store.create("demo").task_id != task.task_id


async def test_project_test_commands_are_passed_to_the_agent(store, project):
    agent = FakeAgent(completed())
    task = store.create("demo")
    await run_task(task_id=task.task_id, project=project, prompt="p",
                   adapter=agent, store=store)
    assert agent.calls[0][3] == ["npx vitest"]


async def test_explicit_new_thread_never_falls_back_to_latest_session(store, project):
    agent = FakeAgent(AgentRunResult(
        session_id="created-thread",
        threadId="created-thread",
        report=AgentReport(status="completed", summary="완료"),
        ok=True,
    ))
    task = store.create(
        "demo",
        thread_mode="new",
        user_message="  사용자가   직접 쓴 새 대화 제목  ",
    )

    await run_task(
        task_id=task.task_id,
        project=project,
        prompt="p",
        adapter=agent,
        store=store,
        thread_mode="new",
    )

    assert agent.find_calls == 0
    assert agent.calls[0][1] is None
    assert agent.thread_names == [
        (project.repo_path, "created-thread", "사용자가 직접 쓴 새 대화 제목")
    ]


async def test_explicit_resume_uses_only_the_selected_thread(store, project):
    agent = FakeAgent(completed())
    task = store.create("demo", thread_mode="resume", thread_id="chosen-thread")

    await run_task(
        task_id=task.task_id,
        project=project,
        prompt="p",
        adapter=agent,
        store=store,
        session_id="chosen-thread",
        thread_mode="resume",
    )

    assert agent.find_calls == 0
    assert agent.calls[0][1] == "chosen-thread"


async def test_resume_without_thread_id_fails_without_running_agent(store, project):
    agent = FakeAgent(completed())
    task = store.create("demo", thread_mode="resume")

    await run_task(
        task_id=task.task_id,
        project=project,
        prompt="p",
        adapter=agent,
        store=store,
        thread_mode="resume",
    )

    assert store.get(task.task_id).status is TaskStatus.FAILED
    assert agent.find_calls == 0
    assert agent.calls == []


# --- API ---


@pytest.fixture
def api(client):
    """가짜 에이전트를 끼운 클라이언트"""
    client.app.state.adapter = FakeAgent(
        completed(changedFiles=[ChangedFile(path="src/app.js", summary="수정")]),
        writes={"src/app.js": "바뀜\n"},
    )
    return client


async def _wait_started(agent):
    """가짜 에이전트가 실행에 들어갈 때까지 기다림(스레드 경계를 넘음)"""
    for _ in range(400):
        if agent.started.is_set():
            return
        await asyncio.sleep(0.01)
    raise AssertionError("에이전트가 시작되지 않았습니다")


async def _settle(client):
    """백그라운드 작업이 끝날 때까지 대기"""
    for _ in range(200):
        if not client.app.state.running:
            return
        await asyncio.sleep(0.01)
    raise AssertionError("백그라운드 작업이 끝나지 않았습니다")


async def test_text_command_end_to_end(api):
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
    assert body["userMessage"] == "로그인 버튼을 아래로 옮겨줘"
    assert body["origin"] == "ipad"
    assert body["changedFiles"][0]["path"] == "src/app.js"
    assert body["sessionId"] == "s1"


async def test_task_review_and_safe_undo(api, repo):
    created = api.post(
        "/api/v1/tasks",
        headers=AUTH,
        data={"projectId": "demo", "typedNote": "파일을 바꿔줘"},
    )
    task_id = created.json()["taskId"]
    await _settle(api)

    task = api.get(f"/api/v1/tasks/{task_id}", headers=AUTH).json()
    assert task["reviewAvailable"] is True
    assert task["undone"] is False
    assert task["completedAt"] is not None
    assert task["changedFiles"] == [
        {"path": "src/app.js", "summary": "수정", "additions": 1, "deletions": 1}
    ]

    review = api.get(f"/api/v1/tasks/{task_id}/review", headers=AUTH)
    assert review.status_code == 200
    assert "diff --git a/src/app.js b/src/app.js" in review.json()["patch"]
    assert review.json()["files"][0]["absolutePath"] == str(repo / "src" / "app.js")

    contents = api.get(
        f"/api/v1/tasks/{task_id}/review/file",
        headers=AUTH,
        params={"path": "src/app.js"},
    )
    assert contents.status_code == 200
    assert contents.json() == {
        "path": "src/app.js",
        "before": "original\n",
        "after": "바뀜\n",
        "beforeExists": True,
        "afterExists": True,
        "contentType": "text/javascript",
        "isBinary": False,
        "encoding": "utf-8",
    }

    undone = api.post(f"/api/v1/tasks/{task_id}/undo", headers=AUTH)
    assert undone.status_code == 200
    assert undone.json()["undone"] is True
    assert undone.json()["completedAt"] == task["completedAt"]
    assert (repo / "src" / "app.js").read_text(encoding="utf-8") == "original\n"
    assert api.post(f"/api/v1/tasks/{task_id}/undo", headers=AUTH).status_code == 409


async def test_vscode_message_origin_is_preserved(api):
    created = api.post(
        "/api/v1/tasks",
        headers=AUTH,
        data={
            "projectId": "demo",
            "typedNote": "이 프로젝트 설명해줘",
            "origin": "vscode",
        },
    )
    await _settle(api)

    body = api.get(
        f"/api/v1/tasks/{created.json()['taskId']}", headers=AUTH
    ).json()
    assert body["userMessage"] == "이 프로젝트 설명해줘"
    assert body["origin"] == "vscode"


async def test_project_conversation_resumes_each_agents_bound_session(api):
    registry = api.app.state.registry
    registry.set_agent_session("demo", "claude-code", "claude-bound")

    first = api.post(
        "/api/v1/tasks",
        headers=AUTH,
        data={
            "projectId": "demo",
            "typedNote": "Claude 턴",
            "origin": "vscode",
        },
    )
    assert first.status_code == 202
    await _settle(api)
    assert api.app.state.adapter.calls[-1][1] == "claude-bound"
    assert registry.resolve("demo").agent_sessions["claude-code"] == "s1"

    registry.set_agent("demo", "codex-cli")
    registry.set_agent_session("demo", "codex-cli", "codex-bound")
    second = api.post(
        "/api/v1/tasks",
        headers=AUTH,
        data={
            "projectId": "demo",
            "typedNote": "Codex 턴",
            "origin": "vscode",
        },
    )
    assert second.status_code == 202
    await _settle(api)
    assert api.app.state.adapter.calls[-1][1] == "codex-bound"

    registry.set_agent("demo", "claude-code")
    third = api.post(
        "/api/v1/tasks",
        headers=AUTH,
        data={
            "projectId": "demo",
            "typedNote": "다시 Claude 턴",
            "origin": "vscode",
        },
    )
    assert third.status_code == 202
    await _settle(api)
    assert api.app.state.adapter.calls[-1][1] == "s1"

    timeline = api.get(
        "/api/v1/tasks?projectId=demo&limit=10", headers=AUTH
    ).json()["tasks"]
    assert [task["userMessage"] for task in timeline[-3:]] == [
        "Claude 턴",
        "Codex 턴",
        "다시 Claude 턴",
    ]
    assert [task["agentId"] for task in timeline[-3:]] == [
        "claude-code",
        "codex-cli",
        "claude-code",
    ]


async def test_model_and_effort_are_forwarded_and_recorded(api):
    created = api.post(
        "/api/v1/tasks",
        headers=AUTH,
        data={
            "projectId": "demo",
            "typedNote": "설명해줘",
            "model": "sonnet",
            "effort": "high",
        },
    )
    assert created.status_code == 202
    await _settle(api)

    body = api.get(
        f"/api/v1/tasks/{created.json()['taskId']}", headers=AUTH
    ).json()
    assert body["agentModel"] == "sonnet"
    assert body["reasoningEffort"] == "high"
    assert api.app.state.adapter.calls[-1][5] == {
        "model": "sonnet", "effort": "high", "speedMode": None
    }


async def test_plain_text_is_not_wrapped_in_a_code_modification_pipeline(api):
    created = api.post(
        "/api/v1/tasks",
        headers=AUTH,
        data={
            "projectId": "demo",
            "typedNote": "hi",
            "origin": "vscode",
        },
    )
    assert created.status_code == 202
    await _settle(api)

    prompt = api.app.state.adapter.calls[-1][2]
    assert prompt == "hi"
    assert "기존 프로젝트 구조" not in prompt
    assert "관련 테스트를 실행" not in prompt
    assert "```bridge" not in prompt


def test_agent_rejects_an_unsupported_effort(api):
    response = api.post(
        "/api/v1/tasks",
        headers=AUTH,
        data={"projectId": "demo", "typedNote": "x", "effort": "xhigh"},
    )
    assert response.status_code == 422


def test_resume_requires_a_thread_id(api):
    response = api.post(
        "/api/v1/tasks",
        headers=AUTH,
        data={"projectId": "demo", "typedNote": "x", "threadMode": "resume"},
    )
    assert response.status_code == 422
    assert "threadId" in response.json()["detail"]


def test_new_thread_rejects_an_existing_thread_id(api):
    response = api.post(
        "/api/v1/tasks",
        headers=AUTH,
        data={
            "projectId": "demo",
            "typedNote": "x",
            "threadMode": "new",
            "threadId": "old-thread",
        },
    )
    assert response.status_code == 422


async def test_api_resume_forwards_the_selected_thread_id(api):
    api.app.state.registry.set_agent("demo", "codex-cli")
    created = api.post(
        "/api/v1/tasks",
        headers=AUTH,
        data={
            "projectId": "demo",
            "typedNote": "이 대화에서 계속해줘",
            "threadMode": "resume",
            "threadId": "selected-thread",
        },
    )
    assert created.status_code == 202

    await _settle(api)

    assert api.app.state.adapter.find_calls == 0
    assert api.app.state.adapter.calls[-1][1] == "selected-thread"


async def test_completed_task_can_regenerate_in_the_exact_same_session(api):
    created = api.post(
        "/api/v1/tasks",
        headers=AUTH,
        data={
            "projectId": "demo",
            "typedNote": "이 프로젝트를 설명해줘",
            "approvalMode": "autopilot",
        },
    )
    assert created.status_code == 202
    await _settle(api)
    original_id = created.json()["taskId"]

    answering = FakeAgent(completed())
    api.app.state.adapter = answering
    response = api.post(
        f"/api/v1/tasks/{original_id}/regenerate",
        headers=AUTH,
    )
    assert response.status_code == 202
    await _settle(api)

    regenerated = api.get(
        f"/api/v1/tasks/{response.json()['taskId']}", headers=AUTH
    ).json()
    assert regenerated["regeneratedFromTaskId"] == original_id
    assert regenerated["userMessage"] == "이 프로젝트를 설명해줘"
    assert regenerated["approvalMode"] == "autopilot"
    assert answering.calls[0][1] == "s1"
    assert "원래 사용자 요청: 이 프로젝트를 설명해줘" in answering.calls[0][2]


def test_explicit_thread_modes_are_not_advertised_for_claude(api):
    response = api.post(
        "/api/v1/tasks",
        headers=AUTH,
        data={"projectId": "demo", "typedNote": "x", "threadMode": "new"},
    )
    assert response.status_code == 501


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


async def test_drawing_runs_the_pc_cli_directly(api):
    r = api.post(
        "/api/v1/tasks",
        headers=AUTH,
        data={"projectId": "demo", "mode": "annotate_existing_screen"},
        files={
            "canvasImage": ("c.png", b"drawing", "image/png"),
            "renderedViewImage": ("view.jpg", b"rendered", "image/jpeg"),
        },
    )
    assert r.status_code == 202
    await _settle(api)
    assert api.app.state.adapter.image_contents == [b"rendered", b"drawing"]
    assert "외부 Vision" not in api.app.state.adapter.calls[0][2]
    assert "LLM CLI" in api.app.state.adapter.calls[0][2]


def test_drawing_requires_the_live_render(api):
    r = api.post(
        "/api/v1/tasks", headers=AUTH, data={"projectId": "demo"},
        files={"canvasImage": ("c.png", b"drawing", "image/png")},
    )
    assert r.status_code == 400
    assert "renderedViewImage" in r.json()["detail"]


def test_request_without_note_or_image_is_rejected(api):
    r = api.post("/api/v1/tasks", headers=AUTH, data={"projectId": "demo"})
    assert r.status_code == 400


async def test_second_task_gets_409(client):
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
    asking = FakeAgent(
        AgentRunResult(
            session_id="s1",
            report=report,
            ok=True,
            raw_output=(
                "어느 쪽인지 먼저 확인할게요.\n\n"
                "```bridge\n{\"status\":\"needs_answer\"}\n```"
            ),
        )
    )
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
    completed_task = client.get(
        f"/api/v1/tasks/{task_id}", headers=AUTH
    ).json()
    assert completed_task["clarificationTurns"] == [
        {
            "question": {
                "questionId": "q1",
                "text": "어느 쪽?",
                "options": [{"optionId": "a", "label": "A안"}],
                "overlay": None,
            },
            "answer": "A안",
            "assistantReply": "어느 쪽인지 먼저 확인할게요.",
            "selectedOptionId": "a",
            "answeredAt": completed_task["clarificationTurns"][0]["answeredAt"],
        }
    ]
    # 고른 선택지의 라벨이 프롬프트에 담겨야 한다
    assert "A안" in answering.calls[0][2]

    # 되물은 **그 세션**에 답해야 한다. 최신 세션을 다시 찾으면(find_latest_session은
    # "existing-session"을 준다) 그 사이 다른 대화가 건드려졌을 때 답이 엉뚱한 곳으로 간다.
    assert answering.calls[0][1] == "s1"


async def test_free_text_answer_resumes_without_a_recommended_option(client):
    report = AgentReport(
        status="needs_answer",
        questions=[Question(
            questionId="q1",
            text="어떤 동작이어야 하나요?",
            options=[QuestionOption(optionId="back", label="뒤로가기")],
        )],
    )
    client.app.state.adapter = FakeAgent(
        AgentRunResult(session_id="s1", report=report, ok=True)
    )
    task_id = client.post(
        "/api/v1/tasks", headers=AUTH,
        data={"projectId": "demo", "typedNote": "버튼을 고쳐줘"},
    ).json()["taskId"]
    await _settle(client)

    answering = FakeAgent(completed())
    client.app.state.adapter = answering
    response = client.post(
        f"/api/v1/tasks/{task_id}/answer",
        headers=AUTH,
        json={"questionId": "q1", "freeText": "홈 화면으로 이동"},
    )
    assert response.status_code == 200
    await _settle(client)
    assert "홈 화면으로 이동" in answering.calls[0][2]
    assert answering.calls[0][1] == "s1"
    completed_task = client.get(
        f"/api/v1/tasks/{task_id}", headers=AUTH
    ).json()
    assert completed_task["clarificationTurns"][0]["answer"] == "홈 화면으로 이동"
    assert completed_task["clarificationTurns"][0]["selectedOptionId"] is None


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
    assert body["reviewAvailable"] is True
    assert body["changedFiles"] == [
        {"path": "src/app.js", "summary": "", "additions": 1, "deletions": 1}
    ]

    review = client.get(
        f"/api/v1/tasks/{task_id}/review/file",
        headers=AUTH,
        params={"path": "src/app.js"},
    )
    assert review.status_code == 200
    assert review.json()["before"] == "original\n"
    assert review.json()["after"] == "작업 중 생긴 변경\n"

    undone = client.post(f"/api/v1/tasks/{task_id}/undo", headers=AUTH)
    assert undone.status_code == 200
    assert (repo / "src" / "app.js").read_text() == "original\n"

    gate.set()
    await _settle(client)
    assert client.get(f"/api/v1/tasks/{task_id}", headers=AUTH).json()["status"] == "cancelled"


async def test_cancel_stops_the_running_coroutine(client, repo):
    gate = threading.Event()
    agent = FakeAgent(
        completed(),
        gate=gate,
        writes={"src/app.js": "취소 뒤 쓰면 안 됨\n"},
    )
    client.app.state.adapter = agent
    task_id = client.post(
        "/api/v1/tasks", headers=AUTH,
        data={"projectId": "demo", "typedNote": "오래 걸리는 작업"},
    ).json()["taskId"]
    await _wait_started(agent)

    response = client.post(f"/api/v1/tasks/{task_id}/cancel", headers=AUTH)
    assert response.status_code == 200
    await _settle(client)

    assert client.app.state.running == {}
    assert (repo / "src" / "app.js").read_text(encoding="utf-8") == "original\n"
    assert client.get(f"/api/v1/tasks/{task_id}", headers=AUTH).json()["status"] == "cancelled"


def test_unknown_task_is_404(api):
    assert api.get("/api/v1/tasks/nope", headers=AUTH).status_code == 404
