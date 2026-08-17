"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vscode = require("vscode");
const { isPathInside } = require("./bridge");
const { SCHEME, forConversation, tryParse } = require("./sessionUri");
const { parseModelId } = require("./models");
const { TaskRenderer, isActive } = require("./activity");
const { buildChatHistory } = require("./history");

const PROJECT_OPTION = "project";
const EFFORT_OPTION = "effort";
const APPROVAL_OPTION = "approvalMode";
const DEFAULT_SENTINEL = "__default__";
const ICON = new vscode.ThemeIcon("sparkle");

const APPROVAL_ITEMS = [
  { id: "default", name: "기본 승인" },
  { id: "bypass", name: "승인 없이 진행" },
  { id: "autopilot", name: "오토파일럿" },
];

/**
 * VIBEX rendered by the native VS Code chat session UI.
 *
 * VS Code owns every pixel here — the session list, the transcript, the
 * composer, the model picker, attachments, the reasoning disclosure and the
 * response actions. This class only supplies the data: it lists VIBEX
 * conversations as chat sessions, replays their turns as chat history, and
 * forwards new turns to the local agent CLI through the bridge.
 */
class VibexChatSessions {
  constructor(context, bridge, output) {
    this.context = context;
    this.bridge = bridge;
    this.output = output;
    this.disposables = [];

    /** Per-session composer selections that are not part of the resource. */
    this._sessionOptions = new Map();
    this._defaultOptions = { effort: DEFAULT_SENTINEL, approvalMode: "default" };
    /**
     * Sessions currently being followed, keyed by resource. A refresh replaces
     * the whole item collection, so these are re-materialised each time rather
     * than held as item objects that a replace would detach.
     */
    this._liveSessions = new Map();
    this._projects = [];

    this._onDidChangeChatSessionOptions = new vscode.EventEmitter();
    this.onDidChangeChatSessionOptions = this._onDidChangeChatSessionOptions.event;
    this._onDidChangeChatSessionProviderOptions = new vscode.EventEmitter();
    this.onDidChangeChatSessionProviderOptions = this._onDidChangeChatSessionProviderOptions.event;

    this.controller = vscode.chat.createChatSessionItemController(SCHEME, (token) =>
      this._refreshItems(token),
    );
    this.controller.newChatSessionItemHandler = (handlerContext, token) =>
      this._createSessionItem(handlerContext, token);

    this.disposables.push(
      this.controller,
      this._onDidChangeChatSessionOptions,
      this._onDidChangeChatSessionProviderOptions,
      this.bridge.onDidChangeTask(() => this._scheduleRefresh()),
      vscode.workspace.onDidChangeWorkspaceFolders(() =>
        this._onDidChangeChatSessionProviderOptions.fire(),
      ),
    );
  }

  dispose() {
    if (this._refreshTimer) clearTimeout(this._refreshTimer);
    this._refreshTimer = undefined;
    for (const disposable of this.disposables.reverse()) disposable.dispose();
    this.disposables = [];
  }

  // #region Session list

  _scheduleRefresh() {
    if (this._refreshTimer) return;
    this._refreshTimer = setTimeout(() => {
      this._refreshTimer = undefined;
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
          this._log(`대화 목록을 읽지 못했습니다(${project.projectId}): ${message(error)}`);
          continue;
        }
        const activeConversationId = await this._activeConversationId(project);
        for (const conversation of conversations) {
          items.push(
            this._createItem(project, conversation, {
              showProjectBadge,
              active: conversation.conversationId === activeConversationId,
            }),
          );
        }
      }
    } catch (error) {
      this._log(`세션 목록을 새로 고치지 못했습니다: ${message(error)}`);
      // Keep any live session visible even while the bridge is unreachable.
      items = [];
    }

    const byKey = new Map(items.map((item) => [item.resource.toString(), item]));
    for (const [key, live] of this._liveSessions) {
      const existing = byKey.get(key);
      if (existing) {
        existing.status = vscode.ChatSessionStatus.InProgress;
        continue;
      }
      // A conversation created this session that the backend has not listed
      // yet, or a bridge that is momentarily unreachable: keep it visible.
      const item = this.controller.createChatSessionItem(live.resource, live.label);
      item.iconPath = ICON;
      item.status = vscode.ChatSessionStatus.InProgress;
      item.timing = { created: live.created, lastRequestStarted: live.started };
      items.push(item);
    }
    this.controller.items.replace(items);
  }

  async _activeConversationId(project) {
    if (!project.activeTaskId) return undefined;
    try {
      const task = await this.bridge.getTask(project.activeTaskId);
      return task?.conversationId || undefined;
    } catch {
      return undefined;
    }
  }

  _createItem(project, conversation, { showProjectBadge, active } = {}) {
    const resource = forConversation(project.projectId, conversation.conversationId);
    const item = this.controller.createChatSessionItem(resource, conversation.title || "새 대화");
    item.iconPath = ICON;
    item.tooltip = `VIBEX · ${project.displayName}`;
    item.timing = {
      created: toEpoch(conversation.createdAt),
      lastRequestEnded: active ? undefined : toEpoch(conversation.updatedAt),
      lastRequestStarted: active ? toEpoch(conversation.updatedAt) : undefined,
    };
    if (showProjectBadge) {
      const badge = new vscode.MarkdownString(`$(folder) ${project.displayName}`);
      badge.supportThemeIcons = true;
      item.badge = badge;
    }
    item.status = active
      ? vscode.ChatSessionStatus.InProgress
      : vscode.ChatSessionStatus.Completed;
    item.metadata = { projectId: project.projectId, projectName: project.displayName };
    return item;
  }

  async _createSessionItem(handlerContext, _token) {
    await this.bridge.ensureBackend();
    const projects = await this.bridge.projects();
    this._projects = projects;

    const requested = optionValue(handlerContext?.sessionOptions, PROJECT_OPTION);
    const project =
      projects.find((candidate) => candidate.projectId === requested) ||
      this.bridge.projectForWorkspace(projects) ||
      projects.find((candidate) => candidate.status !== "unavailable");
    if (!project) {
      throw new Error(
        "사용할 수 있는 VIBEX 프로젝트가 없습니다. 백엔드에 Git 프로젝트를 먼저 등록해 주세요.",
      );
    }

    const title = titleFromPrompt(handlerContext?.request?.prompt);
    const conversation = await this.bridge.createConversation(project.projectId, title);
    const item = this._createItem(project, conversation, {
      showProjectBadge: projects.length > 1,
    });
    item.timing = { created: Date.now() };

    const resourceKey = item.resource.toString();
    this._sessionOptions.set(resourceKey, {
      effort: optionValue(handlerContext?.sessionOptions, EFFORT_OPTION) ?? this._defaultOptions.effort,
      approvalMode:
        optionValue(handlerContext?.sessionOptions, APPROVAL_OPTION) ??
        this._defaultOptions.approvalMode,
    });
    this._liveSessions.set(resourceKey, {
      resource: item.resource,
      label: item.label,
      created: item.timing.created,
      started: item.timing.created,
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
      this._log(`프로젝트 목록을 읽지 못했습니다: ${message(error)}`);
    }

    const selectable = projects.filter((project) => project.status !== "unavailable");
    if (selectable.length > 1) {
      optionGroups.push({
        id: PROJECT_OPTION,
        name: "프로젝트",
        description: "작업할 VIBEX 프로젝트",
        icon: new vscode.ThemeIcon("folder"),
        items: selectable.map((project) => ({
          id: project.projectId,
          name: project.displayName,
          icon: new vscode.ThemeIcon("folder"),
        })),
      });
    }

    const efforts = this._effortItems();
    if (efforts.length > 1) {
      optionGroups.push({
        id: EFFORT_OPTION,
        name: "추론 강도",
        description: "선택한 에이전트가 지원하는 추론 강도",
        items: efforts,
      });
    }

    optionGroups.push({
      id: APPROVAL_OPTION,
      name: "승인 모드",
      description: "에이전트가 파일을 바꾸기 전에 물어볼지 결정합니다",
      items: APPROVAL_ITEMS,
    });

    const newSessionOptions = {
      [EFFORT_OPTION]: this._defaultOptions.effort,
      [APPROVAL_OPTION]: this._defaultOptions.approvalMode,
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
    const items = new Map([[DEFAULT_SENTINEL, { id: DEFAULT_SENTINEL, name: "기본 추론" }]]);
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
      // A blank chat editor: the conversation is created on the first request
      // by `newChatSessionItemHandler`, so there is nothing to replay yet.
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
      [APPROVAL_OPTION]: options.approvalMode,
    };
    const project = this._projects.find((candidate) => candidate.projectId === projectId);
    if (project) {
      // The conversation already belongs to this project; show it, locked.
      sessionOptions[PROJECT_OPTION] = {
        id: project.projectId,
        name: project.displayName,
        icon: new vscode.ThemeIcon("folder"),
        locked: true,
      };
    }

    return {
      title: detail.conversation?.title,
      history: buildChatHistory(tasks, { projectRoot, followLastTask }),
      options: sessionOptions,
      requestHandler: undefined,
      activeResponseCallback: followLastTask
        ? async (stream, cancellation) => {
            await this._followTask(lastTask.taskId, stream, cancellation, projectRoot, resource);
          }
        : undefined,
    };
  }

  /** The session shown in a blank VIBEX chat editor. */
  _emptySession(resource) {
    const options = this._optionsFor(resource);
    return {
      history: [],
      options: {
        [EFFORT_OPTION]: options.effort,
        [APPROVAL_OPTION]: options.approvalMode,
      },
      requestHandler: undefined,
      activeResponseCallback: undefined,
    };
  }

  // #endregion

  // #region Requests

  createHandler() {
    return async (request, context, stream, token) => {
      const chatSessionContext = context.chatSessionContext;
      if (!chatSessionContext) {
        stream.markdown(new vscode.MarkdownString("VIBEX 세션에서 사용할 수 있습니다."));
        stream.button({
          command: `workbench.action.chat.openNewSessionEditor.${SCHEME}`,
          title: "VIBEX 세션 시작",
        });
        return {};
      }

      const resource = chatSessionContext.chatSessionItem.resource;
      const parsed = tryParse(resource);
      if (!parsed) {
        return { errorDetails: { message: "VIBEX 대화를 찾지 못했습니다." } };
      }
      const { projectId, conversationId } = parsed;

      try {
        await this.bridge.ensureBackend();
        const projectRoot = this.bridge.resolveProjectRoot(projectId);
        const { agentId, model } = parseModelId(request.model?.id);
        const agent = (await this.bridge.agents()).find(
          (candidate) => candidate.agentId === agentId,
        );
        const options = this._optionsFor(resource);

        const attachments = await this.bridge.collectAttachments(projectId, request.references);
        if (attachments.skipped.length) {
          stream.warning(
            new vscode.MarkdownString(
              `프로젝트 밖의 첨부는 보내지 않았습니다: ${attachments.skipped.join(", ")}`,
            ),
          );
        }

        // `@상대/경로` mentions in the prompt attach the file, same as the iPad
        // composer. Whatever `@` completion the native UI offers, the text that
        // reaches us is the plain mention, so parsing here covers both.
        const mentions = resolveMentions(projectRoot, request.prompt);
        const inputReferences = dedupe([
          ...attachments.inputReferences,
          ...mentions.inputReferences,
        ]).slice(0, 20);
        const localImagePaths = dedupe([
          ...attachments.localImagePaths,
          ...mentions.localImagePaths,
        ]).slice(0, 8);
        for (const referenced of mentions.resolved) {
          stream.reference2(vscode.Uri.file(referenced));
        }

        this._markInProgress(resource, request.prompt);
        const created = await this.bridge.createTask({
          projectId,
          conversationId,
          agentId,
          model,
          effort: this._effortFor(agent, options.effort),
          approvalMode: options.approvalMode === "default" ? undefined : options.approvalMode,
          prompt: request.prompt,
          localImagePaths,
          inputReferences,
          uploadedImages: attachments.uploadedImages,
        });

        const task = await this._followTask(created.taskId, stream, token, projectRoot, resource);
        if (task?.status === "failed") {
          return { errorDetails: { message: String(task.error || "작업이 실패했습니다.") } };
        }
        return {};
      } catch (error) {
        this._markCompleted(resource);
        this._log(`요청을 처리하지 못했습니다: ${message(error)}`);
        return { errorDetails: { message: message(error) } };
      }
    };
  }

  /** Drops a reasoning level the selected agent does not accept. */
  _effortFor(agent, effort) {
    if (!effort || effort === DEFAULT_SENTINEL) return undefined;
    const allowed = (agent?.efforts || []).some((option) => option.value === effort);
    return allowed ? effort : undefined;
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

    for (;;) {
      try {
        task = await this.bridge.getTask(taskId);
        consecutiveFailures = 0;
      } catch (error) {
        this._log(`작업 상태를 읽지 못했습니다(${taskId}): ${message(error)}`);
        if ((consecutiveFailures += 1) >= 5) {
          stream.warning(
            new vscode.MarkdownString(
              "VIBEX 백엔드에서 작업 상태를 더 이상 읽지 못했습니다. 로그를 확인해 주세요.",
            ),
          );
          break;
        }
        await this._waitForTaskChange(taskId, 1000);
        continue;
      }

      renderer.apply(task);
      if (!isActive(task)) break;

      if (token?.isCancellationRequested && !cancelRequested) {
        cancelRequested = true;
        stream.progress("작업을 취소하고 있습니다.");
        this.bridge.cancelTask(taskId).catch((error) => {
          this._log(`작업을 취소하지 못했습니다(${taskId}): ${message(error)}`);
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
    item.status = vscode.ChatSessionStatus.InProgress;
    item.timing = { ...(item.timing || { created: now }), lastRequestStarted: now, lastRequestEnded: undefined };
    this._liveSessions.set(resource.toString(), {
      resource,
      label: item.label,
      created: item.timing.created,
      started: now,
    });
  }

  _markCompleted(resource, task) {
    const item = this.controller.items.get(resource);
    if (item) {
      item.status =
        task?.status === "failed"
          ? vscode.ChatSessionStatus.Failed
          : vscode.ChatSessionStatus.Completed;
      item.timing = { ...(item.timing || { created: Date.now() }), lastRequestEnded: Date.now() };
    }
    this._liveSessions.delete(resource.toString());
    this._scheduleRefresh();
  }

  // #endregion

  // #region Session commands

  async renameSession(sessionItem) {
    const parsed = tryParse(sessionItem?.resource);
    if (!parsed) return;
    const title = await vscode.window.showInputBox({
      title: "VIBEX 대화 이름 변경",
      value: sessionItem.label,
      prompt: "VS Code와 iPad에 함께 표시할 대화 이름입니다.",
      validateInput: (value) => {
        const trimmed = value.trim();
        if (!trimmed) return "대화 이름을 입력해 주세요.";
        if (trimmed.length > 160) return "대화 이름은 160자 이하여야 합니다.";
        return undefined;
      },
      ignoreFocusOut: true,
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
    const choice = await vscode.window.showWarningMessage(
      "이 VIBEX 대화를 보관할까요? iPad 목록에서도 사라집니다.",
      { modal: true },
      "보관",
    );
    if (choice !== "보관") return;
    await this.bridge.archiveConversation(parsed.projectId, parsed.conversationId);
    this.controller.items.delete(sessionItem.resource);
    this._liveSessions.delete(sessionItem.resource.toString());
    this._scheduleRefresh();
  }

  // #endregion

  _log(text) {
    this.output.appendLine(`[${new Date().toISOString()}] ${text}`);
  }
}

const MENTION_PATTERN = /(^|[\s([{'"`])@([\w가-힣][\w가-힣./\-]*)/g;
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

/**
 * Resolves `@relative/path` mentions in a prompt to files inside the project.
 * Mentions that do not name an existing project file are left as plain text —
 * `@` can legitimately appear in prose, emails, or decorators.
 */
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
    // Trailing sentence punctuation belongs to the prose, not the path.
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
  if (!found) return undefined;
  return typeof found.value === "string" ? found.value : found.value?.id;
}

function titleFromPrompt(prompt) {
  const text = String(prompt || "").trim().replace(/\s+/g, " ");
  if (!text) return "새 대화";
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

function toEpoch(value) {
  const parsed = Date.parse(String(value || ""));
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function message(error) {
  return error instanceof Error ? error.message : String(error);
}

module.exports = {
  VibexChatSessions,
  PROJECT_OPTION,
  EFFORT_OPTION,
  APPROVAL_OPTION,
  resolveMentions,
};
