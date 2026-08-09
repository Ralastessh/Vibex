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


def agent_message() -> str:
    message = f"완료\n```bridge\n{json.dumps(REPORT)}\n```"
    return message


def fake_codex(tmp_path):
    messages_file = tmp_path / "codex-messages.jsonl"
    script = tmp_path / "fake-codex"
    script.write_text(
        "#!/usr/bin/env python3\n"
        "import json, sys\n"
        f"messages_file = {str(messages_file)!r}\n"
        f"agent_message = {agent_message()!r}\n"
        "for line in sys.stdin:\n"
        "    message = json.loads(line)\n"
        "    with open(messages_file, 'a') as stream:\n"
        "        stream.write(json.dumps(message) + '\\n')\n"
        "    method = message.get('method')\n"
        "    request_id = message.get('id')\n"
        "    if method == 'initialize':\n"
        "        response = {'id': request_id, 'result': {'userAgent': 'fake'}}\n"
        "    elif method == 'thread/start':\n"
        "        response = {'id': request_id, 'result': {'thread': {'id': 'codex-session'}}}\n"
        "    elif method == 'thread/resume':\n"
        "        session_id = message['params']['threadId']\n"
        "        response = {'id': request_id, 'result': {'thread': {'id': session_id}}}\n"
        "    elif method == 'turn/start':\n"
        "        session_id = message['params']['threadId']\n"
        "        response = {'id': request_id, 'result': {'turn': {'id': 'turn-1'}}}\n"
        "        print(json.dumps(response), flush=True)\n"
        "        print(json.dumps({'method': 'item/completed', 'params': "
        "{'threadId': session_id, 'turnId': 'turn-1', 'item': "
        "{'type': 'agentMessage', 'text': agent_message}}}), flush=True)\n"
        "        print(json.dumps({'method': 'turn/completed', 'params': "
        "{'threadId': session_id, 'turn': {'id': 'turn-1', 'status': 'completed'}}}), flush=True)\n"
        "        continue\n"
        "    else:\n"
        "        continue\n"
        "    print(json.dumps(response), flush=True)\n",
        encoding="utf-8",
    )
    script.chmod(script.stat().st_mode | stat.S_IEXEC)
    return str(script), messages_file


async def test_codex_exec_attaches_images(tmp_path):
    repo = tmp_path / "repo"
    (repo / ".git").mkdir(parents=True)
    first, second = tmp_path / "view.jpg", tmp_path / "drawing.png"
    first.write_bytes(b"a")
    second.write_bytes(b"b")
    binary, messages_file = fake_codex(tmp_path)

    result = await CodexCLIAdapter(binary=binary).resume_and_run(
        repo, None, "프롬프트", image_paths=[first, second]
    )
    messages = [json.loads(line) for line in messages_file.read_text().splitlines()]
    turn = next(message for message in messages if message.get("method") == "turn/start")
    inputs = turn["params"]["input"]
    assert [item["type"] for item in inputs] == ["text", "localImage", "localImage"]
    assert inputs[1]["path"] == str(first.resolve())
    assert inputs[2]["path"] == str(second.resolve())
    assert result.ok and result.session_id == "codex-session"
    assert result.report.summary == "화면을 수정했다."


async def test_codex_resume_keeps_the_exact_session(tmp_path):
    repo = tmp_path / "repo"
    (repo / ".git").mkdir(parents=True)
    image = tmp_path / "drawing.png"
    image.write_bytes(b"x")
    binary, messages_file = fake_codex(tmp_path)

    await CodexCLIAdapter(binary=binary).resume_and_run(
        repo, "same-session", "답변", image_paths=[image]
    )
    messages = [json.loads(line) for line in messages_file.read_text().splitlines()]
    resume = next(message for message in messages if message.get("method") == "thread/resume")
    assert resume["params"]["threadId"] == "same-session"
    turn = next(message for message in messages if message.get("method") == "turn/start")
    assert turn["params"]["input"][0] == {"type": "text", "text": "답변"}


async def test_finds_latest_codex_session_for_the_same_repo(tmp_path, monkeypatch):
    repo = (tmp_path / "repo").resolve()
    repo.mkdir()
    root = tmp_path / "sessions"
    root.mkdir()

    def rollout(name, session_id, cwd, mtime, source="cli"):
        path = root / f"{name}.jsonl"
        path.write_text(json.dumps({
            "type": "session_meta",
            "payload": {
                "session_id": session_id, "cwd": str(cwd), "source": source
            },
        }) + "\n", encoding="utf-8")
        os.utime(path, (mtime, mtime))

    rollout("old", "old-id", repo, 1000, source="vscode")
    rollout("other", "other-id", tmp_path / "other", 3000)
    rollout("new", "new-id", repo, 2000)
    monkeypatch.setattr("src.agents.codex_cli.sessions_root", lambda: root)

    assert await CodexCLIAdapter().find_latest_session(repo) == "old-id"


def test_codex_contract_failure_is_reported():
    result = CodexCLIAdapter()._result("s1", "계약 블록이 없는 답변")
    assert not result.ok
    assert "bridge" in result.error
