const crypto = require("node:crypto");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { promisify } = require("node:util");
const vscode = require("vscode");

const VIEW_TYPE = "vibex.panel";
const LOCAL_BRIDGE_URL = "http://127.0.0.1:8787";
const TAILSCALE_HOSTNAME = "vibex-pc";
const REVIEW_DOCUMENT_SCHEME = "vibex-review";
const execFile = promisify(childProcess.execFile);

class BridgeError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.status = status;
  }
}

class ReviewDocumentProvider {
  constructor() {
    this.documents = new Map();
  }

  provideTextDocumentContent(uri) {
    return this.documents.get(uri.toString()) || "";
  }

  add(content, relativePath, side) {
    const fileName = path.basename(relativePath || "file") || "file";
    const uri = vscode.Uri.from({
      scheme: REVIEW_DOCUMENT_SCHEME,
      authority: side,
      path: `/${crypto.randomUUID()}/${fileName}`,
    });
    this.documents.set(uri.toString(), String(content ?? ""));

    // Review documents are immutable and short-lived. Keep the provider bounded even
    // when the sidebar stays open for a long VS Code session.
    while (this.documents.size > 200) {
      this.documents.delete(this.documents.keys().next().value);
    }
    return uri;
  }

  dispose() {
    this.documents.clear();
  }
}

class VibexViewProvider {
  constructor(context) {
    this.context = context;
    this.view = undefined;
    this.output = vscode.window.createOutputChannel("Vibex");
    this.refreshGeneration = 0;
    this.backendProcess = undefined;
    this.backendStarting = undefined;
    this.tailscale = { url: "http://vibex-pc:8788", ready: false, error: "Tailscale 확인 전" };
    this.reviewDocuments = new ReviewDocumentProvider();
    this.projectRoots = new Map();
    context.subscriptions.push(
      this.reviewDocuments,
      vscode.workspace.registerTextDocumentContentProvider(
        REVIEW_DOCUMENT_SCHEME,
        this.reviewDocuments,
      ),
    );
  }

  resolveWebviewView(webviewView) {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, "media")],
    };
    webviewView.webview.html = this.html(webviewView.webview);
    webviewView.webview.onDidReceiveMessage(
      (message) => this.onMessage(message),
      undefined,
      this.context.subscriptions,
    );
  }

  async onMessage(message) {
    try {
      switch (message.type) {
        case "ready":
          await this.ensureBackend();
          await this.sendConfiguration();
          await this.refresh(message.projectId, message.requestId);
          await this.configureTailscale();
          break;
        case "refresh":
          await this.refresh(message.projectId, message.requestId);
          break;
        case "setupTailscale":
          await this.configureTailscale();
          break;
        case "setAgent":
          await this.request(`/projects/${encodeURIComponent(message.projectId)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agent: message.agent }),
          });
          await this.refresh(message.projectId);
          break;
        case "sendTask":
          {
            const created = await this.createTask(
              message.projectId,
              message.note,
              message.runOptions,
              message.requestId,
              message.threadMode,
              message.threadId,
            );
            this.post({
              type: "taskAccepted",
              requestId: message.requestId || null,
              taskId: created.taskId || null,
            });
          }
          await this.refresh(message.projectId);
          break;
        case "loadThreads":
          await this.loadThreads(
            message.projectId,
            message.cursor || null,
            Boolean(message.append),
          );
          break;
        case "openThread":
          await this.openThread(message.projectId, message.threadId);
          break;
        case "renameThread":
          await this.renameThread(message.projectId, message.threadId, message.name);
          break;
        case "archiveThread":
          await this.archiveThread(message.projectId, message.threadId);
          break;
        case "answer":
          await this.request(`/tasks/${encodeURIComponent(message.taskId)}/answer`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              questionId: message.questionId,
              selectedOptionId: message.optionId,
              freeText: message.freeText || null,
            }),
          });
          this.post({
            type: "answerAccepted",
            requestId: message.requestId || null,
            taskId: message.taskId,
          });
          await this.refresh(message.projectId);
          break;
        case "cancel":
          await this.request(`/tasks/${encodeURIComponent(message.taskId)}/cancel`, {
            method: "POST",
          });
          this.post({
            type: "cancelAccepted",
            requestId: message.requestId || null,
            taskId: message.taskId,
          });
          await this.refresh(message.projectId);
          break;
        case "reviewTask":
          await this.openReview(message.taskId);
          break;
        case "openTaskFile":
          await this.openTaskFile(message.taskId, message.path);
          break;
        case "copyText":
          await this.copyText(message.text, message.requestId);
          break;
        case "openLink":
          await this.openLink(
            message.href || message.url || message.target || message.link,
            message.projectId,
          );
          break;
        case "undoTask":
          await this.undoTask(message.taskId, message.projectId);
          break;
        case "configure":
          await this.configureWithPrompts();
          break;
        case "showOutput":
          this.output.show(true);
          break;
      }
    } catch (error) {
      if (message.type === "sendTask") {
        this.post({
          type: "taskRejected",
          requestId: message.requestId || null,
          message: error instanceof Error ? error.message : String(error),
        });
        this.reportError(error, { post: false });
        return;
      }
      if (message.type === "answer") {
        this.post({
          type: "answerRejected",
          requestId: message.requestId || null,
          taskId: message.taskId,
          message: error instanceof Error ? error.message : String(error),
        });
        this.reportError(error, { post: false });
        return;
      }
      if (message.type === "cancel") {
        this.post({
          type: "cancelRejected",
          requestId: message.requestId || null,
          taskId: message.taskId,
          message: error instanceof Error ? error.message : String(error),
        });
        this.reportError(error, { post: false });
        return;
      }
      this.reportError(error);
    }
  }

  async sendConfiguration() {
    this.post({
      type: "configuration",
      url: LOCAL_BRIDGE_URL,
      managed: true,
      backendOwned: Boolean(this.backendProcess),
    });
  }

  async configureWithPrompts() {
    const currentPath = vscode.workspace
      .getConfiguration("vibex")
      .get("backendPath", "");
    const backendPath = await vscode.window.showInputBox({
      title: "Vibex 백엔드 폴더",
      value: currentPath,
      prompt: "자동 탐색이 실패할 때만 backend 폴더의 절대 경로를 입력하세요.",
      ignoreFocusOut: true,
    });
    if (backendPath === undefined) return;
    await vscode.workspace.getConfiguration("vibex").update(
      "backendPath", backendPath.trim(), vscode.ConfigurationTarget.Global,
    );
    await this.ensureBackend();
    await this.refresh();
    await this.configureTailscale();
  }

  async ensureBackend() {
    if (await this.bridgeIsHealthy()) return;
    if (this.backendStarting) return this.backendStarting;
    this.backendStarting = this.startBackend();
    try {
      await this.backendStarting;
    } finally {
      this.backendStarting = undefined;
    }
  }

  backendDirectory() {
    const configured = vscode.workspace.getConfiguration("vibex").get("backendPath", "").trim();
    const candidates = [];
    if (configured) candidates.push(configured);
    for (const folder of vscode.workspace.workspaceFolders || []) {
      let current = folder.uri.fsPath;
      while (true) {
        candidates.push(path.join(current, "backend"), current);
        const parent = path.dirname(current);
        if (parent === current) break;
        current = parent;
      }
    }
    return candidates.find((candidate) =>
      fs.existsSync(path.join(candidate, "src", "main.py")) &&
      fs.existsSync(path.join(candidate, "src", "api", "tasks.py")) &&
      fs.existsSync(path.join(candidate, ".venv", "bin", "python"))
    );
  }

  async startBackend() {
    const backend = this.backendDirectory();
    if (!backend) {
      throw new BridgeError(
        "Vibex backend/.venv를 찾지 못했습니다. Vibex 저장소를 워크스페이스에 추가하거나 백엔드 경로를 설정해 주세요.",
      );
    }
    const python = path.join(backend, ".venv", "bin", "python");
    this.output.appendLine(`[backend] 자동 시작: ${backend}`);
    const process = childProcess.spawn(
      python,
      ["-m", "uvicorn", "src.main:app", "--host", "127.0.0.1", "--port", "8787"],
      {
        cwd: backend,
        env: {
          ...processEnv(),
          BRIDGE_PREVIEW_PUBLIC_HOST: TAILSCALE_HOSTNAME,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    this.backendProcess = process;
    for (const stream of [process.stdout, process.stderr]) {
      stream.on("data", (chunk) => this.output.append(chunk.toString()));
    }
    process.once("exit", (code) => {
      this.output.appendLine(`[backend] 종료됨 (${code ?? "signal"})`);
      if (this.backendProcess === process) this.backendProcess = undefined;
    });

    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      if (process.exitCode !== null) {
        throw new BridgeError(`Vibex 백엔드가 시작 중 종료되었습니다(코드 ${process.exitCode}).`);
      }
      if (await this.bridgeIsHealthy()) return;
      await delay(300);
    }
    process.kill("SIGTERM");
    throw new BridgeError("Vibex 백엔드가 60초 안에 준비되지 않았습니다.");
  }

  async bridgeIsHealthy() {
    try {
      const response = await fetch(`${LOCAL_BRIDGE_URL}/api/v1/health`, {
        signal: AbortSignal.timeout(1200),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  tailscaleBinary() {
    const configured = vscode.workspace.getConfiguration("vibex").get("tailscaleBinary", "").trim();
    const candidates = [
      configured,
      ...String(process.env.PATH || "").split(path.delimiter).map((dir) => path.join(dir, "tailscale")),
      "/usr/local/bin/tailscale",
      "/opt/homebrew/bin/tailscale",
      "/Applications/Tailscale.app/Contents/MacOS/Tailscale",
    ].filter(Boolean);
    return candidates.find((candidate) => fs.existsSync(candidate));
  }

  async configureTailscale() {
    const configuration = vscode.workspace.getConfiguration("vibex");
    const hostname = TAILSCALE_HOSTNAME;
    const servePort = configuration.get("tailscaleServePort", 8788);
    const url = `http://${hostname}:${servePort}`;
    try {
      if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(hostname)) {
        throw new BridgeError("Tailscale 호스트 이름은 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.");
      }
      const binary = this.tailscaleBinary();
      if (!binary) {
        throw new BridgeError("Tailscale CLI를 찾지 못했습니다. Tailscale을 설치하고 로그인한 뒤 다시 시도해 주세요.");
      }
      const tailscaleEnv = { ...processEnv(), TAILSCALE_BE_CLI: "1" };
      const { stdout } = await execFile(binary, ["status", "--json"], {
        timeout: 10_000,
        env: tailscaleEnv,
      });
      const status = JSON.parse(stdout);
      const dnsName = String(status?.Self?.DNSName || "").replace(/\.$/, "");
      if (!dnsName || status?.BackendState !== "Running") {
        throw new BridgeError("이 Mac에서 Tailscale에 먼저 로그인해 주세요.");
      }
      if (dnsName.split(".")[0] !== hostname) {
        await execFile(binary, ["set", `--hostname=${hostname}`], {
          timeout: 15_000,
          env: tailscaleEnv,
        });
      }
      await execFile(
        binary,
        ["serve", "--bg", "--yes", `--http=${servePort}`, "127.0.0.1:8787"],
        { timeout: 30_000, env: tailscaleEnv },
      );
      this.tailscale = { url, ready: true, error: "" };
    } catch (error) {
      this.tailscale = { url, ready: false, error: error.message || String(error) };
    }
    this.post({ type: "tailscale", ...this.tailscale });
  }

  async createTask(
    projectId,
    note,
    runOptions = {},
    clientTaskId = null,
    threadMode = "auto",
    threadId = null,
  ) {
    if (!projectId || !String(note || "").trim()) {
      throw new BridgeError("프로젝트와 요청 내용을 입력해 주세요.");
    }
    const body = new URLSearchParams({
      projectId,
      mode: "text",
      typedNote: String(note).trim(),
      origin: "vscode",
      clientTaskId: clientTaskId || crypto.randomUUID(),
      threadMode: ["auto", "resume", "new"].includes(threadMode) ? threadMode : "auto",
    });
    if (threadMode === "resume" && threadId) body.set("threadId", String(threadId));
    if (runOptions.model) body.set("model", runOptions.model);
    if (runOptions.effort) body.set("effort", runOptions.effort);
    if (runOptions.speedMode) body.set("speedMode", runOptions.speedMode);
    return this.request("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  async loadThreads(projectId, cursor = null, append = false) {
    if (!projectId) throw new BridgeError("프로젝트를 먼저 선택해 주세요.");
    const query = new URLSearchParams({ limit: "30" });
    if (cursor) query.set("cursor", cursor);
    const page = await this.request(
      `/projects/${encodeURIComponent(projectId)}/threads?${query.toString()}`,
    );
    this.post({
      type: "threadsLoaded",
      projectId,
      threads: Array.isArray(page.threads) ? page.threads : [],
      nextCursor: page.nextCursor || null,
      append,
    });
  }

  async openThread(projectId, threadId) {
    if (!projectId || !threadId) throw new BridgeError("열 대화를 선택해 주세요.");
    const thread = await this.request(
      `/projects/${encodeURIComponent(projectId)}/threads/${encodeURIComponent(threadId)}`,
    );
    this.post({ type: "threadLoaded", projectId, thread });
  }

  async renameThread(projectId, threadId, currentName = "") {
    if (!projectId || !threadId) throw new BridgeError("이름을 바꿀 대화가 없습니다.");
    const name = await vscode.window.showInputBox({
      title: "대화 이름 변경",
      value: String(currentName || ""),
      prompt: "Codex와 VS Code에 함께 표시할 대화 이름입니다.",
      validateInput: (value) => {
        const trimmed = value.trim();
        if (!trimmed) return "대화 이름을 입력해 주세요.";
        if (trimmed.length > 160) return "대화 이름은 160자 이하여야 합니다.";
        return null;
      },
      ignoreFocusOut: true,
    });
    if (name === undefined) return;
    await this.request(
      `/projects/${encodeURIComponent(projectId)}/threads/${encodeURIComponent(threadId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      },
    );
    await this.openThread(projectId, threadId);
    await this.loadThreads(projectId);
  }

  async archiveThread(projectId, threadId) {
    if (!projectId || !threadId) throw new BridgeError("보관할 대화가 없습니다.");
    const choice = await vscode.window.showWarningMessage(
      "이 대화를 최근 목록에서 보관할까요? Codex 저장소의 대화 자체는 삭제되지 않습니다.",
      { modal: true },
      "보관",
    );
    if (choice !== "보관") return;
    await this.request(
      `/projects/${encodeURIComponent(projectId)}/threads/${encodeURIComponent(threadId)}/archive`,
      { method: "POST" },
    );
    this.post({ type: "threadArchived", projectId, threadId });
    await this.loadThreads(projectId);
  }

  async taskReview(taskId) {
    return this.request(`/tasks/${encodeURIComponent(taskId)}/review`);
  }

  async openReview(taskId) {
    const review = await this.taskReview(taskId);
    const files = Array.isArray(review.files) ? review.files : [];
    if (!files.length) {
      await this.openRawReview(review);
      return;
    }

    let selected = files[0];
    if (files.length > 1) {
      const picked = await vscode.window.showQuickPick(
        files.map((file) => ({
          label: file.path,
          description: `+${file.additions || 0} -${file.deletions || 0}`,
          file,
        })),
        {
          title: "리뷰할 파일 선택",
          placeHolder: `${files.length}개 변경 파일`,
          matchOnDescription: true,
        },
      );
      if (!picked) return;
      selected = picked.file;
    }

    await this.openFileDiffWithFallback(taskId, selected.path, review);
  }

  async openRawReview(review) {
    const document = await vscode.workspace.openTextDocument({
      language: "diff",
      content: String(review.patch || ""),
    });
    await vscode.window.showTextDocument(document, { preview: true });
  }

  async openTaskFile(taskId, relativePath) {
    const review = await this.taskReview(taskId);
    const files = Array.isArray(review.files) ? review.files : [];
    const file = files.find((candidate) => candidate.path === relativePath);
    if (!file) {
      await this.openRawReview(review);
      return;
    }
    await this.openFileDiffWithFallback(taskId, file.path, review);
  }

  async openFileDiffWithFallback(taskId, relativePath, review) {
    try {
      const fileReview = await this.request(
        `/tasks/${encodeURIComponent(taskId)}/review/file?path=${encodeURIComponent(relativePath)}`,
      );
      if (fileReview?.isBinary) {
        await this.openRawReview(review);
        return;
      }
      await this.openFileDiff(fileReview, relativePath);
    } catch (error) {
      if (error instanceof BridgeError && [404, 409, 501].includes(error.status)) {
        await this.openRawReview(review);
        return;
      }
      throw error;
    }
  }

  async openFileDiff(fileReview, expectedPath) {
    if (!fileReview || typeof fileReview !== "object") {
      throw new BridgeError("파일 리뷰 응답이 올바르지 않습니다.");
    }
    const relativePath = String(fileReview.path || expectedPath || "");
    if (!relativePath || (fileReview.path && relativePath !== expectedPath)) {
      throw new BridgeError("파일 리뷰 응답의 경로가 요청과 일치하지 않습니다.");
    }
    const validBefore = fileReview.beforeExists === false
      ? fileReview.before == null || typeof fileReview.before === "string"
      : typeof fileReview.before === "string";
    const validAfter = fileReview.afterExists === false
      ? fileReview.after == null || typeof fileReview.after === "string"
      : typeof fileReview.after === "string";
    if (!validBefore || !validAfter) {
      throw new BridgeError("파일 리뷰 응답에 변경 전·후 내용이 없습니다.");
    }

    const beforeExists = fileReview.beforeExists !== false;
    const afterExists = fileReview.afterExists !== false;
    const beforeUri = this.reviewDocuments.add(fileReview.before ?? "", relativePath, "before");
    const afterUri = this.reviewDocuments.add(fileReview.after ?? "", relativePath, "after");
    const beforeLabel = beforeExists ? "변경 전" : "새 파일";
    const afterLabel = afterExists ? "변경 후" : "삭제됨";
    await vscode.commands.executeCommand(
      "vscode.diff",
      beforeUri,
      afterUri,
      `${relativePath} (${beforeLabel} ↔ ${afterLabel})`,
      { preview: true },
    );
  }

  async copyText(value, requestId) {
    const text = String(value ?? "");
    await vscode.env.clipboard.writeText(text);
    this.post({ type: "copyTextCompleted", requestId: requestId || null });
  }

  async openLink(value, projectId = null) {
    const target = String(value || "").trim();
    if (!target) throw new BridgeError("열 링크가 없습니다.");

    let parsed;
    try {
      parsed = new URL(target);
    } catch {
      parsed = null;
    }

    if (parsed?.protocol === "http:" || parsed?.protocol === "https:") {
      const opened = await vscode.env.openExternal(vscode.Uri.parse(parsed.href, true));
      if (!opened) throw new BridgeError("링크를 열지 못했습니다.");
      return;
    }
    const looksLikeFileLocation = (
      /^[a-zA-Z]:[\\/]/.test(target) ||
      /:\d+(?::\d+)?(?:#(?:L)?\d+(?:(?::|C)\d+)?)?$/i.test(target)
    );
    if (parsed && parsed.protocol !== "file:" && !looksLikeFileLocation) {
      throw new BridgeError(`허용되지 않는 링크 형식입니다: ${parsed.protocol}`);
    }

    const location = this.resolveWorkspaceFile(
      target,
      parsed?.protocol === "file:" ? parsed : null,
      projectId,
    );
    const document = await vscode.workspace.openTextDocument(location.uri);
    let selection;
    if (location.line != null) {
      if (location.line < 1 || location.line > document.lineCount) {
        throw new BridgeError(`파일 줄 번호가 범위를 벗어났습니다: ${location.line}`);
      }
      const line = document.lineAt(location.line - 1);
      const column = Math.min(Math.max((location.column || 1) - 1, 0), line.text.length);
      const position = new vscode.Position(location.line - 1, column);
      selection = new vscode.Range(position, position);
    }
    const editor = await vscode.window.showTextDocument(document, {
      preview: true,
      selection,
    });
    if (selection) editor.revealRange(selection, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
  }

  resolveWorkspaceFile(target, parsedUrl, projectId = null) {
    const folders = (vscode.workspace.workspaceFolders || []).filter(
      (folder) => folder.uri.scheme === "file",
    );
    const projectRoot = this.resolveProjectRoot(projectId);
    if (!folders.length && !projectRoot) {
      throw new BridgeError("선택한 프로젝트 또는 로컬 VS Code 작업 폴더를 찾지 못했습니다.");
    }

    const parsedLocation = parseFileLocation(target, parsedUrl);
    const requestedPath = parsedLocation.filePath;
    const candidates = path.isAbsolute(requestedPath)
      ? [requestedPath]
      : [
          ...(projectRoot ? [path.resolve(projectRoot, requestedPath)] : []),
          ...folders.map((folder) => path.resolve(folder.uri.fsPath, requestedPath)),
        ];
    const allowedRoots = [
      ...(projectRoot ? [projectRoot] : []),
      ...folders.map((folder) => folder.uri.fsPath),
    ];

    for (const candidate of candidates) {
      let realCandidate;
      try {
        realCandidate = fs.realpathSync(candidate);
        if (!fs.statSync(realCandidate).isFile()) continue;
      } catch {
        continue;
      }

      const insideWorkspace = allowedRoots.some((root) => {
        try {
          return isPathInside(realCandidate, fs.realpathSync(root));
        } catch {
          return false;
        }
      });
      if (insideWorkspace) {
        return {
          uri: vscode.Uri.file(realCandidate),
          line: parsedLocation.line,
          column: parsedLocation.column,
        };
      }
    }
    throw new BridgeError("선택한 프로젝트 밖의 파일이거나 존재하지 않는 파일입니다.");
  }

  resolveProjectRoot(projectId) {
    const normalizedId = String(projectId || "").trim();
    if (!normalizedId) return null;
    const cached = this.projectRoots.get(normalizedId);
    if (cached && fs.existsSync(cached)) return cached;

    const backend = this.backendDirectory();
    if (!backend) return null;
    const envPath = path.join(backend, ".env");
    const projectsFile = expandLocalPath(
      process.env.BRIDGE_PROJECTS_FILE || readEnvValue(envPath, "BRIDGE_PROJECTS_FILE") ||
        path.join(backend, "projects.local.json"),
    );
    const configured = configuredProjectRoot(projectsFile, normalizedId);
    if (configured) {
      this.projectRoots.set(normalizedId, configured);
      return configured;
    }

    const workspaceRoot = expandLocalPath(
      process.env.BRIDGE_WORKSPACE_ROOT || readEnvValue(envPath, "BRIDGE_WORKSPACE_ROOT"),
    );
    const discovered = discoverProjectRoot(workspaceRoot, normalizedId);
    if (discovered) {
      this.projectRoots.set(normalizedId, discovered);
      return discovered;
    }

    for (const folder of vscode.workspace.workspaceFolders || []) {
      if (folder.uri.scheme !== "file") continue;
      const candidate = discoverProjectRoot(folder.uri.fsPath, normalizedId);
      if (candidate) {
        this.projectRoots.set(normalizedId, candidate);
        return candidate;
      }
    }
    return null;
  }

  async undoTask(taskId, projectId) {
    const choice = await vscode.window.showWarningMessage(
      "이 작업에서 만든 파일 변경만 실행 취소할까요? 후속 변경과 충돌하면 취소되지 않습니다.",
      { modal: true },
      "실행 취소",
    );
    if (choice !== "실행 취소") return;
    await this.request(`/tasks/${encodeURIComponent(taskId)}/undo`, { method: "POST" });
    await this.refresh(projectId);
  }

  async refresh(selectedProjectId, requestId = null) {
    const generation = ++this.refreshGeneration;
    try {
      await this.ensureBackend();
      const [health, agentResponse, projectResponse] = await Promise.all([
        this.request("/health"),
        this.request("/agents"),
        this.request("/projects"),
      ]);
      const projects = projectResponse.projects || [];
      const selected = projects.some(
        (project) => project.projectId === selectedProjectId,
      )
        ? selectedProjectId
        : projects[0]?.projectId;
      const taskResponse = selected
        ? await this.request(
            `/tasks?projectId=${encodeURIComponent(selected)}&limit=50`,
          )
        : { tasks: [] };
      if (generation !== this.refreshGeneration) return;
      this.post({
        type: "state",
        requestId,
        requestedProjectId: selectedProjectId || null,
        health,
        agents: agentResponse.agents || [],
        projects,
        selectedProjectId: selected || null,
        tasks: taskResponse.tasks || [],
      });
    } catch (error) {
      if (generation !== this.refreshGeneration) return;
      this.reportError(error, { connectionFailed: true });
    }
  }

  async request(path, options = {}) {
    const endpoint = new URL(`/api/v1${path}`, `${LOCAL_BRIDGE_URL}/`);
    const headers = new Headers(options.headers || {});
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(endpoint, {
        ...options,
        headers,
        signal: controller.signal,
      });
      const text = await response.text();
      let body = null;
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }
      if (!response.ok) {
        const detail =
          body && typeof body === "object" ? body.detail : body || response.statusText;
        throw new BridgeError(String(detail), response.status);
      }
      return body || {};
    } catch (error) {
      if (error.name === "AbortError") {
        throw new BridgeError("Vibex Bridge 응답 시간이 초과되었습니다.");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  reportError(error, { post = true, connectionFailed = false } = {}) {
    const message = error instanceof Error ? error.message : String(error);
    this.output.appendLine(`[${new Date().toISOString()}] ${message}`);
    if (!post) return;
    this.post({
      type: "error",
      message,
      needsConfiguration: false,
      connectionFailed,
    });
  }

  post(message) {
    this.view?.webview.postMessage(message);
  }

  dispose() {
    if (this.backendProcess && this.backendProcess.exitCode === null) {
      this.output.appendLine("[backend] VS Code 종료로 자동 실행 프로세스를 정리합니다.");
      this.backendProcess.kill("SIGTERM");
    }
  }

  html(webview) {
    const nonce = crypto.randomBytes(16).toString("base64");
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "styles.css"),
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "main.js"),
    );
    return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data: http://127.0.0.1:8787; connect-src ws://127.0.0.1:8787; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <link rel="stylesheet" href="${styleUri}">
  <title>Vibex</title>
</head>
<body>
  <main class="shell">
    <header class="chat-header">
      <div class="title-row">
        <button id="backButton" class="bare-icon thread-only" type="button" title="최근 대화" aria-label="최근 대화">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div>
          <h1 id="projectTitle">VIBEX</h1>
          <p id="headerSubtitle">Cross-device session</p>
        </div>
      </div>
      <div class="header-actions">
        <div class="thread-menu-wrap thread-only">
          <button id="threadMenuButton" class="bare-icon" type="button" title="대화 작업" aria-label="대화 작업" aria-expanded="false" aria-controls="threadMenu">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/></svg>
          </button>
          <div id="threadMenu" class="thread-menu hidden" role="menu">
            <button id="renameThreadButton" type="button" role="menuitem">이름 변경</button>
            <button id="archiveThreadButton" type="button" role="menuitem">대화 보관</button>
          </div>
        </div>
        <button id="historyButton" class="bare-icon codex-only" type="button" title="최근 대화" aria-label="최근 대화">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.8 12a8.2 8.2 0 1 0 2.4-5.8L3.8 8.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.8 4.6v4h4M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button id="newThreadButton" class="bare-icon codex-only" type="button" title="새 대화" aria-label="새 대화">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5H6.8A2.8 2.8 0 0 0 4 8.3v8.9A2.8 2.8 0 0 0 6.8 20h8.9a2.8 2.8 0 0 0 2.8-2.8V9.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M13 11 20 4M15 4h5v5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button id="refreshButton" class="bare-icon" type="button" title="새로고침" aria-label="새로고침">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 1-2.35-5.65L20 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 3v5h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button id="settingsButton" class="bare-icon" type="button" title="프로젝트 및 연결 설정" aria-label="설정" aria-expanded="false" aria-controls="connectionPanel">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.4v-.1A1.7 1.7 0 0 0 8 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 3.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2V9.4h.1A1.7 1.7 0 0 0 3.6 8a1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.06 3.2l.06.06A1.7 1.7 0 0 0 8 3.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2h4.2v.1A1.7 1.7 0 0 0 15 3.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 8c.16.42.48.77.9 1 .3.18.66.28 1.02.28H21v4.2h-.1A1.7 1.7 0 0 0 19.4 15Z" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </header>

    <section id="connectionPanel" class="preferences-popover hidden">
      <div class="connection-state">
        <span id="connectionDot" class="status-dot"></span>
        <span id="connectionText">Bridge 확인 중</span>
      </div>
      <div id="workspacePanel" class="workspace-panel hidden">
        <label class="field-label" for="projectSelect">프로젝트</label>
        <select id="projectSelect"></select>
        <div class="agent-header">
          <span class="field-label">에이전트</span>
          <span id="projectState" class="state-badge">idle</span>
        </div>
        <div id="agentSwitcher" class="agent-switcher"></div>
        <p id="agentNote" class="muted"></p>
      </div>
      <div class="pairing-panel">
        <span class="field-label">iPad 자동 연결</span>
        <p id="pairingStatus" class="muted">Tailscale 확인 중…</p>
        <code id="tailscaleURL" class="pairing-url">http://vibex-pc:8788</code>
        <button id="setupTailscaleButton" class="secondary wide" type="button">Tailscale 연결 다시 준비</button>
      </div>
    </section>

    <section id="errorBanner" class="error-banner hidden" role="alert"></section>

    <section id="historyPanel" class="history-panel hidden" aria-label="최근 대화">
      <div class="history-heading">
        <div><h2>최근 대화</h2><p>이 프로젝트의 Codex · VS Code · CLI 대화</p></div>
        <button id="historyNewButton" class="secondary" type="button">새 대화</button>
      </div>
      <div id="threadList" class="thread-list"></div>
      <button id="loadMoreThreadsButton" class="secondary wide hidden" type="button">이전 대화 더 보기</button>
    </section>

    <section id="conversationPanel" class="conversation" aria-label="대화">
      <div id="emptyState" class="empty-state">
        <div class="empty-mark">✦</div>
        <h2>Vibex에서 작업하기</h2>
        <p>iPad와 VS Code의 요청이 같은 대화 흐름에 표시됩니다.</p>
      </div>
      <div id="taskList" class="task-list" role="log" aria-live="polite"></div>
    </section>

    <button id="scrollToBottomButton" class="scroll-to-bottom hidden" type="button" title="최신 메시지로 이동" aria-label="최신 메시지로 이동">
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>

    <footer class="composer">
      <textarea id="promptInput" rows="3" placeholder="후속 변경 사항을 부탁하세요"></textarea>
      <div class="composer-footer">
        <div class="runtime-picker">
          <button id="runtimeButton" class="runtime-button" type="button" aria-haspopup="dialog" aria-controls="runtimePanel" aria-expanded="false" title="모델 실행 설정">
            <span id="selectedAgentLabel" class="runtime-button-label">실행 설정</span>
            <svg class="runtime-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <section id="runtimePanel" class="runtime-popover hidden" role="dialog" aria-label="모델 실행 설정">
            <label class="runtime-field"><span>모델</span><select id="modelSelect"></select></label>
            <label class="runtime-field"><span>추론</span><select id="effortSelect"></select></label>
            <label class="runtime-field"><span>속도</span><select id="speedSelect"></select></label>
          </section>
        </div>
        <div class="send-tools">
          <button id="cancelButton" class="stop-button hidden" type="button" title="작업 중단" aria-label="작업 중단"><span class="stop-glyph" aria-hidden="true"></span></button>
          <button id="sendButton" class="send-button" type="button" aria-label="전송" title="전송">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 7-7 7 7M12 19V5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>
      <p id="composerHint" class="composer-hint">로컬에서 작업 · Enter 전송 · Shift+Enter 줄바꿈</p>
    </footer>
  </main>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

const PROJECT_DISCOVERY_IGNORES = new Set([
  ".git",
  ".next",
  ".venv",
  "__pycache__",
  "build",
  "dist",
  "node_modules",
  "venv",
]);

function expandLocalPath(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (raw === "~") return require("node:os").homedir();
  if (raw.startsWith(`~${path.sep}`)) {
    return path.join(require("node:os").homedir(), raw.slice(2));
  }
  return path.resolve(raw);
}

function readEnvValue(filePath, key) {
  try {
    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!match || match[1] !== key) continue;
      const value = match[2];
      if (
        value.length >= 2 &&
        ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'")))
      ) return value.slice(1, -1);
      return value.replace(/\s+#.*$/, "").trim();
    }
  } catch {
    return "";
  }
  return "";
}

function configuredProjectRoot(projectsFile, projectId) {
  if (!projectsFile) return null;
  try {
    const payload = JSON.parse(fs.readFileSync(projectsFile, "utf8"));
    const configured = (payload.projects || []).find(
      (project) => project.projectId === projectId && project.repoPath,
    );
    if (!configured) return null;
    const candidate = path.isAbsolute(configured.repoPath)
      ? configured.repoPath
      : path.resolve(path.dirname(projectsFile), configured.repoPath);
    const real = fs.realpathSync(candidate);
    return fs.statSync(real).isDirectory() ? real : null;
  } catch {
    return null;
  }
}

function discoverProjectRoot(workspaceRoot, projectId) {
  if (!workspaceRoot) return null;
  let root;
  try {
    root = fs.realpathSync(workspaceRoot);
    if (!fs.statSync(root).isDirectory()) return null;
  } catch {
    return null;
  }

  const stack = [root];
  const basenameId = projectId.split("--").at(-1);
  let visited = 0;
  while (stack.length && visited < 10_000) {
    const current = stack.pop();
    visited += 1;
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    if (entries.some((entry) => entry.name === ".git")) {
      const candidateId = projectIdForPath(root, current);
      if (candidateId === projectId || normalizeProjectPart(path.basename(current)) === basenameId) {
        try {
          return fs.realpathSync(current);
        } catch {
          return null;
        }
      }
      continue;
    }
    const directories = entries
      .filter((entry) => (
        entry.isDirectory() &&
        !entry.isSymbolicLink() &&
        !entry.name.startsWith(".") &&
        !PROJECT_DISCOVERY_IGNORES.has(entry.name)
      ))
      .map((entry) => path.join(current, entry.name))
      .sort()
      .reverse();
    stack.push(...directories);
  }
  return null;
}

function projectIdForPath(root, repository) {
  const relative = path.relative(root, repository);
  const parts = relative && relative !== "."
    ? relative.split(path.sep)
    : [path.basename(repository)];
  return parts.map(normalizeProjectPart).filter(Boolean).join("--") || "project";
}

function normalizeProjectPart(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "");
}

function parseFileLocation(target, parsedUrl) {
  let rawPath = target;
  let line = null;
  let column = null;

  if (parsedUrl?.protocol === "file:") {
    const uri = vscode.Uri.parse(target, true);
    rawPath = uri.with({ query: "", fragment: "" }).fsPath;
    ({ line, column } = parseLineReference(uri.fragment));
  } else {
    const hashAt = rawPath.lastIndexOf("#");
    if (hashAt >= 0) {
      const fragment = rawPath.slice(hashAt + 1);
      rawPath = rawPath.slice(0, hashAt);
      ({ line, column } = parseLineReference(fragment));
    }
    try {
      rawPath = decodeURIComponent(rawPath);
    } catch {
      throw new BridgeError("파일 링크의 경로 인코딩이 올바르지 않습니다.");
    }
  }

  const suffix = rawPath.match(/:(\d+)(?::(\d+))?$/);
  if (suffix) {
    rawPath = rawPath.slice(0, suffix.index);
    line ??= Number(suffix[1]);
    column ??= suffix[2] ? Number(suffix[2]) : null;
  }
  if (!rawPath || rawPath.includes("\0")) {
    throw new BridgeError("파일 링크의 경로가 올바르지 않습니다.");
  }
  return { filePath: rawPath, line, column };
}

function parseLineReference(fragment) {
  const match = String(fragment || "").match(/^(?:L)?(\d+)(?:(?::|C)(\d+))?$/i);
  return match
    ? { line: Number(match[1]), column: match[2] ? Number(match[2]) : null }
    : { line: null, column: null };
}

function isPathInside(candidate, root) {
  const relative = path.relative(root, candidate);
  return relative === "" || (
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function processEnv() {
  return { ...process.env, PYTHONUNBUFFERED: "1" };
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function activate(context) {
  const provider = new VibexViewProvider(context);
  context.subscriptions.push(
    provider.output,
    { dispose: () => provider.dispose() },
    vscode.window.registerWebviewViewProvider(VIEW_TYPE, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
    vscode.commands.registerCommand("vibex.open", async () => {
      await vscode.commands.executeCommand(
        "workbench.view.extension.vibexSecondaryViewContainer",
      );
    }),
    vscode.commands.registerCommand("vibex.configure", async () => {
      await provider.configureWithPrompts();
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("vibex")) provider.sendConfiguration();
    }),
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
