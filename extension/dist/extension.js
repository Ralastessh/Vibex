"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// src/bridge.js
var require_bridge = __commonJS({
  "src/bridge.js"(exports2, module2) {
    "use strict";
    var childProcess = require("node:child_process");
    var crypto = require("node:crypto");
    var fs = require("node:fs");
    var os = require("node:os");
    var path = require("node:path");
    var { promisify } = require("node:util");
    var vscode2 = require("vscode");
    var execFile = promisify(childProcess.execFile);
    var LOCAL_BRIDGE_URL = "http://127.0.0.1:8787";
    var API_PREFIX = "/api/v1";
    var BridgeError = class extends Error {
      constructor(message, status = 0) {
        super(message);
        this.name = "BridgeError";
        this.status = status;
      }
    };
    var PROJECT_DISCOVERY_IGNORES = /* @__PURE__ */ new Set([
      ".git",
      ".next",
      ".venv",
      "__pycache__",
      "build",
      "dist",
      "node_modules",
      "venv"
    ]);
    var IMAGE_EXTENSIONS = /* @__PURE__ */ new Set([".png", ".jpg", ".jpeg", ".webp"]);
    var VibexBridge2 = class {
      constructor(context, output) {
        this.context = context;
        this.output = output;
        this.backendProcess = void 0;
        this.backendStarting = void 0;
        this.projectRoots = /* @__PURE__ */ new Map();
        this._agentsCache = void 0;
        this.tailscale = { url: "", ready: false, error: "" };
        this._onDidChangeTask = new vscode2.EventEmitter();
        this.onDidChangeTask = this._onDidChangeTask.event;
        this._socket = void 0;
        this._socketRetry = void 0;
        this._disposed = false;
      }
      dispose() {
        this._disposed = true;
        if (this._socketRetry) {
          clearTimeout(this._socketRetry);
          this._socketRetry = void 0;
        }
        try {
          this._socket?.close();
        } catch {
        }
        this._socket = void 0;
        this._onDidChangeTask.dispose();
        if (this.backendProcess && this.backendProcess.exitCode === null) {
          this.log("[backend] VS Code \uC885\uB8CC\uB85C \uC790\uB3D9 \uC2E4\uD589 \uD504\uB85C\uC138\uC2A4\uB97C \uC815\uB9AC\uD569\uB2C8\uB2E4.");
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
        const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 2e4);
        try {
          const response = await fetch(endpoint, {
            method: options.method,
            headers: new Headers(options.headers || {}),
            body: options.body,
            signal: controller.signal
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
            const detail = body && typeof body === "object" ? body.detail : body || response.statusText;
            throw new BridgeError(String(detail), response.status);
          }
          return body || {};
        } catch (error) {
          if (error.name === "AbortError") {
            throw new BridgeError("Vibex Bridge \uC751\uB2F5 \uC2DC\uAC04\uC774 \uCD08\uACFC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
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
        if (!refresh && this._agentsCache && Date.now() - this._agentsCache.at < 3e4) {
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
          `/projects/${encodeURIComponent(projectId)}/conversations`
        );
        return Array.isArray(response.conversations) ? response.conversations : [];
      }
      async conversationDetail(projectId, conversationId) {
        return this.request(
          `/projects/${encodeURIComponent(projectId)}/conversations/${encodeURIComponent(conversationId)}`
        );
      }
      async createConversation(projectId, title = "\uC0C8 \uB300\uD654") {
        return this.request(`/projects/${encodeURIComponent(projectId)}/conversations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title })
        });
      }
      async renameConversation(projectId, conversationId, title) {
        return this.request(
          `/projects/${encodeURIComponent(projectId)}/conversations/${encodeURIComponent(conversationId)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title })
          }
        );
      }
      async archiveConversation(projectId, conversationId) {
        return this.request(
          `/projects/${encodeURIComponent(projectId)}/conversations/${encodeURIComponent(conversationId)}/archive`,
          { method: "POST" }
        );
      }
      async getTask(taskId) {
        return this.request(`/tasks/${encodeURIComponent(taskId)}`);
      }
      async attachmentData(attachment) {
        const relative = String(attachment?.url || "");
        if (!relative) return null;
        const endpoint = new URL(relative, `${LOCAL_BRIDGE_URL}/`);
        const response = await fetch(endpoint, { signal: AbortSignal.timeout(2e4) });
        if (!response.ok) return null;
        const contentType = response.headers.get("content-type") || attachment?.contentType || "image/png";
        const bytes = Buffer.from(await response.arrayBuffer());
        return `data:${contentType};base64,${bytes.toString("base64")}`;
      }
      async cancelTask(taskId) {
        return this.request(`/tasks/${encodeURIComponent(taskId)}/cancel`, {
          method: "POST",
          timeoutMs: 6e4
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
          `/tasks/${encodeURIComponent(taskId)}/review/file?path=${encodeURIComponent(relativePath)}`
        );
      }
      /**
       * Starts a task in a Vibex conversation. Text, local file references and
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
        uploadedImages = []
      }) {
        if (!projectId || !String(prompt || "").trim()) {
          throw new BridgeError("\uD504\uB85C\uC81D\uD2B8\uC640 \uC694\uCCAD \uB0B4\uC6A9\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
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
            image.name
          );
        }
        return this.request("/tasks", { method: "POST", body: form, timeoutMs: 6e4 });
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
          this.backendStarting = void 0;
        }
      }
      async isHealthy() {
        try {
          const response = await fetch(`${LOCAL_BRIDGE_URL}${API_PREFIX}/health`, {
            signal: AbortSignal.timeout(1200)
          });
          return response.ok;
        } catch {
          return false;
        }
      }
      backendDirectory() {
        const configured = vscode2.workspace.getConfiguration("vibex").get("backendPath", "").trim();
        const candidates = [];
        if (configured) candidates.push(configured);
        if (process.env.VIBEX_BACKEND_DIR) candidates.push(process.env.VIBEX_BACKEND_DIR);
        for (const folder of vscode2.workspace.workspaceFolders || []) {
          if (folder.uri.scheme !== "file") continue;
          let current = folder.uri.fsPath;
          for (; ; ) {
            candidates.push(path.join(current, "backend"), current);
            const parent = path.dirname(current);
            if (parent === current) break;
            current = parent;
          }
        }
        return candidates.find(
          (candidate) => fs.existsSync(path.join(candidate, "src", "main.py")) && fs.existsSync(path.join(candidate, "src", "api", "tasks.py")) && fs.existsSync(path.join(candidate, ".venv", "bin", "python"))
        );
      }
      async startBackend() {
        const backend = this.backendDirectory();
        if (!backend) {
          throw new BridgeError(
            "Vibex backend/.venv\uB97C \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. Vibex \uC800\uC7A5\uC18C\uB97C \uC6CC\uD06C\uC2A4\uD398\uC774\uC2A4\uC5D0 \uCD94\uAC00\uD558\uAC70\uB098 vibex.backendPath\uB97C \uC124\uC815\uD574 \uC8FC\uC138\uC694."
          );
        }
        const python = path.join(backend, ".venv", "bin", "python");
        this.log(`[backend] \uC790\uB3D9 \uC2DC\uC791: ${backend}`);
        const child = childProcess.spawn(
          python,
          // --no-proxy-headers: Tailscale Serve가 붙이는 X-Forwarded-For를 uvicorn이
          // 신뢰해 request.client를 원격 IP로 덮어쓰면, loopback 전제로 동작하는
          // verify_device가 Serve 경유 요청을 전부 401로 막는다.
          [
            "-m",
            "uvicorn",
            "src.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            "8787",
            "--no-proxy-headers"
          ],
          {
            cwd: backend,
            env: {
              ...process.env,
              PYTHONUNBUFFERED: "1"
            },
            stdio: ["ignore", "pipe", "pipe"]
          }
        );
        this.backendProcess = child;
        for (const stream of [child.stdout, child.stderr]) {
          stream.on("data", (chunk) => this.output.append(chunk.toString()));
        }
        child.once("exit", (code) => {
          this.log(`[backend] \uC885\uB8CC\uB428 (${code ?? "signal"})`);
          if (this.backendProcess === child) this.backendProcess = void 0;
        });
        const deadline = Date.now() + 6e4;
        while (Date.now() < deadline) {
          if (child.exitCode !== null) {
            throw new BridgeError(`Vibex \uBC31\uC5D4\uB4DC\uAC00 \uC2DC\uC791 \uC911 \uC885\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4(\uCF54\uB4DC ${child.exitCode}).`);
          }
          if (await this.isHealthy()) return;
          await delay(300);
        }
        child.kill("SIGTERM");
        throw new BridgeError("Vibex \uBC31\uC5D4\uB4DC\uAC00 60\uCD08 \uC548\uC5D0 \uC900\uBE44\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
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
          this.log(`[events] \uC5F0\uACB0 \uC2E4\uD328: ${error?.message || error}`);
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
              projectId: payload.projectId ? String(payload.projectId) : void 0,
              status: payload.status ? String(payload.status) : void 0
            });
          }
        });
        const drop = () => {
          if (this._socket === socket) this._socket = void 0;
          this._scheduleReconnect();
        };
        socket.addEventListener("close", drop);
        socket.addEventListener("error", drop);
      }
      _scheduleReconnect() {
        if (this._disposed || this._socketRetry || this._socket) return;
        this._socketRetry = setTimeout(() => {
          this._socketRetry = void 0;
          void this.isHealthy().then((healthy) => {
            if (healthy) this.connectEvents();
            else this._scheduleReconnect();
          });
        }, 3e3);
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
          process.env.BRIDGE_PROJECTS_FILE || readEnvValue(envPath, "BRIDGE_PROJECTS_FILE") || path.join(backend, "projects.local.json")
        );
        const configured = configuredProjectRoot(projectsFile, normalizedId);
        if (configured) {
          this.projectRoots.set(normalizedId, configured);
          return configured;
        }
        const workspaceRoot = expandLocalPath(
          process.env.BRIDGE_WORKSPACE_ROOT || readEnvValue(envPath, "BRIDGE_WORKSPACE_ROOT")
        );
        const discovered = discoverProjectRoot(workspaceRoot, normalizedId);
        if (discovered) {
          this.projectRoots.set(normalizedId, discovered);
          return discovered;
        }
        for (const folder of vscode2.workspace.workspaceFolders || []) {
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
        const folders = (vscode2.workspace.workspaceFolders || []).filter(
          (folder) => folder.uri.scheme === "file"
        );
        if (!folders.length) return void 0;
        const contained = [];
        for (const project of projects) {
          const root = this.resolveProjectRoot(project.projectId);
          if (!root) continue;
          for (const folder of folders) {
            if (samePath(root, folder.uri.fsPath) || isPathInside(folder.uri.fsPath, root)) {
              return project;
            }
            if (isPathInside(root, folder.uri.fsPath)) contained.push(project);
          }
        }
        return contained.length === 1 ? contained[0] : void 0;
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
          const uri = vscode2.Uri.isUri(value) ? value : vscode2.Uri.isUri(value?.uri) ? value.uri : void 0;
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
          if (typeof value?.data === "function" && typeof value?.mimeType === "string") {
            try {
              const data = await value.data();
              uploadedImages.push({
                data,
                mimeType: value.mimeType,
                name: reference.name || "pasted-image"
              });
            } catch {
              skipped.push(reference.name || "\uC774\uBBF8\uC9C0");
            }
          }
        }
        return {
          inputReferences: dedupe(inputReferences).slice(0, 20),
          localImagePaths: dedupe(localImagePaths),
          uploadedImages,
          skipped
        };
      }
      // #endregion
      // #region Tailscale
      tailscaleBinary() {
        const configured = vscode2.workspace.getConfiguration("vibex").get("tailscaleBinary", "").trim();
        const candidates = [
          configured,
          ...String(process.env.PATH || "").split(path.delimiter).map((dir) => path.join(dir, "tailscale")),
          "/usr/local/bin/tailscale",
          "/opt/homebrew/bin/tailscale",
          "/Applications/Tailscale.app/Contents/MacOS/Tailscale"
        ].filter(Boolean);
        return candidates.find((candidate) => fs.existsSync(candidate));
      }
      async configureTailscale() {
        const servePort = vscode2.workspace.getConfiguration("vibex").get("tailscaleServePort", 8787);
        let url = "";
        try {
          const binary = this.tailscaleBinary();
          if (!binary) {
            throw new BridgeError(
              "Tailscale CLI\uB97C \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. Tailscale\uC744 \uC124\uCE58\uD558\uACE0 \uB85C\uADF8\uC778\uD55C \uB4A4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694."
            );
          }
          const tailscaleEnv = { ...process.env, TAILSCALE_BE_CLI: "1" };
          const { stdout } = await execFile(binary, ["status", "--json"], {
            timeout: 1e4,
            env: tailscaleEnv
          });
          const status = JSON.parse(stdout);
          const dnsName = String(status?.Self?.DNSName || "").replace(/\.$/, "");
          if (!dnsName || status?.BackendState !== "Running") {
            throw new BridgeError("\uC774 Mac\uC5D0\uC11C Tailscale\uC5D0 \uBA3C\uC800 \uB85C\uADF8\uC778\uD574 \uC8FC\uC138\uC694.");
          }
          url = `http://${dnsName}:${servePort}`;
          await execFile(
            binary,
            ["serve", "--bg", "--yes", `--http=${servePort}`, "127.0.0.1:8787"],
            { timeout: 3e4, env: tailscaleEnv }
          );
          this.tailscale = { url, ready: true, error: "" };
        } catch (error) {
          this.tailscale = { url, ready: false, error: error?.message || String(error) };
        }
        return this.tailscale;
      }
      // #endregion
    };
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
      return relative === "" || relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
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
          if (value.length >= 2 && (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'"))) {
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
          (project) => project.projectId === projectId && project.repoPath
        );
        if (!configured) return null;
        const candidate = path.isAbsolute(configured.repoPath) ? configured.repoPath : path.resolve(path.dirname(projectsFile), configured.repoPath);
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
      while (stack.length && visited < 1e4) {
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
        const directories = entries.filter(
          (entry) => entry.isDirectory() && !entry.isSymbolicLink() && !entry.name.startsWith(".") && !PROJECT_DISCOVERY_IGNORES.has(entry.name)
        ).map((entry) => path.join(current, entry.name)).sort().reverse();
        stack.push(...directories);
      }
      return null;
    }
    function projectIdForPath(root, repository) {
      const relative = path.relative(root, repository);
      const parts = relative && relative !== "." ? relative.split(path.sep) : [path.basename(repository)];
      return parts.map(normalizeProjectPart).filter(Boolean).join("--") || "project";
    }
    function normalizeProjectPart(value) {
      return String(value).toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "");
    }
    function delay(milliseconds) {
      return new Promise((resolve) => setTimeout(resolve, milliseconds));
    }
    module2.exports = {
      VibexBridge: VibexBridge2,
      BridgeError,
      LOCAL_BRIDGE_URL,
      isPathInside,
      delay
    };
  }
});

// src/models.js
var require_models = __commonJS({
  "src/models.js"(exports2, module2) {
    "use strict";
    var vscode2 = require("vscode");
    var VENDOR2 = "vibex";
    var SESSION_TYPE = "vibex";
    var SEPARATOR = "::";
    var VibexModelProvider2 = class {
      constructor(bridge, output) {
        this.bridge = bridge;
        this.output = output;
        this._onDidChange = new vscode2.EventEmitter();
        this.onDidChangeLanguageModelChatInformation = this._onDidChange.event;
      }
      dispose() {
        this._onDidChange.dispose();
      }
      refresh() {
        this._onDidChange.fire();
      }
      async provideLanguageModelChatInformation(options, _token) {
        let agents;
        try {
          if (!options?.silent) {
            await this.bridge.ensureBackend();
          } else if (!await this.bridge.isHealthy()) {
            return [];
          }
          agents = await this.bridge.agents({ refresh: !options?.silent });
        } catch (error) {
          this.output.appendLine(`[models] \uC5D0\uC774\uC804\uD2B8 \uBAA9\uB85D\uC744 \uC77D\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4: ${error?.message || error}`);
          return [];
        }
        const information = [];
        let categoryOrder = 1;
        let isFirst = true;
        for (const agent of agents) {
          if (!agent.usable) continue;
          const category = { label: agent.displayName, order: categoryOrder++ };
          const models = agent.models?.length ? agent.models : [{ value: "", label: agent.displayName }];
          for (const model of models) {
            information.push({
              id: buildModelId(agent.agentId, model.value),
              name: model.label,
              family: agent.agentId,
              version: "1",
              maxInputTokens: 2e5,
              maxOutputTokens: 64e3,
              isUserSelectable: true,
              isDefault: isFirst,
              category,
              capabilities: { imageInput: true, toolCalling: false },
              targetChatSessionType: SESSION_TYPE
            });
            isFirst = false;
          }
        }
        return information;
      }
      async provideLanguageModelChatResponse() {
      }
      async provideTokenCount() {
        return 0;
      }
    };
    function buildModelId(agentId, modelValue) {
      return `${agentId}${SEPARATOR}${modelValue || ""}`;
    }
    function parseModelId(modelId) {
      const raw = String(modelId || "");
      const index = raw.indexOf(SEPARATOR);
      if (index < 0) return { agentId: raw, model: "" };
      return { agentId: raw.slice(0, index), model: raw.slice(index + SEPARATOR.length) };
    }
    module2.exports = { VibexModelProvider: VibexModelProvider2, VENDOR: VENDOR2, buildModelId, parseModelId };
  }
});

// src/sessionUri.js
var require_sessionUri = __commonJS({
  "src/sessionUri.js"(exports2, module2) {
    "use strict";
    var vscode2 = require("vscode");
    var SCHEME2 = "vibex";
    function forConversation(projectId, conversationId) {
      const project = String(projectId || "").trim();
      const conversation = String(conversationId || "").trim();
      if (!project || !conversation) {
        throw new Error("Vibex \uB300\uD654 \uC8FC\uC18C\uC5D0\uB294 projectId\uC640 conversationId\uAC00 \uBAA8\uB450 \uD544\uC694\uD569\uB2C8\uB2E4.");
      }
      return vscode2.Uri.from({ scheme: SCHEME2, path: `/${project}/${conversation}` });
    }
    function parse(resource) {
      if (!resource || resource.scheme !== SCHEME2) {
        throw new Error(`Vibex \uB300\uD654 \uC8FC\uC18C\uAC00 \uC544\uB2D9\uB2C8\uB2E4: ${resource?.toString?.() ?? resource}`);
      }
      const [, projectId, conversationId] = resource.path.split("/");
      if (!projectId || !conversationId) {
        throw new Error(`Vibex \uB300\uD654 \uC8FC\uC18C\uB97C \uD574\uC11D\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4: ${resource.toString()}`);
      }
      return { projectId, conversationId };
    }
    function tryParse(resource) {
      try {
        return parse(resource);
      } catch {
        return void 0;
      }
    }
    function isConversation(resource) {
      return tryParse(resource) !== void 0;
    }
    module2.exports = { SCHEME: SCHEME2, forConversation, parse, tryParse, isConversation };
  }
});

// src/activity.js
var require_activity = __commonJS({
  "src/activity.js"(exports2, module2) {
    "use strict";
    var vscode2 = require("vscode");
    var STATUS_MESSAGES = {
      queued: "\uB300\uAE30 \uC911\uC785\uB2C8\uB2E4.",
      interpreting: "\uC694\uCCAD\uC744 \uD574\uC11D\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4.",
      awaiting_confirmation: "\uD655\uC778\uC744 \uAE30\uB2E4\uB9AC\uACE0 \uC788\uC2B5\uB2C8\uB2E4.",
      resolving_session: "\uD504\uB85C\uC81D\uD2B8 \uC138\uC158\uC744 \uCC3E\uACE0 \uC788\uC2B5\uB2C8\uB2E4.",
      running_agent: "\uC694\uCCAD\uC744 \uCC98\uB9AC\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4.",
      testing: "\uD14C\uC2A4\uD2B8\uB97C \uC2E4\uD589\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4.",
      completed: "\uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
      failed: "\uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.",
      cancelled: "\uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
    var ACTIVE_STATUSES = /* @__PURE__ */ new Set([
      "queued",
      "interpreting",
      "awaiting_confirmation",
      "resolving_session",
      "running_agent",
      "testing"
    ]);
    var ACTIVITY_LABELS = {
      reasoning: "\uC791\uC5C5 \uBC29\uD5A5\uC744 \uAC80\uD1A0\uD588\uC2B5\uB2C8\uB2E4",
      plan: "\uC791\uC5C5 \uACC4\uD68D\uC744 \uAC31\uC2E0\uD588\uC2B5\uB2C8\uB2E4",
      command: "\uBA85\uB839\uC744 \uC2E4\uD589\uD588\uC2B5\uB2C8\uB2E4",
      commandExecution: "\uBA85\uB839\uC744 \uC2E4\uD589\uD588\uC2B5\uB2C8\uB2E4",
      fileChange: "\uD30C\uC77C\uC744 \uC218\uC815\uD588\uC2B5\uB2C8\uB2E4",
      mcpToolCall: "\uB3C4\uAD6C\uB97C \uC0AC\uC6A9\uD588\uC2B5\uB2C8\uB2E4",
      dynamicToolCall: "\uB3C4\uAD6C\uB97C \uC0AC\uC6A9\uD588\uC2B5\uB2C8\uB2E4",
      collabToolCall: "\uB3C4\uAD6C\uB97C \uC0AC\uC6A9\uD588\uC2B5\uB2C8\uB2E4",
      webSearch: "\uC6F9\uC744 \uAC80\uC0C9\uD588\uC2B5\uB2C8\uB2E4",
      imageView: "\uC774\uBBF8\uC9C0\uB97C \uD655\uC778\uD588\uC2B5\uB2C8\uB2E4",
      enteredReviewMode: "\uB9AC\uBDF0 \uBAA8\uB4DC\uC5D0 \uB4E4\uC5B4\uAC14\uC2B5\uB2C8\uB2E4",
      exitedReviewMode: "\uB9AC\uBDF0 \uBAA8\uB4DC\uB97C \uB9C8\uCCE4\uC2B5\uB2C8\uB2E4"
    };
    function isActive(task) {
      return ACTIVE_STATUSES.has(String(task?.status || ""));
    }
    var AGENT_DISPLAY_NAMES = {
      "claude-code": "Claude Code",
      "codex-cli": "Codex",
      "gemini-cli": "Gemini"
    };
    function formatTokens(count) {
      const value = Number(count) || 0;
      if (value >= 1e3) return `${(value / 1e3).toFixed(value >= 1e4 ? 0 : 1)}k`;
      return String(value);
    }
    function metaLineFor(task) {
      const parts = [];
      const agent = AGENT_DISPLAY_NAMES[String(task?.agentId || "")] || task?.agentId;
      if (agent) {
        const model = String(task?.agentModel || "").trim();
        parts.push(model ? `${agent} \xB7 ${model}` : String(agent));
      }
      const usage = task?.usage;
      if (usage && (usage.inputTokens || usage.outputTokens || usage.totalTokens)) {
        const total = usage.totalTokens || (usage.inputTokens || 0) + (usage.outputTokens || 0);
        parts.push(`${formatTokens(usage.inputTokens)}\u2191 ${formatTokens(usage.outputTokens)}\u2193 (\uCD1D ${formatTokens(total)} \uD1A0\uD070)`);
      }
      if (usage?.costUsd != null) {
        parts.push(`$${Number(usage.costUsd).toFixed(4)}`);
      }
      if (!parts.length) return void 0;
      const markdown = new vscode2.MarkdownString(`<sub>${parts.join(" \xB7 ")}</sub>`);
      markdown.supportHtml = true;
      return markdown;
    }
    function statusMessage(status) {
      return STATUS_MESSAGES[String(status || "")] || "\uC791\uC5C5\uC744 \uC9C4\uD589\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4.";
    }
    function activityItems(task) {
      return Array.isArray(task?.activityItems) ? task.activityItems : [];
    }
    function itemKind(item) {
      return String(item?.type || "item");
    }
    function itemLabel(item) {
      return ACTIVITY_LABELS[itemKind(item)] || "\uC791\uC5C5\uC744 \uC9C4\uD589\uD588\uC2B5\uB2C8\uB2E4";
    }
    function commandText(data) {
      const command = data?.command;
      if (Array.isArray(command)) return command.join(" ");
      return command ? String(command) : "";
    }
    function isItemComplete(item) {
      const status = String(item?.status || "");
      return status !== "" && status !== "inProgress";
    }
    function toolInvocationFor(item) {
      const kind = itemKind(item);
      const data = item?.data || {};
      const invocation = new vscode2.ChatToolInvocationPart(kind, String(item.itemId));
      invocation.enablePartialUpdate = true;
      invocation.isConfirmed = true;
      invocation.isComplete = isItemComplete(item);
      invocation.isError = String(item?.status || "") === "failed";
      if (kind === "commandExecution" || kind === "command") {
        const command = commandText(data) || String(item.text || "");
        invocation.invocationMessage = "";
        invocation.toolSpecificData = {
          commandLine: { original: command },
          language: "bash",
          output: item.output ? { text: String(item.output).replace(/\n/g, "\r\n") } : void 0,
          state: typeof data.exitCode === "number" ? { exitCode: data.exitCode } : void 0
        };
        return invocation;
      }
      if (kind === "fileChange") {
        const changes = Array.isArray(data.changes) ? data.changes : [];
        const paths = changes.map((change) => change?.path).filter(Boolean);
        invocation.invocationMessage = paths.length ? new vscode2.MarkdownString(
          paths.length === 1 ? `\`${paths[0]}\` \uD30C\uC77C\uC744 \uC218\uC815\uD588\uC2B5\uB2C8\uB2E4` : `${paths.length}\uAC1C \uD30C\uC77C\uC744 \uC218\uC815\uD588\uC2B5\uB2C8\uB2E4`
        ) : itemLabel(item);
        if (paths.length > 1) {
          invocation.toolSpecificData = { input: "", output: paths.join("\n") };
        }
        return invocation;
      }
      const title = String(item.text || data.tool || data.name || "").trim() || itemLabel(item);
      invocation.invocationMessage = new vscode2.MarkdownString(title);
      const output = String(item.output || "").trim();
      if (output && output !== title) {
        invocation.toolSpecificData = { input: "", output };
      }
      return invocation;
    }
    var TaskRenderer = class {
      constructor(stream, { projectRoot } = {}) {
        this.stream = stream;
        this.projectRoot = projectRoot;
        this.emittedReplyLength = 0;
        this.emittedThinking = /* @__PURE__ */ new Map();
        this.emittedSignatures = /* @__PURE__ */ new Map();
        this.emittedStatus = void 0;
        this.emittedUsage = false;
        this.emittedFooter = false;
      }
      apply(task) {
        this._renderStatus(task);
        this._renderActivity(task);
        this._renderReply(task);
        if (!isActive(task)) {
          this._renderFooter(task);
        }
      }
      _renderStatus(task) {
        const status = String(task?.status || "");
        if (!status || status === this.emittedStatus || !isActive(task)) return;
        this.emittedStatus = status;
        this.stream.progress(statusMessage(status));
      }
      _renderActivity(task) {
        for (const item of activityItems(task)) {
          const id = String(item?.itemId || "");
          if (!id) continue;
          if (itemKind(item) === "reasoning") {
            const text = String(item.text || "");
            const already = this.emittedThinking.get(id) ?? 0;
            if (text.length > already) {
              this.stream.thinkingProgress({ id, text: text.slice(already) });
              this.emittedThinking.set(id, text.length);
            }
            continue;
          }
          const signature = JSON.stringify([item.status, item.text, item.output, item.data]);
          if (this.emittedSignatures.get(id) === signature) continue;
          this.emittedSignatures.set(id, signature);
          this.stream.push(toolInvocationFor(item));
        }
      }
      _renderReply(task) {
        const reply = String(task?.agentReply || "");
        if (reply.length <= this.emittedReplyLength) return;
        this.stream.markdown(new vscode2.MarkdownString(reply.slice(this.emittedReplyLength)));
        this.emittedReplyLength = reply.length;
      }
      _renderFooter(task) {
        if (this.emittedFooter) return;
        this.emittedFooter = true;
        for (const warning of task?.warnings || []) {
          this.stream.warning(new vscode2.MarkdownString(String(warning)));
        }
        for (const test of task?.testResults || []) {
          const icon = test.status === "passed" ? "$(check)" : test.status === "failed" ? "$(error)" : "$(circle-slash)";
          const line = new vscode2.MarkdownString(
            `${icon} \`${test.command}\`${test.summary ? ` \u2014 ${test.summary}` : ""}`
          );
          line.supportThemeIcons = true;
          this.stream.markdown(line);
        }
        for (const file of task?.changedFiles || []) {
          const absolute = this.projectRoot && file?.path ? vscode2.Uri.joinPath(vscode2.Uri.file(this.projectRoot), file.path) : void 0;
          if (absolute) this.stream.reference2(absolute);
        }
        if (task?.reviewAvailable) {
          this.stream.button({
            command: "vibex.openReview",
            title: "\uBCC0\uACBD \uC0AC\uD56D \uAC80\uD1A0",
            arguments: [task.taskId]
          });
        }
        if (task?.usage && !this.emittedUsage) {
          this.emittedUsage = true;
          this.stream.usage({
            promptTokens: Number(task.usage.inputTokens || 0),
            completionTokens: Number(task.usage.outputTokens || 0)
          });
        }
        if (task?.error) {
          this.stream.warning(new vscode2.MarkdownString(String(task.error)));
        }
        const metaLine = metaLineFor(task);
        if (metaLine) this.stream.markdown(metaLine);
      }
    };
    function historyPartsForTask(task, { projectRoot } = {}) {
      const parts = [];
      for (const item of activityItems(task)) {
        if (itemKind(item) === "reasoning") {
          const text = String(item.text || "").trim();
          if (text) parts.push(new vscode2.ChatResponseThinkingProgressPart(text, String(item.itemId)));
          continue;
        }
        parts.push(toolInvocationFor(item));
      }
      const reply = String(task?.agentReply || "").trim();
      if (reply) parts.push(new vscode2.ChatResponseMarkdownPart(new vscode2.MarkdownString(reply)));
      for (const test of task?.testResults || []) {
        const icon = test.status === "passed" ? "$(check)" : test.status === "failed" ? "$(error)" : "$(circle-slash)";
        const line = new vscode2.MarkdownString(
          `${icon} \`${test.command}\`${test.summary ? ` \u2014 ${test.summary}` : ""}`
        );
        line.supportThemeIcons = true;
        parts.push(new vscode2.ChatResponseMarkdownPart(line));
      }
      for (const file of task?.changedFiles || []) {
        if (!projectRoot || !file?.path) continue;
        parts.push(
          new vscode2.ChatResponseReferencePart(
            vscode2.Uri.joinPath(vscode2.Uri.file(projectRoot), file.path)
          )
        );
      }
      if (task?.reviewAvailable) {
        parts.push(
          new vscode2.ChatResponseCommandButtonPart({
            command: "vibex.openReview",
            title: "\uBCC0\uACBD \uC0AC\uD56D \uAC80\uD1A0",
            arguments: [task.taskId]
          })
        );
      }
      const error = String(task?.error || "").trim();
      if (error) {
        parts.push(new vscode2.ChatResponseWarningPart(new vscode2.MarkdownString(error)));
      }
      const metaLine = metaLineFor(task);
      if (metaLine) parts.push(new vscode2.ChatResponseMarkdownPart(metaLine));
      return parts;
    }
    module2.exports = {
      ACTIVE_STATUSES,
      TaskRenderer,
      historyPartsForTask,
      isActive,
      statusMessage
    };
  }
});

// src/history.js
var require_history = __commonJS({
  "src/history.js"(exports2, module2) {
    "use strict";
    var vscode2 = require("vscode");
    var { SCHEME: SCHEME2 } = require_sessionUri();
    var { buildModelId } = require_models();
    var { historyPartsForTask, isActive } = require_activity();
    function buildChatHistory(tasks, { projectRoot, followLastTask } = {}) {
      const turns = [];
      const ordered = Array.isArray(tasks) ? tasks : [];
      for (const [index, task] of ordered.entries()) {
        const isLast = index === ordered.length - 1;
        if (isLast && followLastTask && isActive(task)) {
          turns.push(requestTurnFor(task, task.userMessage, `${task.taskId}`, projectRoot));
          continue;
        }
        turns.push(requestTurnFor(task, task.userMessage, `${task.taskId}`, projectRoot));
        for (const [turnIndex, clarification] of (task.clarificationTurns || []).entries()) {
          const reply = String(clarification?.assistantReply || clarification?.question?.text || "").trim();
          if (reply) {
            turns.push(
              new vscode2.ChatResponseTurn2(
                [new vscode2.ChatResponseMarkdownPart(new vscode2.MarkdownString(reply))],
                {},
                SCHEME2
              )
            );
          }
          const answer = String(clarification?.answer || "").trim();
          if (answer) {
            turns.push(
              requestTurnFor(task, answer, `${task.taskId}-answer-${turnIndex}`, projectRoot)
            );
          }
        }
        const parts = historyPartsForTask(task, { projectRoot });
        if (parts.length) {
          turns.push(new vscode2.ChatResponseTurn2(parts, {}, SCHEME2));
        }
      }
      return turns;
    }
    function requestTurnFor(task, prompt, id, projectRoot) {
      return new vscode2.ChatRequestTurn2(
        String(prompt || ""),
        void 0,
        referencesFor(task, projectRoot),
        SCHEME2,
        [],
        void 0,
        id,
        task?.agentId ? buildModelId(task.agentId, task.agentModel || "") : void 0,
        void 0
      );
    }
    function referencesFor(task, projectRoot) {
      if (!projectRoot) return [];
      const references = [];
      for (const reference of task?.inputReferences || []) {
        if (!reference?.relativePath) continue;
        references.push({
          id: reference.relativePath,
          name: reference.name || reference.relativePath,
          value: vscode2.Uri.joinPath(vscode2.Uri.file(projectRoot), reference.relativePath)
        });
      }
      return references;
    }
    module2.exports = { buildChatHistory };
  }
});

// src/sessions.js
var require_sessions = __commonJS({
  "src/sessions.js"(exports2, module2) {
    "use strict";
    var fs = require("node:fs");
    var path = require("node:path");
    var vscode2 = require("vscode");
    var { isPathInside } = require_bridge();
    var { SCHEME: SCHEME2, forConversation, tryParse } = require_sessionUri();
    var { parseModelId } = require_models();
    var { TaskRenderer, isActive } = require_activity();
    var { buildChatHistory } = require_history();
    var PROJECT_OPTION = "project";
    var EFFORT_OPTION = "effort";
    var APPROVAL_OPTION = "approvalMode";
    var DEFAULT_SENTINEL = "__default__";
    var ICON = new vscode2.ThemeIcon("sparkle");
    var APPROVAL_ITEMS = [
      { id: "default", name: "\uAE30\uBCF8 \uC2B9\uC778" },
      { id: "bypass", name: "\uC2B9\uC778 \uC5C6\uC774 \uC9C4\uD589" },
      { id: "autopilot", name: "\uC624\uD1A0\uD30C\uC77C\uB7FF" }
    ];
    var VibexChatSessions2 = class {
      constructor(context, bridge, output) {
        this.context = context;
        this.bridge = bridge;
        this.output = output;
        this.disposables = [];
        this._sessionOptions = /* @__PURE__ */ new Map();
        this._defaultOptions = { effort: DEFAULT_SENTINEL, approvalMode: "default" };
        this._liveSessions = /* @__PURE__ */ new Map();
        this._projects = [];
        this._onDidChangeChatSessionOptions = new vscode2.EventEmitter();
        this.onDidChangeChatSessionOptions = this._onDidChangeChatSessionOptions.event;
        this._onDidChangeChatSessionProviderOptions = new vscode2.EventEmitter();
        this.onDidChangeChatSessionProviderOptions = this._onDidChangeChatSessionProviderOptions.event;
        this.controller = vscode2.chat.createChatSessionItemController(
          SCHEME2,
          (token) => this._refreshItems(token)
        );
        this.controller.newChatSessionItemHandler = (handlerContext, token) => this._createSessionItem(handlerContext, token);
        this.disposables.push(
          this.controller,
          this._onDidChangeChatSessionOptions,
          this._onDidChangeChatSessionProviderOptions,
          this.bridge.onDidChangeTask(() => this._scheduleRefresh()),
          vscode2.workspace.onDidChangeWorkspaceFolders(
            () => this._onDidChangeChatSessionProviderOptions.fire()
          )
        );
      }
      dispose() {
        if (this._refreshTimer) clearTimeout(this._refreshTimer);
        this._refreshTimer = void 0;
        for (const disposable of this.disposables.reverse()) disposable.dispose();
        this.disposables = [];
      }
      // #region Session list
      _scheduleRefresh() {
        if (this._refreshTimer) return;
        this._refreshTimer = setTimeout(() => {
          this._refreshTimer = void 0;
          void this._refreshItems();
        }, 400);
      }
      async _refreshItems(_token) {
        let items = [];
        try {
          await this.bridge.ensureBackend();
          this._projects = await this.bridge.projects();
          const showProjectBadge = this._projects.length > 1;
          for (const project of this._projects) {
            if (project.status === "unavailable") continue;
            let conversations;
            try {
              conversations = await this.bridge.conversations(project.projectId);
            } catch (error) {
              this._log(`\uB300\uD654 \uBAA9\uB85D\uC744 \uC77D\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4(${project.projectId}): ${message(error)}`);
              continue;
            }
            const activeConversationId = await this._activeConversationId(project);
            for (const conversation of conversations) {
              items.push(
                this._createItem(project, conversation, {
                  showProjectBadge,
                  active: conversation.conversationId === activeConversationId
                })
              );
            }
          }
        } catch (error) {
          this._log(`\uC138\uC158 \uBAA9\uB85D\uC744 \uC0C8\uB85C \uACE0\uCE58\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4: ${message(error)}`);
          items = [];
        }
        const byKey = new Map(items.map((item) => [item.resource.toString(), item]));
        for (const [key, live] of this._liveSessions) {
          const existing = byKey.get(key);
          if (existing) {
            existing.status = vscode2.ChatSessionStatus.InProgress;
            continue;
          }
          const item = this.controller.createChatSessionItem(live.resource, live.label);
          item.iconPath = ICON;
          item.status = vscode2.ChatSessionStatus.InProgress;
          item.timing = { created: live.created, lastRequestStarted: live.started };
          items.push(item);
        }
        this.controller.items.replace(items);
      }
      async _activeConversationId(project) {
        if (!project.activeTaskId) return void 0;
        try {
          const task = await this.bridge.getTask(project.activeTaskId);
          return task?.conversationId || void 0;
        } catch {
          return void 0;
        }
      }
      _createItem(project, conversation, { showProjectBadge, active } = {}) {
        const resource = forConversation(project.projectId, conversation.conversationId);
        const item = this.controller.createChatSessionItem(resource, conversation.title || "\uC0C8 \uB300\uD654");
        item.iconPath = ICON;
        item.tooltip = `Vibex \xB7 ${project.displayName}`;
        item.timing = {
          created: toEpoch(conversation.createdAt),
          lastRequestEnded: active ? void 0 : toEpoch(conversation.updatedAt),
          lastRequestStarted: active ? toEpoch(conversation.updatedAt) : void 0
        };
        if (showProjectBadge) {
          const badge = new vscode2.MarkdownString(`$(folder) ${project.displayName}`);
          badge.supportThemeIcons = true;
          item.badge = badge;
        }
        item.status = active ? vscode2.ChatSessionStatus.InProgress : vscode2.ChatSessionStatus.Completed;
        item.metadata = { projectId: project.projectId, projectName: project.displayName };
        return item;
      }
      async _createSessionItem(handlerContext, _token) {
        await this.bridge.ensureBackend();
        const projects = await this.bridge.projects();
        this._projects = projects;
        const requested = optionValue(handlerContext?.sessionOptions, PROJECT_OPTION);
        const project = projects.find((candidate) => candidate.projectId === requested) || this.bridge.projectForWorkspace(projects) || projects.find((candidate) => candidate.status !== "unavailable");
        if (!project) {
          throw new Error(
            "\uC0AC\uC6A9\uD560 \uC218 \uC788\uB294 Vibex \uD504\uB85C\uC81D\uD2B8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uBC31\uC5D4\uB4DC\uC5D0 Git \uD504\uB85C\uC81D\uD2B8\uB97C \uBA3C\uC800 \uB4F1\uB85D\uD574 \uC8FC\uC138\uC694."
          );
        }
        const title = titleFromPrompt(handlerContext?.request?.prompt);
        const conversation = await this.bridge.createConversation(project.projectId, title);
        const item = this._createItem(project, conversation, {
          showProjectBadge: projects.length > 1
        });
        item.timing = { created: Date.now() };
        const resourceKey = item.resource.toString();
        this._sessionOptions.set(resourceKey, {
          effort: optionValue(handlerContext?.sessionOptions, EFFORT_OPTION) ?? this._defaultOptions.effort,
          approvalMode: optionValue(handlerContext?.sessionOptions, APPROVAL_OPTION) ?? this._defaultOptions.approvalMode
        });
        this._liveSessions.set(resourceKey, {
          resource: item.resource,
          label: item.label,
          created: item.timing.created,
          started: item.timing.created
        });
        return item;
      }
      // #endregion
      // #region Composer options
      async provideChatSessionProviderOptions() {
        const optionGroups = [];
        let projects = this._projects;
        try {
          await this.bridge.ensureBackend();
          projects = await this.bridge.projects();
          this._projects = projects;
          await this.bridge.agents();
        } catch (error) {
          this._log(`\uD504\uB85C\uC81D\uD2B8 \uBAA9\uB85D\uC744 \uC77D\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4: ${message(error)}`);
        }
        const selectable = projects.filter((project) => project.status !== "unavailable");
        if (selectable.length > 1) {
          optionGroups.push({
            id: PROJECT_OPTION,
            name: "\uD504\uB85C\uC81D\uD2B8",
            description: "\uC791\uC5C5\uD560 Vibex \uD504\uB85C\uC81D\uD2B8",
            icon: new vscode2.ThemeIcon("folder"),
            items: selectable.map((project) => ({
              id: project.projectId,
              name: project.displayName,
              icon: new vscode2.ThemeIcon("folder")
            }))
          });
        }
        const efforts = this._effortItems();
        if (efforts.length > 1) {
          optionGroups.push({
            id: EFFORT_OPTION,
            name: "\uCD94\uB860 \uAC15\uB3C4",
            description: "\uC120\uD0DD\uD55C \uC5D0\uC774\uC804\uD2B8\uAC00 \uC9C0\uC6D0\uD558\uB294 \uCD94\uB860 \uAC15\uB3C4",
            items: efforts
          });
        }
        optionGroups.push({
          id: APPROVAL_OPTION,
          name: "\uC2B9\uC778 \uBAA8\uB4DC",
          description: "\uC5D0\uC774\uC804\uD2B8\uAC00 \uD30C\uC77C\uC744 \uBC14\uAFB8\uAE30 \uC804\uC5D0 \uBB3C\uC5B4\uBCFC\uC9C0 \uACB0\uC815\uD569\uB2C8\uB2E4",
          items: APPROVAL_ITEMS
        });
        const newSessionOptions = {
          [EFFORT_OPTION]: this._defaultOptions.effort,
          [APPROVAL_OPTION]: this._defaultOptions.approvalMode
        };
        const workspaceProject = this.bridge.projectForWorkspace(selectable) || selectable[0];
        if (selectable.length > 1 && workspaceProject) {
          newSessionOptions[PROJECT_OPTION] = workspaceProject.projectId;
        }
        return { optionGroups, newSessionOptions };
      }
      /**
       * The union of the reasoning levels the installed agents accept. A level that
       * the agent chosen for a given turn does not support is dropped before the
       * request is sent, so switching agents mid-conversation never fails here.
       */
      _effortItems() {
        const items = /* @__PURE__ */ new Map([[DEFAULT_SENTINEL, { id: DEFAULT_SENTINEL, name: "\uAE30\uBCF8 \uCD94\uB860" }]]);
        for (const agent of this.bridge.cachedAgents) {
          if (!agent.usable) continue;
          for (const effort of agent.efforts || []) {
            if (!effort.value) continue;
            if (!items.has(effort.value)) {
              items.set(effort.value, { id: effort.value, name: effort.label });
            }
          }
        }
        return [...items.values()];
      }
      provideHandleOptionsChange(resource, updates) {
        const key = resource.toString();
        const current = this._sessionOptions.get(key) || { ...this._defaultOptions };
        let changed = false;
        for (const update of updates) {
          const value = typeof update.value === "string" ? update.value : update.value?.id;
          if (update.optionId === EFFORT_OPTION && value) {
            current.effort = value;
            this._defaultOptions.effort = value;
            changed = true;
          } else if (update.optionId === APPROVAL_OPTION && value) {
            current.approvalMode = value;
            this._defaultOptions.approvalMode = value;
            changed = true;
          }
        }
        if (changed) {
          this._sessionOptions.set(key, current);
          this._onDidChangeChatSessionProviderOptions.fire();
        }
      }
      _optionsFor(resource) {
        return this._sessionOptions.get(resource.toString()) || { ...this._defaultOptions };
      }
      // #endregion
      // #region Session content
      async provideChatSessionContent(resource, token) {
        const parsed = tryParse(resource);
        if (!parsed) {
          return this._emptySession(resource);
        }
        const { projectId, conversationId } = parsed;
        await this.bridge.ensureBackend();
        if (!this._projects.length) {
          this._projects = await this.bridge.projects().catch(() => []);
        }
        const detail = await this.bridge.conversationDetail(projectId, conversationId);
        const tasks = Array.isArray(detail.tasks) ? detail.tasks : [];
        const projectRoot = this.bridge.resolveProjectRoot(projectId);
        const lastTask = tasks[tasks.length - 1];
        const followLastTask = Boolean(lastTask && isActive(lastTask));
        const options = this._optionsFor(resource);
        const sessionOptions = {
          [EFFORT_OPTION]: options.effort,
          [APPROVAL_OPTION]: options.approvalMode
        };
        const project = this._projects.find((candidate) => candidate.projectId === projectId);
        if (project) {
          sessionOptions[PROJECT_OPTION] = {
            id: project.projectId,
            name: project.displayName,
            icon: new vscode2.ThemeIcon("folder"),
            locked: true
          };
        }
        return {
          title: detail.conversation?.title,
          history: buildChatHistory(tasks, { projectRoot, followLastTask }),
          options: sessionOptions,
          requestHandler: void 0,
          activeResponseCallback: followLastTask ? async (stream, cancellation) => {
            await this._followTask(lastTask.taskId, stream, cancellation, projectRoot, resource);
          } : void 0
        };
      }
      /** The session shown in a blank Vibex chat editor. */
      _emptySession(resource) {
        const options = this._optionsFor(resource);
        return {
          history: [],
          options: {
            [EFFORT_OPTION]: options.effort,
            [APPROVAL_OPTION]: options.approvalMode
          },
          requestHandler: void 0,
          activeResponseCallback: void 0
        };
      }
      // #endregion
      // #region Requests
      createHandler() {
        return async (request, context, stream, token) => {
          const chatSessionContext = context.chatSessionContext;
          if (!chatSessionContext) {
            stream.markdown(new vscode2.MarkdownString("Vibex \uC138\uC158\uC5D0\uC11C \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."));
            stream.button({
              command: `workbench.action.chat.openNewSessionEditor.${SCHEME2}`,
              title: "Vibex \uC138\uC158 \uC2DC\uC791"
            });
            return {};
          }
          const resource = chatSessionContext.chatSessionItem.resource;
          const parsed = tryParse(resource);
          if (!parsed) {
            return { errorDetails: { message: "Vibex \uB300\uD654\uB97C \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4." } };
          }
          const { projectId, conversationId } = parsed;
          try {
            await this.bridge.ensureBackend();
            const projectRoot = this.bridge.resolveProjectRoot(projectId);
            const { agentId, model } = parseModelId(request.model?.id);
            const agent = (await this.bridge.agents()).find(
              (candidate) => candidate.agentId === agentId
            );
            const options = this._optionsFor(resource);
            const attachments = await this.bridge.collectAttachments(projectId, request.references);
            if (attachments.skipped.length) {
              stream.warning(
                new vscode2.MarkdownString(
                  `\uD504\uB85C\uC81D\uD2B8 \uBC16\uC758 \uCCA8\uBD80\uB294 \uBCF4\uB0B4\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4: ${attachments.skipped.join(", ")}`
                )
              );
            }
            const mentions = resolveMentions(projectRoot, request.prompt);
            const inputReferences = dedupe([
              ...attachments.inputReferences,
              ...mentions.inputReferences
            ]).slice(0, 20);
            const localImagePaths = dedupe([
              ...attachments.localImagePaths,
              ...mentions.localImagePaths
            ]).slice(0, 8);
            for (const referenced of mentions.resolved) {
              stream.reference2(vscode2.Uri.file(referenced));
            }
            this._markInProgress(resource, request.prompt);
            const created = await this.bridge.createTask({
              projectId,
              conversationId,
              agentId,
              model,
              effort: this._effortFor(agent, options.effort),
              approvalMode: options.approvalMode === "default" ? void 0 : options.approvalMode,
              prompt: request.prompt,
              localImagePaths,
              inputReferences,
              uploadedImages: attachments.uploadedImages
            });
            const task = await this._followTask(created.taskId, stream, token, projectRoot, resource);
            if (task?.status === "failed") {
              return { errorDetails: { message: String(task.error || "\uC791\uC5C5\uC774 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.") } };
            }
            return {};
          } catch (error) {
            this._markCompleted(resource);
            this._log(`\uC694\uCCAD\uC744 \uCC98\uB9AC\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4: ${message(error)}`);
            return { errorDetails: { message: message(error) } };
          }
        };
      }
      /** Drops a reasoning level the selected agent does not accept. */
      _effortFor(agent, effort) {
        if (!effort || effort === DEFAULT_SENTINEL) return void 0;
        const allowed = (agent?.efforts || []).some((option) => option.value === effort);
        return allowed ? effort : void 0;
      }
      /**
       * Mirrors one backend task into the chat response until it reaches a terminal
       * status. The bridge publishes coarse `task.status` events, so each event (or
       * a short timeout) triggers a snapshot read and only the new content is
       * pushed to the stream.
       */
      async _followTask(taskId, stream, token, projectRoot, resource) {
        const renderer = new TaskRenderer(stream, { projectRoot });
        let cancelRequested = false;
        let consecutiveFailures = 0;
        let task;
        for (; ; ) {
          try {
            task = await this.bridge.getTask(taskId);
            consecutiveFailures = 0;
          } catch (error) {
            this._log(`\uC791\uC5C5 \uC0C1\uD0DC\uB97C \uC77D\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4(${taskId}): ${message(error)}`);
            if ((consecutiveFailures += 1) >= 5) {
              stream.warning(
                new vscode2.MarkdownString(
                  "Vibex \uBC31\uC5D4\uB4DC\uC5D0\uC11C \uC791\uC5C5 \uC0C1\uD0DC\uB97C \uB354 \uC774\uC0C1 \uC77D\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uB85C\uADF8\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694."
                )
              );
              break;
            }
            await this._waitForTaskChange(taskId, 1e3);
            continue;
          }
          renderer.apply(task);
          if (!isActive(task)) break;
          if (token?.isCancellationRequested && !cancelRequested) {
            cancelRequested = true;
            stream.progress("\uC791\uC5C5\uC744 \uCDE8\uC18C\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4.");
            this.bridge.cancelTask(taskId).catch((error) => {
              this._log(`\uC791\uC5C5\uC744 \uCDE8\uC18C\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4(${taskId}): ${message(error)}`);
            });
          }
          await this._waitForTaskChange(taskId, 700);
        }
        if (resource) {
          this._markCompleted(resource, task);
        }
        return task;
      }
      _waitForTaskChange(taskId, timeoutMs) {
        return new Promise((resolve) => {
          const timer = setTimeout(finish, timeoutMs);
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
      _markInProgress(resource, prompt) {
        const now = Date.now();
        let item = this.controller.items.get(resource);
        if (!item) {
          item = this.controller.createChatSessionItem(resource, titleFromPrompt(prompt));
          item.iconPath = ICON;
          item.timing = { created: now };
          this.controller.items.add(item);
        }
        item.status = vscode2.ChatSessionStatus.InProgress;
        item.timing = { ...item.timing || { created: now }, lastRequestStarted: now, lastRequestEnded: void 0 };
        this._liveSessions.set(resource.toString(), {
          resource,
          label: item.label,
          created: item.timing.created,
          started: now
        });
      }
      _markCompleted(resource, task) {
        const item = this.controller.items.get(resource);
        if (item) {
          item.status = task?.status === "failed" ? vscode2.ChatSessionStatus.Failed : vscode2.ChatSessionStatus.Completed;
          item.timing = { ...item.timing || { created: Date.now() }, lastRequestEnded: Date.now() };
        }
        this._liveSessions.delete(resource.toString());
        this._scheduleRefresh();
      }
      // #endregion
      // #region Session commands
      async renameSession(sessionItem) {
        const parsed = tryParse(sessionItem?.resource);
        if (!parsed) return;
        const title = await vscode2.window.showInputBox({
          title: "Vibex \uB300\uD654 \uC774\uB984 \uBCC0\uACBD",
          value: sessionItem.label,
          prompt: "VS Code\uC640 iPad\uC5D0 \uD568\uAED8 \uD45C\uC2DC\uD560 \uB300\uD654 \uC774\uB984\uC785\uB2C8\uB2E4.",
          validateInput: (value) => {
            const trimmed = value.trim();
            if (!trimmed) return "\uB300\uD654 \uC774\uB984\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.";
            if (trimmed.length > 160) return "\uB300\uD654 \uC774\uB984\uC740 160\uC790 \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4.";
            return void 0;
          },
          ignoreFocusOut: true
        });
        if (!title) return;
        await this.bridge.renameConversation(parsed.projectId, parsed.conversationId, title.trim());
        const item = this.controller.items.get(sessionItem.resource);
        if (item) item.label = title.trim();
        this._scheduleRefresh();
      }
      async archiveSession(sessionItem) {
        const parsed = tryParse(sessionItem?.resource);
        if (!parsed) return;
        const choice = await vscode2.window.showWarningMessage(
          "\uC774 Vibex \uB300\uD654\uB97C \uBCF4\uAD00\uD560\uAE4C\uC694? iPad \uBAA9\uB85D\uC5D0\uC11C\uB3C4 \uC0AC\uB77C\uC9D1\uB2C8\uB2E4.",
          { modal: true },
          "\uBCF4\uAD00"
        );
        if (choice !== "\uBCF4\uAD00") return;
        await this.bridge.archiveConversation(parsed.projectId, parsed.conversationId);
        this.controller.items.delete(sessionItem.resource);
        this._liveSessions.delete(sessionItem.resource.toString());
        this._scheduleRefresh();
      }
      // #endregion
      _log(text) {
        this.output.appendLine(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${text}`);
      }
    };
    var MENTION_PATTERN = /(^|[\s([{'"`])@([\w가-힣][\w가-힣./\-]*)/g;
    var IMAGE_EXTENSIONS = /* @__PURE__ */ new Set([".png", ".jpg", ".jpeg", ".webp"]);
    function resolveMentions(projectRoot, prompt) {
      const inputReferences = [];
      const localImagePaths = [];
      const resolved = [];
      if (!projectRoot) return { inputReferences, localImagePaths, resolved };
      let realRoot;
      try {
        realRoot = fs.realpathSync(projectRoot);
      } catch {
        return { inputReferences, localImagePaths, resolved };
      }
      for (const match of String(prompt || "").matchAll(MENTION_PATTERN)) {
        const mention = match[2].replace(/[.,!?:;]+$/, "");
        if (!mention) continue;
        let realPath;
        try {
          realPath = fs.realpathSync(path.join(realRoot, mention));
          if (!fs.statSync(realPath).isFile()) continue;
        } catch {
          continue;
        }
        if (!isPathInside(realPath, realRoot)) continue;
        if (IMAGE_EXTENSIONS.has(path.extname(realPath).toLowerCase())) {
          localImagePaths.push(realPath);
        } else {
          inputReferences.push(path.relative(realRoot, realPath));
        }
        resolved.push(realPath);
      }
      return { inputReferences, localImagePaths, resolved };
    }
    function dedupe(values) {
      return [...new Set(values)];
    }
    function optionValue(sessionOptions, optionId) {
      const found = (sessionOptions || []).find((option) => option.optionId === optionId);
      if (!found) return void 0;
      return typeof found.value === "string" ? found.value : found.value?.id;
    }
    function titleFromPrompt(prompt) {
      const text = String(prompt || "").trim().replace(/\s+/g, " ");
      if (!text) return "\uC0C8 \uB300\uD654";
      return text.length > 60 ? `${text.slice(0, 60)}\u2026` : text;
    }
    function toEpoch(value) {
      const parsed = Date.parse(String(value || ""));
      return Number.isNaN(parsed) ? Date.now() : parsed;
    }
    function message(error) {
      return error instanceof Error ? error.message : String(error);
    }
    module2.exports = {
      VibexChatSessions: VibexChatSessions2,
      PROJECT_OPTION,
      EFFORT_OPTION,
      APPROVAL_OPTION,
      resolveMentions
    };
  }
});

// src/review.js
var require_review = __commonJS({
  "src/review.js"(exports2, module2) {
    "use strict";
    var crypto = require("node:crypto");
    var path = require("node:path");
    var vscode2 = require("vscode");
    var { BridgeError } = require_bridge();
    var REVIEW_DOCUMENT_SCHEME = "vibex-review";
    var ReviewDocumentProvider = class {
      constructor() {
        this.documents = /* @__PURE__ */ new Map();
      }
      provideTextDocumentContent(uri) {
        return this.documents.get(uri.toString()) || "";
      }
      add(content, relativePath, side) {
        const fileName = path.basename(relativePath || "file") || "file";
        const uri = vscode2.Uri.from({
          scheme: REVIEW_DOCUMENT_SCHEME,
          authority: side,
          path: `/${crypto.randomUUID()}/${fileName}`
        });
        this.documents.set(uri.toString(), String(content ?? ""));
        while (this.documents.size > 200) {
          this.documents.delete(this.documents.keys().next().value);
        }
        return uri;
      }
      dispose() {
        this.documents.clear();
      }
    };
    var ReviewService2 = class {
      constructor(bridge) {
        this.bridge = bridge;
        this.documents = new ReviewDocumentProvider();
        this.registration = vscode2.workspace.registerTextDocumentContentProvider(
          REVIEW_DOCUMENT_SCHEME,
          this.documents
        );
      }
      dispose() {
        this.registration.dispose();
        this.documents.dispose();
      }
      async openReview(taskId) {
        const review = await this.bridge.taskReview(taskId);
        const files = Array.isArray(review.files) ? review.files : [];
        if (!files.length) {
          await this.openRawReview(review);
          return;
        }
        let selected = files[0];
        if (files.length > 1) {
          const picked = await vscode2.window.showQuickPick(
            files.map((file) => ({
              label: file.path,
              description: `+${file.additions || 0} -${file.deletions || 0}`,
              file
            })),
            {
              title: "\uB9AC\uBDF0\uD560 \uD30C\uC77C \uC120\uD0DD",
              placeHolder: `${files.length}\uAC1C \uBCC0\uACBD \uD30C\uC77C`,
              matchOnDescription: true
            }
          );
          if (!picked) return;
          selected = picked.file;
        }
        await this.openFileDiffWithFallback(taskId, selected.path, review);
      }
      async openRawReview(review) {
        const document = await vscode2.workspace.openTextDocument({
          language: "diff",
          content: String(review.patch || "")
        });
        await vscode2.window.showTextDocument(document, { preview: true });
      }
      async openFileDiffWithFallback(taskId, relativePath, review) {
        try {
          const fileReview = await this.bridge.taskReviewFile(taskId, relativePath);
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
          throw new BridgeError("\uD30C\uC77C \uB9AC\uBDF0 \uC751\uB2F5\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
        }
        const relativePath = String(fileReview.path || expectedPath || "");
        if (!relativePath || fileReview.path && relativePath !== expectedPath) {
          throw new BridgeError("\uD30C\uC77C \uB9AC\uBDF0 \uC751\uB2F5\uC758 \uACBD\uB85C\uAC00 \uC694\uCCAD\uACFC \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
        }
        const validBefore = fileReview.beforeExists === false ? fileReview.before == null || typeof fileReview.before === "string" : typeof fileReview.before === "string";
        const validAfter = fileReview.afterExists === false ? fileReview.after == null || typeof fileReview.after === "string" : typeof fileReview.after === "string";
        if (!validBefore || !validAfter) {
          throw new BridgeError("\uD30C\uC77C \uB9AC\uBDF0 \uC751\uB2F5\uC5D0 \uBCC0\uACBD \uC804\xB7\uD6C4 \uB0B4\uC6A9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.");
        }
        const beforeExists = fileReview.beforeExists !== false;
        const afterExists = fileReview.afterExists !== false;
        const beforeUri = this.documents.add(fileReview.before ?? "", relativePath, "before");
        const afterUri = this.documents.add(fileReview.after ?? "", relativePath, "after");
        await vscode2.commands.executeCommand(
          "vscode.diff",
          beforeUri,
          afterUri,
          `${relativePath} (${beforeExists ? "\uBCC0\uACBD \uC804" : "\uC0C8 \uD30C\uC77C"} \u2194 ${afterExists ? "\uBCC0\uACBD \uD6C4" : "\uC0AD\uC81C\uB428"})`,
          { preview: true }
        );
      }
    };
    module2.exports = { ReviewService: ReviewService2, REVIEW_DOCUMENT_SCHEME };
  }
});

// src/panel.js
var require_panel = __commonJS({
  "src/panel.js"(exports2, module2) {
    "use strict";
    var crypto = require("node:crypto");
    var vscode2 = require("vscode");
    var { parseModelId } = require_models();
    var VIEW_TYPE = "vibex.panel";
    var ACTIVE_STATUSES = /* @__PURE__ */ new Set([
      "queued",
      "interpreting",
      "awaiting_confirmation",
      "resolving_session",
      "running_agent",
      "testing"
    ]);
    var OPTIONS_KEY = "vibex.panel.options";
    var VibexPanel2 = class {
      constructor(context, bridge, review, output) {
        this.context = context;
        this.bridge = bridge;
        this.review = review;
        this.output = output;
        this.view = void 0;
        this.selectedProjectId = null;
        this.selectedConversationId = null;
        this.tasks = [];
        this.options = { ...context.globalState.get(OPTIONS_KEY) || {} };
        this.refreshGeneration = 0;
        this._following = /* @__PURE__ */ new Set();
        this.disposables = [
          vscode2.window.registerWebviewViewProvider(VIEW_TYPE, this, {
            webviewOptions: { retainContextWhenHidden: true }
          }),
          bridge.onDidChangeTask((event) => this._onTaskEvent(event))
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
          localResourceRoots: [vscode2.Uri.joinPath(this.context.extensionUri, "media")]
        };
        webviewView.webview.html = this._html(webviewView.webview);
        webviewView.webview.onDidReceiveMessage((message) => {
          this._onMessage(message).catch((error) => {
            this._log(`webview \uBA54\uC2DC\uC9C0 \uCC98\uB9AC \uC2E4\uD328(${message?.type}): ${describe2(error)}`);
            this._postState({ connectionError: describe2(error) });
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
              await vscode2.env.openExternal(vscode2.Uri.parse(href, true));
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
              files: this._findMentionCandidates(projectId, message.query)
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
        const active = [...this.tasks || []].reverse().find((task) => ACTIVE_STATUSES.has(task.status));
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
        const ignored = /* @__PURE__ */ new Set([
          ".git",
          ".next",
          ".venv",
          "__pycache__",
          "build",
          "dist",
          "node_modules",
          "venv"
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
        const picked = await vscode2.window.showOpenDialog({
          canSelectFiles: true,
          canSelectMany: false,
          defaultUri: vscode2.Uri.file(root),
          openLabel: "Vibex\uC5D0 \uCCA8\uBD80"
        });
        const file = picked?.[0];
        if (!file) return;
        const path = require("node:path");
        const relative = path.relative(root, file.fsPath);
        if (relative.startsWith("..")) {
          vscode2.window.showWarningMessage("\uC120\uD0DD\uD55C \uD504\uB85C\uC81D\uD2B8 \uBC16\uC758 \uD30C\uC77C\uC740 \uCC38\uC870\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
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
        const projects = await this.bridge.projects();
        const availableProjects = projects.filter((project) => project.status !== "unavailable");
        const groups = await Promise.all(
          availableProjects.map(async (project) => ({
            project,
            conversations: await this.bridge.conversations(project.projectId).catch((error) => {
              this._log(`\uB300\uD654 \uBAA9\uB85D\uC744 \uC77D\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4(${project.projectId}): ${describe2(error)}`);
              return [];
            })
          }))
        );
        const entries = groups.flatMap(({ project, conversations }) =>
          conversations.map((conversation) => ({
            label: conversation.title || "\uC0C8 \uB300\uD654",
            description: project.displayName,
            detail: new Date(conversation.updatedAt).toLocaleString("ko-KR"),
            picked: project.projectId === this.selectedProjectId && conversation.conversationId === this.selectedConversationId,
            projectId: project.projectId,
            conversationId: conversation.conversationId,
            updatedAt: conversation.updatedAt
          }))
        ).sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
        if (!entries.length) {
          vscode2.window.showInformationMessage("Vibex \uB300\uD654\uAC00 \uC544\uC9C1 \uC5C6\uC2B5\uB2C8\uB2E4.");
          return;
        }
        const picked = await vscode2.window.showQuickPick(
          entries,
          { title: "Vibex \uB300\uD654", placeHolder: "\uBAA8\uB4E0 \uD504\uB85C\uC81D\uD2B8\uC758 \uB300\uD654\uC5D0\uC11C \uC120\uD0DD\uD558\uC138\uC694", matchOnDescription: true, matchOnDetail: true }
        );
        if (!picked) return;
        this.selectedProjectId = picked.projectId;
        this.selectedConversationId = picked.conversationId;
        await this.refresh();
      }
      async _send(message) {
        await this.bridge.ensureBackend();
        const projectId = await this._projectId();
        if (!this.selectedConversationId) {
          const conversation = await this.bridge.createConversation(
            projectId,
            titleFromPrompt(message.text)
          );
          this.selectedConversationId = conversation.conversationId;
        }
        const { agentId, model } = parseModelId(message.modelId);
        const agent = (await this.bridge.agents()).find(
          (candidate) => candidate.agentId === agentId
        );
        const effort = message.effort && (agent?.efforts || []).some((option) => option.value === message.effort) ? message.effort : void 0;
        const projectRoot = this.bridge.resolveProjectRoot(projectId);
        const { resolveMentions } = require_sessions();
        const mentions = resolveMentions(projectRoot, message.text);
        const created = await this.bridge.createTask({
          projectId,
          conversationId: this.selectedConversationId,
          agentId,
          model,
          effort,
          approvalMode: message.approvalMode === "default" ? void 0 : message.approvalMode,
          prompt: message.text,
          inputReferences: mentions.inputReferences,
          localImagePaths: mentions.localImagePaths
        });
        await this.refresh();
        this._follow(created.taskId);
      }
      // #endregion
      // #region State assembly
      async _projectId() {
        if (this.selectedProjectId) return this.selectedProjectId;
        const projects = await this.bridge.projects();
        const project = this.bridge.projectForWorkspace(projects) || projects.find((candidate) => candidate.status !== "unavailable");
        if (!project) {
          throw new Error("\uC0AC\uC6A9\uD560 \uC218 \uC788\uB294 Vibex \uD504\uB85C\uC81D\uD2B8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uBC31\uC5D4\uB4DC\uC5D0 Git \uD504\uB85C\uC81D\uD2B8\uB97C \uBA3C\uC800 \uB4F1\uB85D\uD574 \uC8FC\uC138\uC694.");
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
            this.bridge.projects()
          ]);
          const projectId = await this._projectId();
          const conversations = await this.bridge.conversations(projectId);
          let selected = conversations.find(
            (candidate) => candidate.conversationId === this.selectedConversationId
          ) || conversations[0] || null;
          this.selectedConversationId = selected?.conversationId || null;
          let tasks = [];
          if (selected) {
            const detail = await this.bridge.conversationDetail(projectId, selected.conversationId);
            tasks = Array.isArray(detail.tasks) ? detail.tasks : [];
            tasks = await Promise.all(tasks.map((task) => this._hydrateTask(task)));
          }
          if (generation !== this.refreshGeneration) return;
          this.tasks = tasks;
          const lastTask = tasks[tasks.length - 1];
          if (lastTask && ACTIVE_STATUSES.has(lastTask.status)) this._follow(lastTask.taskId);
          if (this.view) {
            this.view.description = selected?.title || void 0;
          }
          this._postState({
            health,
            agents,
            projects,
            conversations,
            selectedProjectId: projectId,
            selectedConversationId: this.selectedConversationId,
            tasks,
            busy: Boolean(lastTask && ACTIVE_STATUSES.has(lastTask.status))
          });
        } catch (error) {
          if (generation !== this.refreshGeneration) return;
          this._log(`\uC0C1\uD0DC \uAC31\uC2E0 \uC2E4\uD328: ${describe2(error)}`);
          this._postState({ connectionError: describe2(error) });
        }
      }
      _postState(partial) {
        this.view?.webview.postMessage({
          type: "state",
          options: {
            modelId: this.options.model || null,
            effort: this.options.effort || "",
            approvalMode: this.options.approvalMode || "default"
          },
          ...partial
        });
      }
      async _hydrateTask(task) {
        const attachments = Array.isArray(task?.attachments) ? task.attachments : [];
        if (!attachments.length) return task;
        const hydrated = await Promise.all(attachments.map(async (attachment) => ({
          ...attachment,
          dataUrl: attachment.dataUrl || await this.bridge.attachmentData(attachment).catch(() => null)
        })));
        return { ...task, attachments: hydrated };
      }
      _onTaskEvent(event) {
        if (!this.view) return;
        if (event.taskId && this._following.has(event.taskId)) return;
        void this.refresh();
      }
      /** Streams one task's snapshots to the webview until it settles. */
      _follow(taskId) {
        if (this._following.has(taskId)) return;
        this._following.add(taskId);
        const poll = async () => {
          try {
            for (; ; ) {
              const task = await this._hydrateTask(await this.bridge.getTask(taskId));
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
            this._log(`\uC791\uC5C5 \uCD94\uC801 \uC2E4\uD328(${taskId}): ${describe2(error)}`);
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
        const media = (file) => webview.asWebviewUri(vscode2.Uri.joinPath(this.context.extensionUri, "media", file));
        const glue = require("node:fs").readFileSync(
          vscode2.Uri.joinPath(this.context.extensionUri, "media", "vibex-glue.css").fsPath,
          "utf8"
        ).replace("{{CODICON_URI}}", media("codicon.ttf").toString());
        return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data: http://127.0.0.1:8787;">
  <link rel="stylesheet" href="${media("native-chat.css")}">
  <style>${glue}</style>
  <title>Vibex</title>
</head>
<body data-vibex-icon="${media("vibex-panel-logo.png")}">
  <script nonce="${nonce}" src="${media("webview.js")}"></script>
</body>
</html>`;
      }
      _log(text) {
        this.output.appendLine(`[panel] ${text}`);
      }
    };
    function titleFromPrompt(prompt) {
      const text = String(prompt || "").trim().replace(/\s+/g, " ");
      if (!text) return "\uC0C8 \uB300\uD654";
      return text.length > 60 ? `${text.slice(0, 60)}\u2026` : text;
    }
    function describe2(error) {
      return error instanceof Error ? error.message : String(error);
    }
    module2.exports = { VibexPanel: VibexPanel2, VIEW_TYPE };
  }
});

// src/extension.js
var vscode = require("vscode");
var { VibexBridge } = require_bridge();
var { VibexModelProvider, VENDOR } = require_models();
var { VibexChatSessions } = require_sessions();
var { ReviewService } = require_review();
var { VibexPanel } = require_panel();
var { SCHEME } = require_sessionUri();
function activate(context) {
  const output = vscode.window.createOutputChannel("Vibex");
  const bridge = new VibexBridge(context, output);
  const models = new VibexModelProvider(bridge, output);
  const review = new ReviewService(bridge);
  const sessions = new VibexChatSessions(context, bridge, output);
  const panel = new VibexPanel(context, bridge, review, output);
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
    vscode.commands.registerCommand(
      "vibex.newSession",
      () => openVibexEditor()
    ),
    vscode.commands.registerCommand("vibex.openEditor", () => openVibexEditor()),
    vscode.commands.registerCommand(
      "vibex.openPanel",
      () => vscode.commands.executeCommand("workbench.view.extension.vibexPanelContainer")
    ),
    vscode.commands.registerCommand(
      "vibex.panel.new",
      () => run(output, () => panel.newConversation())
    ),
    vscode.commands.registerCommand(
      "vibex.panel.history",
      () => run(output, () => panel.pickConversation())
    ),
    // `open "vscode://vibex.vibex/new"` — 터미널·Raycast·스크립트 어디서든
    // Vibex 세션을 여는 외부 진입점.
    vscode.window.registerUriHandler({
      handleUri(uri) {
        if (uri.path === "/panel") {
          void vscode.commands.executeCommand("vibex.openPanel");
        } else if (!uri.path || uri.path === "/" || uri.path === "/new") {
          void vscode.commands.executeCommand("vibex.newSession");
        }
      }
    }),
    vscode.commands.registerCommand(
      "vibex.sessions.rename",
      (item) => run(output, () => sessions.renameSession(item))
    ),
    vscode.commands.registerCommand(
      "vibex.sessions.archive",
      (item) => run(output, () => sessions.archiveSession(item))
    ),
    vscode.commands.registerCommand(
      "vibex.openReview",
      (taskId) => run(output, () => review.openReview(taskId))
    ),
    vscode.commands.registerCommand(
      "vibex.undoTask",
      (taskId) => run(output, () => undoTask(bridge, taskId))
    ),
    vscode.commands.registerCommand(
      "vibex.configureBackend",
      () => run(output, () => configureBackend(bridge, models))
    ),
    vscode.commands.registerCommand(
      "vibex.configureTailscale",
      () => run(output, () => configureTailscale(bridge))
    ),
    vscode.commands.registerCommand("vibex.showLogs", () => output.show(true)),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("vibex")) models.refresh();
    })
  );
  if (process.env.VIBEX_DEV_OPEN_EDITOR === "1") {
    setTimeout(() => void vscode.commands.executeCommand("vibex.newSession"), 4e3);
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
    }, 5e3);
  }
  void bridge.ensureBackend().then(async () => {
    const tailscale = await bridge.configureTailscale();
    if (tailscale.ready) {
      output.appendLine(`[startup] Tailscale Serve \uC900\uBE44\uB428: ${tailscale.url}`);
    } else {
      output.appendLine(`[startup] Tailscale Serve \uC124\uC815 \uC2E4\uD328: ${tailscale.error}`);
    }
    bridge.connectEvents();
    models.refresh();
  }).catch((error) => {
    output.appendLine(`[startup] \uBC31\uC5D4\uB4DC\uB97C \uC2DC\uC791\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4: ${describe(error)}`);
  });
}
async function undoTask(bridge, taskId) {
  if (!taskId) return;
  const choice = await vscode.window.showWarningMessage(
    "\uC774 \uC791\uC5C5\uC5D0\uC11C \uB9CC\uB4E0 \uD30C\uC77C \uBCC0\uACBD\uB9CC \uC2E4\uD589 \uCDE8\uC18C\uD560\uAE4C\uC694? \uD6C4\uC18D \uBCC0\uACBD\uACFC \uCDA9\uB3CC\uD558\uBA74 \uCDE8\uC18C\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
    { modal: true },
    "\uC2E4\uD589 \uCDE8\uC18C"
  );
  if (choice !== "\uC2E4\uD589 \uCDE8\uC18C") return;
  await bridge.undoTask(taskId);
  vscode.window.showInformationMessage("\uC791\uC5C5\uC758 \uD30C\uC77C \uBCC0\uACBD\uC744 \uB418\uB3CC\uB838\uC2B5\uB2C8\uB2E4.");
}
async function configureBackend(bridge, models) {
  const configuration = vscode.workspace.getConfiguration("vibex");
  const backendPath = await vscode.window.showInputBox({
    title: "Vibex \uBC31\uC5D4\uB4DC \uD3F4\uB354",
    value: configuration.get("backendPath", ""),
    prompt: "\uC790\uB3D9 \uD0D0\uC0C9\uC774 \uC2E4\uD328\uD560 \uB54C\uB9CC backend \uD3F4\uB354\uC758 \uC808\uB300 \uACBD\uB85C\uB97C \uC785\uB825\uD558\uC138\uC694.",
    ignoreFocusOut: true
  });
  if (backendPath === void 0) return;
  await configuration.update(
    "backendPath",
    backendPath.trim(),
    vscode.ConfigurationTarget.Global
  );
  await bridge.ensureBackend();
  bridge.connectEvents();
  models.refresh();
  vscode.window.showInformationMessage("Vibex \uBC31\uC5D4\uB4DC\uC5D0 \uC5F0\uACB0\uD588\uC2B5\uB2E4.");
}
async function configureTailscale(bridge) {
  const result = await bridge.configureTailscale();
  if (result.ready) {
    vscode.window.showInformationMessage(`iPad\uC5D0\uC11C ${result.url} \uB85C \uC811\uC18D\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.`);
  } else {
    vscode.window.showWarningMessage(`Tailscale \uC124\uC815\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4: ${result.error}`);
  }
}
async function run(output, action) {
  try {
    await action();
  } catch (error) {
    const text = describe(error);
    output.appendLine(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${text}`);
    vscode.window.showErrorMessage(`Vibex: ${text}`);
  }
}
function describe(error) {
  return error instanceof Error ? error.message : String(error);
}
function deactivate() {
}
function openVibexEditor() {
  return vscode.commands.executeCommand(
    `workbench.action.chat.openNewSessionEditor.${SCHEME}`
  );
}
module.exports = { activate, deactivate };
//# sourceMappingURL=extension.js.map
