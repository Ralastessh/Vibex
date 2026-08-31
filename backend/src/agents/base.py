"""타 LLM으로의 모델 전환 시에도 동일하게 실행할 수 있게 통합 스키마를 정의"""
from __future__ import annotations
from pathlib import Path
from typing import Callable, Protocol, runtime_checkable
from pydantic import BaseModel, Field
from src.agents.contract import AgentReport
from src.tasks.models import ActivityItem, AgentUsage, ApprovalMode


class AgentProgress(BaseModel):
    """하나의 턴에 클라이언트로 전송하는 누적 채팅"""
    agent_reply: str = ""
    activity_items: list[ActivityItem] = Field(default_factory=list)
    thread_id: str | None = Field(default=None, alias="threadId")
    turn_id: str | None = Field(default=None, alias="turnId")
    resolved_model: str | None = Field(default=None, alias="resolvedModel")
    usage: AgentUsage | None = None

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


ProgressCallback = Callable[[AgentProgress], None]

class AgentRunResult(BaseModel):
    # 모델 간 전환에서 중요한 부분은 상호 간의 채팅 컨텍스트 공유 -> 각 세션 저장 필드 이용
    # session_id는 Claude Code 전용 필드, Codex App Server의 thread/turn id는 Codex 전용 필드
    session_id: str | None = None
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
        """해당 저장소에 속한 가장 최근 세션 id"""
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
