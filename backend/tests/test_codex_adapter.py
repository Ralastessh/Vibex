from __future__ import annotations

import json
import os
import stat

import pytest

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


def test_fast_mode_is_scoped_to_the_app_server_process():
    command = CodexCLIAdapter(binary="codex")._command("fast")
    assert command[:3] == ["codex", "app-server", "--stdio"]
    assert 'service_tier="fast"' in command
    assert command[-2:] == ["--enable", "fast_mode"]


def fake_codex(tmp_path):
    messages_file = tmp_path / "codex-messages.jsonl"
    script = tmp_path / "fake-codex"
    script.write_text(
        "#!/usr/bin/env python3\n"
        "import json, os, sys\n"
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
        "        response = {'id': request_id, 'result': {'thread': "
        "{'id': 'codex-session', 'model': 'gpt-5.6-sol'}}}\n"
        "    elif method == 'thread/list':\n"
        "        response = {'id': request_id, 'result': {'data': [{\n"
        "            'id': 'listed-thread', 'sessionId': 'listed-thread',\n"
        "            'name': '실제 대화', 'preview': '첫 질문', 'source': 'vscode',\n"
        "            'cwd': os.getcwd(), 'createdAt': 1, 'updatedAt': 2,\n"
        "            'recencyAt': 3, 'turns': []}], 'nextCursor': 'next'}}\n"
        "    elif method == 'thread/read':\n"
        "        thread_id = message['params']['threadId']\n"
        "        response = {'id': request_id, 'result': {'thread': {\n"
        "            'id': thread_id, 'sessionId': thread_id, 'cwd': os.getcwd(),\n"
        "            'name': '실제 대화', 'preview': '첫 질문', 'source': 'vscode',\n"
        "            'turns': [{'id': 'stored-turn', 'status': 'completed',\n"
        "                       'items': [{'id': 'u1', 'type': 'userMessage',\n"
        "                                  'content': [{'type': 'text', 'text': '하이'}]},\n"
        "                                 {'id': 'a1', 'type': 'agentMessage',\n"
        "                                  'text': '안녕하세요'}]}]}}}\n"
        "    elif method in ('thread/name/set', 'thread/archive'):\n"
        "        response = {'id': request_id, 'result': {}}\n"
        "    elif method == 'thread/resume':\n"
        "        session_id = message['params']['threadId']\n"
        "        print(json.dumps({'method': 'thread/started', 'params': "
        "{'threadId': session_id, 'history': 'x' * 100_000}}), flush=True)\n"
        "        response = {'id': request_id, 'result': {'thread': {'id': session_id}}}\n"
        "    elif method == 'turn/start':\n"
        "        session_id = message['params']['threadId']\n"
        "        response = {'id': request_id, 'result': {'turn': {'id': 'turn-1'}}}\n"
        "        print(json.dumps(response), flush=True)\n"
        "        print(json.dumps({'method': 'item/started', 'params': "
        "{'threadId': session_id, 'turnId': 'turn-1', 'item': "
        "{'id': 'agent-1', 'type': 'agentMessage', 'text': ''}}}), flush=True)\n"
        "        print(json.dumps({'method': 'item/agentMessage/delta', 'params': "
        "{'threadId': session_id, 'turnId': 'turn-1', 'itemId': 'agent-1', "
        "'delta': '먼저 파일을 확인했습니다.'}}), flush=True)\n"
        "        print(json.dumps({'method': 'item/completed', 'params': "
        "{'threadId': session_id, 'turnId': 'turn-1', 'item': "
        "{'id': 'agent-1', 'type': 'agentMessage', "
        "'text': '먼저 파일을 확인했습니다.'}}}), flush=True)\n"
        "        print(json.dumps({'method': 'item/started', 'params': "
        "{'threadId': session_id, 'turnId': 'turn-1', 'item': "
        "{'id': 'reason-1', 'type': 'reasoning', 'summary': [], 'content': []}}}), flush=True)\n"
        "        print(json.dumps({'method': 'item/reasoning/summaryTextDelta', 'params': "
        "{'threadId': session_id, 'turnId': 'turn-1', 'itemId': 'reason-1', "
        "'summaryIndex': 0, 'delta': '구조를 파악하는 중'}}), flush=True)\n"
        "        print(json.dumps({'method': 'item/completed', 'params': "
        "{'threadId': session_id, 'turnId': 'turn-1', 'item': "
        "{'id': 'reason-1', 'type': 'reasoning', "
        "'summary': ['구조 파악 완료'], 'content': []}}}), flush=True)\n"
        "        print(json.dumps({'method': 'item/started', 'params': "
        "{'threadId': session_id, 'turnId': 'turn-1', 'item': "
        "{'id': 'cmd-1', 'type': 'commandExecution', 'command': 'find src', "
        "'cwd': '/repo', 'status': 'inProgress'}}}), flush=True)\n"
        "        print(json.dumps({'method': 'item/commandExecution/outputDelta', 'params': "
        "{'threadId': session_id, 'turnId': 'turn-1', 'itemId': 'cmd-1', "
        "'delta': 'src/app.js\\n'}}), flush=True)\n"
        "        print(json.dumps({'method': 'item/completed', 'params': "
        "{'threadId': session_id, 'turnId': 'turn-1', 'item': "
        "{'id': 'cmd-1', 'type': 'commandExecution', 'command': 'find src', "
        "'cwd': '/repo', 'status': 'completed', 'aggregatedOutput': 'src/app.js\\n', "
        "'exitCode': 0}}}), flush=True)\n"
        "        print(json.dumps({'method': 'item/started', 'params': "
        "{'threadId': session_id, 'turnId': 'turn-1', 'item': "
        "{'id': 'tool-1', 'type': 'mcpToolCall', 'server': 'demo', "
        "'tool': 'lookup', 'status': 'inProgress', 'arguments': {'q': 'x'}}}}), flush=True)\n"
        "        print(json.dumps({'method': 'item/completed', 'params': "
        "{'threadId': session_id, 'turnId': 'turn-1', 'item': "
        "{'id': 'tool-1', 'type': 'mcpToolCall', 'server': 'demo', "
        "'tool': 'lookup', 'status': 'completed', 'arguments': {'q': 'x'}, "
        "'result': '찾음'}}}), flush=True)\n"
        "        print(json.dumps({'method': 'item/started', 'params': "
        "{'threadId': session_id, 'turnId': 'turn-1', 'item': "
        "{'id': 'agent-2', 'type': 'agentMessage', 'text': ''}}}), flush=True)\n"
        "        midpoint = len(agent_message) // 2\n"
        "        for delta in (agent_message[:midpoint], agent_message[midpoint:]):\n"
        "            print(json.dumps({'method': 'item/agentMessage/delta', 'params': "
        "{'threadId': session_id, 'turnId': 'turn-1', 'itemId': 'agent-2', "
        "'delta': delta}}), flush=True)\n"
        "        print(json.dumps({'method': 'item/completed', 'params': "
        "{'threadId': session_id, 'turnId': 'turn-1', 'item': "
        "{'id': 'agent-2', 'type': 'agentMessage', 'text': agent_message}}}), flush=True)\n"
        "        print(json.dumps({'method': 'thread/tokenUsage/updated', 'params': "
        "{'threadId': session_id, 'turnId': 'turn-1', 'tokenUsage': {'last': "
        "{'inputTokens': 120, 'cachedInputTokens': 20, 'outputTokens': 30, "
        "'reasoningOutputTokens': 10, 'totalTokens': 150}}}}), flush=True)\n"
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
    start = next(message for message in messages if message.get("method") == "thread/start")
    assert start["params"]["cwd"] == str(repo.resolve())
    assert "runtimeWorkspaceRoots" not in start["params"]
    turn = next(message for message in messages if message.get("method") == "turn/start")
    inputs = turn["params"]["input"]
    assert [item["type"] for item in inputs] == ["text", "localImage", "localImage"]
    assert inputs[1]["path"] == str(first.resolve())
    assert inputs[2]["path"] == str(second.resolve())
    assert result.ok and result.session_id == "codex-session"
    assert result.report.summary == "화면을 수정했다."
    assert result.resolved_model == "gpt-5.6-sol"
    assert result.usage.total_tokens == 150


async def test_codex_streams_messages_and_activity_items_in_order(tmp_path):
    repo = tmp_path / "repo"
    (repo / ".git").mkdir(parents=True)
    binary, _ = fake_codex(tmp_path)
    updates = []

    result = await CodexCLIAdapter(binary=binary).resume_and_run(
        repo,
        None,
        "프롬프트",
        on_progress=updates.append,
    )

    assert result.ok
    assert result.raw_output.startswith("먼저 파일을 확인했습니다.\n\n완료")
    assert any(update.agent_reply == "먼저 파일을 확인했습니다." for update in updates)
    assert updates[-1].agent_reply == result.raw_output
    assert [item.type for item in result.activity_items] == [
        "reasoning",
        "commandExecution",
        "mcpToolCall",
    ]
    reasoning, command, tool = result.activity_items
    assert reasoning.status == "completed"
    assert reasoning.text == "구조 파악 완료"
    assert command.output == "src/app.js\n"
    assert command.data["exitCode"] == 0
    assert tool.status == "completed"
    assert tool.data["server"] == "demo"


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


async def test_codex_turn_receives_model_and_effort(tmp_path):
    repo = tmp_path / "repo"
    (repo / ".git").mkdir(parents=True)
    binary, messages_file = fake_codex(tmp_path)

    await CodexCLIAdapter(binary=binary).resume_and_run(
        repo, None, "답변", model="gpt-5.6-terra", effort="high"
    )
    messages = [json.loads(line) for line in messages_file.read_text().splitlines()]
    turn = next(message for message in messages if message.get("method") == "turn/start")
    assert turn["params"]["model"] == "gpt-5.6-terra"
    assert turn["params"]["effort"] == "high"


@pytest.mark.parametrize(
    ("approval_mode", "expected"),
    [
        (
            "default",
            {
                "approvalPolicy": "on-request",
                "approvalsReviewer": "auto_review",
                "sandbox": "workspace-write",
                "sandboxType": "workspaceWrite",
            },
        ),
        (
            "autopilot",
            {
                "approvalPolicy": "never",
                "approvalsReviewer": "auto_review",
                "sandbox": "workspace-write",
                "sandboxType": "workspaceWrite",
            },
        ),
        (
            "bypass",
            {
                "approvalPolicy": "never",
                "approvalsReviewer": "user",
                "sandbox": "danger-full-access",
                "sandboxType": "dangerFullAccess",
            },
        ),
    ],
)
async def test_codex_approval_modes_change_real_app_server_policy(
    tmp_path, approval_mode, expected
):
    repo = tmp_path / "repo"
    (repo / ".git").mkdir(parents=True)
    binary, messages_file = fake_codex(tmp_path)

    await CodexCLIAdapter(binary=binary).resume_and_run(
        repo, None, "답변", approval_mode=approval_mode
    )
    messages = [json.loads(line) for line in messages_file.read_text().splitlines()]
    start = next(message for message in messages if message.get("method") == "thread/start")
    turn = next(message for message in messages if message.get("method") == "turn/start")
    assert start["params"]["approvalPolicy"] == expected["approvalPolicy"]
    assert start["params"]["approvalsReviewer"] == expected["approvalsReviewer"]
    assert start["params"]["sandbox"] == expected["sandbox"]
    assert turn["params"]["sandboxPolicy"]["type"] == expected["sandboxType"]


async def test_codex_lists_every_shared_thread_source_and_exact_cwd(tmp_path):
    repo = tmp_path / "repo"
    (repo / ".git").mkdir(parents=True)
    binary, messages_file = fake_codex(tmp_path)

    page = await CodexCLIAdapter(binary=binary).list_threads(repo, limit=25)
    messages = [json.loads(line) for line in messages_file.read_text().splitlines()]
    request = next(message for message in messages if message.get("method") == "thread/list")

    assert request["params"]["sourceKinds"] == ["vscode", "cli", "appServer"]
    assert request["params"]["cwd"] == str(repo.resolve())
    assert request["params"]["limit"] == 25
    assert page["data"][0]["id"] == "listed-thread"
    assert page["nextCursor"] == "next"


async def test_codex_reads_renames_and_archives_only_a_thread_in_the_repo(tmp_path):
    repo = tmp_path / "repo"
    (repo / ".git").mkdir(parents=True)
    binary, messages_file = fake_codex(tmp_path)
    adapter = CodexCLIAdapter(binary=binary)

    thread = await adapter.read_thread(repo, "selected-thread")
    await adapter.set_thread_name(repo, "selected-thread", "새 이름")
    await adapter.archive_thread(repo, "selected-thread")

    assert thread["turns"][0]["items"][1]["text"] == "안녕하세요"
    messages = [json.loads(line) for line in messages_file.read_text().splitlines()]
    rename = next(message for message in messages if message.get("method") == "thread/name/set")
    archive = next(message for message in messages if message.get("method") == "thread/archive")
    assert rename["params"] == {"threadId": "selected-thread", "name": "새 이름"}
    assert archive["params"] == {"threadId": "selected-thread"}


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
