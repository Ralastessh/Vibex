# VIBEX

VIBEX is a VS Code chat session provider. It contributes its own **VIBEX** tab
to the chat sessions picker — beside `CODEX` and `CLAUDE CODE` — and is rendered
entirely by VS Code's native chat UI. No WebView, no custom CSS.

Behind that UI, VIBEX talks to the local VIBEX bridge (`127.0.0.1:8787`), which
drives the Codex and Claude Code CLIs. Both agents share a single VIBEX
conversation, and the same conversation is available from the iPad app.

## Using it

- **중앙 VIBEX 화면** — 우측 VIBEX 탭 제목줄의 `편집기 열기` 아이콘 또는
  `VIBEX: 중앙 채팅 편집기 열기` 명령을 누릅니다. 이 화면은 별도 구현물이
  아니라 VS Code가 VIBEX Chat Session을 중앙 editor area에 렌더한 네이티브
  화면이며, 우측 패널과 같은 백엔드 대화를 사용합니다.

- **New session** — the VIBEX tab's new-session button, or `VIBEX: 새 세션 시작`.
  The project is taken from the open workspace folder when it matches a
  registered VIBEX project.
- **Switching agents** — use the model picker. Entries are grouped per agent
  (`Codex (ChatGPT)`, `Claude Code`); the selection applies to the next turn
  only, so a conversation can mix both.
- **Composer options** — project (shown when more than one is registered),
  reasoning effort, and approval mode. A reasoning level the chosen agent does
  not accept is dropped rather than rejected.
- **Attachments** — `@relative/path` mentions in the prompt, native attachments
  and pasted images are validated against the project root before they are
  sent; anything outside it is reported and skipped.
- **Per-answer metadata** — every finished answer ends with a small line noting
  the agent, model and token usage (and cost when the CLI reports it).
- **Reviewing changes** — finished turns that touched files offer
  `변경 사항 검토`, which opens VS Code's diff editor on the task's patch.

## Settings

| Setting | Purpose |
| --- | --- |
| `vibex.backendPath` | Absolute path to the VIBEX `backend` folder when autodiscovery fails. |
| `vibex.tailscaleBinary` | Path to the `tailscale` CLI when it is not on `PATH`. |
| `vibex.tailscaleServePort` | HTTP port published for the iPad through Tailscale Serve. |

See `../VIBEX.md` for the architecture and the development loop.
