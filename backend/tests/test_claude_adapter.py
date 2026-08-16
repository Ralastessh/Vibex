"""Claude Code 어댑터 (CLAUDE.md §9).

실제 CLI를 부르지 않는다. 가짜 실행 파일로 출력만 흉내 낸다 —
테스트가 매번 과금되거나 네트워크에 의존하면 안 된다.

여기서 재현하는 출력 형태는 전부 **실측에서 관찰한 것**이다
(docs/claude-code-adapter.md).
"""

from __future__ import annotations

import json
import os
import stat

import pytest

from src.agents.claude_code import ClaudeCodeAdapter, session_dir_for

REPORT = {
    "status": "completed",
    "summary": "border-radius를 24px로 바꿨다.",
    "changedFiles": [{"path": "src/styles/login.css", "summary": "모서리"}],
    "tests": [{"command": "npx vitest run", "status": "passed", "summary": "3 passed"}],
    "questions": [],
    "warnings": [],
}


def fake_claude(tmp_path, envelope: dict, *, prefix: str = "", record_args: bool = True):
    """인자를 기록하고 정해진 봉투를 뱉는 가짜 claude."""
    args_file = tmp_path / "args.json"
    script = tmp_path / "fake-claude"
    script.write_text(
        "#!/usr/bin/env python3\n"
        "import json, sys\n"
        f"{'json.dump(sys.argv[1:], open(' + repr(str(args_file)) + ', chr(119)))' if record_args else ''}\n"
        f"sys.stdout.write({prefix!r})\n"
        f"sys.stdout.write({json.dumps(envelope)!r})\n",
        encoding="utf-8",
    )
    script.chmod(script.stat().st_mode | stat.S_IEXEC)
    return str(script), args_file


def envelope(**overrides) -> dict:
    base = {
        "type": "result",
        "subtype": "success",
        "is_error": False,
        "session_id": "sess-123",
        "result": f"작업했습니다.\n\n```bridge\n{json.dumps(REPORT)}\n```",
        "permission_denials": [],
        "total_cost_usd": 0.04,
        "model": "claude-sonnet-4-6",
        "usage": {
            "input_tokens": 100,
            "cache_read_input_tokens": 25,
            "output_tokens": 40,
        },
    }
    base.update(overrides)
    return base


@pytest.fixture
def repo(tmp_path):
    path = tmp_path / "repo"
    (path / ".git").mkdir(parents=True)
    return path


# --- §9.2 세션 탐색 ---


def test_session_dir_encoding_matches_observed_layout():
    """실측: /Users/kimjoonsu/Desktop/oss → -Users-kimjoonsu-Desktop-oss"""
    from pathlib import Path

    assert session_dir_for(Path("/Users/kimjoonsu/Desktop/oss")).name == (
        "-Users-kimjoonsu-Desktop-oss"
    )


async def test_latest_session_is_chosen_by_mtime(tmp_path, repo, monkeypatch):
    directory = tmp_path / "sessions"
    directory.mkdir()
    old, new = directory / "old.jsonl", directory / "new.jsonl"
    old.write_text("{}", encoding="utf-8")
    new.write_text("{}", encoding="utf-8")
    os.utime(old, (1_000, 1_000))
    os.utime(new, (2_000, 2_000))

    monkeypatch.setattr(
        "src.agents.claude_code.session_dir_for", lambda _: directory
    )
    assert await ClaudeCodeAdapter().find_latest_session(repo) == "new"


async def test_no_session_directory_means_new_session(tmp_path, repo, monkeypatch):
    """§9.3 — 세션이 없으면 새로 만든다. 다른 프로젝트 세션을 집지 않는다."""
    monkeypatch.setattr(
        "src.agents.claude_code.session_dir_for", lambda _: tmp_path / "absent"
    )
    assert await ClaudeCodeAdapter().find_latest_session(repo) is None


# --- 실행 명령 구성 ---


async def test_command_uses_the_verified_flags(tmp_path, repo):
    binary, args_file = fake_claude(tmp_path, envelope())
    await ClaudeCodeAdapter(binary=binary, max_budget_usd=1.5).resume_and_run(
        repo, "sess-1", "프롬프트", test_commands=["npx vitest"]
    )
    args = json.loads(args_file.read_text())

    assert args[:2] == ["-p", "프롬프트"]
    assert "--output-format" in args and args[args.index("--output-format") + 1] == "json"
    assert args[args.index("--resume") + 1] == "sess-1"
    # 실측: 기본 모드는 편집을 차단한다.
    assert args[args.index("--permission-mode") + 1] == "acceptEdits"
    # 실측: acceptEdits는 Bash를 막는다. 명령을 좁혀 허용해야 테스트가 돈다.
    assert args[args.index("--allowedTools") + 1] == "Bash(npx vitest:*)"
    assert args[args.index("--max-budget-usd") + 1] == "1.5"


async def test_command_receives_model_and_effort(tmp_path, repo):
    binary, args_file = fake_claude(tmp_path, envelope())
    await ClaudeCodeAdapter(binary=binary).resume_and_run(
        repo, "sess-1", "프롬프트", model="sonnet", effort="high"
    )
    args = json.loads(args_file.read_text())
    assert args[args.index("--model") + 1] == "sonnet"
    assert args[args.index("--effort") + 1] == "high"


@pytest.mark.parametrize(
    ("approval_mode", "expected"),
    [
        ("default", ["--permission-mode", "acceptEdits"]),
        ("autopilot", ["--permission-mode", "auto"]),
        ("bypass", ["--dangerously-skip-permissions"]),
    ],
)
async def test_approval_mode_uses_a_real_claude_permission_flag(
    tmp_path, repo, approval_mode, expected
):
    binary, args_file = fake_claude(tmp_path, envelope())
    await ClaudeCodeAdapter(binary=binary).resume_and_run(
        repo, None, "p", approval_mode=approval_mode
    )
    args = json.loads(args_file.read_text())
    if len(expected) == 1:
        assert expected[0] in args
    else:
        assert args[args.index(expected[0]) + 1] == expected[1]


async def test_no_test_commands_means_no_bash_allowance(tmp_path, repo):
    """§18.5 — 허용 목록이 없으면 Bash를 열지 않는다."""
    binary, args_file = fake_claude(tmp_path, envelope())
    await ClaudeCodeAdapter(binary=binary).resume_and_run(repo, None, "p")
    args = json.loads(args_file.read_text())
    assert "--allowedTools" not in args
    # 세션이 없으면 --resume을 붙이지 않는다(대화형 선택기 방지).
    assert "--resume" not in args


async def test_images_are_exposed_to_claude_as_readable_files(tmp_path, repo):
    binary, args_file = fake_claude(tmp_path, envelope())
    rendered = tmp_path / "rendered.jpg"
    drawing = tmp_path / "drawing.png"
    rendered.write_bytes(b"rendered")
    drawing.write_bytes(b"drawing")

    await ClaudeCodeAdapter(binary=binary).resume_and_run(
        repo, "sess-1", "이미지를 분석해줘", image_paths=[rendered, drawing]
    )
    args = json.loads(args_file.read_text())
    assert "--add-dir" in args
    assert "Read" in args[args.index("--allowedTools") + 1]
    prompt = args[1]
    assert str(rendered.resolve()) in prompt
    assert str(drawing.resolve()) in prompt


# --- 출력 해석 ---


async def test_successful_run(tmp_path, repo):
    binary, _ = fake_claude(tmp_path, envelope())
    result = await ClaudeCodeAdapter(binary=binary).resume_and_run(repo, None, "p")
    assert result.ok
    assert result.session_id == "sess-123"
    assert result.report.summary == "border-radius를 24px로 바꿨다."
    assert result.cost_usd == 0.04
    assert result.resolved_model == "claude-sonnet-4-6"
    assert result.usage.input_tokens == 100
    assert result.usage.cached_input_tokens == 25
    assert result.usage.total_tokens == 140


async def test_warning_line_before_json_is_tolerated(tmp_path, repo):
    """실측: stdin 미연결 경고가 JSON 앞에 붙는 경우가 있다."""
    binary, _ = fake_claude(
        tmp_path, envelope(), prefix="Warning: no stdin data received in 3s\n"
    )
    result = await ClaudeCodeAdapter(binary=binary).resume_and_run(repo, None, "p")
    assert result.ok


async def test_permission_denial_is_a_failure_even_when_is_error_is_false(tmp_path, repo):
    """가장 중요한 회귀 방지.

    실측에서 기본 권한 모드는 편집을 막으면서 is_error를 False로 줬다.
    이것을 성공으로 판정하면 Bridge가 아무것도 안 바꾸고 '완료'를 보고한다.
    """
    denied = envelope(
        permission_denials=[{"tool_name": "Edit", "tool_use_id": "t1", "tool_input": {}}],
        result="파일 쓰기 권한이 필요합니다.",
    )
    binary, _ = fake_claude(tmp_path, denied)
    result = await ClaudeCodeAdapter(binary=binary).resume_and_run(repo, None, "p")

    assert not result.ok
    assert result.denied_tools == ["Edit"]
    assert "권한이 거부" in result.error


async def test_agent_error_is_reported(tmp_path, repo):
    binary, _ = fake_claude(tmp_path, envelope(is_error=True, result="무언가 실패"))
    result = await ClaudeCodeAdapter(binary=binary).resume_and_run(repo, None, "p")
    assert not result.ok
    assert "오류로 종료" in result.error


async def test_missing_contract_block_is_not_success(tmp_path, repo):
    binary, _ = fake_claude(tmp_path, envelope(result="다 했어요"))
    result = await ClaudeCodeAdapter(binary=binary).resume_and_run(repo, None, "p")
    assert not result.ok
    assert "결과 블록" in result.error


async def test_unparseable_output_is_reported(tmp_path, repo):
    script = tmp_path / "broken"
    script.write_text("#!/bin/sh\necho 'not json'\n", encoding="utf-8")
    script.chmod(script.stat().st_mode | stat.S_IEXEC)
    result = await ClaudeCodeAdapter(binary=str(script)).resume_and_run(repo, None, "p")
    assert not result.ok
    assert "해석할 수 없습니다" in result.error


async def test_missing_binary_is_reported(repo):
    result = await ClaudeCodeAdapter(binary="/no/such/claude").resume_and_run(
        repo, None, "p"
    )
    assert "찾을 수 없습니다" in result.error


async def test_timeout_kills_the_process(tmp_path, repo):
    script = tmp_path / "hang"
    script.write_text("#!/bin/sh\nsleep 30\n", encoding="utf-8")
    script.chmod(script.stat().st_mode | stat.S_IEXEC)
    result = await ClaudeCodeAdapter(
        binary=str(script), timeout_seconds=0.5
    ).resume_and_run(repo, None, "p")
    assert "끝나지 않았습니다" in result.error
