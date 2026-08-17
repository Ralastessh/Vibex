"use strict";

const crypto = require("node:crypto");
const vscode = require("vscode");
const { parseModelId } = require("./models");

const VIEW_TYPE = "vibex.panel";

const ACTIVE_STATUSES = new Set([
  "queued", "interpreting", "awaiting_confirmation",
  "resolving_session", "running_agent", "testing",
]);

const OPTIONS_KEY = "vibex.panel.options";

/**
 * The VIBEX secondary-sidebar tab.
 *
 * The webview it hosts renders VS Code's own chat DOM/CSS (see
 * media/native-chat.css and webview/main.js); this class only feeds it data
 * through the same VibexBridge the native chat sessions use, so both surfaces
 * always show the same conversations.
 */
class VibexPanel {
  constructor(context, bridge, review, output) {
    this.context = context;
    this.bridge = bridge;
    this.review = review;
    this.output = output;
    this.view = undefined;
    this.selectedProjectId = null;
    this.selectedConversationId = null;
    // Last published task snapshot, so "cancel" can find what is running.
    this.tasks = [];
    this.options = { ...(context.globalState.get(OPTIONS_KEY) || {}) };
    this.refreshGeneration = 0;
    this._following = new Set();

    this.disposables = [
      vscode.window.registerWebviewViewProvider(VIEW_TYPE, this, {
        webviewOptions: { retainContextWhenHidden: true },
      }),
      bridge.onDidChangeTask((event) => this._onTaskEvent(event)),
    ];
  }

  dispose() {
    for (const disposable of this.disposables) disposable.dispose();
    this.disposables = [];
  }

  resolveWebviewView(webviewView) {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, "media")],
    };
    webviewView.webview.html = this._html(webviewView.webview);
    webviewView.webview.onDidReceiveMessage((message) => {
      this._onMessage(message).catch((error) => {
        this._log(`webview 메시지 처리 실패(${message?.type}): ${describe(error)}`);
        this._postState({ connectionError: describe(error) });
      });
    });
  }

  // #region Messages from the webview

  async _onMessage(message) {
    switch (message.type) {
      case "ready":
        await this.refresh();
        return;
      case "selectConversation":
        this.selectedConversationId = message.conversationId;
        await this.refresh();
        return;
      case "newConversation": {
        await this.bridge.ensureBackend();
        const projectId = await this._projectId();
        const conversation = await this.bridge.createConversation(projectId);
        this.selectedConversationId = conversation.conversationId;
        await this.refresh();
        return;
      }
      case "setOption":
        this.options[message.id] = message.value;
        await this.context.globalState.update(OPTIONS_KEY, this.options);
        return;
      case "send":
        await this._send(message);
        return;
      case "openReview":
        await this.review.openReview(message.taskId);
        return;
      case "openLink": {
        const href = String(message.href || "");
        if (/^https?:/.test(href)) {
          await vscode.env.openExternal(vscode.Uri.parse(href, true));
        }
        return;
      }
      case "pickAttachment": {
        await this._pickAttachment();
        return;
      }
      case "searchMentions": {
        const projectId = await this._projectId();
        this.view?.webview.postMessage({
          type: "mentionResults",
          requestId: message.requestId || null,
          files: this._findMentionCandidates(projectId, message.query),
        });
        return;
      }
      case "cancel": {
        await this._cancel();
        return;
      }
    }
  }

  /**
   * Cancels the task the composer is currently waiting on.
   *
   * The webview only knows that *something* is running, so the active task is
   * resolved here from the same snapshot `refresh()` last published.
   */
  async _cancel() {
    const active = [...(this.tasks || [])]
      .reverse()
      .find((task) => ACTIVE_STATUSES.has(task.status));
    if (!active) {
      await this.refresh();
      return;
    }
    await this.bridge.cancelTask(active.taskId);
    await this.refresh();
  }

  /**
   * Files under the project root that match an `@` mention prefix.
   *
   * Breadth-first so shallow files — the ones usually wanted — surface first,
   * with hard caps on both results and visited entries to keep the keystroke
   * round-trip cheap on large repositories.
   */
  _findMentionCandidates(projectId, query = "") {
    const root = this.bridge.resolveProjectRoot(projectId);
    if (!root) return [];
    const fs = require("node:fs");
    const path = require("node:path");
    const normalized = String(query || "").trim().toLocaleLowerCase();
    const ignored = new Set([
      ".git", ".next", ".venv", "__pycache__", "build", "dist", "node_modules", "venv",
    ]);
    const queue = [root];
    const results = [];
    let visited = 0;
    while (queue.length && results.length < 40 && visited < 2500) {
      let entries;
      try {
        entries = fs.readdirSync(queue.shift(), { withFileTypes: true });
      } catch {
        continue;
      }
      entries.sort((left, right) => left.name.localeCompare(right.name));
      for (const entry of entries) {
        if (visited++ >= 2500) break;
        if (entry.name.startsWith(".") || ignored.has(entry.name) || entry.isSymbolicLink()) continue;
        const absolute = path.join(entry.parentPath || entry.path, entry.name);
        if (entry.isDirectory()) {
          queue.push(absolute);
          continue;
        }
        if (!entry.isFile()) continue;
        const relativePath = path.relative(root, absolute);
        if (normalized && !relativePath.toLocaleLowerCase().includes(normalized)) continue;
        results.push({ relativePath, name: entry.name });
        if (results.length >= 40) break;
      }
    }
    return results;
  }

  /** Native file dialog scoped to the project; inserts an `@path` mention. */
  async _pickAttachment() {
    const projectId = await this._projectId();
    const root = this.bridge.resolveProjectRoot(projectId);
    if (!root) return;
    const picked = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectMany: false,
      defaultUri: vscode.Uri.file(root),
      openLabel: "VIBEX에 첨부",
    });
    const file = picked?.[0];
    if (!file) return;
    const path = require("node:path");
    const relative = path.relative(root, file.fsPath);
    if (relative.startsWith("..")) {
      vscode.window.showWarningMessage("선택한 프로젝트 밖의 파일은 참조할 수 없습니다.");
      return;
    }
    this.view?.webview.postMessage({ type: "insertMention", relativePath: relative });
  }

  /** Native view-title action: start a fresh conversation. */
  async newConversation() {
    await this.bridge.ensureBackend();
    const projectId = await this._projectId();
    const conversation = await this.bridge.createConversation(projectId);
    this.selectedConversationId = conversation.conversationId;
    await this.refresh();
  }

  /** Native view-title action: switch conversations via the quick pick. */
  async pickConversation() {
    await this.bridge.ensureBackend();
    const projectId = await this._projectId();
    const conversations = await this.bridge.conversations(projectId);
    if (!conversations.length) {
      vscode.window.showInformationMessage("VIBEX 대화가 아직 없습니다.");
      return;
    }
    const picked = await vscode.window.showQuickPick(
      conversations.map((conversation) => ({
        label: conversation.title || "새 대화",
        description: new Date(conversation.updatedAt).toLocaleString("ko-KR"),
        picked: conversation.conversationId === this.selectedConversationId,
        conversationId: conversation.conversationId,
      })),
      { title: "VIBEX 대화", placeHolder: "열어 볼 대화를 선택하세요" },
    );
    if (!picked) return;
    this.selectedConversationId = picked.conversationId;
    await this.refresh();
  }

  async _send(message) {
    await this.bridge.ensureBackend();
    const projectId = await this._projectId();
    if (!this.selectedConversationId) {
      const conversation = await this.bridge.createConversation(
        projectId,
        titleFromPrompt(message.text),
      );
      this.selectedConversationId = conversation.conversationId;
    }
    const { agentId, model } = parseModelId(message.modelId);
    const agent = (await this.bridge.agents()).find(
      (candidate) => candidate.agentId === agentId,
    );
    const effort =
      message.effort && (agent?.efforts || []).some((option) => option.value === message.effort)
        ? message.effort
        : undefined;

    // `@경로` mentions attach the referenced project files, exactly like the
    // native VIBEX chat session surface.
    const projectRoot = this.bridge.resolveProjectRoot(projectId);
    const { resolveMentions } = require("./sessions");
    const mentions = resolveMentions(projectRoot, message.text);

    const created = await this.bridge.createTask({
      projectId,
      conversationId: this.selectedConversationId,
      agentId,
      model,
      effort,
      approvalMode: message.approvalMode === "default" ? undefined : message.approvalMode,
      prompt: message.text,
      inputReferences: mentions.inputReferences,
      localImagePaths: mentions.localImagePaths,
    });
    await this.refresh();
    this._follow(created.taskId);
  }

  // #endregion

  // #region State assembly

  async _projectId() {
    if (this.selectedProjectId) return this.selectedProjectId;
    const projects = await this.bridge.projects();
    const project =
      this.bridge.projectForWorkspace(projects) ||
      projects.find((candidate) => candidate.status !== "unavailable");
    if (!project) {
      throw new Error("사용할 수 있는 VIBEX 프로젝트가 없습니다. 백엔드에 Git 프로젝트를 먼저 등록해 주세요.");
    }
    this.selectedProjectId = project.projectId;
    return project.projectId;
  }

  async refresh() {
    const generation = ++this.refreshGeneration;
    try {
      await this.bridge.ensureBackend();
      const [health, agents, projects] = await Promise.all([
        this.bridge.health(),
        this.bridge.agents(),
        this.bridge.projects(),
      ]);
      const projectId = await this._projectId();
      const conversations = await this.bridge.conversations(projectId);
      let selected = conversations.find(
        (candidate) => candidate.conversationId === this.selectedConversationId,
      ) || conversations[0] || null;
      this.selectedConversationId = selected?.conversationId || null;

      let tasks = [];
      if (selected) {
        const detail = await this.bridge.conversationDetail(projectId, selected.conversationId);
        tasks = Array.isArray(detail.tasks) ? detail.tasks : [];
      }
      if (generation !== this.refreshGeneration) return;
      this.tasks = tasks;

      const lastTask = tasks[tasks.length - 1];
      if (lastTask && ACTIVE_STATUSES.has(lastTask.status)) this._follow(lastTask.taskId);

      // The conversation title lives in the native view header, not in the page.
      if (this.view) {
        this.view.description = selected?.title || undefined;
      }

      this._postState({
        health,
        agents,
        projects,
        conversations,
        selectedProjectId: projectId,
        selectedConversationId: this.selectedConversationId,
        tasks,
        busy: Boolean(lastTask && ACTIVE_STATUSES.has(lastTask.status)),
      });
    } catch (error) {
      if (generation !== this.refreshGeneration) return;
      this._log(`상태 갱신 실패: ${describe(error)}`);
      this._postState({ connectionError: describe(error) });
    }
  }

  _postState(partial) {
    this.view?.webview.postMessage({
      type: "state",
      options: {
        modelId: this.options.model || null,
        effort: this.options.effort || "",
        approvalMode: this.options.approvalMode || "default",
      },
      ...partial,
    });
  }

  _onTaskEvent(event) {
    if (!this.view) return;
    if (event.taskId && this._following.has(event.taskId)) return; // 이미 추적 중
    // 다른 기기(iPad)에서 시작된 작업도 화면에 반영한다.
    void this.refresh();
  }

  /** Streams one task's snapshots to the webview until it settles. */
  _follow(taskId) {
    if (this._following.has(taskId)) return;
    this._following.add(taskId);
    const poll = async () => {
      try {
        for (;;) {
          const task = await this.bridge.getTask(taskId);
          const index = this.tasks.findIndex((candidate) => candidate.taskId === task.taskId);
          if (index >= 0) this.tasks[index] = task;
          else this.tasks.push(task);
          this.view?.webview.postMessage({ type: "taskUpdate", task });
          if (!ACTIVE_STATUSES.has(task.status)) break;
          await new Promise((resolve) => {
            const timer = setTimeout(finish, 700);
            const subscription = this.bridge.onDidChangeTask((event) => {
              if (event.taskId === taskId) finish();
            });
            function finish() {
              clearTimeout(timer);
              subscription.dispose();
              resolve();
            }
          });
        }
      } catch (error) {
        this._log(`작업 추적 실패(${taskId}): ${describe(error)}`);
      } finally {
        this._following.delete(taskId);
        void this.refresh();
      }
    };
    void poll();
  }

  // #endregion

  _html(webview) {
    const nonce = crypto.randomBytes(16).toString("base64");
    const media = (file) =>
      webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "media", file));
    const glue = require("node:fs")
      .readFileSync(
        vscode.Uri.joinPath(this.context.extensionUri, "media", "vibex-glue.css").fsPath,
        "utf8",
      )
      .replace("{{CODICON_URI}}", media("codicon.ttf").toString());
    return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data: http://127.0.0.1:8787;">
  <link rel="stylesheet" href="${media("native-chat.css")}">
  <style>${glue}</style>
  <title>VIBEX</title>
</head>
<body>
  <script nonce="${nonce}" src="${media("webview.js")}"></script>
</body>
</html>`;
  }

  _log(text) {
    this.output.appendLine(`[panel] ${text}`);
  }
}

function titleFromPrompt(prompt) {
  const text = String(prompt || "").trim().replace(/\s+/g, " ");
  if (!text) return "새 대화";
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

function describe(error) {
  return error instanceof Error ? error.message : String(error);
}

module.exports = { VibexPanel, VIEW_TYPE };
