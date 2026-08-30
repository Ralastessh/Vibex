"""에이전트 종류가 달라도 같은 방식으로 실행할 수 있게 공통 형태를 정해 둔 파일입니다."""

from __future__ import annotations
from pathlib import Path
from typing import Callable, Protocol, runtime_checkable
from pydantic import BaseModel, Field
from src.agents.contract import AgentReport
from src.tasks.models import ActivityItem, AgentUsage, ApprovalMode


class AgentProgress(BaseModel):
    """한 turn을 실행하는 동안 클라이언트에 공개할 수 있는 누적 상태."""

    agent_reply: str = ""
    activity_items: list[ActivityItem] = Field(default_factory=list)
    thread_id: str | None = Field(default=None, alias="threadId")
    turn_id: str | None = Field(default=None, alias="turnId")
    resolved_model: str | None = Field(default=None, alias="resolvedModel")
    usage: AgentUsage | None = None

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


ProgressCallback = Callable[[AgentProgress], None]

class AgentRunResult(BaseModel):
    session_id: str | None = None
    # session_id는 Claude와 기존 클라이언트를 위한 호환 필드다. Codex App
    # Server의 공식 용어인 thread/turn id를 별도로 보존한다.
    thread_id: str | None = Field(default=None, alias="threadId")
    turn_id: str | None = Field(default=None, alias="turnId")
    resolved_model: str | None = Field(default=None, alias="resolvedModel")
    report: AgentReport | None = None
    ok: bool = False
    denied_tools: list[str] = Field(default_factory=list)
    error: str | None = None
    raw_output: str = ""
    activity_items: list[ActivityItem] = Field(default_factory=list)
    usage: AgentUsage | None = None
    cost_usd: float | None = None

    model_config = {"populate_by_name": True, "serialize_by_alias": True}

@runtime_checkable
class AgentAdapter(Protocol):
    async def find_latest_session(self, repo_path: Path) -> str | None:
        """해당 저장소에 속한 가장 최근 세션 id. 없으면 None"""

    async def resume_and_run(
        self,
        repo_path: Path,
        session_id: str | None,
        prompt: str,
        *,
        test_commands: list[str] | None = None,
        image_paths: list[Path] | None = None,
        model: str | None = None,
        effort: str | None = None,
        speed_mode: str | None = None,
        approval_mode: ApprovalMode = "default",
        on_progress: ProgressCallback | None = None,
    ) -> AgentRunResult:
        """세션을 재개해 한 작업 단위를 실행"""
