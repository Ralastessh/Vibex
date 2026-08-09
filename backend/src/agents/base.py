from __future__ import annotations
from pathlib import Path
from typing import Protocol, runtime_checkable
from pydantic import BaseModel, Field
from src.agents.contract import AgentReport

class AgentRunResult(BaseModel):
    session_id: str | None = None
    report: AgentReport | None = None
    ok: bool = False
    denied_tools: list[str] = Field(default_factory=list)
    error: str | None = None
    raw_output: str = ""
    cost_usd: float | None = None

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
    ) -> AgentRunResult:
        """세션을 재개해 한 작업 단위를 실행"""
