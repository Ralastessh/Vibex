# Claude Code 이외의 다른 LLM에 연결
from __future__ import annotations
import shutil
from dataclasses import dataclass
from src.agents.base import AgentAdapter
from src.agents.claude_code import ClaudeCodeAdapter
from src.agents.codex_cli import CodexCLIAdapter


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
    models: tuple[tuple[str, str], ...] = ()
    efforts: tuple[tuple[str, str], ...] = ()
    speed_modes: tuple[tuple[str, str], ...] = ()

    @property
    def usable(self) -> bool:
        return self.verified and self.installed

_CANDIDATES = (
    (
        "claude-code", "Claude Code", "claude", True,
        "실측 검증 완료 (docs/claude-code-adapter.md)",
        (("", "기본 모델"), ("sonnet", "Sonnet"), ("opus", "Opus"), ("haiku", "Haiku")),
        (("", "기본 추론"), ("low", "낮음"), ("medium", "보통"), ("high", "높음"), ("max", "최대")),
        (("", "기본 속도"),),
    ),
    (
        "codex-cli", "Codex (ChatGPT)", "codex", True,
        "App Server 기반 이미지 첨부·VS Code/CLI 공용 thread resume 지원",
        (
            ("", "기본 모델"),
            ("gpt-5.6-sol", "GPT-5.6 Sol"),
            ("gpt-5.6-terra", "GPT-5.6 Terra"),
            ("gpt-5.6-luna", "GPT-5.6 Luna"),
        ),
        (("", "기본 추론"), ("low", "낮음"), ("medium", "보통"), ("high", "높음"), ("xhigh", "매우 높음")),
        (("", "기본 속도"), ("fast", "Fast · 크레딧 추가")),
    ),
    (
        "gemini-cli", "Gemini CLI", "gemini", False,
        "CLI 설치 후 세션·resume·출력 형식 실측 검증이 필요합니다.",
        (), (), (),
    ),
)

def available_agents(
    claude_binary: str = "claude", codex_binary: str = "codex"
) -> list[AgentInfo]:
    infos = []
    for agent_id, name, binary, verified, note, models, efforts, speed_modes in _CANDIDATES:
        resolved = (
            claude_binary if agent_id == "claude-code"
            else codex_binary if agent_id == "codex-cli"
            else binary
        )
        infos.append(
            AgentInfo(
                agent_id=agent_id,
                display_name=name,
                binary=resolved,
                verified=verified,
                installed=shutil.which(resolved) is not None,
                note=note,
                models=models,
                efforts=efforts,
                speed_modes=speed_modes,
            )
        )
    return infos


def validate_run_options(
    agent_id: str, model: str | None, effort: str | None, speed_mode: str | None
) -> tuple[str | None, str | None, str | None]:
    info = next((item for item in available_agents() if item.agent_id == agent_id), None)
    if info is None:
        raise ValueError(f"알 수 없는 에이전트입니다: {agent_id}")

    values = []
    for label, value, choices in (
        ("모델", model, info.models),
        ("추론 강도", effort, info.efforts),
        ("실행 속도", speed_mode, info.speed_modes),
    ):
        normalized = (value or "").strip()
        allowed = {option[0] for option in choices}
        if normalized not in allowed:
            raise ValueError(f"{info.display_name}에서 지원하지 않는 {label}입니다: {normalized}")
        values.append(normalized or None)
    return tuple(values)


class UnsupportedAgentError(RuntimeError):
    """아직 검증되지 않았거나 설치되지 않은 에이전트"""

def build_adapter(agent_id: str, settings) -> AgentAdapter:
    if agent_id == "claude-code":
        return ClaudeCodeAdapter(
            binary=settings.claude_binary,
            max_budget_usd=settings.max_budget_usd,
            timeout_seconds=settings.agent_timeout_seconds,
        )
    if agent_id == "codex-cli":
        return CodexCLIAdapter(
            binary=settings.codex_binary,
            timeout_seconds=settings.agent_timeout_seconds,
        )
    else:
        info = next((a for a in available_agents(
            settings.claude_binary, settings.codex_binary
        ) if a.agent_id == agent_id), None)
        detail = info.note if info else "알 수 없는 에이전트입니다."
        raise UnsupportedAgentError(f"{agent_id}: {detail}")
