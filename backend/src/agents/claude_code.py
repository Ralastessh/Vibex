# LLM 에이전트 중 Claude Code와의 호환성 검증용
from __future__ import annotations
import asyncio
import json
import logging
import re
import shutil
from pathlib import Path
from src.agents.base import AgentRunResult
from src.agents.contract import ContractError, extract

# 로깅용
logger = logging.getLogger("src.agents.claude")

SESSIONS_ROOT = Path.home() / ".claude" / "projects"
_NON_ALNUM = re.compile(r"[^a-zA-Z0-9]")

# 작업 프로젝트 내의 LLM과의 채팅 세션 반환
def session_dir_for(repo_path: Path) -> Path:
    return SESSIONS_ROOT / _NON_ALNUM.sub("-", str(repo_path.resolve()))

# Claude Code 전용 어뎁터 클래스
class ClaudeCodeAdapter:
    def __init__(
        self,
        binary: str = "claude",
        *,
        max_budget_usd: float | None = None,
        timeout_seconds: float = 1800) -> None:
        self._binary = binary
        self._max_budget_usd = max_budget_usd
        self._timeout = timeout_seconds

    # 현재 프로젝트 내에서 최신 세션 탐색(일반적으로 프로젝트 별로 세션이 분리되어 있기에 탐색 가능)
    # 대기 병목이 존재하기 때문에 비동기 처리
    async def find_latest_session(self, repo_path: Path) -> str | None:
        directory = session_dir_for(repo_path)
        if not directory.is_dir():
            logger.info("세션 디렉터리 없음 — 새 세션으로 시작합니다: %s", directory)
            return None
        
        sessions = sorted(directory.glob("*.jsonl"), key=lambda p: p.stat().st_mtime, reverse=True)
        if not sessions:
            return None
        logger.info("최신 세션 선택: %s", sessions[0].stem)
        return sessions[0].stem

    # 세부 설정
    def _command(self, prompt: str, session_id: str | None, test_commands: list[str] | None) -> list[str]:
        command = [self._binary, "-p", prompt, "--output-format", "json"]

        if session_id:
            # 대화 재개
            command += ["--resume", session_id]
        command += ["--permission-mode", "acceptEdits"]

        if test_commands:
            command += ["--allowedTools", ",".join(f"Bash({c}:*)" for c in test_commands)]

        if self._max_budget_usd is not None:
            command += ["--max-budget-usd", str(self._max_budget_usd)]

        return command

    async def resume_and_run(
        self,
        repo_path: Path,
        session_id: str | None,
        prompt: str,
        *,
        test_commands: list[str] | None = None) -> AgentRunResult:
        if shutil.which(self._binary) is None and not Path(self._binary).exists():
            return AgentRunResult(
                error=f"Claude Code 실행 파일을 찾을 수 없습니다: {self._binary}"
            )

        command = self._command(prompt, session_id, test_commands)
        process = await asyncio.create_subprocess_exec(
            *command,
            cwd=repo_path,
            # stdin이 열려 있으면 경고 한 줄이 stdout 앞에 붙음
            stdin=asyncio.subprocess.DEVNULL,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        self._process = process

        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(), timeout=self._timeout
            )
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()
            return AgentRunResult(
                session_id=session_id,
                error=f"에이전트가 {self._timeout:.0f}초 안에 끝나지 않았습니다.",
            )

        return self._parse(
            stdout.decode("utf-8", "replace"),
            stderr.decode("utf-8", "replace"),
            fallback_session_id=session_id,
        )

    # LLM 답변 후 해석
    def _parse(self, stdout: str, stderr: str, *, fallback_session_id: str | None) -> AgentRunResult:
        envelope = _load_json(stdout)
        if envelope is None:
            return AgentRunResult(
                session_id=fallback_session_id,
                raw_output=stdout,
                error=f"에이전트 출력을 해석할 수 없습니다. {stderr.strip()[:300]}",
            )

        denied = [d.get("tool_name", "?") for d in envelope.get("permission_denials") or []]
        session_id = envelope.get("session_id") or fallback_session_id
        result_text = envelope.get("result") or ""

        ok = not envelope.get("is_error", False) and not denied

        report = None
        contract_error = None
        try:
            report = extract(result_text)
        except ContractError as exc:
            contract_error = str(exc)

        error = None
        if envelope.get("is_error"):
            error = f"에이전트가 오류로 종료했습니다: {result_text[:300]}"
        elif denied:
            error = "권한이 거부되어 작업을 수행하지 못했습니다: " + ", ".join(sorted(set(denied)))
        elif contract_error:
            error = contract_error

        return AgentRunResult(
            session_id=session_id,
            report=report,
            ok=ok and report is not None,
            denied_tools=denied,
            error=error,
            raw_output=result_text,
            cost_usd=envelope.get("total_cost_usd"))

# stdout에서 JSON 불러오기
def _load_json(stdout: str) -> dict | None:
    start = stdout.find("{")
    if start < 0:
        return None
    try:
        value = json.loads(stdout[start:])
    except json.JSONDecodeError:
        return None
    return value if isinstance(value, dict) else None
