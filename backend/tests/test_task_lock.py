"""작업 상태와 프로젝트 lock (CLAUDE.md §11, §15).

lock이 뚫리면 두 작업이 같은 저장소를 동시에 수정한다 — 사용자의 미커밋
변경사항을 파괴할 수 있는 유일한 경로다(§23.17).
"""

from __future__ import annotations

import pytest

from src.tasks.models import ACTIVE_STATUSES, TERMINAL_STATUSES, TaskStatus
from src.tasks.store import ProjectBusyError, TaskStore


@pytest.fixture
def store():
    s = TaskStore()
    yield s
    s.close()


def test_second_task_on_same_project_is_refused(store):
    first = store.create("demo")
    with pytest.raises(ProjectBusyError) as exc:
        store.create("demo")
    assert exc.value.active_task_id == first.task_id


def test_other_projects_are_unaffected(store):
    """§15 — 다른 프로젝트는 독립 실행 가능하다."""
    store.create("demo")
    assert store.create("moonwalk").project_id == "moonwalk"


@pytest.mark.parametrize("terminal", sorted(TERMINAL_STATUSES, key=lambda s: s.value))
def test_project_frees_up_after_task_finishes(store, terminal):
    first = store.create("demo")
    store.update(first.task_id, status=terminal)
    assert store.create("demo").task_id != first.task_id


@pytest.mark.parametrize("active", sorted(ACTIVE_STATUSES, key=lambda s: s.value))
def test_every_active_status_holds_the_lock(store, active):
    """상태를 하나 추가하고 인덱스 갱신을 잊으면 lock이 조용히 뚫린다."""
    first = store.create("demo")
    store.update(first.task_id, status=active)
    with pytest.raises(ProjectBusyError):
        store.create("demo")


def test_active_task_lookup_matches_the_lock(store):
    task = store.create("demo")
    assert store.active_task("demo").task_id == task.task_id
    store.update(task.task_id, status=TaskStatus.COMPLETED)
    assert store.active_task("demo") is None


# --- 재전송 (§12.3) ---


def test_same_client_task_id_returns_the_original(store):
    """iPad가 네트워크 문제로 재전송해도 작업이 두 번 생기면 안 된다."""
    first = store.create("demo", client_task_id="abc")
    assert store.create("demo", client_task_id="abc").task_id == first.task_id


def test_resent_after_completion_still_returns_the_original(store):
    first = store.create("demo", client_task_id="abc")
    store.update(first.task_id, status=TaskStatus.COMPLETED)
    again = store.create("demo", client_task_id="abc")
    assert again.task_id == first.task_id
    assert again.status is TaskStatus.COMPLETED


# --- 상태 보존 (§20 iPad Disconnect) ---


def test_results_survive_while_the_process_lives(store):
    """iPad가 끊겼다가 같은 Bridge에 재접속해도 결과가 남는다."""
    from src.tasks.models import ChangedFile, Question, QuestionOption, TestResult

    task = store.create("demo")
    store.update(
        task.task_id,
        status=TaskStatus.COMPLETED,
        session_id="sess-1",
        summary="로그인 버튼 위치 수정",
        changed_files=[ChangedFile(path="src/pages/Login.jsx", summary="버튼 이동")],
        test_results=[TestResult(command="npx vitest run", status="passed", summary="3 passed")],
        questions=[Question(questionId="q1", text="확인?",
                            options=[QuestionOption(optionId="a", label="네")])],
        warnings=["미커밋 변경사항이 있었습니다."],
    )

    # 재접속 = 같은 저장소에 다시 묻기
    loaded = store.get(task.task_id)
    assert loaded.summary == "로그인 버튼 위치 수정"
    assert loaded.changed_files[0].path == "src/pages/Login.jsx"
    assert loaded.test_results[0].status == "passed"
    assert loaded.questions[0].options[0].label == "네"
    assert loaded.warnings == ["미커밋 변경사항이 있었습니다."]


def test_completed_conversation_survives_store_restart(tmp_path):
    path = tmp_path / "conversations.json"
    first = TaskStore(path=path)
    task = first.create(
        "demo", user_message="Codex에게 질문", agent_id="codex-cli"
    )
    first.update(
        task.task_id,
        status=TaskStatus.COMPLETED,
        session_id="codex-thread-1",
        agent_reply="첫 답변",
    )
    first.close()

    second = TaskStore(path=path)
    loaded = second.get(task.task_id)
    assert loaded.user_message == "Codex에게 질문"
    assert loaded.agent_reply == "첫 답변"
    assert loaded.agent_id == "codex-cli"
    assert loaded.session_id == "codex-thread-1"
    second.close()


def test_interrupted_persisted_task_is_failed_after_restart(tmp_path):
    path = tmp_path / "conversations.json"
    first = TaskStore(path=path)
    task = first.create("demo", user_message="실행 중")

    second = TaskStore(path=path)
    loaded = second.get(task.task_id)
    assert loaded.status is TaskStatus.FAILED
    assert "재시작" in loaded.error
    first.close()
    second.close()


def test_reads_return_copies_not_shared_state(store):
    """조회 결과를 고쳐도 저장소가 바뀌면 안 된다.

    SQLite를 쓸 때는 매번 새 객체가 만들어져 이 문제가 없었다. 메모리 저장소는
    같은 객체를 넘기기 쉬운데, 그러면 호출부의 무심한 수정이 저장소에 스며들어
    어디서 바뀌었는지 추적할 수 없게 된다.
    """
    task = store.create("demo")
    fetched = store.get(task.task_id)
    fetched.summary = "밖에서 고친 값"
    fetched.warnings.append("밖에서 넣은 경고")

    again = store.get(task.task_id)
    assert again.summary is None
    assert again.warnings == []


def test_update_arguments_are_not_aliased(store):
    """넘긴 리스트를 나중에 고쳐도 저장된 값이 흔들리면 안 된다."""
    task = store.create("demo")
    warnings = ["처음"]
    store.update(task.task_id, warnings=warnings)
    warnings.append("나중에 추가")

    assert store.get(task.task_id).warnings == ["처음"]


def test_recent_returns_newest_first(store):
    """대화 스레드가 시간순으로 보이려면 순서가 보장되어야 한다."""
    ids = []
    for _ in range(3):
        created = store.create("demo")
        ids.append(created.task_id)
        store.update(created.task_id, status=TaskStatus.COMPLETED)

    assert [t.task_id for t in store.recent("demo")] == list(reversed(ids))


def test_recent_is_scoped_to_the_project(store):
    store.update(store.create("demo").task_id, status=TaskStatus.COMPLETED)
    store.update(store.create("other").task_id, status=TaskStatus.COMPLETED)

    assert [t.project_id for t in store.recent("demo")] == ["demo"]


def test_old_finished_tasks_are_evicted_but_active_ones_survive(store):
    """며칠씩 켜 두는 프로세스라 끝난 작업을 무한히 쌓으면 천천히 새는 것과 같다."""
    from src.tasks.store import MAX_RETAINED_TASKS

    running = store.create("keep-me")
    store.update(running.task_id, status=TaskStatus.RUNNING_AGENT)

    for i in range(MAX_RETAINED_TASKS + 20):
        done = store.create(f"p{i}")
        store.update(done.task_id, status=TaskStatus.COMPLETED)

    # 진행 중인 작업은 아무리 오래돼도 버리지 않는다 — lock의 근거이기 때문이다
    assert store.get(running.task_id) is not None
    assert store.active_task("keep-me") is not None


def test_active_and_terminal_statuses_cover_every_state():
    """상태를 추가하고 어느 쪽에도 넣지 않으면 lock 판정에서 누락된다."""
    assert ACTIVE_STATUSES | TERMINAL_STATUSES == set(TaskStatus)
    assert not (ACTIVE_STATUSES & TERMINAL_STATUSES)
