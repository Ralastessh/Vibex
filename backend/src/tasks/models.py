from __future__ import annotations
from datetime import datetime, timezone
from enum import Enum
from pydantic import BaseModel, Field
from src.vision.schema import ProjectCommand

# 현재 작업 상태에 대한 정보 -> 추후 작업이 끊겨도 지속적으로 확인 가능
class TaskStatus(str, Enum):
    QUEUED = "queued"
    INTERPRETING = "interpreting"
    AWAITING_CONFIRMATION = "awaiting_confirmation"
    RESOLVING_SESSION = "resolving_session"
    RUNNING_AGENT = "running_agent"
    TESTING = "testing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

# 아직 종료되지 않은 상태
ACTIVE_STATUSES = frozenset(
    {
        TaskStatus.QUEUED,
        TaskStatus.INTERPRETING,
        TaskStatus.AWAITING_CONFIRMATION,
        TaskStatus.RESOLVING_SESSION,
        TaskStatus.RUNNING_AGENT,
        TaskStatus.TESTING,
    }
)

TERMINAL_STATUSES = frozenset(
    {TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED}
)

class ChangedFile(BaseModel):
    path: str
    summary: str = ""

class TestResult(BaseModel):
    command: str
    status: str  # passed / failed / skipped
    summary: str = ""

class QuestionOption(BaseModel):
    option_id: str = Field(alias="optionId")
    label: str
    model_config = {"populate_by_name": True}

class Question(BaseModel):
    question_id: str = Field(alias="questionId")
    text: str
    options: list[QuestionOption] = Field(default_factory=list)
    model_config = {"populate_by_name": True}

def _now() -> datetime:
    return datetime.now(timezone.utc)

class Task(BaseModel):
    task_id: str = Field(alias="taskId")
    project_id: str = Field(alias="projectId")
    status: TaskStatus
    created_at: datetime = Field(default_factory=_now, alias="createdAt")
    updated_at: datetime = Field(default_factory=_now, alias="updatedAt")

    client_task_id: str | None = Field(default=None, alias="clientTaskId")
    session_id: str | None = Field(default=None, alias="sessionId")
    #: §8 Vision 해석 결과. iPad의 Confirmation 화면(§19)이 이걸 보여준다.
    interpretation: ProjectCommand | None = None
    summary: str | None = None

    agent_reply: str | None = Field(default=None, alias="agentReply")
    changed_files: list[ChangedFile] = Field(default_factory=list, alias="changedFiles")
    test_results: list[TestResult] = Field(default_factory=list, alias="testResults")
    questions: list[Question] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    error: str | None = None

    model_config = {"populate_by_name": True}

    @property
    def is_active(self) -> bool:
        return self.status in ACTIVE_STATUSES
