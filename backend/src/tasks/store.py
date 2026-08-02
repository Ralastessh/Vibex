from __future__ import annotations
import logging
import threading
import uuid
from datetime import datetime, timezone
from src.tasks.models import (
    ACTIVE_STATUSES,
    ChangedFile,
    Question,
    Task,
    TaskStatus,
    TestResult,
)
from src.vision.schema import ProjectCommand

logger = logging.getLogger("bridge.store")
# 이전 프로세스는 종료
MAX_RETAINED_TASKS = 200


class ProjectBusyError(RuntimeError):
    def __init__(self, project_id: str, active_task_id: str) -> None:
        super().__init__(f"{project_id} 에 진행 중인 작업이 있습니다: {active_task_id}")
        self.project_id = project_id
        self.active_task_id = active_task_id


class TaskStore:
    def __init__(self, on_change=None) -> None:
        #: task_id -> Task. 삽입 순서가 곧 생성 순서다(축출이 이것에 기댄다).
        self._tasks: dict[str, Task] = {}
        #: project_id -> task_id. **이 딕셔너리가 프로젝트 lock 그 자체다**(§15).
        self._active: dict[str, str] = {}
        #: (project_id, client_task_id) -> task_id. 재전송 중복 방지(§12.3).
        self._by_client: dict[tuple[str, str], str] = {}
        self._lock = threading.RLock()
        self._on_change = on_change

    def close(self) -> None:
        with self._lock:
            self._tasks.clear()
            self._active.clear()
            self._by_client.clear()

    # --- 생성 ---

    def create(self, project_id: str, client_task_id: str | None = None) -> Task:
        with self._lock:
            # 같은 clientTaskId면 끝난 작업이라도 원래 것을 돌려준다.
            # iPad가 네트워크 문제로 재전송해도 작업이 두 번 생기면 안 된다.
            existing = self._find_by_client(project_id, client_task_id)
            if existing is not None:
                return _copy(existing)

            holder = self._active.get(project_id)
            if holder is not None:
                raise ProjectBusyError(project_id, holder)

            task = Task(
                task_id=str(uuid.uuid4()),
                project_id=project_id,
                status=TaskStatus.QUEUED,
                client_task_id=client_task_id,
            )
            self._tasks[task.task_id] = task
            self._active[project_id] = task.task_id
            if client_task_id is not None:
                self._by_client[(project_id, client_task_id)] = task.task_id

            self._evict()
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

    # --- 갱신 ---

    def update(
        self,
        task_id: str,
        *,
        status: TaskStatus | None = None,
        session_id: str | None = None,
        interpretation: ProjectCommand | None = None,
        summary: str | None = None,
        agent_reply: str | None = None,
        changed_files: list[ChangedFile] | None = None,
        test_results: list[TestResult] | None = None,
        questions: list[Question] | None = None,
        warnings: list[str] | None = None,
        error: str | None = None,
    ) -> Task:
        with self._lock:
            task = self._tasks.get(task_id)
            if task is None:
                raise LookupError(task_id)

            if status is not None:
                task.status = status
            if session_id is not None:
                task.session_id = session_id
            if interpretation is not None:
                task.interpretation = interpretation.model_copy(deep=True)
            if summary is not None:
                task.summary = summary
            if agent_reply is not None:
                task.agent_reply = agent_reply
            # 넘어온 리스트를 그대로 들고 있지 않는다. 호출부가 나중에 고치면
            # 저장된 값이 따라 흔들린다.
            if changed_files is not None:
                task.changed_files = [c.model_copy(deep=True) for c in changed_files]
            if test_results is not None:
                task.test_results = [t.model_copy(deep=True) for t in test_results]
            if questions is not None:
                task.questions = [q.model_copy(deep=True) for q in questions]
            if warnings is not None:
                task.warnings = list(warnings)
            if error is not None:
                task.error = error

            task.updated_at = datetime.now(timezone.utc)
            self._sync_lock(task)
            self._evict()
            snapshot = _copy(task)

        self._notify(snapshot)
        return snapshot

    # --- 내부 ---

    def _find_by_client(
        self, project_id: str, client_task_id: str | None
    ) -> Task | None:
        if client_task_id is None:
            return None
        task_id = self._by_client.get((project_id, client_task_id))
        return self._tasks.get(task_id) if task_id is not None else None

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
            del self._tasks[task_id]
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
