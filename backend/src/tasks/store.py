from __future__ import annotations
import json
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from storage.db import connect
from tasks.models import (
    ChangedFile,
    Question,
    Task,
    TaskStatus,
    TestResult,
)
from vision.schema import ProjectCommand
from tasks.models import ACTIVE_STATUSES

class ProjectBusyError(RuntimeError):
    def __init__(self, project_id: str, active_task_id: str) -> None:
        super().__init__(f"{project_id} 에 진행 중인 작업이 있습니다: {active_task_id}")
        self.project_id = project_id
        self.active_task_id = active_task_id

def _dumps(items) -> str:
    return json.dumps([i.model_dump(by_alias=True) for i in items], ensure_ascii=False)

class TaskStore:
    def __init__(self, path: Path, on_change=None) -> None:
        self._db = connect(path)
        self._lock = threading.Lock()
        self._on_change = on_change

    def _notify(self, task: Task) -> None:
        if self._on_change is None:
            return
        try:
            self._on_change(task)
        except Exception:
            pass

    def close(self) -> None:
        self._db.close()

    # 새 프로젝트 생성 및 작업
    def create(self, project_id: str, client_task_id: str | None = None) -> Task:
        existing = self.find_by_client_task_id(project_id, client_task_id)
        # 기존 작업이 존재하면 끝내기
        if existing is not None:
            return existing

        task = Task(
            task_id=str(uuid.uuid4()),
            project_id=project_id,
            status=TaskStatus.QUEUED,
            client_task_id=client_task_id,
        )
        try:
            with self._lock:
                self._db.execute(
                    "INSERT INTO tasks (task_id, project_id, status, created_at,"
                    " updated_at, client_task_id) VALUES (?, ?, ?, ?, ?, ?)",
                    (
                        task.task_id,
                        task.project_id,
                        task.status.value,
                        task.created_at.isoformat(),
                        task.updated_at.isoformat(),
                        task.client_task_id,
                    ),
                )
        except sqlite3.IntegrityError as exc:
            active = self.active_task(project_id)
            if active is not None:
                raise ProjectBusyError(project_id, active.task_id) from exc
            raise
        self._notify(task)
        return task

    def get(self, task_id: str) -> Task | None:
        row = self._db.execute(
            "SELECT * FROM tasks WHERE task_id = ?", (task_id,)
        ).fetchone()
        return _to_task(row) if row else None

    def active_task(self, project_id: str) -> Task | None:
        placeholders = ", ".join("?" * len(ACTIVE_STATUSES))
        row = self._db.execute(
            f"SELECT * FROM tasks WHERE project_id = ? AND status IN ({placeholders})",
            (project_id, *(s.value for s in ACTIVE_STATUSES)),
        ).fetchone()
        return _to_task(row) if row else None

    def find_by_client_task_id(
        self, project_id: str, client_task_id: str | None) -> Task | None:
        if client_task_id is None:
            return None
        row = self._db.execute(
            "SELECT * FROM tasks WHERE project_id = ? AND client_task_id = ?",
            (project_id, client_task_id),
        ).fetchone()
        return _to_task(row) if row else None

    def recent(self, project_id: str, limit: int = 10) -> list[Task]:
        rows = self._db.execute(
            "SELECT * FROM tasks WHERE project_id = ?"
            " ORDER BY created_at DESC LIMIT ?",
            (project_id, limit),
        ).fetchall()
        return [_to_task(r) for r in rows]

    # 갱신
    def update(
        self,
        task_id: str,
        *,
        status: TaskStatus | None = None,
        session_id: str | None = None,
        interpretation: "ProjectCommand | None" = None,
        summary: str | None = None,
        changed_files: list[ChangedFile] | None = None,
        test_results: list[TestResult] | None = None,
        questions: list[Question] | None = None,
        warnings: list[str] | None = None,
        error: str | None = None) -> Task:
        fields: dict[str, object] = {
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        if status is not None:
            fields["status"] = status.value
        if session_id is not None:
            fields["session_id"] = session_id
        if interpretation is not None:
            fields["interpretation"] = interpretation.model_dump_json(by_alias=True)
        if summary is not None:
            fields["summary"] = summary
        if changed_files is not None:
            fields["changed_files"] = _dumps(changed_files)
        if test_results is not None:
            fields["test_results"] = _dumps(test_results)
        if questions is not None:
            fields["questions"] = _dumps(questions)
        if warnings is not None:
            fields["warnings"] = json.dumps(warnings, ensure_ascii=False)
        if error is not None:
            fields["error"] = error

        assignments = ", ".join(f"{k} = ?" for k in fields)
        with self._lock:
            self._db.execute(
                f"UPDATE tasks SET {assignments} WHERE task_id = ?",
                (*fields.values(), task_id),
            )
        task = self.get(task_id)
        if task is None:
            raise LookupError(task_id)
        self._notify(task)
        return task

def _to_task(row: sqlite3.Row) -> Task:
    return Task(
        taskId=row["task_id"],
        projectId=row["project_id"],
        status=TaskStatus(row["status"]),
        createdAt=row["created_at"],
        updatedAt=row["updated_at"],
        clientTaskId=row["client_task_id"],
        sessionId=row["session_id"],
        interpretation=(
            json.loads(row["interpretation"]) if row["interpretation"] else None
        ),
        summary=row["summary"],
        changedFiles=json.loads(row["changed_files"]),
        testResults=json.loads(row["test_results"]),
        questions=json.loads(row["questions"]),
        warnings=json.loads(row["warnings"]),
        error=row["error"],
    )
