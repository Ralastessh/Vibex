from __future__ import annotations
from fastapi import APIRouter, Request
from pydantic import BaseModel, Field
from backend.src.agents.registry import available_agents
from backend.src.auth.device import RequireDevice

# 향후 Claude Code뿐만 아니라 타 LLM도 지원할 예정 -> 별도 라우터를 두어 모델 선택지를 둠
router = APIRouter(prefix="/agents", tags=["agents"], dependencies=[RequireDevice])

# 에이전트(PC의 LLM CLI) 관련 정보
class AgentView(BaseModel):
    agent_id: str = Field(alias="agentId")
    display_name: str = Field(alias="displayName")
    usable: bool
    installed: bool
    verified: bool
    note: str = ""

    model_config = {"populate_by_name": True, "serialize_by_alias": True}

# 하나가 아닌 여러 LLM에 대한 선택지
class AgentListResponse(BaseModel):
    agents: list[AgentView]

@router.get("", response_model=AgentListResponse)
def list_agents(request: Request) -> AgentListResponse:
    settings = request.app.state.settings
    return AgentListResponse(
        agents=[
            AgentView(
                agentId=info.agent_id,
                displayName=info.display_name,
                usable=info.usable,
                installed=info.installed,
                verified=info.verified,
                note=info.note)
            for info in available_agents(settings.claude_binary)
        ]
    )
