# Claude Code 이외의 다른 LLM에 연결
from __future__ import annotations
import shutil
from dataclasses import dataclass
from backend.src.agents.base import AgentAdapter
from backend.src.agents.claude_code import ClaudeCodeAdapter


@dataclass(frozen=True)
class AgentInfo:
    agent_id: str
    display_name: str
    binary: str
    #: 이 저장소에서 실측 검증을 마쳤는가.
    verified: bool
    #: 실제로 이 기기에 설치되어 있는가.
    installed: bool
    note: str = ""

    @property
    def usable(self) -> bool:
        return self.verified and self.installed

_CANDIDATES = (
    ("claude-code", "Claude Code", "claude", True,
     "실측 검증 완료 (docs/claude-code-adapter.md)"),
    ("codex-cli", "Codex CLI", "codex", False,
     "CLI 설치 후 세션·resume·출력 형식 실측 검증이 필요합니다."),
    ("gemini-cli", "Gemini CLI", "gemini", False,
     "CLI 설치 후 세션·resume·출력 형식 실측 검증이 필요합니다."),
)

def available_agents(claude_binary: str = "claude") -> list[AgentInfo]:
    infos = []
    for agent_id, name, binary, verified, note in _CANDIDATES:
        resolved = claude_binary if agent_id == "claude-code" else binary
        infos.append(
            AgentInfo(
                agent_id=agent_id,
                display_name=name,
                binary=resolved,
                verified=verified,
                installed=shutil.which(resolved) is not None,
                note=note,
            )
        )
    return infos


class UnsupportedAgentError(RuntimeError):
    """아직 검증되지 않았거나 설치되지 않은 에이전트"""

def build_adapter(agent_id: str, settings) -> AgentAdapter:
    if agent_id != "claude-code":
        info = next((a for a in available_agents() if a.agent_id == agent_id), None)
        detail = info.note if info else "알 수 없는 에이전트입니다."
        raise UnsupportedAgentError(f"{agent_id}: {detail}")

    return ClaudeCodeAdapter(
        binary=settings.claude_binary,
        max_budget_usd=settings.max_budget_usd,
        timeout_seconds=settings.agent_timeout_seconds,
    )
