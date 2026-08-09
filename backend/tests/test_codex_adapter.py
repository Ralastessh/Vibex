from __future__ import annotations

import json
import os
import stat

from src.agents.codex_cli import CodexCLIAdapter


REPORT = {
    "status": "completed",
    "summary": "화면을 수정했다.",
    "changedFiles": [],
    "tests": [],
    "questions": [],
    "warnings": [],
}


def events(session_id="codex-session") -> str:
    message = f"완료\n```bridge\n{json.dumps(REPORT)}\n```"
    return "\n".join(
        [
            json.dumps({"type": "thread.started", "thread_id": session_id}),
            json.dumps({"type": "turn.started"}),
            json.dumps({
                "type": "item.completed",
                "item": {"type": "agent_message", "text": message},
            }),
            json.dumps({"type": "turn.completed"}),
        ]
    )


def fake_codex(tmp_path, output: str):
    args_file = tmp_path / "codex-args.json"
    script = tmp_path / "fake-codex"
    script.write_text(
        "#!/usr/bin/env python3\n"
        "import json, sys\n"
        f"json.dump(sys.argv[1:], open({str(args_file)!r}, 'w'))\n"
        f"sys.stdout.write({output!r})\n",
        encoding="utf-8",
    )
    script.chmod(script.stat().st_mode | stat.S_IEXEC)
    return str(script), args_file


async def test_codex_exec_attaches_images(tmp_path):
    repo = tmp_path / "repo"
    (repo / ".git").mkdir(parents=True)
    first, second = tmp_path / "view.jpg", tmp_path / "drawing.png"
    first.write_bytes(b"a")
    second.write_bytes(b"b")
    binary, args_file = fake_codex(tmp_path, events())

    result = await CodexCLIAdapter(binary=binary).resume_and_run(
        repo, None, "프롬프트", image_paths=[first, second]
    )
    args = json.loads(args_file.read_text())
    assert args[:2] == ["exec", "--json"]
    assert args.count("-i") == 2
    assert str(first.resolve()) in args and str(second.resolve()) in args
    assert result.ok and result.session_id == "codex-session"
    assert result.report.summary == "화면을 수정했다."


async def test_codex_resume_keeps_the_exact_session(tmp_path):
    repo = tmp_path / "repo"
    (repo / ".git").mkdir(parents=True)
    image = tmp_path / "drawing.png"
    image.write_bytes(b"x")
    binary, args_file = fake_codex(tmp_path, events("same-session"))

    await CodexCLIAdapter(binary=binary).resume_and_run(
        repo, "same-session", "답변", image_paths=[image]
    )
    args = json.loads(args_file.read_text())
    assert args[:3] == ["exec", "resume", "--json"]
    assert args[-2:] == ["same-session", "답변"]


async def test_finds_latest_codex_session_for_the_same_repo(tmp_path, monkeypatch):
    repo = (tmp_path / "repo").resolve()
    repo.mkdir()
    root = tmp_path / "sessions"
    root.mkdir()

    def rollout(name, session_id, cwd, mtime):
        path = root / f"{name}.jsonl"
        path.write_text(json.dumps({
            "type": "session_meta",
            "payload": {"session_id": session_id, "cwd": str(cwd)},
        }) + "\n", encoding="utf-8")
        os.utime(path, (mtime, mtime))

    rollout("old", "old-id", repo, 1000)
    rollout("other", "other-id", tmp_path / "other", 3000)
    rollout("new", "new-id", repo, 2000)
    monkeypatch.setattr("src.agents.codex_cli.sessions_root", lambda: root)

    assert await CodexCLIAdapter().find_latest_session(repo) == "new-id"


def test_codex_jsonl_failure_is_reported():
    output = json.dumps({"type": "thread.started", "thread_id": "s1"}) + "\n"
    output += json.dumps({"type": "turn.failed", "error": {"message": "로그인 만료"}})
    result = CodexCLIAdapter()._parse(
        output, "", return_code=1, fallback_session_id=None
    )
    assert not result.ok
    assert "로그인 만료" in result.error
