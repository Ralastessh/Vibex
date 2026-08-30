"""에이전트를 바꿔도 앞 대화가 필요한 만큼 전달되고 긴 대화는 잘 줄어드는지 확인합니다."""

from __future__ import annotations

import src.tasks.store as store_module
from src.tasks.context import (
    attach_shared_context,
    compact_conversation,
    estimate_tokens,
    shared_context_for_agent,
)
from src.tasks.models import Conversation, Task, TaskStatus
from src.tasks.store import TaskStore


def _complete(store: TaskStore, task: Task, reply: str) -> Task:
    return store.update(
        task.task_id,
        status=TaskStatus.COMPLETED,
        agent_reply=reply,
        session_id=f"{task.agent_id}-session",
    )


def test_token_estimate_is_conservative_for_korean_and_ascii():
    assert estimate_tokens("가나다라마바사") >= 7
    assert 2 <= estimate_tokens("hello world") <= 6


def test_agent_receives_only_turns_after_its_last_cursor():
    store = TaskStore()
    conversation = store.create_conversation("demo", "공용")

    claude = store.create(
        "demo",
        user_message="첫 질문",
        agent_id="claude-code",
        conversation_id=conversation.conversation_id,
    )
    _complete(store, claude, "Claude의 첫 답변")
    store.record_agent_turn(
        conversation.conversation_id,
        "claude-code",
        claude.task_id,
        max_history_tokens=32_768,
        recent_history_tokens=12_288,
        max_summary_tokens=4_096,
    )

    codex = store.create(
        "demo",
        user_message="Codex 질문",
        agent_id="codex-cli",
        conversation_id=conversation.conversation_id,
    )
    handoff = store.shared_context(
        "demo",
        conversation.conversation_id,
        "codex-cli",
        before_task_id=codex.task_id,
        max_tokens=32_768,
        max_summary_tokens=4_096,
    )
    assert "첫 질문" in handoff.text
    assert "Claude의 첫 답변" in handoff.text
    assert "Codex 질문" not in handoff.text

    _complete(store, codex, "Codex의 답변")
    store.record_agent_turn(
        conversation.conversation_id,
        "codex-cli",
        codex.task_id,
        max_history_tokens=32_768,
        recent_history_tokens=12_288,
        max_summary_tokens=4_096,
    )
    next_codex = store.create(
        "demo",
        user_message="다음 질문",
        agent_id="codex-cli",
        conversation_id=conversation.conversation_id,
    )
    repeated = store.shared_context(
        "demo",
        conversation.conversation_id,
        "codex-cli",
        before_task_id=next_codex.task_id,
        max_tokens=32_768,
        max_summary_tokens=4_096,
    )
    assert repeated.text == ""
    store.close()


def test_long_history_is_compacted_without_deleting_original_tasks():
    conversation = Conversation(
        conversationId="conversation",
        projectId="demo",
    )
    tasks = [
        Task(
            taskId=f"task-{index}",
            projectId="demo",
            conversationId="conversation",
            status=TaskStatus.COMPLETED,
            agentId="claude-code" if index % 2 else "codex-cli",
            userMessage=f"요청 {index} " + "가" * 240,
            agentReply=f"답변 {index} " + "나" * 360,
        )
        for index in range(12)
    ]

    compacted = compact_conversation(
        conversation,
        tasks,
        max_history_tokens=1_024,
        recent_history_tokens=512,
        max_summary_tokens=256,
    )
    assert compacted.summary
    assert compacted.through_task_id is not None
    assert compacted.estimated_tokens <= 256
    assert len(tasks) == 12
    assert tasks[0].user_message.startswith("요청 0")


def test_handoff_never_exceeds_previous_context_limit():
    conversation = Conversation(
        conversationId="conversation",
        projectId="demo",
        contextSummary="요약 " + "가" * 400,
        summaryThroughTaskId="task-0",
    )
    tasks = [
        Task(
            taskId=f"task-{index}",
            projectId="demo",
            conversationId="conversation",
            status=TaskStatus.COMPLETED,
            agentId="codex-cli",
            userMessage="질문 " + "나" * 300,
            agentReply="답변 " + "다" * 500,
        )
        for index in range(4)
    ]
    handoff = shared_context_for_agent(
        conversation,
        tasks,
        agent_id="claude-code",
        before_task_id="missing-current-task",
        max_tokens=1_024,
        max_summary_tokens=256,
    )
    assert handoff.through_task_id == "task-3"
    assert handoff.estimated_tokens <= 1_024
    assert "에이전트: 답변" in handoff.text
    assert handoff.text.endswith("</vibex-shared-context>")
    prompt = attach_shared_context("현재 질문", handoff)
    assert prompt.endswith("</current-user-request>")
    assert "현재 질문" in prompt


def test_persisted_summary_is_used_after_its_source_task_was_evicted():
    conversation = Conversation(
        conversationId="conversation",
        projectId="demo",
        contextSummary="오래된 핵심 결정: 인증은 Tailscale을 사용한다.",
        summaryThroughTaskId="already-evicted",
    )
    recent = Task(
        taskId="recent",
        projectId="demo",
        conversationId="conversation",
        status=TaskStatus.COMPLETED,
        agentId="codex-cli",
        userMessage="최근 질문",
        agentReply="최근 답변",
    )
    handoff = shared_context_for_agent(
        conversation,
        [recent],
        agent_id="claude-code",
        before_task_id="current",
        max_tokens=1_024,
        max_summary_tokens=256,
    )
    assert "Tailscale" in handoff.text
    assert "최근 질문" in handoff.text


def test_task_eviction_folds_the_turn_into_the_persisted_summary(monkeypatch):
    monkeypatch.setattr(store_module, "MAX_RETAINED_TASKS", 2)
    store = TaskStore(context_recent_tokens=512, context_summary_tokens=256)
    conversation = store.create_conversation("demo", "공용")
    first = store.create(
        "demo",
        user_message="축출 전에 보존할 결정",
        agent_id="codex-cli",
        conversation_id=conversation.conversation_id,
    )
    _complete(store, first, "SQLite를 사용하기로 결정했다.")
    second = store.create(
        "demo",
        user_message="두 번째",
        agent_id="claude-code",
        conversation_id=conversation.conversation_id,
    )
    _complete(store, second, "두 번째 답변")

    store.create(
        "demo",
        user_message="세 번째",
        agent_id="codex-cli",
        conversation_id=conversation.conversation_id,
    )
    updated = store.get_conversation("demo", conversation.conversation_id)
    assert updated is not None
    assert "SQLite" in updated.context_summary
    assert updated.summary_through_task_id == first.task_id
    assert store.get(first.task_id) is None
    store.close()


def test_summary_and_agent_cursor_survive_backend_restart(tmp_path):
    path = tmp_path / "conversations.json"
    store = TaskStore(path=path)
    conversation = store.create_conversation("demo", "공용")
    task = store.create(
        "demo",
        user_message="오래 보존할 요구사항 " + "가" * 500,
        agent_id="claude-code",
        conversation_id=conversation.conversation_id,
    )
    _complete(store, task, "요구사항을 확인했다. " + "나" * 500)
    store.record_agent_turn(
        conversation.conversation_id,
        "claude-code",
        task.task_id,
        max_history_tokens=1,
        recent_history_tokens=1,
        max_summary_tokens=256,
    )
    store.close()

    restored_store = TaskStore(path=path)
    restored = restored_store.get_conversation("demo", conversation.conversation_id)
    assert restored is not None
    assert restored.context_summary
    assert restored.summary_through_task_id == task.task_id
    assert restored.agent_context_cursors["claude-code"] == task.task_id
    restored_store.close()
