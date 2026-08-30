"""작업과 대화, 질문에 들어가는 데이터 형식을 모아 둔 파일입니다.

앱에 보내는 JSON은 camelCase를 쓰지만 파이썬 코드 안에서는 snake_case를 씁니다.
작업 중인지 끝난 상태인지 구분하는 목록도 여기서 한 번만 정해 두고 같이 사용합니다.
"""

from __future__ import annotations
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Literal
from pydantic import BaseModel, Field

ThreadMode = Literal["auto", "resume", "new"]
ApprovalMode = Literal["default", "bypass", "autopilot"]

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
    additions: int = 0
    deletions: int = 0


class TaskAttachment(BaseModel):
    name: str
    kind: Literal["rendered_view", "drawing_overlay", "reference_image"] = Field(alias="kind")
    content_type: str = Field(alias="contentType")
    url: str

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


class TaskInputReference(BaseModel):
    name: str
    relative_path: str = Field(alias="relativePath")
    kind: Literal["file", "image"] = "file"

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


class ActivityItem(BaseModel):
    """에이전트가 실행 중 공개한 작업 항목의 현재 스냅샷.

    App Server의 item 종류는 계속 확장될 수 있으므로 공통 필드만 고정하고,
    종류별 원본 필드는 ``data``에 보존한다. UI는 이해하는 종류만 렌더링하고
    모르는 항목을 임의의 기능으로 꾸며내지 않는다.
    """

    item_id: str = Field(alias="itemId")
    type: str
    status: str = "inProgress"
    text: str = ""
    output: str = ""
    data: dict[str, Any] = Field(default_factory=dict)

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


class AgentUsage(BaseModel):
    """공급자가 실제로 반환한 한 turn의 사용량.

    Copilot의 credit 단위는 로컬 CLI에 존재하지 않는다. Codex는 App Server가
    보내는 tokenUsage.last를, Claude는 CLI JSON의 usage/total_cost_usd를 보존해
    UI가 존재하지 않는 값을 추정하지 않게 한다.
    """

    input_tokens: int = Field(default=0, alias="inputTokens")
    cached_input_tokens: int = Field(default=0, alias="cachedInputTokens")
    output_tokens: int = Field(default=0, alias="outputTokens")
    reasoning_output_tokens: int = Field(default=0, alias="reasoningOutputTokens")
    total_tokens: int = Field(default=0, alias="totalTokens")
    cost_usd: float | None = Field(default=None, alias="costUsd")

    model_config = {"populate_by_name": True, "serialize_by_alias": True}

class TestResult(BaseModel):
    command: str
    status: str  # passed / failed / skipped
    summary: str = ""

class QuestionOption(BaseModel):
    option_id: str = Field(alias="optionId")
    label: str
    model_config = {"populate_by_name": True}

class OverlayTarget(BaseModel):
    """라이브 프론트엔드 위에 표시할 정규화 좌표(0~1)."""

    shape: Literal["rectangle", "ellipse", "capsule"] = "rectangle"
    x: float = Field(ge=0, le=1)
    y: float = Field(ge=0, le=1)
    width: float = Field(gt=0, le=1)
    height: float = Field(gt=0, le=1)
    label: str = ""

class Question(BaseModel):
    question_id: str = Field(alias="questionId")
    text: str
    options: list[QuestionOption] = Field(default_factory=list)
    overlay: OverlayTarget | None = None
    model_config = {"populate_by_name": True}

def _now() -> datetime:
    return datetime.now(timezone.utc)


class ClarificationTurn(BaseModel):
    """한 작업 안에서 오간 에이전트의 되물음과 사용자의 답변.

    ``Task.agentReply``는 작업이 재개되면 최신 답변으로 바뀐다. 이전 질문과 답을
    별도로 남겨야 VS Code/iPad가 실제 대화 순서를 잃지 않고 다시 그릴 수 있다.
    """

    question: Question
    answer: str
    assistant_reply: str = Field(default="", alias="assistantReply")
    selected_option_id: str | None = Field(default=None, alias="selectedOptionId")
    answered_at: datetime = Field(default_factory=_now, alias="answeredAt")

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


class Conversation(BaseModel):
    """VS Code와 iPad가 함께 여는 VIBEX 소유의 공용 대화.

    공급자 세션은 대화의 정체성이 아니다. ``agentSessions``에는 각 로컬 CLI를
    다시 이어 쓰기 위한 식별자만 두고, 화면에 표시할 원본 이력은 이 대화에
    속한 Task/turn이 담당한다.
    """

    conversation_id: str = Field(alias="conversationId")
    project_id: str = Field(alias="projectId")
    title: str = "새 대화"
    created_at: datetime = Field(default_factory=_now, alias="createdAt")
    updated_at: datetime = Field(default_factory=_now, alias="updatedAt")
    agent_sessions: dict[str, str] = Field(default_factory=dict, alias="agentSessions")
    # 화면/감사용 원본 Task는 그대로 보존하고 모델 입력에만 쓰는 압축 문맥을
    # 별도로 유지한다. 모델별 cursor로 같은 문맥의 반복 주입도 피한다.
    context_summary: str = Field(default="", alias="contextSummary")
    summary_through_task_id: str | None = Field(
        default=None, alias="summaryThroughTaskId"
    )
    summary_token_estimate: int = Field(default=0, alias="summaryTokenEstimate")
    agent_context_cursors: dict[str, str] = Field(
        default_factory=dict, alias="agentContextCursors"
    )
    archived: bool = False

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


class Task(BaseModel):
    task_id: str = Field(alias="taskId")
    project_id: str = Field(alias="projectId")
    conversation_id: str | None = Field(default=None, alias="conversationId")
    status: TaskStatus
    created_at: datetime = Field(default_factory=_now, alias="createdAt")
    updated_at: datetime = Field(default_factory=_now, alias="updatedAt")
    completed_at: datetime | None = Field(default=None, alias="completedAt")

    client_task_id: str | None = Field(default=None, alias="clientTaskId")
    thread_mode: ThreadMode = Field(default="auto", alias="threadMode")
    thread_id: str | None = Field(default=None, alias="threadId")
    turn_id: str | None = Field(default=None, alias="turnId")
    # 이전 iPad/VS Code 클라이언트와 Claude adapter가 쓰는 호환 필드.
    session_id: str | None = Field(default=None, alias="sessionId")
    agent_id: str | None = Field(default=None, alias="agentId")
    user_message: str = Field(default="", alias="userMessage")
    origin: Literal["ipad", "vscode"] = "ipad"
    agent_model: str | None = Field(default=None, alias="agentModel")
    reasoning_effort: str | None = Field(default=None, alias="reasoningEffort")
    speed_mode: str | None = Field(default=None, alias="speedMode")
    approval_mode: ApprovalMode = Field(default="default", alias="approvalMode")
    shared_context_tokens: int = Field(default=0, alias="sharedContextTokens")
    context_through_task_id: str | None = Field(
        default=None, alias="contextThroughTaskId"
    )
    regenerated_from_task_id: str | None = Field(
        default=None, alias="regeneratedFromTaskId"
    )
    summary: str | None = None

    agent_reply: str | None = Field(default=None, alias="agentReply")
    activity_items: list[ActivityItem] = Field(default_factory=list, alias="activityItems")
    usage: AgentUsage | None = None
    attachments: list[TaskAttachment] = Field(default_factory=list)
    input_references: list[TaskInputReference] = Field(
        default_factory=list, alias="inputReferences"
    )
    changed_files: list[ChangedFile] = Field(default_factory=list, alias="changedFiles")
    test_results: list[TestResult] = Field(default_factory=list, alias="testResults")
    questions: list[Question] = Field(default_factory=list)
    clarification_turns: list[ClarificationTurn] = Field(
        default_factory=list, alias="clarificationTurns"
    )
    warnings: list[str] = Field(default_factory=list)
    error: str | None = None
    review_available: bool = Field(default=False, alias="reviewAvailable")
    undone: bool = False

    model_config = {"populate_by_name": True}

    @property
    def is_active(self) -> bool:
        return self.status in ACTIVE_STATUSES
