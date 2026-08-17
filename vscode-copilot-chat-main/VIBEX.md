# VIBEX native chat sessions

VIBEX runs as a VS Code **chat session provider**, so it appears as its own
`VIBEX` tab next to `CODEX` and `CLAUDE CODE` in the chat sessions picker.

Every pixel of the UI is VS Code's own chat surface — the same one this fork's
Copilot Chat extension drives for its `claude-code` and `copilotcli` sessions.
VS Code renders the session list, back navigation, transcript, composer,
attachments, model picker, reasoning disclosure, tool/terminal cards, response
actions and token usage. There is **no VIBEX HTML/CSS WebView** to keep in
visual sync, and nothing to restyle when VS Code changes its chat UI.

The extension only supplies data:

| VS Code concept | VIBEX concept |
| --- | --- |
| chat session (`vibex:/<projectId>/<conversationId>`) | VIBEX conversation |
| request / response turn | VIBEX task (`agentReply`, `activityItems`, …) |
| model picker entry | local agent × model (`codex-cli::gpt-5.5`, `claude-code::opus`) |
| composer option groups | project · reasoning effort · approval mode |
| tool / terminal card | `activityItems` (`commandExecution`, `fileChange`, …) |
| reasoning disclosure | `activityItems` of type `reasoning` |

Both agents share one VIBEX conversation, and the model picker is the agent
switch: choosing Codex for one turn and Claude Code for the next keeps both in
the same conversation, which is the same conversation the iPad app reads.

## Layout

The independent extension manifest and bundle live under `vibex-extension/`.
The upstream Copilot extension is neither activated nor packaged with VIBEX —
this repository is used as the reference implementation and as the source of
the proposed-API typings, not as a runtime dependency.

```
vibex-extension/
  package.json          chatSessions + languageModelChatProviders contributions
  src/extension.js      activation and command wiring
  src/sessions.js       session item controller, content provider, request handler
  src/activity.js       VIBEX task snapshot -> native chat response parts
  src/history.js        conversation replay as chat history turns
  src/models.js         agent x model entries for the native model picker
  src/bridge.js         HTTP client, backend autostart, task event stream
  src/review.js         diff editor for a task's changed files
```

## Run from source

1. Open `vscode-copilot-chat-main` as the VS Code workspace.
2. Run `npm ci --ignore-scripts` once, then `npm run compile:vibex` after source changes.
3. Start the `Launch VIBEX` debug configuration.
4. In the Extension Development Host, open Chat Sessions and select **VIBEX**.

The extension first connects to `http://127.0.0.1:8787/api/v1`. If nothing is
listening there, it discovers `../backend` and starts its `.venv` automatically.
Use `vibex.backendPath` only when the default layout differs.

Do not run `npm run build` during development: the upstream production build
rewrites `package.json`. Use `npm run compile:vibex`.

## Proposed APIs

VIBEX uses `chatSessionsProvider`, `chatParticipantAdditions`,
`chatParticipantPrivate`, `chatProvider` and `languageModelThinkingPart`. These
are enabled automatically for an extension loaded with
`--extensionDevelopmentPath`; the launch configuration also passes
`--enable-proposed-api=vibex.vibex` so a packaged build behaves the same.
