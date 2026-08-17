"use strict";

const childProcess = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { promisify } = require("node:util");
const vscode = require("vscode");

const execFile = promisify(childProcess.execFile);

const LOCAL_BRIDGE_URL = "http://127.0.0.1:8787";
const API_PREFIX = "/api/v1";
const TAILSCALE_HOSTNAME = "vibex-pc";

class BridgeError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "BridgeError";
    this.status = status;
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

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

/**
 * Everything the extension knows about the local VIBEX bridge: the HTTP API,
 * the process that serves it, and the task event stream that tells the chat
 * session UI when something changed on the backend (including changes that the
 * iPad app made in the same conversation).
 */
class VibexBridge {
  constructor(context, output) {
    this.context = context;
    this.output = output;
    this.backendProcess = undefined;
    this.backendStarting = undefined;
    this.projectRoots = new Map();
    this._agentsCache = undefined;
    this.tailscale = { url: `http://${TAILSCALE_HOSTNAME}:8788`, ready: false, error: "" };

    this._onDidChangeTask = new vscode.EventEmitter();
    /** Fires with `{ taskId, projectId, status }` for every backend task transition. */
    this.onDidChangeTask = this._onDidChangeTask.event;

    this._socket = undefined;
    this._socketRetry = undefined;
    this._disposed = false;
  }

  dispose() {
    this._disposed = true;
    if (this._socketRetry) {
      clearTimeout(this._socketRetry);
      this._socketRetry = undefined;
    }
    try {
      this._socket?.close();
    } catch {
      // The socket is already gone; nothing to clean up.
    }
    this._socket = undefined;
    this._onDidChangeTask.dispose();
    if (this.backendProcess && this.backendProcess.exitCode === null) {
      this.log("[backend] VS Code 종료로 자동 실행 프로세스를 정리합니다.");
      this.backendProcess.kill("SIGTERM");
    }
  }

  log(message) {
    this.output.appendLine(message);
  }

  // #region HTTP

  async request(endpointPath, options = {}) {
    const endpoint = new URL(`${API_PREFIX}${endpointPath}`, `${LOCAL_BRIDGE_URL}/`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);
    try {
      const response = await fetch(endpoint, {
        method: options.method,
        headers: new Headers(options.headers || {}),
        body: options.body,
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

  async health() {
    return this.request("/health");
  }

  /**
   * The installed agent CLIs and the models/efforts each accepts. Both the
   * model picker and the composer's reasoning picker read this, so the result
   * is cached briefly to keep those two in sync without re-querying per render.
   */
  async agents({ refresh = false } = {}) {
    if (!refresh && this._agentsCache && Date.now() - this._agentsCache.at < 30_000) {
      return this._agentsCache.agents;
    }
    const response = await this.request("/agents");
    const agents = Array.isArray(response.agents) ? response.agents : [];
    this._agentsCache = { agents, at: Date.now() };
    return agents;
  }

  /** The last known agent list, without touching the network. */
  get cachedAgents() {
    return this._agentsCache?.agents ?? [];
  }

  async projects() {
    const response = await this.request("/projects");
    return Array.isArray(response.projects) ? response.projects : [];
  }

  async conversations(projectId) {
    const response = await this.request(
      `/projects/${encodeURIComponent(projectId)}/conversations`,
    );
    return Array.isArray(response.conversations) ? response.conversations : [];
  }

  async conversationDetail(projectId, conversationId) {
    return this.request(
      `/projects/${encodeURIComponent(projectId)}/conversations/${encodeURIComponent(conversationId)}`,
    );
  }

  async createConversation(projectId, title = "새 대화") {
    return this.request(`/projects/${encodeURIComponent(projectId)}/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  }

  async renameConversation(projectId, conversationId, title) {
    return this.request(
      `/projects/${encodeURIComponent(projectId)}/conversations/${encodeURIComponent(conversationId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      },
    );
  }

  async archiveConversation(projectId, conversationId) {
    return this.request(
      `/projects/${encodeURIComponent(projectId)}/conversations/${encodeURIComponent(conversationId)}/archive`,
      { method: "POST" },
    );
  }

  async getTask(taskId) {
    return this.request(`/tasks/${encodeURIComponent(taskId)}`);
  }

  async cancelTask(taskId) {
    return this.request(`/tasks/${encodeURIComponent(taskId)}/cancel`, {
      method: "POST",
      timeoutMs: 60_000,
    });
  }

  async undoTask(taskId) {
    return this.request(`/tasks/${encodeURIComponent(taskId)}/undo`, { method: "POST" });
  }

  async taskReview(taskId) {
    return this.request(`/tasks/${encodeURIComponent(taskId)}/review`);
  }

  async taskReviewFile(taskId, relativePath) {
    return this.request(
      `/tasks/${encodeURIComponent(taskId)}/review/file?path=${encodeURIComponent(relativePath)}`,
    );
  }

  /**
   * Starts a task in a VIBEX conversation. Text, local file references and
   * pasted images all travel in the same multipart body the iPad app uses, so
   * the two clients keep writing to one conversation history.
   */
  async createTask({
    projectId,
    conversationId,
    agentId,
    model,
    effort,
    speedMode,
    approvalMode,
    prompt,
    localImagePaths = [],
    inputReferences = [],
    uploadedImages = [],
  }) {
    if (!projectId || !String(prompt || "").trim()) {
      throw new BridgeError("프로젝트와 요청 내용을 입력해 주세요.");
    }

    const form = new FormData();
    form.set("projectId", projectId);
    form.set("mode", "text");
    form.set("typedNote", String(prompt).trim());
    form.set("origin", "vscode");
    form.set("clientTaskId", crypto.randomUUID());
    form.set("threadMode", "auto");
    if (conversationId) form.set("conversationId", conversationId);
    if (agentId) form.set("agentId", agentId);
    if (model) form.set("model", model);
    if (effort) form.set("effort", effort);
    if (speedMode) form.set("speedMode", speedMode);
    if (approvalMode) form.set("approvalMode", approvalMode);
    for (const imagePath of localImagePaths) {
      if (imagePath) form.append("localImagePath", String(imagePath));
    }
    for (const reference of inputReferences) {
      if (reference) form.append("inputReference", String(reference));
    }
    for (const image of uploadedImages) {
      form.append(
        "referenceImage",
        new Blob([image.data], { type: image.mimeType }),
        image.name,
      );
    }

    return this.request("/tasks", { method: "POST", body: form, timeoutMs: 60_000 });
  }

  // #endregion

  // #region Backend process

  async ensureBackend() {
    if (await this.isHealthy()) return;
    if (this.backendStarting) return this.backendStarting;
    this.backendStarting = this.startBackend();
    try {
      await this.backendStarting;
    } finally {
      this.backendStarting = undefined;
    }
  }

  async isHealthy() {
    try {
      const response = await fetch(`${LOCAL_BRIDGE_URL}${API_PREFIX}/health`, {
        signal: AbortSignal.timeout(1200),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  backendDirectory() {
    const configured = vscode.workspace
      .getConfiguration("vibex")
      .get("backendPath", "")
      .trim();
    const candidates = [];
    if (configured) candidates.push(configured);
    if (process.env.VIBEX_BACKEND_DIR) candidates.push(process.env.VIBEX_BACKEND_DIR);
    for (const folder of vscode.workspace.workspaceFolders || []) {
      if (folder.uri.scheme !== "file") continue;
      let current = folder.uri.fsPath;
      for (;;) {
        candidates.push(path.join(current, "backend"), current);
        const parent = path.dirname(current);
        if (parent === current) break;
        current = parent;
      }
    }
    return candidates.find(
      (candidate) =>
        fs.existsSync(path.join(candidate, "src", "main.py")) &&
        fs.existsSync(path.join(candidate, "src", "api", "tasks.py")) &&
        fs.existsSync(path.join(candidate, ".venv", "bin", "python")),
    );
  }

  async startBackend() {
    const backend = this.backendDirectory();
    if (!backend) {
      throw new BridgeError(
        "Vibex backend/.venv를 찾지 못했습니다. Vibex 저장소를 워크스페이스에 추가하거나 vibex.backendPath를 설정해 주세요.",
      );
    }
    const python = path.join(backend, ".venv", "bin", "python");
    this.log(`[backend] 자동 시작: ${backend}`);
    const child = childProcess.spawn(
      python,
      ["-m", "uvicorn", "src.main:app", "--host", "127.0.0.1", "--port", "8787"],
      {
        cwd: backend,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: "1",
          BRIDGE_PREVIEW_PUBLIC_HOST: TAILSCALE_HOSTNAME,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    this.backendProcess = child;
    for (const stream of [child.stdout, child.stderr]) {
      stream.on("data", (chunk) => this.output.append(chunk.toString()));
    }
    child.once("exit", (code) => {
      this.log(`[backend] 종료됨 (${code ?? "signal"})`);
      if (this.backendProcess === child) this.backendProcess = undefined;
    });

    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) {
        throw new BridgeError(`Vibex 백엔드가 시작 중 종료되었습니다(코드 ${child.exitCode}).`);
      }
      if (await this.isHealthy()) return;
      await delay(300);
    }
    child.kill("SIGTERM");
    throw new BridgeError("Vibex 백엔드가 60초 안에 준비되지 않았습니다.");
  }

  // #endregion

  // #region Task event stream

  /**
   * Keeps a websocket open to `/events` so the session list and any open
   * transcript react immediately to backend progress. Polling remains the
   * source of truth for content; this only shortens the latency.
   */
  connectEvents() {
    if (this._disposed || this._socket) return;
    const WebSocketImpl = globalThis.WebSocket;
    if (typeof WebSocketImpl !== "function") return;

    let socket;
    try {
      socket = new WebSocketImpl(`ws://127.0.0.1:8787${API_PREFIX}/events`);
    } catch (error) {
      this.log(`[events] 연결 실패: ${error?.message || error}`);
      this._scheduleReconnect();
      return;
    }
    this._socket = socket;

    socket.addEventListener("message", (event) => {
      let payload;
      try {
        payload = JSON.parse(String(event.data));
      } catch {
        return;
      }
      if (payload?.type === "task.status" && payload.taskId) {
        this._onDidChangeTask.fire({
          taskId: String(payload.taskId),
          projectId: payload.projectId ? String(payload.projectId) : undefined,
          status: payload.status ? String(payload.status) : undefined,
        });
      }
    });
    const drop = () => {
      if (this._socket === socket) this._socket = undefined;
      this._scheduleReconnect();
    };
    socket.addEventListener("close", drop);
    socket.addEventListener("error", drop);
  }

  _scheduleReconnect() {
    if (this._disposed || this._socketRetry || this._socket) return;
    this._socketRetry = setTimeout(() => {
      this._socketRetry = undefined;
      void this.isHealthy().then((healthy) => {
        if (healthy) this.connectEvents();
        else this._scheduleReconnect();
      });
    }, 3000);
  }

  // #endregion

  // #region Project paths

  /**
   * Resolves the absolute repository path of a registered project so file
   * attachments and review diffs can be validated locally before they are sent.
   */
  resolveProjectRoot(projectId) {
    const normalizedId = String(projectId || "").trim();
    if (!normalizedId) return null;
    const cached = this.projectRoots.get(normalizedId);
    if (cached && fs.existsSync(cached)) return cached;

    const backend = this.backendDirectory();
    if (!backend) return null;
    const envPath = path.join(backend, ".env");
    const projectsFile = expandLocalPath(
      process.env.BRIDGE_PROJECTS_FILE ||
        readEnvValue(envPath, "BRIDGE_PROJECTS_FILE") ||
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

  /**
   * Picks the registered project that owns the current workspace, so a new
   * chat session lands in the repository the user is actually looking at.
   */
  projectForWorkspace(projects) {
    const folders = (vscode.workspace.workspaceFolders || []).filter(
      (folder) => folder.uri.scheme === "file",
    );
    if (!folders.length) return undefined;

    const contained = [];
    for (const project of projects) {
      const root = this.resolveProjectRoot(project.projectId);
      if (!root) continue;
      for (const folder of folders) {
        // The open folder *is* the project, or lives inside it.
        if (samePath(root, folder.uri.fsPath) || isPathInside(folder.uri.fsPath, root)) {
          return project;
        }
        // The project sits below an open folder (monorepo-style layouts).
        if (isPathInside(root, folder.uri.fsPath)) contained.push(project);
      }
    }
    // Only fall back to containment when it points at a single project;
    // otherwise the choice would be arbitrary and could edit the wrong repo.
    return contained.length === 1 ? contained[0] : undefined;
  }

  /**
   * Splits VS Code chat attachments into what the bridge accepts: project
   * relative file references, project local image paths, and pasted image bytes.
   */
  async collectAttachments(projectId, references) {
    const root = this.resolveProjectRoot(projectId);
    const inputReferences = [];
    const localImagePaths = [];
    const uploadedImages = [];
    const skipped = [];

    for (const reference of references || []) {
      const value = reference?.value;
      if (!value) continue;

      const uri = vscode.Uri.isUri(value)
        ? value
        : vscode.Uri.isUri(value?.uri)
          ? value.uri
          : undefined;

      if (uri) {
        if (uri.scheme !== "file") {
          skipped.push(reference.name || uri.toString());
          continue;
        }
        let realPath;
        try {
          realPath = fs.realpathSync(uri.fsPath);
          if (!fs.statSync(realPath).isFile()) throw new Error("not a file");
        } catch {
          skipped.push(reference.name || path.basename(uri.fsPath));
          continue;
        }
        if (!root || !isPathInside(realPath, fs.realpathSync(root))) {
          skipped.push(path.basename(realPath));
          continue;
        }
        if (IMAGE_EXTENSIONS.has(path.extname(realPath).toLowerCase())) {
          localImagePaths.push(realPath);
        } else {
          inputReferences.push(path.relative(fs.realpathSync(root), realPath));
        }
        continue;
      }

      // Pasted or dragged image data has no file on disk; upload the bytes.
      if (typeof value?.data === "function" && typeof value?.mimeType === "string") {
        try {
          const data = await value.data();
          uploadedImages.push({
            data,
            mimeType: value.mimeType,
            name: reference.name || "pasted-image",
          });
        } catch {
          skipped.push(reference.name || "이미지");
        }
      }
    }

    return {
      inputReferences: dedupe(inputReferences).slice(0, 20),
      localImagePaths: dedupe(localImagePaths),
      uploadedImages,
      skipped,
    };
  }

  // #endregion

  // #region Tailscale

  tailscaleBinary() {
    const configured = vscode.workspace
      .getConfiguration("vibex")
      .get("tailscaleBinary", "")
      .trim();
    const candidates = [
      configured,
      ...String(process.env.PATH || "")
        .split(path.delimiter)
        .map((dir) => path.join(dir, "tailscale")),
      "/usr/local/bin/tailscale",
      "/opt/homebrew/bin/tailscale",
      "/Applications/Tailscale.app/Contents/MacOS/Tailscale",
    ].filter(Boolean);
    return candidates.find((candidate) => fs.existsSync(candidate));
  }

  async configureTailscale() {
    const servePort = vscode.workspace
      .getConfiguration("vibex")
      .get("tailscaleServePort", 8788);
    const url = `http://${TAILSCALE_HOSTNAME}:${servePort}`;
    try {
      const binary = this.tailscaleBinary();
      if (!binary) {
        throw new BridgeError(
          "Tailscale CLI를 찾지 못했습니다. Tailscale을 설치하고 로그인한 뒤 다시 시도해 주세요.",
        );
      }
      const tailscaleEnv = { ...process.env, TAILSCALE_BE_CLI: "1" };
      const { stdout } = await execFile(binary, ["status", "--json"], {
        timeout: 10_000,
        env: tailscaleEnv,
      });
      const status = JSON.parse(stdout);
      const dnsName = String(status?.Self?.DNSName || "").replace(/\.$/, "");
      if (!dnsName || status?.BackendState !== "Running") {
        throw new BridgeError("이 Mac에서 Tailscale에 먼저 로그인해 주세요.");
      }
      if (dnsName.split(".")[0] !== TAILSCALE_HOSTNAME) {
        await execFile(binary, ["set", `--hostname=${TAILSCALE_HOSTNAME}`], {
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
      this.tailscale = { url, ready: false, error: error?.message || String(error) };
    }
    return this.tailscale;
  }

  // #endregion
}

function dedupe(values) {
  return [...new Set(values)];
}

function samePath(left, right) {
  try {
    return fs.realpathSync(left) === fs.realpathSync(right);
  } catch {
    return path.resolve(left) === path.resolve(right);
  }
}

function isPathInside(candidate, root) {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}

function expandLocalPath(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (raw === "~") return os.homedir();
  if (raw.startsWith(`~${path.sep}`)) return path.join(os.homedir(), raw.slice(2));
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
      ) {
        return value.slice(1, -1);
      }
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
      if (
        candidateId === projectId ||
        normalizeProjectPart(path.basename(current)) === basenameId
      ) {
        try {
          return fs.realpathSync(current);
        } catch {
          return null;
        }
      }
      continue;
    }
    const directories = entries
      .filter(
        (entry) =>
          entry.isDirectory() &&
          !entry.isSymbolicLink() &&
          !entry.name.startsWith(".") &&
          !PROJECT_DISCOVERY_IGNORES.has(entry.name),
      )
      .map((entry) => path.join(current, entry.name))
      .sort()
      .reverse();
    stack.push(...directories);
  }
  return null;
}

function projectIdForPath(root, repository) {
  const relative = path.relative(root, repository);
  const parts =
    relative && relative !== "." ? relative.split(path.sep) : [path.basename(repository)];
  return parts.map(normalizeProjectPart).filter(Boolean).join("--") || "project";
}

function normalizeProjectPart(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-|-$/g, "");
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

module.exports = {
  VibexBridge,
  BridgeError,
  LOCAL_BRIDGE_URL,
  TAILSCALE_HOSTNAME,
  isPathInside,
  delay,
};
