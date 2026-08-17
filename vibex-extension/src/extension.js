"use strict";

const vscode = require("vscode");
const { VibexBridge } = require("./bridge");
const { VibexModelProvider, VENDOR } = require("./models");
const { VibexChatSessions } = require("./sessions");
const { ReviewService } = require("./review");
const { VibexPanel } = require("./panel");
const { SCHEME } = require("./sessionUri");

function activate(context) {
  const output = vscode.window.createOutputChannel("VIBEX");
  const bridge = new VibexBridge(context, output);
  const models = new VibexModelProvider(bridge, output);
  const review = new ReviewService(bridge);
  const sessions = new VibexChatSessions(context, bridge, output);
  const panel = new VibexPanel(context, bridge, review, output);

  // VIBEX contributes its own models (one per local agent + model pair), so the
  // session declares `requiresCustomModels` and the picker never shows Copilot
  // models inside a VIBEX transcript.
  const participant = vscode.chat.createChatParticipant(SCHEME, sessions.createHandler());
  participant.iconPath = new vscode.ThemeIcon("sparkle");

  context.subscriptions.push(
    output,
    bridge,
    models,
    review,
    sessions,
    panel,
    participant,
    vscode.lm.registerLanguageModelChatProvider(VENDOR, models),
    vscode.chat.registerChatSessionContentProvider(SCHEME, sessions, participant),

    vscode.commands.registerCommand("vibex.newSession", () =>
      vscode.commands.executeCommand(`workbench.action.chat.openNewSessionEditor.${SCHEME}`),
    ),
    vscode.commands.registerCommand("vibex.openPanel", () =>
      vscode.commands.executeCommand("workbench.view.extension.vibexPanelContainer"),
    ),
    vscode.commands.registerCommand("vibex.panel.new", () =>
      run(output, () => panel.newConversation()),
    ),
    vscode.commands.registerCommand("vibex.panel.history", () =>
      run(output, () => panel.pickConversation()),
    ),
    // `open "vscode://vibex.vibex/new"` — 터미널·Raycast·스크립트 어디서든
    // VIBEX 세션을 여는 외부 진입점.
    vscode.window.registerUriHandler({
      handleUri(uri) {
        if (uri.path === "/panel") {
          void vscode.commands.executeCommand("vibex.openPanel");
        } else if (!uri.path || uri.path === "/" || uri.path === "/new") {
          void vscode.commands.executeCommand("vibex.newSession");
        }
      },
    }),
    vscode.commands.registerCommand("vibex.sessions.rename", (item) =>
      run(output, () => sessions.renameSession(item)),
    ),
    vscode.commands.registerCommand("vibex.sessions.archive", (item) =>
      run(output, () => sessions.archiveSession(item)),
    ),
    vscode.commands.registerCommand("vibex.openReview", (taskId) =>
      run(output, () => review.openReview(taskId)),
    ),
    vscode.commands.registerCommand("vibex.undoTask", (taskId) =>
      run(output, () => undoTask(bridge, taskId)),
    ),
    vscode.commands.registerCommand("vibex.configureBackend", () =>
      run(output, () => configureBackend(bridge, models)),
    ),
    vscode.commands.registerCommand("vibex.configureTailscale", () =>
      run(output, () => configureTailscale(bridge)),
    ),
    vscode.commands.registerCommand("vibex.showLogs", () => output.show(true)),

    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("vibex")) models.refresh();
    }),
  );

  // Test hook for the extension development host, where vscode:// URLs cannot
  // be routed (macOS delivers them to the primary VS Code instance instead).
  if (process.env.VIBEX_DEV_OPEN_EDITOR === "1") {
    setTimeout(() => void vscode.commands.executeCommand("vibex.newSession"), 4000);
  }

  if (process.env.VIBEX_DEV_FOCUS_PANEL === "1") {
    setTimeout(async () => {
      for (const command of ["workbench.view.extension.vibexPanelContainer", "vibex.panel.focus"]) {
        try {
          await vscode.commands.executeCommand(command);
          output.appendLine(`[dev] ${command} ok`);
        } catch (error) {
          output.appendLine(`[dev] ${command} failed: ${describe(error)}`);
        }
      }
    }, 5000);
  }

  // Start the backend and the event stream in the background so the VIBEX tab
  // is populated by the time the user opens it.
  void bridge
    .ensureBackend()
    .then(() => {
      bridge.connectEvents();
      models.refresh();
    })
    .catch((error) => {
      output.appendLine(`[startup] 백엔드를 시작하지 못했습니다: ${describe(error)}`);
    });
}

async function undoTask(bridge, taskId) {
  if (!taskId) return;
  const choice = await vscode.window.showWarningMessage(
    "이 작업에서 만든 파일 변경만 실행 취소할까요? 후속 변경과 충돌하면 취소되지 않습니다.",
    { modal: true },
    "실행 취소",
  );
  if (choice !== "실행 취소") return;
  await bridge.undoTask(taskId);
  vscode.window.showInformationMessage("작업의 파일 변경을 되돌렸습니다.");
}

async function configureBackend(bridge, models) {
  const configuration = vscode.workspace.getConfiguration("vibex");
  const backendPath = await vscode.window.showInputBox({
    title: "VIBEX 백엔드 폴더",
    value: configuration.get("backendPath", ""),
    prompt: "자동 탐색이 실패할 때만 backend 폴더의 절대 경로를 입력하세요.",
    ignoreFocusOut: true,
  });
  if (backendPath === undefined) return;
  await configuration.update(
    "backendPath",
    backendPath.trim(),
    vscode.ConfigurationTarget.Global,
  );
  await bridge.ensureBackend();
  bridge.connectEvents();
  models.refresh();
  vscode.window.showInformationMessage("VIBEX 백엔드에 연결했습니다.");
}

async function configureTailscale(bridge) {
  const result = await bridge.configureTailscale();
  if (result.ready) {
    vscode.window.showInformationMessage(`iPad에서 ${result.url} 로 접속할 수 있습니다.`);
  } else {
    vscode.window.showWarningMessage(`Tailscale 설정에 실패했습니다: ${result.error}`);
  }
}

async function run(output, action) {
  try {
    await action();
  } catch (error) {
    const text = describe(error);
    output.appendLine(`[${new Date().toISOString()}] ${text}`);
    vscode.window.showErrorMessage(`VIBEX: ${text}`);
  }
}

function describe(error) {
  return error instanceof Error ? error.message : String(error);
}

function deactivate() {}

module.exports = { activate, deactivate };
