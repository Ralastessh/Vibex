from __future__ import annotations
import json
import logging
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from src.tasks.models import (
    ACTIVE_STATUSES,
    TERMINAL_STATUSES,
    ActivityItem,
    AgentUsage,
    ApprovalMode,
    ChangedFile,
    ClarificationTurn,
    Conversation,
    Question,
    Task,
    TaskAttachment,
    TaskInputReference,
    TaskStatus,
    TestResult,
    ThreadMode,
)
from src.tasks.context import SharedContext, compact_conversation, shared_context_for_agent

logger = logging.getLogger("bridge.store")
# 이전 프로세스는 종료
MAX_RETAINED_TASKS = 200


class ProjectBusyError(RuntimeError):
    def __init__(self, project_id: str, active_task_id: str) -> None:
        super().__init__(f"{project_id} 에 진행 중인 작업이 있습니다: {active_task_id}")
        self.project_id = project_id
        self.active_task_id = active_task_id


class TaskStore:
    def __init__(
        self,
        on_change=None,
        path: Path | None = None,
        *,
        context_recent_tokens: int = 12_288,
        context_summary_tokens: int = 4_096,
    ) -> None:
        #: task_id -> Task. 삽입 순서가 곧 생성 순서다(축출이 이것에 기댄다).
        self._tasks: dict[str, Task] = {}
        #: conversation_id -> VIBEX 공용 대화 메타데이터.
        self._conversations: dict[str, Conversation] = {}
        #: project_id -> task_id. **이 딕셔너리가 프로젝트 lock 그 자체다**(§15).
        self._active: dict[str, str] = {}
        #: (project_id, client_task_id) -> task_id. 재전송 중복 방지(§12.3).
        self._by_client: dict[tuple[str, str], str] = {}
        self._review_patches: dict[str, str] = {}
        #: task_id -> (작업 직전 Git tree, 작업 직후 Git tree)
        self._review_trees: dict[str, tuple[str, str]] = {}
        self._lock = threading.RLock()
        self._on_change = on_change
        self._path = path
        self._context_recent_tokens = context_recent_tokens
        self._context_summary_tokens = context_summary_tokens
        self._load()

    def close(self) -> None:
        with self._lock:
            self._save_locked()
            self._tasks.clear()
            self._conversations.clear()
            self._active.clear()
            self._by_client.clear()
            self._review_patches.clear()
            self._review_trees.clear()

    # --- 생성 ---

    def create(
        self,
        project_id: str,
        client_task_id: str | None = None,
        *,
        user_message: str = "",
        origin: str = "ipad",
        agent_model: str | None = None,
        reasoning_effort: str | None = None,
        speed_mode: str | None = None,
        approval_mode: ApprovalMode = "default",
        agent_id: str | None = None,
        regenerated_from_task_id: str | None = None,
        thread_mode: ThreadMode = "auto",
        thread_id: str | None = None,
        conversation_id: str | None = None,
    ) -> Task:
        with self._lock:
            # 같은 clientTaskId면 끝난 작업이라도 원래 것을 돌려준다.
            # iPad가 네트워크 문제로 재전송해도 작업이 두 번 생기면 안 된다.
            existing = self._find_by_client(project_id, client_task_id)
            if existing is not None:
                return _copy(existing)

            holder = self._active.get(project_id)
            if holder is not None:
                raise ProjectBusyError(project_id, holder)

            conversation = self._ensure_conversation_locked(
                project_id, conversation_id=conversation_id
            )

            task = Task(
                task_id=str(uuid.uuid4()),
                project_id=project_id,
                conversation_id=conversation.conversation_id,
                status=TaskStatus.QUEUED,
                client_task_id=client_task_id,
                user_message=user_message,
                origin=origin,
                agent_model=agent_model,
                reasoning_effort=reasoning_effort,
                speed_mode=speed_mode,
                approval_mode=approval_mode,
                agent_id=agent_id,
                regenerated_from_task_id=regenerated_from_task_id,
                thread_mode=thread_mode,
                thread_id=thread_id,
                session_id=thread_id,
            )
            self._tasks[task.task_id] = task
            self._touch_conversation_locked(conversation, user_message)
            self._active[project_id] = task.task_id
            if client_task_id is not None:
                self._by_client[(project_id, client_task_id)] = task.task_id

            self._evict()
            self._save_locked()
            snapshot = _copy(task)

        # 알림은 lock 밖에서. 구독자가 다시 저장소를 부를 수 있다.
        self._notify(snapshot)
        return snapshot

    # --- 조회 ---

    def get(self, task_id: str) -> Task | None:
        with self._lock:
            task = self._tasks.get(task_id)
            return _copy(task) if task is not None else None

    def active_task(self, project_id: str) -> Task | None:
        with self._lock:
            task_id = self._active.get(project_id)
            if task_id is None:
                return None
            task = self._tasks.get(task_id)
            return _copy(task) if task is not None else None

    def find_by_client_task_id(
        self, project_id: str, client_task_id: str | None
    ) -> Task | None:
        with self._lock:
            task = self._find_by_client(project_id, client_task_id)
            return _copy(task) if task is not None else None

    def recent(self, project_id: str, limit: int = 10) -> list[Task]:
        """최신 순. 대화 스레드가 시간순으로 보이려면 순서가 보장되어야 한다."""
        with self._lock:
            found = [t for t in self._tasks.values() if t.project_id == project_id]
            return [_copy(t) for t in reversed(found)][:limit]

    def recent_for_conversation(
        self, project_id: str, conversation_id: str, limit: int = 100
    ) -> list[Task]:
        with self._lock:
            conversation = self._conversations.get(conversation_id)
            if conversation is None or conversation.project_id != project_id:
                raise LookupError(conversation_id)
            found = [
                task
                for task in self._tasks.values()
                if task.project_id == project_id
                and task.conversation_id == conversation_id
            ]
            return [_copy(task) for task in reversed(found)][:limit]

    # --- 공용 대화 ---

    def create_conversation(self, project_id: str, title: str = "새 대화") -> Conversation:
        with self._lock:
            conversation = Conversation(
                conversationId=str(uuid.uuid4()),
                projectId=project_id,
                title=_conversation_title(title),
            )
            self._conversations[conversation.conversation_id] = conversation
            self._save_locked()
            return _copy_conversation(conversation)

    def get_conversation(self, project_id: str, conversation_id: str) -> Conversation | None:
        with self._lock:
            conversation = self._conversations.get(conversation_id)
            if conversation is None or conversation.project_id != project_id:
                return None
            return _copy_conversation(conversation)

    def conversations(self, project_id: str, *, include_archived: bool = False) -> list[Conversation]:
        with self._lock:
            found = [
                conversation
                for conversation in self._conversations.values()
                if conversation.project_id == project_id
                and (include_archived or not conversation.archived)
            ]
            found.sort(key=lambda value: value.updated_at, reverse=True)
            return [_copy_conversation(value) for value in found]

    def bind_agent_session(
        self, conversation_id: str, agent_id: str, session_id: str
    ) -> Conversation:
        with self._lock:
            conversation = self._conversations.get(conversation_id)
            if conversation is None:
                raise LookupError(conversation_id)
            conversation.agent_sessions[agent_id] = session_id
            conversation.updated_at = datetime.now(timezone.utc)
            self._save_locked()
            return _copy_conversation(conversation)

    def shared_context(
        self,
        project_id: str,
        conversation_id: str,
        agent_id: str,
        *,
        before_task_id: str,
        max_tokens: int,
        max_summary_tokens: int,
    ) -> SharedContext:
        """선택 모델이 아직 보지 못한 공용 대화만 bounded handoff로 만든다."""

        with self._lock:
            conversation = self._conversations.get(conversation_id)
            if conversation is None or conversation.project_id != project_id:
                raise LookupError(conversation_id)
            tasks = [
                task
                for task in self._tasks.values()
                if task.project_id == project_id
                and task.conversation_id == conversation_id
            ]
            return shared_context_for_agent(
                conversation.model_copy(deep=True),
                [_copy(task) for task in tasks],
                agent_id=agent_id,
                before_task_id=before_task_id,
                max_tokens=max_tokens,
                max_summary_tokens=max_summary_tokens,
            )

    def record_agent_turn(
        self,
        conversation_id: str,
        agent_id: str,
        task_id: str,
        *,
        max_history_tokens: int,
        recent_history_tokens: int,
        max_summary_tokens: int,
    ) -> Conversation:
        """성공한 턴을 cursor에 반영하고 필요할 때 오래된 문맥을 압축한다."""

        with self._lock:
            conversation = self._conversations.get(conversation_id)
            if conversation is None:
                raise LookupError(conversation_id)
            task = self._tasks.get(task_id)
            if task is None or task.conversation_id != conversation_id:
                raise LookupError(task_id)
            conversation.agent_context_cursors[agent_id] = task_id
            tasks = [
                value
                for value in self._tasks.values()
                if value.conversation_id == conversation_id
            ]
            compacted = compact_conversation(
                conversation,
                [_copy(value) for value in tasks],
                max_history_tokens=max_history_tokens,
                recent_history_tokens=min(recent_history_tokens, max_history_tokens),
                max_summary_tokens=min(max_summary_tokens, max_history_tokens),
            )
            conversation.context_summary = compacted.summary
            conversation.summary_through_task_id = compacted.through_task_id
            conversation.summary_token_estimate = compacted.estimated_tokens
            conversation.updated_at = datetime.now(timezone.utc)
            self._save_locked()
            return _copy_conversation(conversation)

    def rename_conversation(
        self, project_id: str, conversation_id: str, title: str
    ) -> Conversation:
        with self._lock:
            conversation = self._conversations.get(conversation_id)
            if conversation is None or conversation.project_id != project_id:
                raise LookupError(conversation_id)
            conversation.title = _conversation_title(title)
            conversation.updated_at = datetime.now(timezone.utc)
            self._save_locked()
            return _copy_conversation(conversation)

    def archive_conversation(
        self, project_id: str, conversation_id: str
    ) -> Conversation:
        with self._lock:
            conversation = self._conversations.get(conversation_id)
            if conversation is None or conversation.project_id != project_id:
                raise LookupError(conversation_id)
            conversation.archived = True
            conversation.updated_at = datetime.now(timezone.utc)
            self._save_locked()
            return _copy_conversation(conversation)

    def delete_conversation(
        self, project_id: str, conversation_id: str
    ) -> Conversation:
        """대화와 그 대화에 속한 VIBEX 작업 기록을 영구 삭제한다.

        실행 중인 작업을 지우면 프로젝트 lock과 에이전트 실행의 귀속이
        사라지므로 해당 대화가 작업 중일 때는 삭제를 거부한다.
        """

        with self._lock:
            conversation = self._conversations.get(conversation_id)
            if conversation is None or conversation.project_id != project_id:
                raise LookupError(conversation_id)

            task_ids = [
                task.task_id
                for task in self._tasks.values()
                if task.project_id == project_id
                and task.conversation_id == conversation_id
            ]
            active_task = next(
                (
                    self._tasks[task_id]
                    for task_id in task_ids
                    if self._tasks[task_id].status in ACTIVE_STATUSES
                ),
                None,
            )
            if active_task is not None:
                raise ProjectBusyError(project_id, active_task.task_id)

            deleted = _copy_conversation(conversation)
            for task_id in task_ids:
                task = self._tasks.pop(task_id)
                self._review_patches.pop(task_id, None)
                self._review_trees.pop(task_id, None)
                if task.client_task_id is not None:
                    self._by_client.pop(
                        (task.project_id, task.client_task_id), None
                    )
                if self._active.get(project_id) == task_id:
                    self._active.pop(project_id, None)

            del self._conversations[conversation_id]
            self._save_locked()
            return deleted

    def agent_session(self, conversation_id: str, agent_id: str) -> str | None:
        with self._lock:
            conversation = self._conversations.get(conversation_id)
            return conversation.agent_sessions.get(agent_id) if conversation else None

    def review_patch(self, task_id: str) -> str | None:
        with self._lock:
            return self._review_patches.get(task_id)

    def review_trees(self, task_id: str) -> tuple[str, str] | None:
        with self._lock:
            return self._review_trees.get(task_id)

    # --- 갱신 ---

    def update(
        self,
        task_id: str,
        *,
        status: TaskStatus | None = None,
        session_id: str | None = None,
        thread_id: str | None = None,
        turn_id: str | None = None,
        agent_model: str | None = None,
        shared_context_tokens: int | None = None,
        context_through_task_id: str | None = None,
        summary: str | None = None,
        agent_reply: str | None = None,
        activity_items: list[ActivityItem] | None = None,
        usage: AgentUsage | None = None,
        attachments: list[TaskAttachment] | None = None,
        input_references: list[TaskInputReference] | None = None,
        changed_files: list[ChangedFile] | None = None,
        test_results: list[TestResult] | None = None,
        questions: list[Question] | None = None,
        clarification_turns: list[ClarificationTurn] | None = None,
        warnings: list[str] | None = None,
        error: str | None = None,
        review_patch: str | None = None,
        review_before_tree: str | None = None,
        review_after_tree: str | None = None,
        undone: bool | None = None,
    ) -> Task:
        with self._lock:
            task = self._tasks.get(task_id)
            if task is None:
                raise LookupError(task_id)

            now = datetime.now(timezone.utc)
            if status is not None:
                task.status = status
                if status in TERMINAL_STATUSES and task.completed_at is None:
                    task.completed_at = now
            if session_id is not None:
                task.session_id = session_id
            if thread_id is not None:
                task.thread_id = thread_id
                # sessionId is the backwards-compatible alias used by the iPad
                # and older VS Code builds. Keep it in sync for Codex threads.
                task.session_id = thread_id
            if turn_id is not None:
                task.turn_id = turn_id
            if agent_model is not None:
                task.agent_model = agent_model
            if shared_context_tokens is not None:
                task.shared_context_tokens = shared_context_tokens
            if context_through_task_id is not None:
                task.context_through_task_id = context_through_task_id
            if summary is not None:
                task.summary = summary
            if agent_reply is not None:
                task.agent_reply = agent_reply
            if activity_items is not None:
                task.activity_items = [item.model_copy(deep=True) for item in activity_items]
            if usage is not None:
                task.usage = usage.model_copy(deep=True)
            if attachments is not None:
                task.attachments = [item.model_copy(deep=True) for item in attachments]
            if input_references is not None:
                task.input_references = [
                    item.model_copy(deep=True) for item in input_references
                ]
            # 넘어온 리스트를 그대로 들고 있지 않는다. 호출부가 나중에 고치면
            # 저장된 값이 따라 흔들린다.
            if changed_files is not None:
                task.changed_files = [c.model_copy(deep=True) for c in changed_files]
            if test_results is not None:
                task.test_results = [t.model_copy(deep=True) for t in test_results]
            if questions is not None:
                task.questions = [q.model_copy(deep=True) for q in questions]
            if clarification_turns is not None:
                task.clarification_turns = [
                    turn.model_copy(deep=True) for turn in clarification_turns
                ]
            if warnings is not None:
                task.warnings = list(warnings)
            if error is not None:
                task.error = error
            if review_patch is not None:
                if review_patch.strip():
                    self._review_patches[task_id] = review_patch
                    task.review_available = True
                else:
                    self._review_patches.pop(task_id, None)
                    self._review_trees.pop(task_id, None)
                    task.review_available = False
            if review_before_tree is not None and review_after_tree is not None:
                if task.review_available:
                    self._review_trees[task_id] = (
                        review_before_tree,
                        review_after_tree,
                    )
                else:
                    self._review_trees.pop(task_id, None)
            if undone is not None:
                task.undone = undone

            task.updated_at = now
            conversation = (
                self._conversations.get(task.conversation_id)
                if task.conversation_id
                else None
            )
            if conversation is not None:
                conversation.updated_at = now
            self._sync_lock(task)
            self._evict()
            # 토큰 delta마다 디스크 전체를 다시 쓰지 않는다. 대화가 사용자에게
            # 반환 가능한 경계에 도달했을 때만 내구 저장한다.
            if (
                status in TERMINAL_STATUSES
                or status is TaskStatus.AWAITING_CONFIRMATION
                or undone is not None
            ):
                self._save_locked()
            snapshot = _copy(task)

        self._notify(snapshot)
        return snapshot

    # --- 내부 ---

    def _load(self) -> None:
        if self._path is None or not self._path.exists():
            return
        try:
            payload = json.loads(self._path.read_text(encoding="utf-8"))
            for value in payload.get("tasks", []):
                task = Task.model_validate(value)
                if task.status in ACTIVE_STATUSES:
                    task.status = TaskStatus.FAILED
                    task.error = "VIBEX 백엔드가 재시작되어 이전 실행이 중단되었습니다."
                    task.completed_at = datetime.now(timezone.utc)
                self._tasks[task.task_id] = task
                if task.client_task_id:
                    self._by_client[(task.project_id, task.client_task_id)] = task.task_id
            for value in payload.get("conversations", []):
                conversation = Conversation.model_validate(value)
                self._conversations[conversation.conversation_id] = conversation
            self._migrate_conversations_locked()
            self._review_patches = {
                str(key): str(value)
                for key, value in payload.get("reviewPatches", {}).items()
                if key in self._tasks and value
            }
            self._review_trees = {
                str(key): (str(value[0]), str(value[1]))
                for key, value in payload.get("reviewTrees", {}).items()
                if key in self._tasks and isinstance(value, list) and len(value) == 2
            }
            self._evict()
        except (OSError, ValueError, TypeError, json.JSONDecodeError) as exc:
            logger.warning("저장된 VIBEX 대화를 읽지 못했습니다: %s", exc)

    def _save_locked(self) -> None:
        if self._path is None:
            return
        payload = {
            "version": 2,
            "conversations": [
                conversation.model_dump(by_alias=True, mode="json")
                for conversation in self._conversations.values()
            ],
            "tasks": [
                task.model_dump(by_alias=True, mode="json")
                for task in self._tasks.values()
            ],
            "reviewPatches": self._review_patches,
            "reviewTrees": {
                key: list(value) for key, value in self._review_trees.items()
            },
        }
        try:
            self._path.parent.mkdir(parents=True, exist_ok=True)
            temporary = self._path.with_suffix(self._path.suffix + ".tmp")
            temporary.write_text(
                json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            temporary.replace(self._path)
        except OSError as exc:
            logger.warning("VIBEX 대화를 저장하지 못했습니다: %s", exc)

    def _find_by_client(
        self, project_id: str, client_task_id: str | None
    ) -> Task | None:
        if client_task_id is None:
            return None
        task_id = self._by_client.get((project_id, client_task_id))
        return self._tasks.get(task_id) if task_id is not None else None

    def _ensure_conversation_locked(
        self, project_id: str, *, conversation_id: str | None
    ) -> Conversation:
        if conversation_id:
            conversation = self._conversations.get(conversation_id)
            if conversation is None or conversation.project_id != project_id:
                raise LookupError(conversation_id)
            return conversation
        legacy_id = _default_conversation_id(project_id)
        conversation = self._conversations.get(legacy_id)
        if conversation is None:
            conversation = Conversation(
                conversationId=legacy_id,
                projectId=project_id,
                title="기본 대화",
            )
            self._conversations[legacy_id] = conversation
        return conversation

    def _touch_conversation_locked(self, conversation: Conversation, message: str) -> None:
        conversation.updated_at = datetime.now(timezone.utc)
        if conversation.title in {"새 대화", "기본 대화"} and message.strip():
            conversation.title = _conversation_title(message)

    def _migrate_conversations_locked(self) -> None:
        for task in self._tasks.values():
            if task.conversation_id and task.conversation_id in self._conversations:
                continue
            conversation = self._ensure_conversation_locked(
                task.project_id, conversation_id=None
            )
            task.conversation_id = conversation.conversation_id
            if task.updated_at > conversation.updated_at:
                conversation.updated_at = task.updated_at
            if conversation.title == "기본 대화" and task.user_message:
                conversation.title = _conversation_title(task.user_message)

    def _sync_lock(self, task: Task) -> None:
        holder = self._active.get(task.project_id)
        if task.status in ACTIVE_STATUSES:
            if holder is None:
                self._active[task.project_id] = task.task_id
        elif holder == task.task_id:
            del self._active[task.project_id]

    def _evict(self) -> None:
        """끝난 작업만 오래된 것부터 버린다.

        진행 중인 작업은 아무리 오래돼도 남긴다 — lock의 근거이기 때문이다.
        """
        excess = len(self._tasks) - MAX_RETAINED_TASKS
        if excess <= 0:
            return
        for task_id, task in list(self._tasks.items()):  # 삽입 순 = 오래된 순
            if excess <= 0:
                break
            if task.status in ACTIVE_STATUSES:
                continue
            conversation = (
                self._conversations.get(task.conversation_id)
                if task.conversation_id
                else None
            )
            if conversation is not None:
                # Task 원본 보존 한도(200개) 때문에 턴이 사라지기 직전에도 모델용
                # 요약에는 접어 넣는다. 짧은 대화 200개가 32K에 못 미치는 경우의
                # 조용한 문맥 유실을 막는다.
                conversation_tasks = [
                    value
                    for value in self._tasks.values()
                    if value.conversation_id == conversation.conversation_id
                ]
                compacted = compact_conversation(
                    conversation,
                    [_copy(value) for value in conversation_tasks],
                    max_history_tokens=0,
                    recent_history_tokens=self._context_recent_tokens,
                    max_summary_tokens=self._context_summary_tokens,
                )
                conversation.context_summary = compacted.summary
                conversation.summary_through_task_id = compacted.through_task_id
                conversation.summary_token_estimate = compacted.estimated_tokens
            del self._tasks[task_id]
            self._review_patches.pop(task_id, None)
            self._review_trees.pop(task_id, None)
            if task.client_task_id is not None:
                self._by_client.pop((task.project_id, task.client_task_id), None)
            excess -= 1

    def _notify(self, task: Task) -> None:
        if self._on_change is None:
            return
        try:
            self._on_change(task)
        except Exception:
            logger.debug("상태 알림 실패: %s", task.task_id, exc_info=True)


def _copy(task: Task) -> Task:
    """조회 결과를 고쳐도 저장소가 바뀌지 않도록 매번 새 객체를 준다."""
    return task.model_copy(deep=True)


def _copy_conversation(conversation: Conversation) -> Conversation:
    return conversation.model_copy(deep=True)


def _default_conversation_id(project_id: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"vibex-conversation:{project_id}"))


def _conversation_title(value: str) -> str:
    normalized = " ".join((value or "").split()).strip()
    return normalized[:80] or "새 대화"
