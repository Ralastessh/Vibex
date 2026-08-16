const vscode = acquireVsCodeApi();

const ACTIVE_STATUSES = new Set([
  "queued",
  "interpreting",
  "resolving_session",
  "running_agent",
  "testing",
  "awaiting_confirmation",
]);

const persistedState = vscode.getState() || {};
const turnNodes = new Map();
const SLASH_COMMANDS = [
  { value: "/clear", label: "/clear", description: "입력과 첨부 비우기", action: "clear" },
  { value: "/explain", label: "/explain", description: "선택한 코드나 프로젝트 설명", prompt: "다음을 이해하기 쉽게 설명해줘: " },
  { value: "/fix", label: "/fix", description: "문제를 조사하고 수정", prompt: "다음 문제의 원인을 조사하고 수정해줘: " },
  { value: "/test", label: "/test", description: "관련 테스트 작성 또는 실행", prompt: "다음 대상의 관련 테스트를 작성하거나 실행해줘: " },
  { value: "/review", label: "/review", description: "현재 변경사항 검토", prompt: "현재 프로젝트의 변경사항을 검토해줘. " },
];

const state = {
  configuration: { url: "http://127.0.0.1:8787", managed: true },
  tailscale: { url: "http://vibex-pc:8788", ready: false, error: "" },
  connected: false,
  health: null,
  agents: [],
  projects: [],
  selectedProjectId: persistedState.selectedProjectId || null,
  conversations: [],
  selectedConversationIds: persistedState.selectedConversationIds || {},
  selectedAgents: persistedState.selectedAgents || {},
  runOptions: persistedState.runOptions || {},
  threadSelections: persistedState.threadSelections || {},
  threadView: "conversation",
  threads: [],
  threadsNextCursor: null,
  threadListProjectId: null,
  threadDetail: null,
  threadListSignature: null,
  tasks: [],
  error: "",
  pendingRequestId: null,
  optimisticTurns: [],
  pendingAnswers: new Map(),
  questionErrors: new Map(),
  copyTargets: new Map(),
  responseFeedback: {},
  draftAttachments: persistedState.draftAttachments || [],
  attachmentRequestId: null,
  regeneratePendingTaskId: null,
  mentionRequestId: null,
  mentionFiles: [],
  promptAssistItems: [],
  promptAssistIndex: 0,
  promptAssistRange: null,
  cancelPendingTaskId: null,
  cancelPendingProjectId: null,
  refreshSequence: 0,
  pollTimer: null,
  eventSocket: null,
  eventReconnectTimer: null,
  eventRefreshTimer: null,
};

const dom = Object.fromEntries(
  [
    "connectionPanel",
    "workspacePanel",
    "projectTitle",
    "headerSubtitle",
    "pairingStatus",
    "tailscaleURL",
    "setupTailscaleButton",
    "refreshButton",
    "settingsButton",
    "connectionDot",
    "connectionText",
    "projectSelect",
    "projectState",
    "agentSwitcher",
    "agentNote",
    "errorBanner",
    "emptyState",
    "taskList",
    "promptInput",
    "sendButton",
    "composerRoot",
    "chatInputContainer",
    "attachButton",
    "attachmentTray",
    "agentButton",
    "agentPanel",
    "agentChoices",
    "agentSearchInput",
    "selectedAgentName",
    "scrollToBottomButton",
    "composerHint",
    "selectedAgentLabel",
    "runtimeButton",
    "runtimePanel",
    "runtimeSearchInput",
    "modelSelect",
    "effortSelect",
    "speedSelect",
    "modelChoices",
    "effortChoices",
    "speedChoices",
    "modelGroupButton",
    "speedGroupButton",
    "runtimeModelValue",
    "approvalButton",
    "approvalPanel",
    "approvalChoices",
    "approvalLabel",
    "promptAssist",
    "historyButton",
    "newThreadButton",
    "threadMenuButton",
    "threadMenu",
    "renameThreadButton",
    "archiveThreadButton",
    "historyPanel",
    "threadList",
    "loadMoreThreadsButton",
    "conversationPanel",
  ].map((id) => [id, document.getElementById(id)]),
);

dom.refreshButton.addEventListener("click", refresh);
dom.settingsButton.addEventListener("click", () => {
  const opening = dom.connectionPanel.classList.contains("hidden");
  dom.connectionPanel.classList.toggle("hidden", !opening);
  dom.settingsButton.setAttribute("aria-expanded", String(opening));
  if (opening) requestAnimationFrame(() => dom.projectSelect.focus());
});
dom.setupTailscaleButton.addEventListener("click", () => {
  dom.pairingStatus.textContent = "Tailscale Serve를 준비하는 중…";
  vscode.postMessage({ type: "setupTailscale" });
});
dom.projectSelect.addEventListener("change", () => {
  state.selectedProjectId = dom.projectSelect.value || null;
  state.draftAttachments = [];
  state.attachmentRequestId = null;
  state.mentionFiles = [];
  closePromptAssist();
  state.tasks = [];
  state.conversations = [];
  state.threads = [];
  state.threadsNextCursor = null;
  state.threadListProjectId = null;
  state.threadDetail = null;
  state.threadListSignature = null;
  state.threadView = "conversation";
  state.error = "";
  persistViewState();
  turnNodes.clear();
  dom.taskList.replaceChildren();
  render();
  refresh();
});
for (const control of [dom.modelSelect, dom.effortSelect, dom.speedSelect]) {
  control.addEventListener("change", saveRunOptions);
}
dom.sendButton.addEventListener("click", handlePrimaryAction);
dom.attachButton.addEventListener("click", () => {
  if (!state.selectedProjectId || state.attachmentRequestId) return;
  state.attachmentRequestId = crypto.randomUUID();
  dom.attachButton.disabled = true;
  vscode.postMessage({
    type: "pickAttachments",
    requestId: state.attachmentRequestId,
    projectId: state.selectedProjectId,
  });
});
dom.agentButton.addEventListener("click", () => {
  const opening = dom.agentPanel.classList.contains("hidden");
  closeRuntime();
  closeApprovalPanel();
  dom.agentPanel.classList.toggle("hidden", !opening);
  dom.agentButton.setAttribute("aria-expanded", String(opening));
  if (opening) {
    dom.agentSearchInput.value = "";
    renderAgents();
    requestAnimationFrame(() => dom.agentSearchInput.focus());
  }
});
dom.agentSearchInput.addEventListener("input", renderAgents);
dom.promptInput.addEventListener("input", () => {
  resizeComposer();
  renderComposer();
  updatePromptAssist();
});
dom.promptInput.addEventListener("focus", () => {
  dom.chatInputContainer.classList.add("focused");
});
dom.promptInput.addEventListener("blur", () => {
  dom.chatInputContainer.classList.remove("focused");
});
dom.promptInput.addEventListener("keydown", (event) => {
  if (handlePromptAssistKey(event)) return;
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
    event.preventDefault();
    handlePrimaryAction();
  }
});

function handlePrimaryAction() {
  const task = state.tasks.findLast((candidate) => ACTIVE_STATUSES.has(candidate.status));
  if (!task) return sendTask();
  if (state.cancelPendingTaskId) return;
  state.cancelPendingTaskId = task.taskId;
  state.cancelPendingProjectId = task.projectId;
  vscode.postMessage({ type: "cancel", requestId: crypto.randomUUID(), taskId: task.taskId, projectId: state.selectedProjectId });
  renderComposer();
}
dom.scrollToBottomButton.addEventListener("click", () => {
  scrollToDocumentBottom("smooth");
});
dom.historyButton.addEventListener("click", openHistory);
dom.newThreadButton.addEventListener("click", startNewThread);
dom.loadMoreThreadsButton.addEventListener("click", () => {
  if (!state.selectedProjectId || !state.threadsNextCursor) return;
  vscode.postMessage({
    type: "loadThreads",
    projectId: state.selectedProjectId,
    cursor: state.threadsNextCursor,
    append: true,
  });
});
dom.threadMenuButton.addEventListener("click", () => {
  const opening = dom.threadMenu.classList.contains("hidden");
  dom.threadMenu.classList.toggle("hidden", !opening);
  dom.threadMenuButton.setAttribute("aria-expanded", String(opening));
  if (opening) requestAnimationFrame(() => dom.renameThreadButton.focus());
});
dom.renameThreadButton.addEventListener("click", () => {
  const conversationId = selectedConversationId();
  if (!conversationId) return;
  closeThreadMenu();
  vscode.postMessage({
    type: "renameThread",
    projectId: state.selectedProjectId,
    threadId: conversationId,
    name: threadTitle(),
  });
});
dom.archiveThreadButton.addEventListener("click", () => {
  const conversationId = selectedConversationId();
  if (!conversationId) return;
  closeThreadMenu();
  vscode.postMessage({
    type: "archiveThread",
    projectId: state.selectedProjectId,
    threadId: conversationId,
  });
});
dom.runtimeButton.addEventListener("click", () => {
  if (dom.runtimeButton.disabled) return;
  const opening = dom.runtimePanel.classList.contains("hidden");
  closeAgentPanel();
  closeApprovalPanel();
  dom.runtimePanel.classList.toggle("hidden", !opening);
  dom.runtimeButton.setAttribute("aria-expanded", String(opening));
  if (opening) {
    dom.runtimeSearchInput.value = "";
    renderRunOptions();
    requestAnimationFrame(() => dom.runtimeSearchInput.focus());
  }
});
dom.runtimeSearchInput.addEventListener("input", renderRunOptions);
dom.approvalButton.addEventListener("click", () => {
  const opening = dom.approvalPanel.classList.contains("hidden");
  closeAgentPanel();
  closeRuntime();
  dom.approvalPanel.classList.toggle("hidden", !opening);
  dom.approvalButton.setAttribute("aria-expanded", String(opening));
  if (opening) requestAnimationFrame(() => dom.approvalChoices.querySelector("button")?.focus());
});
for (const [button, choices] of [
  [dom.modelGroupButton, dom.modelChoices],
  [dom.speedGroupButton, dom.speedChoices],
]) {
  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") !== "false";
    button.setAttribute("aria-expanded", String(!expanded));
    choices.classList.toggle("hidden", expanded);
  });
}

document.addEventListener("pointerdown", (event) => {
  if (
    !dom.connectionPanel.classList.contains("hidden") &&
    !dom.connectionPanel.contains(event.target) &&
    !dom.settingsButton.contains(event.target)
  ) closeSettings();
  if (
    !dom.runtimePanel.classList.contains("hidden") &&
    !dom.runtimePanel.contains(event.target) &&
    !dom.runtimeButton.contains(event.target)
  ) closeRuntime();
  if (
    !dom.threadMenu.classList.contains("hidden") &&
    !dom.threadMenu.contains(event.target) &&
    !dom.threadMenuButton.contains(event.target)
  ) closeThreadMenu();
  if (
    !dom.agentPanel.classList.contains("hidden") &&
    !dom.agentPanel.contains(event.target) &&
    !dom.agentButton.contains(event.target)
  ) closeAgentPanel();
  if (
    !dom.approvalPanel.classList.contains("hidden") &&
    !dom.approvalPanel.contains(event.target) &&
    !dom.approvalButton.contains(event.target)
  ) closeApprovalPanel();
  if (!dom.promptAssist.classList.contains("hidden") && !dom.composerRoot.contains(event.target)) {
    closePromptAssist();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !dom.connectionPanel.classList.contains("hidden")) {
    closeSettings();
    dom.settingsButton.focus();
  } else if (event.key === "Escape" && !dom.runtimePanel.classList.contains("hidden")) {
    closeRuntime();
    dom.runtimeButton.focus();
  } else if (event.key === "Escape" && !dom.threadMenu.classList.contains("hidden")) {
    closeThreadMenu();
    dom.threadMenuButton.focus();
  } else if (event.key === "Escape" && !dom.agentPanel.classList.contains("hidden")) {
    closeAgentPanel();
    dom.agentButton.focus();
  } else if (event.key === "Escape" && !dom.approvalPanel.classList.contains("hidden")) {
    closeApprovalPanel();
    dom.approvalButton.focus();
  } else if (event.key === "Escape" && !dom.promptAssist.classList.contains("hidden")) {
    closePromptAssist();
    dom.promptInput.focus();
  }
});

function closeSettings() {
  dom.connectionPanel.classList.add("hidden");
  dom.settingsButton.setAttribute("aria-expanded", "false");
}

function closeRuntime() {
  dom.runtimePanel.classList.add("hidden");
  dom.runtimeButton.setAttribute("aria-expanded", "false");
}

function closeAgentPanel() {
  dom.agentPanel.classList.add("hidden");
  dom.agentButton.setAttribute("aria-expanded", "false");
}

function closeApprovalPanel() {
  dom.approvalPanel.classList.add("hidden");
  dom.approvalButton.setAttribute("aria-expanded", "false");
}

function closePromptAssist() {
  state.promptAssistItems = [];
  state.promptAssistRange = null;
  state.promptAssistIndex = 0;
  dom.promptAssist.classList.add("hidden");
  dom.promptAssist.replaceChildren();
}

function closeThreadMenu() {
  dom.threadMenu.classList.add("hidden");
  dom.threadMenuButton.setAttribute("aria-expanded", "false");
}

window.addEventListener("message", (event) => {
  const message = event.data;
  if (message.type === "configuration") {
    state.configuration = message;
    connectEventStream();
  } else if (message.type === "tailscale") {
    state.tailscale = message;
  } else if (message.type === "state") {
    if (
      message.requestedProjectId &&
      state.selectedProjectId &&
      message.requestedProjectId !== state.selectedProjectId
    ) return;
    state.connected = true;
    state.error = "";
    state.health = message.health;
    state.agents = message.agents;
    state.projects = message.projects;
    state.selectedProjectId = message.selectedProjectId;
    state.conversations = Array.isArray(message.conversations) ? message.conversations : [];
    if (state.selectedProjectId && message.selectedConversationId) {
      state.selectedConversationIds[state.selectedProjectId] = message.selectedConversationId;
    }
    state.tasks = message.tasks;
    state.responseFeedback = message.responseFeedback || state.responseFeedback;
    const selected = state.projects.find(
      (project) => project.projectId === state.selectedProjectId,
    );
    if (
      selected &&
      state.threadView === "history" &&
      state.threadListProjectId !== state.selectedProjectId
    ) {
      state.threadListProjectId = state.selectedProjectId;
      vscode.postMessage({ type: "loadThreads", projectId: state.selectedProjectId });
    }
    const materializedRequests = new Set(
      state.tasks.map((task) => task.clientTaskId).filter(Boolean),
    );
    state.optimisticTurns = state.optimisticTurns.filter((turn) => (
      turn.projectId !== state.selectedProjectId || !materializedRequests.has(turn.requestId)
    ));
    reconcilePendingAnswers();
    if (
      state.cancelPendingProjectId === state.selectedProjectId &&
      !state.tasks.some((task) => (
        task.taskId === state.cancelPendingTaskId && ACTIVE_STATUSES.has(task.status)
      ))
    ) {
      state.cancelPendingTaskId = null;
      state.cancelPendingProjectId = null;
    }
    persistViewState();
  } else if (message.type === "taskAccepted") {
    if (message.requestId === state.pendingRequestId) {
      state.pendingRequestId = null;
    }
    if (state.selectedProjectId && message.conversationId) {
      state.selectedConversationIds[state.selectedProjectId] = message.conversationId;
      persistViewState();
    }
    const optimistic = state.optimisticTurns.find((turn) => turn.requestId === message.requestId);
    if (optimistic) {
      optimistic.accepted = true;
      optimistic.taskId = message.taskId || null;
    }
  } else if (message.type === "attachmentsSelected") {
    if (message.requestId !== state.attachmentRequestId) return;
    state.attachmentRequestId = null;
    const known = new Set(state.draftAttachments.map((attachment) => attachment.path));
    for (const attachment of message.attachments || []) {
      if (attachment?.path && !known.has(attachment.path)) {
        state.draftAttachments.push(attachment);
        known.add(attachment.path);
      }
    }
    if (message.error) state.error = message.error;
    persistViewState();
  } else if (message.type === "mentionResults") {
    if (message.requestId !== state.mentionRequestId) return;
    state.mentionFiles = Array.isArray(message.files) ? message.files : [];
    const range = promptTokenAtCursor();
    if (!range?.token.startsWith("@")) return;
    state.promptAssistItems = [
      ...state.promptAssistItems.filter((item) => item.type !== "file"),
      ...state.mentionFiles.map((file) => ({
        type: "file",
        value: `@${file.relativePath}`,
        label: file.name,
        description: file.relativePath,
        file,
      })),
    ];
    renderPromptAssist();
  } else if (message.type === "regenerateAccepted") {
    if (state.regeneratePendingTaskId === message.sourceTaskId) {
      state.regeneratePendingTaskId = null;
      invalidateTurn(message.sourceTaskId);
    }
  } else if (message.type === "regenerateRejected") {
    if (state.regeneratePendingTaskId === message.taskId) {
      state.regeneratePendingTaskId = null;
      invalidateTurn(message.taskId);
    }
    state.error = message.message || "답변을 다시 생성하지 못했습니다.";
  } else if (message.type === "threadsLoaded") {
    if (message.projectId !== state.selectedProjectId) return;
    state.threadListProjectId = message.projectId;
    const incoming = Array.isArray(message.threads) ? message.threads : [];
    if (message.append) {
      const known = new Set(state.threads.map((thread) => thread.threadId));
      state.threads.push(...incoming.filter((thread) => !known.has(thread.threadId)));
    } else {
      state.threads = incoming;
    }
    state.threadsNextCursor = message.nextCursor || null;
  } else if (message.type === "threadLoaded") {
    if (message.projectId !== state.selectedProjectId || !message.thread?.threadId) return;
    state.threadDetail = message.thread;
    state.tasks = Array.isArray(message.tasks) ? message.tasks : [];
    state.selectedConversationIds[state.selectedProjectId] = message.thread.threadId;
    state.threadView = "conversation";
    closeThreadMenu();
    persistViewState();
  } else if (message.type === "threadArchived") {
    if (message.projectId !== state.selectedProjectId) return;
    if (selectedConversationId() === message.threadId) startNewThread();
  } else if (message.type === "taskRejected") {
    if (message.requestId === state.pendingRequestId) state.pendingRequestId = null;
    const rejected = state.optimisticTurns.find((turn) => turn.requestId === message.requestId);
    state.optimisticTurns = state.optimisticTurns.filter(
      (turn) => turn.requestId !== message.requestId,
    );
    if (rejected && !dom.promptInput.value.trim()) {
      dom.promptInput.value = rejected.note;
      resizeComposer();
    }
    if (rejected && !state.draftAttachments.length) {
      state.draftAttachments = rejected.inputReferences || [];
      persistViewState();
    }
    state.error = message.message || "요청을 전송하지 못했습니다.";
  } else if (message.type === "copyTextCompleted") {
    completeCopy(message.requestId);
  } else if (message.type === "responseFeedbackChanged") {
    if (message.responseKey) {
      if (message.feedback) state.responseFeedback[message.responseKey] = message.feedback;
      else delete state.responseFeedback[message.responseKey];
    }
  } else if (message.type === "answerAccepted") {
    const pending = pendingAnswerForRequest(message.requestId);
    if (pending) {
      pending.accepted = true;
      invalidateTurn(pending.taskId);
    }
  } else if (message.type === "answerRejected") {
    const pending = pendingAnswerForRequest(message.requestId);
    if (pending) {
      state.pendingAnswers.delete(pending.key);
      state.questionErrors.set(
        pending.key,
        message.message || "답변을 전송하지 못했습니다.",
      );
      invalidateTurn(pending.taskId);
    }
  } else if (message.type === "cancelAccepted") {
    // 실제 task 상태가 terminal로 관찰될 때까지 pending을 유지해 중복 취소를 막는다.
  } else if (message.type === "cancelRejected") {
    state.cancelPendingTaskId = null;
    state.cancelPendingProjectId = null;
    state.error = message.message || "작업을 중단하지 못했습니다.";
  } else if (message.type === "error") {
    // 개별 작업/리뷰 오류가 Bridge 연결 오류로 위장하지 않게 한다.
    state.error = message.message;
    if (message.needsConfiguration || message.connectionFailed) {
      state.connected = false;
    }
    if (message.needsConfiguration) {
      dom.connectionPanel.classList.remove("hidden");
    }
  }
  render();
  schedulePoll();
});

function refresh() {
  const requestId = `refresh-${++state.refreshSequence}`;
  vscode.postMessage({
    type: "refresh",
    requestId,
    projectId: state.selectedProjectId,
    conversationId: selectedConversationId(),
  });
}

function sendTask() {
  const typedNote = dom.promptInput.value.trim();
  const inputReferences = state.draftAttachments.map((attachment) => ({ ...attachment }));
  const note = typedNote || (inputReferences.length ? "첨부한 자료를 검토해줘." : "");
  if (
    !note ||
    !state.selectedProjectId ||
    state.pendingRequestId ||
    hasActiveTask()
  ) return;
  state.pendingRequestId = crypto.randomUUID();
  const threadSelection = currentThreadSelection();
  if (threadSelection.mode === "new") {
    threadSelection.requestId = state.pendingRequestId;
    state.threadSelections[state.selectedProjectId] = threadSelection;
    persistViewState();
  }
  state.optimisticTurns.push({
    requestId: state.pendingRequestId,
    projectId: state.selectedProjectId,
    note,
    inputReferences,
    createdAt: new Date().toISOString(),
    accepted: false,
    taskId: null,
  });
  dom.promptInput.value = "";
  state.draftAttachments = [];
  closePromptAssist();
  persistViewState();
  resizeComposer();
  vscode.postMessage({
    type: "sendTask",
    requestId: state.pendingRequestId,
    projectId: state.selectedProjectId,
    note,
    runOptions: selectedRunOptions(),
    threadMode: threadSelection.mode,
    threadId: threadSelection.threadId || null,
    attachments: inputReferences,
    conversationId: selectedConversationId(),
    agentId: selectedAgentId(),
  });
  render();
  requestAnimationFrame(() => scrollToDocumentBottom("smooth"));
}

function regenerateTask(task) {
  if (!task?.taskId || state.regeneratePendingTaskId || hasActiveTask()) return;
  state.regeneratePendingTaskId = task.taskId;
  invalidateTurn(task.taskId);
  vscode.postMessage({
    type: "regenerateTask",
    requestId: crypto.randomUUID(),
    projectId: task.projectId || state.selectedProjectId,
    taskId: task.taskId,
  });
  render();
}

function promptTokenAtCursor() {
  const cursor = dom.promptInput.selectionStart ?? dom.promptInput.value.length;
  const before = dom.promptInput.value.slice(0, cursor);
  const match = before.match(/(^|\s)([/@][^\s]*)$/u);
  if (!match) return null;
  const token = match[2];
  return { token, start: cursor - token.length, end: cursor };
}

function updatePromptAssist() {
  const range = promptTokenAtCursor();
  if (!range) {
    closePromptAssist();
    return;
  }
  state.promptAssistRange = range;
  state.promptAssistIndex = 0;
  if (range.token.startsWith("/")) {
    const query = range.token.toLocaleLowerCase();
    state.promptAssistItems = SLASH_COMMANDS.filter((command) => (
      command.value.startsWith(query)
    )).map((command) => ({ type: "command", ...command }));
    renderPromptAssist();
    return;
  }

  const query = range.token.slice(1);
  const agentItems = state.agents
    .filter((agent) => ["codex-cli", "claude-code"].includes(agent.agentId))
    .filter((agent) => !query || agent.displayName.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
    .map((agent) => ({
      type: "agent",
      value: `@${shortAgentName(agent)}`,
      label: shortAgentName(agent),
      description: `${agent.displayName} · 로컬 CLI`,
      agent,
    }));
  state.promptAssistItems = [
    ...agentItems,
    ...state.mentionFiles.map((file) => ({
      type: "file",
      value: `@${file.relativePath}`,
      label: file.name,
      description: file.relativePath,
      file,
    })),
  ];
  renderPromptAssist();
  state.mentionRequestId = crypto.randomUUID();
  vscode.postMessage({
    type: "searchMentions",
    requestId: state.mentionRequestId,
    projectId: state.selectedProjectId,
    query,
  });
}

function renderPromptAssist() {
  const range = promptTokenAtCursor();
  if (!range || !state.promptAssistItems.length) {
    dom.promptAssist.classList.add("hidden");
    dom.promptAssist.replaceChildren();
    return;
  }
  state.promptAssistRange = range;
  if (state.promptAssistIndex >= state.promptAssistItems.length) state.promptAssistIndex = 0;
  dom.promptAssist.replaceChildren(...state.promptAssistItems.map((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `prompt-assist-item${index === state.promptAssistIndex ? " active" : ""}`;
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", String(index === state.promptAssistIndex));
    button.append(
      textElement("span", item.type === "file" ? "#" : item.type === "agent" ? "@" : "/", "assist-kind"),
      textElement("span", item.label, "assist-label"),
      textElement("span", item.description, "assist-description"),
    );
    button.addEventListener("pointerdown", (event) => event.preventDefault());
    button.addEventListener("click", () => selectPromptAssist(index));
    return button;
  }));
  dom.promptAssist.classList.remove("hidden");
}

function handlePromptAssistKey(event) {
  if (dom.promptAssist.classList.contains("hidden") || !state.promptAssistItems.length) return false;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const delta = event.key === "ArrowDown" ? 1 : -1;
    state.promptAssistIndex = (
      state.promptAssistIndex + delta + state.promptAssistItems.length
    ) % state.promptAssistItems.length;
    renderPromptAssist();
    return true;
  }
  if ((event.key === "Enter" || event.key === "Tab") && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    selectPromptAssist(state.promptAssistIndex);
    return true;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    closePromptAssist();
    return true;
  }
  return false;
}

function replacePromptAssistToken(replacement = "") {
  const range = state.promptAssistRange || promptTokenAtCursor();
  if (!range) return;
  const value = dom.promptInput.value;
  dom.promptInput.value = `${value.slice(0, range.start)}${replacement}${value.slice(range.end)}`;
  const cursor = range.start + replacement.length;
  dom.promptInput.setSelectionRange(cursor, cursor);
  resizeComposer();
}

function selectPromptAssist(index) {
  const item = state.promptAssistItems[index];
  if (!item) return;
  if (item.type === "command") {
    if (item.action === "new") {
      replacePromptAssistToken("");
      startNewThread();
    } else if (item.action === "history") {
      replacePromptAssistToken("");
      openHistory();
    } else if (item.action === "clear") {
      dom.promptInput.value = "";
      state.draftAttachments = [];
      persistViewState();
      resizeComposer();
    } else {
      replacePromptAssistToken(item.prompt || "");
    }
  } else if (item.type === "agent") {
    replacePromptAssistToken("");
    const project = selectedProject();
    if (project && item.agent?.usable) {
      selectAgent(project, item.agent);
    }
  } else if (item.type === "file") {
    replacePromptAssistToken("");
    if (!state.draftAttachments.some((attachment) => attachment.path === item.file.path)) {
      state.draftAttachments.push(item.file);
      persistViewState();
    }
  }
  closePromptAssist();
  renderComposer();
  dom.promptInput.focus();
}

function hasActiveTask() {
  return state.tasks.some((task) => ACTIVE_STATUSES.has(task.status)) ||
    state.optimisticTurns.some((turn) => turn.projectId === state.selectedProjectId);
}

function invalidateTurn(taskId) {
  const cached = turnNodes.get(taskId);
  if (cached) cached.signature = "";
}

function render() {
  renderConnection();
  renderPairing();
  renderProjects();
  renderAgents();
  renderRunOptions();
  renderThreadChrome();
  renderTasks();
  renderComposer();
}

function renderPairing() {
  const tailscale = state.tailscale;
  dom.pairingStatus.textContent = tailscale.ready
    ? "준비됨 · iPad에서 같은 tailnet에 로그인하면 자동 연결됩니다."
    : tailscale.error || "Tailscale 확인 중…";
  dom.tailscaleURL.textContent = tailscale.url || "http://vibex-pc:8788";
}

function renderConnection() {
  dom.workspacePanel.classList.toggle("hidden", !state.connected);
  dom.connectionDot.classList.toggle("offline", !state.connected);
  dom.connectionText.textContent = state.connected
    ? `${state.configuration.url} · ${state.health?.projects ?? 0} projects`
    : "Bridge 연결 안 됨";
  dom.errorBanner.textContent = state.error;
  dom.errorBanner.classList.toggle("hidden", !state.error);
}

function renderProjects() {
  const current = state.selectedProjectId;
  dom.projectSelect.replaceChildren(
    ...state.projects.map((project) => {
      const option = document.createElement("option");
      option.value = project.projectId;
      option.textContent = project.displayName;
      option.selected = project.projectId === current;
      option.disabled = project.status === "unavailable";
      return option;
    }),
  );
  if (!state.projects.length) {
    const option = document.createElement("option");
    option.textContent = "등록된 프로젝트 없음";
    option.disabled = true;
    option.selected = true;
    dom.projectSelect.append(option);
  }
  const project = selectedProject();
  dom.projectState.textContent = project?.status || "offline";
  dom.projectTitle.textContent = project?.displayName || "VIBEX";
  const agent = state.agents.find((candidate) => candidate.agentId === selectedAgentId());
  dom.headerSubtitle.textContent = project
    ? `${agent?.displayName || "Local agent"} · ${project.status === "busy" ? "작업 중" : "로컬에서 작업"}`
    : "iPad · VS Code";
}

function renderAgents() {
  const project = selectedProject();
  const activeAgentId = selectedAgentId();
  const visibleAgents = state.agents.filter((agent) =>
    ["codex-cli", "claude-code"].includes(agent.agentId),
  );
  dom.agentSwitcher.replaceChildren(
    ...visibleAgents.map((agent) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `agent-button${activeAgentId === agent.agentId ? " active" : ""}`;
      button.disabled = !project || !agent.usable || project.status === "busy";
      button.append(
        document.createTextNode(agent.displayName),
        textElement("span", agent.usable ? "Local CLI" : agent.note || "사용 불가"),
      );
      button.addEventListener("click", () => {
        if (!project) return;
        selectAgent(project, agent);
      });
      return button;
    }),
  );
  const selectedAgent = visibleAgents.find((agent) => agent.agentId === activeAgentId);
  dom.selectedAgentName.textContent = "Agent";
  dom.agentButton.title = selectedAgent
    ? `에이전트 설정 - ${selectedAgent.displayName}`
    : "에이전트 설정";
  const query = dom.agentSearchInput.value.trim().toLocaleLowerCase();
  const filteredAgents = visibleAgents.filter((agent) => (
    !query || `${agent.displayName} ${agent.note}`.toLocaleLowerCase().includes(query)
  ));
  dom.agentChoices.replaceChildren(
    ...filteredAgents.map((agent) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "runtime-choice agent-choice";
      button.setAttribute("role", "menuitemradio");
      button.setAttribute("aria-checked", String(activeAgentId === agent.agentId));
      button.disabled = !project || !agent.usable || project.status === "busy";
      const copy = document.createElement("span");
      copy.className = "runtime-choice-copy";
      copy.append(
        textElement("span", agent.displayName, "runtime-choice-title"),
        textElement("span", agent.usable ? "로컬 CLI · 프로젝트 세션" : agent.note || "사용 불가", "runtime-choice-description"),
      );
      button.append(textElement("span", "", `agent-dot ${agent.agentId}`), copy);
      if (activeAgentId === agent.agentId) button.append(textElement("span", "✓", "runtime-check"));
      button.addEventListener("click", () => {
        if (!project || button.disabled) return;
        selectAgent(project, agent);
      });
      return button;
    }),
  );
  dom.agentButton.disabled = !project || !visibleAgents.some((agent) => agent.usable);
  if (dom.agentButton.disabled) closeAgentPanel();
  dom.agentNote.textContent = project
    ? selectedAgent?.note || "프로젝트에서 사용할 로컬 에이전트를 선택하세요."
    : "";
}

function selectAgent(project, agent) {
  if (!project || !agent?.usable || selectedAgentId() === agent.agentId) {
    closeAgentPanel();
    return;
  }
  closeAgentPanel();
  closeRuntime();
  closeApprovalPanel();

  // 대화 타임라인은 VIBEX 프로젝트 소유다. 에이전트 선택은 다음 턴의 실행기만
  // 바꾸며 현재 메시지 목록을 교체하거나 지우지 않는다.
  state.selectedAgents[conversationAgentKey()] = agent.agentId;
  state.threadView = "conversation";
  state.error = "";
  persistViewState();
  render();
  requestAnimationFrame(() => dom.promptInput.focus());
}

function shortAgentName(agent) {
  if (agent?.agentId === "codex-cli") return "Codex";
  if (agent?.agentId === "claude-code") return "Claude";
  return agent?.displayName || "";
}

function renderRunOptions() {
  const project = selectedProject();
  const agent = state.agents.find((candidate) => candidate.agentId === selectedAgentId());
  const saved = agent ? state.runOptions[agent.agentId] || {} : {};
  fillSelect(dom.modelSelect, agent?.models || [], saved.model);
  fillSelect(dom.effortSelect, agent?.efforts || [], saved.effort);
  fillSelect(dom.speedSelect, agent?.speedModes || [], saved.speedMode);

  const modelLabel = selectedOptionLabel(dom.modelSelect);
  dom.selectedAgentLabel.textContent = modelLabel && !modelLabel.startsWith("기본")
    ? modelLabel
    : "Auto";
  dom.runtimeModelValue.textContent = modelLabel && !modelLabel.startsWith("기본")
    ? modelLabel
    : agent?.displayName || "모델";
  renderRuntimeChoices(dom.effortChoices, dom.effortSelect, "effort");
  renderRuntimeChoices(dom.modelChoices, dom.modelSelect, "model");
  renderRuntimeChoices(dom.speedChoices, dom.speedSelect, "speed");
  renderApprovalChoices(saved.approvalMode || "default");
  dom.runtimeButton.disabled = !project || !agent;
  dom.approvalButton.disabled = !project || !agent;
  if (dom.runtimeButton.disabled) closeRuntime();
  if (dom.approvalButton.disabled) closeApprovalPanel();
}

function renderApprovalChoices(selected) {
  const choices = [
    {
      value: "default",
      title: "기본 승인",
      description: "안전한 작업공간 안에서 요청을 자동 검토합니다.",
      icon: "shield",
    },
    {
      value: "bypass",
      title: "승인 건너뛰기",
      description: "모든 도구 호출을 자동 승인합니다.",
      icon: "warning",
    },
    {
      value: "autopilot",
      title: "Autopilot(미리 보기)",
      description: "샌드박스 안에서 완료될 때까지 자율적으로 진행합니다.",
      icon: "rocket",
    },
  ];
  const active = choices.find((choice) => choice.value === selected) || choices[0];
  dom.approvalLabel.textContent = active.title;
  dom.approvalChoices.replaceChildren(...choices.map((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "approval-choice";
    button.setAttribute("role", "menuitemradio");
    button.setAttribute("aria-checked", String(choice.value === active.value));
    const copy = document.createElement("span");
    copy.className = "runtime-choice-copy";
    copy.append(
      textElement("span", choice.title, "runtime-choice-title"),
      textElement("span", choice.description, "runtime-choice-description"),
    );
    button.append(icon(choice.icon), copy);
    if (choice.value === active.value) button.append(textElement("span", "✓", "runtime-check"));
    button.addEventListener("click", () => {
      const project = selectedProject();
      if (!project) return;
      const agentId = selectedAgentId();
      state.runOptions[agentId] = {
        ...(state.runOptions[agentId] || {}),
        approvalMode: choice.value,
      };
      persistViewState();
      closeApprovalPanel();
      renderRunOptions();
    });
    return button;
  }));
}

function renderRuntimeChoices(container, select, kind) {
  const selected = select.value || "";
  const query = dom.runtimeSearchInput?.value.trim().toLocaleLowerCase() || "";
  const visibleOptions = [...select.children].filter((option) => (
    (kind === "speed" || option.value !== "") &&
    (!query || kind !== "model" || `${option.textContent} ${option.value}`.toLocaleLowerCase().includes(query))
  ));
  container.replaceChildren(...visibleOptions.map((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "runtime-choice";
    button.setAttribute("role", "menuitemradio");
    button.setAttribute("aria-checked", String(option.value === selected));
    const copy = document.createElement("span");
    copy.className = "runtime-choice-copy";
    copy.append(textElement("span", runtimeChoiceLabel(kind, option.value, option.textContent), "runtime-choice-title"));
    const description = runtimeChoiceDescription(kind, option.value);
    if (description) copy.append(textElement("span", description, "runtime-choice-description"));
    button.append(copy);
    if (option.value === selected) button.append(textElement("span", "✓", "runtime-check"));
    button.addEventListener("click", () => {
      select.value = option.value;
      saveRunOptions();
      renderRunOptions();
    });
    return button;
  }));
}

function runtimeChoiceLabel(kind, value, fallback) {
  if (kind === "effort") return ({ "": "기본", low: "Light", medium: "Medium", high: "High", xhigh: "Extra High", max: "울트라" })[value] || fallback;
  if (kind === "speed") return value === "fast" ? "⚡ 고속" : "표준";
  return fallback;
}

function runtimeChoiceDescription(kind, value) {
  if (kind !== "speed") return "";
  return value === "fast" ? "1.5x speed, increased usage" : "기본 속도";
}

function fillSelect(select, options, selectedValue) {
  const signature = JSON.stringify([options, selectedValue]);
  select.dataset.optionCount = String(options.length);
  if (select.dataset.signature === signature) return;
  select.dataset.signature = signature;
  select.replaceChildren(...options.map((item) => {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    option.selected = item.value === (selectedValue || "");
    return option;
  }));
  select.disabled = options.length <= 1;
}

function saveRunOptions() {
  const project = selectedProject();
  if (!project) return;
  state.runOptions[selectedAgentId()] = selectedRunOptions();
  persistViewState();
  renderRunOptions();
}

function selectedRunOptions() {
  const project = selectedProject();
  const saved = project ? state.runOptions[selectedAgentId()] || {} : {};
  return {
    model: dom.modelSelect.value || "",
    effort: dom.effortSelect.value || "",
    speedMode: dom.speedSelect.value || "",
    approvalMode: saved.approvalMode || "default",
  };
}

function selectedOptionLabel(select) {
  return select.selectedOptions[0]?.textContent || "";
}

function persistViewState() {
  vscode.setState({
    selectedProjectId: state.selectedProjectId,
    selectedConversationIds: state.selectedConversationIds,
    selectedAgents: state.selectedAgents,
    runOptions: state.runOptions,
    threadSelections: state.threadSelections,
    draftAttachments: state.draftAttachments,
  });
}

function codexThreadsAvailable() {
  return Boolean(state.selectedProjectId);
}

function currentThreadSelection() {
  // VIBEX conversationId is the canonical cross-model chat identity. It is not
  // a Codex/Claude native thread id; the backend resolves each agent's private
  // session binding inside that conversation.
  return { mode: "auto", threadId: null, requestId: null };
}

function openHistory() {
  if (!codexThreadsAvailable() || !state.selectedProjectId) return;
  state.threadView = "history";
  state.threadListProjectId = state.selectedProjectId;
  closeSettings();
  closeRuntime();
  closeThreadMenu();
  vscode.postMessage({ type: "loadThreads", projectId: state.selectedProjectId });
  render();
}

function startNewThread() {
  if (!codexThreadsAvailable() || !state.selectedProjectId) return;
  vscode.postMessage({ type: "newThread", projectId: state.selectedProjectId });
}

function threadTitle() {
  const conversationId = selectedConversationId();
  if (!conversationId) return "새 대화";
  const detail = state.threadDetail?.threadId === conversationId
    ? state.threadDetail
    : null;
  const summary = state.threads.find((thread) => thread.threadId === conversationId);
  const conversation = state.conversations.find(
    (item) => item.conversationId === conversationId,
  );
  const liveTask = state.tasks.findLast((task) => task.conversationId === conversationId);
  return conversation?.title || detail?.name || visibleStoredUserText(detail?.preview || "") ||
    summary?.name || visibleStoredUserText(summary?.preview || "") ||
    liveTask?.userMessage || "대화";
}

function renderThreadChrome() {
  const codex = codexThreadsAvailable();
  const history = codex && state.threadView === "history";
  const hasThread = codex && Boolean(selectedConversationId());

  for (const element of document.querySelectorAll(".codex-only")) {
    element.classList.toggle("hidden", !codex);
  }
  for (const element of document.querySelectorAll(".thread-only")) {
    element.classList.toggle("hidden", !codex);
  }
  dom.threadMenuButton.classList.toggle("hidden", !hasThread || history);
  if (!hasThread || history) closeThreadMenu();
  dom.historyButton.classList.toggle("hidden", !codex || history);
  document.querySelector(".title-row")?.classList.toggle("hidden", history);
  dom.projectTitle.textContent = history ? "최근 대화" : threadTitle();
  dom.historyPanel.classList.toggle("hidden", !history);
  dom.conversationPanel.classList.toggle("hidden", history);
  document.querySelector(".composer")?.classList.toggle("hidden", history);
  if (history) dom.scrollToBottomButton.classList.add("hidden");
  renderThreadList();
}

function renderThreadList() {
  if (state.threadView !== "history") return;
  const signature = JSON.stringify({
    threads: state.threads,
    nextCursor: state.threadsNextCursor,
  });
  if (state.threadListSignature === signature) return;
  state.threadListSignature = signature;
  if (!state.threads.length) {
    dom.threadList.replaceChildren(
      textElement("p", "이 프로젝트에 저장된 Codex 대화가 없습니다.", "history-empty"),
    );
  } else {
    dom.threadList.replaceChildren(...state.threads.map((thread) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "thread-row";
      const visiblePreview = visibleStoredUserText(thread.preview || "") || "내용 없음";
      const displayName = thread.name || visiblePreview || "새 대화";
      const showPreview = Boolean(
        thread.name && visiblePreview &&
        !visiblePreview.startsWith(thread.name) && !thread.name.startsWith(visiblePreview),
      );
      button.append(textElement("strong", displayName));
      if (showPreview) button.append(textElement("span", visiblePreview, "thread-preview"));
      button.append(textElement("time", formatThreadDate(thread.recencyAt || thread.updatedAt)));
      button.addEventListener("click", () => {
        vscode.postMessage({
          type: "openThread",
          projectId: state.selectedProjectId,
          threadId: thread.threadId,
        });
      });
      return button;
    }));
  }
  dom.loadMoreThreadsButton.classList.toggle("hidden", !state.threadsNextCursor);
}

function formatThreadDate(value) {
  if (!value) return "";
  const numeric = Number(value);
  const date = Number.isFinite(numeric)
    ? new Date(numeric < 10_000_000_000 ? numeric * 1000 : numeric)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function renderTasks() {
  const selection = currentThreadSelection();
  const selectedTasks = tasksForThreadSelection(selection);
  const storedTasks = storedThreadTasks(selection);
  const storedTurnIds = new Set(storedTasks.map((task) => task.turnId).filter(Boolean));
  const optimisticTasks = state.optimisticTurns
    .filter((turn) => turn.projectId === state.selectedProjectId)
    .filter((turn) => (
      selection.mode === "auto" ||
      (selection.mode === "new" && (!selection.requestId || turn.requestId === selection.requestId))
    ))
    .map((turn) => ({
      taskId: `optimistic-${turn.requestId}`,
      projectId: turn.projectId,
      clientTaskId: turn.requestId,
      status: "queued",
      createdAt: turn.createdAt,
      updatedAt: turn.createdAt,
      userMessage: turn.note,
      origin: "vscode",
      attachments: [],
      inputReferences: turn.inputReferences || [],
      activityItems: [],
      optimistic: true,
    }));
  const visibleTasks = [
    ...storedTasks,
    ...selectedTasks.filter((task) => !task.turnId || !storedTurnIds.has(task.turnId)),
    ...optimisticTasks,
  ];
  dom.emptyState.classList.toggle("hidden", visibleTasks.length > 0);
  const shouldFollow = nearDocumentBottom();
  const currentIds = new Set(visibleTasks.map((task) => task.taskId));

  for (const [taskId, cached] of turnNodes) {
    if (!currentIds.has(taskId)) {
      cached.node.remove();
      turnNodes.delete(taskId);
    }
  }

  for (const task of visibleTasks) {
    const signature = JSON.stringify([
      task,
      state.responseFeedback[responseFeedbackKey(task)] || null,
    ]);
    let cached = turnNodes.get(task.taskId);
    if (!cached || cached.signature !== signature) {
      const node = taskTurn(task);
      if (cached) cached.node.replaceWith(node);
      cached = { node, signature };
      turnNodes.set(task.taskId, cached);
    }
    dom.taskList.append(cached.node);
  }

  if (shouldFollow) {
    requestAnimationFrame(() => {
      scrollToDocumentBottom("auto");
      updateScrollToBottomButton();
    });
  } else {
    updateScrollToBottomButton();
  }
}

function tasksForThreadSelection(selection) {
  return state.tasks;
}

function storedThreadTasks(selection) {
  return [];
}

function storedTurnTask(turn) {
  if (!turn || !turn.id || !Array.isArray(turn.items)) return null;
  const userParts = [];
  const agentParts = [];
  const activityItems = [];
  for (const item of turn.items) {
    if (!item || typeof item !== "object") continue;
    if (item.type === "userMessage") {
      for (const content of item.content || []) {
        if (content?.type === "text" && content.text) {
          userParts.push(visibleStoredUserText(String(content.text)));
        }
      }
    } else if (item.type === "agentMessage" && item.text) {
      const visible = withoutStoredBridgeBlock(String(item.text));
      if (visible) agentParts.push(visible);
    } else {
      activityItems.push({
        itemId: item.id || `${turn.id}-${activityItems.length}`,
        type: item.type || "item",
        status: item.status || "completed",
        text: activityStoredText(item),
        output: item.aggregatedOutput || item.output || "",
        data: item,
      });
    }
  }
  const startedAt = epochToISOString(turn.startedAt) || new Date(0).toISOString();
  const completedAt = epochToISOString(turn.completedAt) || startedAt;
  return {
    taskId: `stored-${turn.id}`,
    turnId: turn.id,
    threadId: state.threadDetail.threadId,
    projectId: state.selectedProjectId,
    status: turn.status === "completed" ? "completed" : turn.status || "completed",
    createdAt: startedAt,
    updatedAt: completedAt,
    userMessage: userParts.join("\n\n").trim(),
    origin: "vscode",
    agentReply: agentParts.join("\n\n"),
    attachments: [],
    activityItems,
    stored: true,
  };
}

function visibleStoredUserText(text) {
  const answer = text.match(
    /^이전 질문에 대한 사용자의 답이다\.[\s\S]*?\n답:\s*([\s\S]*?)\n\n이 답을 반영해/,
  );
  if (answer) return answer[1].trim();

  const request = text.match(/(?:^|\n)요청:\n([\s\S]*?)(?:\n\n제약:|$)/);
  if (!request) return text.trim();
  const cleaned = request[1]
    .split("\n")
    .map((line) => line.replace(/^\s*\d+\.\s*/, ""))
    .join("\n")
    .trim();
  const added = cleaned.match(/사용자가 덧붙인 설명:\s*([\s\S]*)$/);
  if (added) return added[1].trim();
  if (cleaned.startsWith("첨부 이미지 1은")) {
    return "첨부한 화면과 드로잉을 기준으로 수정해줘.";
  }
  return cleaned;
}

function withoutStoredBridgeBlock(text) {
  const removed = text.replace(/```bridge\s*[\s\S]*?```/g, "");
  const open = removed.search(/(?:^|\n)```bridge(?:\s|$)/);
  return (open >= 0 ? removed.slice(0, open) : removed).trim();
}

function activityStoredText(item) {
  if (typeof item.text === "string") return item.text;
  if (Array.isArray(item.summary)) return item.summary.map((part) => (
    typeof part === "string" ? part : part?.text || ""
  )).filter(Boolean).join("\n");
  if (typeof item.command === "string") return item.command;
  if (typeof item.tool === "string") return item.tool;
  return "";
}

function epochToISOString(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return new Date(numeric < 10_000_000_000 ? numeric * 1000 : numeric).toISOString();
}

function taskTurn(task) {
  const turn = document.createElement("article");
  turn.className = "turn";
  turn.dataset.taskId = task.taskId;

  if (task.regeneratedFromTaskId || task.regenerated_from_task_id) {
    const restart = document.createElement("div");
    restart.className = "restart-divider";
    restart.append(document.createElement("span"), textElement("strong", "다시 시작"), document.createElement("span"));
    turn.append(restart);
  }

  if (task.userMessage || task.attachments?.length || task.inputReferences?.length) {
    const user = document.createElement("section");
    user.className = "user-message";
    if (task.attachments?.length || task.inputReferences?.length) user.append(attachmentPreview(task));
    if (task.userMessage) user.append(textElement("div", task.userMessage, "user-bubble"));

    const userMeta = document.createElement("div");
    userMeta.className = "message-meta";
    userMeta.append(
      textElement("span", formatDate(task.createdAt)),
      textElement("span", task.origin === "vscode" ? "VS Code" : "iPad", "origin-badge"),
    );
    if (task.userMessage) {
      userMeta.append(iconButton("copy", "메시지 복사", (event) => {
        requestCopy(event.currentTarget, task.userMessage);
      }, "message-action"));
    }
    user.append(userMeta);
    turn.append(user);
  }

  if (task.origin === "ipad") appendClarificationTurns(turn, task);

  const assistant = document.createElement("section");
  assistant.className = "assistant-message";
  const log = workLog(task);
  if (log) assistant.append(log);

  if (task.agentReply) assistant.append(markdownResponse(task.agentReply, task.projectId));
  if (task.error) assistant.append(textElement("div", task.error, "assistant-copy task-error"));
  if (task.origin === "ipad" && task.questions?.length) assistant.append(questionList(task));
  if (task.changedFiles?.length) assistant.append(filesCard(task));

  if (task.agentReply) {
    const footer = document.createElement("div");
    footer.className = "response-footer";
    const actions = document.createElement("nav");
    actions.className = "response-actions";
    actions.setAttribute("aria-label", "답변 작업");
    const responseKey = responseFeedbackKey(task);
    if (canRegenerateTask(task)) {
      const regenerate = iconButton("refresh", "답변 다시 생성", () => {
        regenerateTask(task);
      }, "response-action");
      regenerate.disabled = state.regeneratePendingTaskId === task.taskId || hasActiveTask();
      regenerate.classList.toggle("pending", state.regeneratePendingTaskId === task.taskId);
      actions.append(regenerate);
    }
    actions.append(iconButton("copy", "답변 복사", (event) => {
      requestCopy(event.currentTarget, task.agentReply);
    }, "response-action"));
    actions.append(responseFeedbackButton("thumb-up", "좋아요", responseKey, "like"));
    actions.append(responseFeedbackButton("thumb-down", "싫어요", responseKey, "dislike"));
    actions.append(iconButton("expand", "답변 크게 열기", () => {
      vscode.postMessage({
        type: "openResponse",
        text: task.agentReply,
        title: task.userMessage || threadTitle(),
      });
    }, "response-action"));
    footer.append(actions, assistantMetadata(task));
    assistant.append(footer);
  }
  turn.append(assistant);
  return turn;
}

function canRegenerateTask(task) {
  return Boolean(
    !task?.stored &&
    !ACTIVE_STATUSES.has(task.status) &&
    (task.threadId || task.sessionId),
  );
}

function assistantMetadata(task) {
  const meta = document.createElement("div");
  meta.className = "assistant-meta";
  const parts = [formatDate(task.completedAt || task.updatedAt)];
  const model = taskModelLabel(task);
  if (model) parts.push(model);
  const usage = usageLabel(task.usage);
  if (usage) parts.push(usage);
  meta.textContent = parts.filter(Boolean).join(" · ");
  return meta;
}

function taskModelLabel(task) {
  if (task.agentModel) {
    const agent = state.agents.find((candidate) => candidate.agentId === task.agentId);
    const option = agent?.models?.find((candidate) => candidate.value === task.agentModel);
    return option?.label || task.agentModel;
  }
  const agent = state.agents.find((candidate) => candidate.agentId === task.agentId);
  return shortAgentName(agent) || task.agentId || "로컬 CLI";
}

function usageLabel(usage) {
  if (!usage) return "";
  const labels = [];
  const tokens = Number(usage.totalTokens);
  if (Number.isFinite(tokens) && tokens > 0) {
    labels.push(`${new Intl.NumberFormat("ko-KR").format(tokens)} tokens`);
    const output = Number(usage.outputTokens);
    if (Number.isFinite(output) && output > 0 && output < tokens) {
      labels.push(`출력 ${new Intl.NumberFormat("ko-KR").format(output)}`);
    }
  }
  const cost = Number(usage.costUsd);
  if (Number.isFinite(cost) && cost > 0) {
    labels.push(`$${cost.toFixed(cost < 0.01 ? 4 : 2)}`);
  }
  return labels.join(" · ");
}

function appendClarificationTurns(turn, task) {
  for (const clarification of task.clarificationTurns || task.clarification_turns || []) {
    const questionText = typeof clarification.question === "string"
      ? clarification.question
      : clarification.question?.text || "";
    const assistantReply = clarification.assistantReply || clarification.assistant_reply || "";
    const assistant = document.createElement("section");
    assistant.className = "assistant-message clarification-message";
    if (assistantReply) assistant.append(markdownResponse(assistantReply, task.projectId));
    if (questionText) {
      assistant.append(textElement("p", questionText, "clarification-question"));
    }
    if (assistantReply || questionText) {
      const copyValue = assistantReply
        ? `${assistantReply}${questionText ? `\n\n${questionText}` : ""}`
        : questionText;
      const actions = document.createElement("nav");
      actions.className = "response-actions";
      actions.setAttribute("aria-label", "확인 질문 작업");
      actions.append(iconButton("copy", "확인 질문 복사", (event) => {
        requestCopy(event.currentTarget, copyValue);
      }, "response-action"));
      assistant.append(actions);
      turn.append(assistant);
    }

    if (!clarification.answer) continue;
    const user = document.createElement("section");
    user.className = "user-message clarification-answer";
    user.append(textElement("div", clarification.answer, "user-bubble"));
    const meta = document.createElement("div");
    meta.className = "message-meta";
    meta.append(
      textElement("span", formatDate(clarification.answeredAt || clarification.answered_at)),
      textElement("span", "선택 답변", "origin-badge"),
      iconButton("copy", "답변 복사", (event) => {
        requestCopy(event.currentTarget, clarification.answer);
      }, "message-action"),
    );
    user.append(meta);
    turn.append(user);
  }
}

function workLog(task) {
  const active = ACTIVE_STATUSES.has(task.status);
  const items = task.activityItems || task.activity_items || [];
  if (!active && task.status === "completed") return null;
  const elapsed = `${formatDuration(task.createdAt, task.completedAt || task.updatedAt)} 동안 작업함`;
  const label = active
    ? statusDescription(task.status)
    : task.status === "cancelled"
      ? `${elapsed} · 중단됨`
      : elapsed;

  if (!items.length) {
    const row = document.createElement("div");
    row.className = "work-summary";
    if (active) row.append(spinner());
    row.append(textElement("span", label));
    return row;
  }

  const details = document.createElement("details");
  details.className = "work-log";
  details.open = active;
  const summary = document.createElement("summary");
  if (active) summary.append(spinner());
  summary.append(textElement("span", label), icon("chevron"));
  details.append(summary);
  const activity = document.createElement("div");
  activity.className = "activity-list";
  for (const item of items) activity.append(activityRow(item));
  details.append(activity);
  return details;
}

function activityRow(item) {
  const row = document.createElement("div");
  row.className = `activity-row activity-${safeClass(item.kind || item.type || "item")}`;
  const kind = item.kind || item.type || "item";
  const title = activityTitle(item, kind);
  const heading = document.createElement("div");
  heading.className = "activity-heading";
  heading.append(icon(activityIcon(kind)), textElement("span", title));
  row.append(heading);
  const detail = item.detail || item.output || "";
  if (detail && detail !== title) row.append(textElement("pre", detail, "activity-detail"));
  return row;
}

function activityTitle(item, kind) {
  if (item.title || item.summary || item.text) {
    return item.title || item.summary || item.text;
  }
  const data = item.data || {};
  if (kind === "commandExecution" || kind === "command") {
    const command = Array.isArray(data.command) ? data.command.join(" ") : data.command;
    return command ? String(command) : activityLabel(kind);
  }
  if (kind === "fileChange" && Array.isArray(data.changes)) {
    const paths = data.changes.map((change) => change.path).filter(Boolean);
    if (paths.length) return `${paths.length}개 파일을 수정했습니다`;
  }
  if (["mcpToolCall", "dynamicToolCall", "collabToolCall"].includes(kind)) {
    return String(data.tool || data.name || activityLabel(kind));
  }
  return activityLabel(kind);
}

function activityLabel(kind) {
  return {
    reasoning: "작업 방향을 검토했습니다",
    command: "명령을 실행했습니다",
    commandExecution: "명령을 실행했습니다",
    tool: "도구를 사용했습니다",
    mcpToolCall: "도구를 사용했습니다",
    dynamicToolCall: "도구를 사용했습니다",
    collabToolCall: "도구를 사용했습니다",
    fileChange: "파일을 수정했습니다",
    plan: "작업 계획을 갱신했습니다",
  }[kind] || "작업을 진행했습니다";
}

function activityIcon(kind) {
  if (kind === "command" || kind === "commandExecution") return "terminal";
  if (kind === "fileChange") return "file";
  return "spark";
}

function attachmentPreview(task) {
  const collection = document.createElement("div");
  collection.className = "user-attachments";
  const preview = document.createElement("figure");
  preview.className = "user-attachment";
  const stack = document.createElement("div");
  stack.className = "attachment-stack";
  const rendered = (task.attachments || []).filter((item) => item.kind === "rendered_view");
  const drawings = (task.attachments || []).filter((item) => item.kind === "drawing_overlay");
  const references = (task.attachments || []).filter((item) => item.kind === "reference_image");
  const ordered = [...rendered, ...drawings];
  for (const [index, item] of ordered.entries()) {
    const image = document.createElement("img");
    image.src = new URL(item.url, `${state.configuration.url}/`).href;
    image.alt = item.kind === "drawing_overlay" ? "iPad 드로잉" : "iPad에서 본 화면";
    image.className = item.kind === "drawing_overlay" && rendered.length
      ? "attachment-overlay"
      : "attachment-base";
    image.loading = index === 0 ? "eager" : "lazy";
    stack.append(image);
  }
  if (ordered.length) {
    preview.append(stack, textElement("figcaption", "iPad 화면 · 드로잉", "attachment-label"));
    collection.append(preview);
  }
  for (const item of references) {
    const figure = document.createElement("figure");
    figure.className = "reference-attachment";
    const image = document.createElement("img");
    image.src = new URL(item.url, `${state.configuration.url}/`).href;
    image.alt = item.name || "참조 이미지";
    image.loading = "lazy";
    figure.append(image, textElement("figcaption", item.name || "참조 이미지"));
    collection.append(figure);
  }
  for (const item of task.inputReferences || []) {
    if (item.kind === "image" && references.length) continue;
    collection.append(attachmentChip(item, false));
  }
  return collection;
}

function attachmentChip(item, removable) {
  const chip = document.createElement("div");
  chip.className = `attachment-chip attachment-${item.kind || "file"}`;
  chip.append(icon(item.kind === "image" ? "image" : "file"));
  const copy = document.createElement("span");
  copy.className = "attachment-chip-copy";
  copy.append(
    textElement("strong", item.name || item.relativePath || "첨부 파일"),
    textElement("span", item.kind === "image" ? "이미지" : item.relativePath || "프로젝트 파일"),
  );
  chip.append(copy);
  if (removable) {
    chip.append(iconButton("close", `${item.name || "첨부 파일"} 제거`, () => {
      state.draftAttachments = state.draftAttachments.filter(
        (attachment) => attachment.path !== item.path,
      );
      persistViewState();
      renderComposer();
    }, "attachment-remove"));
  }
  return chip;
}

function renderDraftAttachments() {
  dom.attachmentTray.replaceChildren(
    ...state.draftAttachments.map((attachment) => attachmentChip(attachment, true)),
  );
  dom.attachmentTray.classList.toggle("hidden", !state.draftAttachments.length);
}

function filesCard(task) {
  const files = task.changedFiles;
  const card = document.createElement("section");
  card.className = "files-card";
  const heading = document.createElement("div");
  heading.className = "files-heading";
  const totals = files.reduce(
    (value, file) => ({
      additions: value.additions + (file.additions || 0),
      deletions: value.deletions + (file.deletions || 0),
    }),
    { additions: 0, deletions: 0 },
  );
  const title = document.createElement("div");
  title.className = "files-title";
  title.append(
    textElement("span", `파일 ${files.length}개를 편집함`),
    changeStats(totals.additions, totals.deletions),
  );
  const controls = document.createElement("div");
  controls.className = "file-controls";
  const undo = textButton(task.undone ? "실행 취소됨" : "실행 취소", "file-action");
  undo.disabled = !task.reviewAvailable || task.undone;
  undo.addEventListener("click", () => {
    vscode.postMessage({
      type: "undoTask",
      taskId: task.taskId,
      projectId: task.projectId,
    });
  });
  const review = textButton("리뷰", "file-action review-action");
  review.disabled = !task.reviewAvailable;
  review.addEventListener("click", () => {
    vscode.postMessage({ type: "reviewTask", taskId: task.taskId });
  });
  controls.append(undo, review);
  heading.append(title, controls);
  card.append(heading);
  for (const file of files) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "file-row";
    row.append(
      textElement("span", file.path, "file-path"),
      changeStats(file.additions || 0, file.deletions || 0),
    );
    row.addEventListener("click", () => {
      vscode.postMessage({
        type: "openTaskFile",
        taskId: task.taskId,
        path: file.path,
      });
    });
    card.append(row);
  }
  return card;
}

function changeStats(additions, deletions) {
  const stats = document.createElement("span");
  stats.className = "change-stats";
  stats.append(
    textElement("span", `+${additions}`, "additions"),
    textElement("span", `-${deletions}`, "deletions"),
  );
  return stats;
}

function markdownResponse(source, projectId) {
  const root = document.createElement("div");
  root.className = "assistant-copy";
  const lines = String(source).replace(/\r\n?/g, "\n").split("\n");
  let paragraph = [];
  let list = null;
  let listKind = "";

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const block = document.createElement("p");
    block.className = "response-paragraph";
    appendInline(block, paragraph.join("\n"), projectId);
    root.append(block);
    paragraph = [];
  };
  const resetList = () => {
    list = null;
    listKind = "";
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fence = line.match(/^\s*```([^`]*)$/);
    if (fence) {
      flushParagraph();
      resetList();
      const codeLines = [];
      index += 1;
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      root.append(codeBlock(codeLines.join("\n"), fence[1].trim()));
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      resetList();
      continue;
    }
    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      flushParagraph();
      resetList();
      root.append(document.createElement("hr"));
      continue;
    }
    if (
      line.includes("|") &&
      index + 1 < lines.length &&
      /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1])
    ) {
      flushParagraph();
      resetList();
      const tableLines = [line];
      index += 2;
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        tableLines.push(lines[index]);
        index += 1;
      }
      index -= 1;
      root.append(markdownTable(tableLines, projectId));
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      resetList();
      const title = document.createElement(`h${Math.min(heading[1].length + 1, 5)}`);
      title.className = "response-heading";
      appendInline(title, heading[2], projectId);
      root.append(title);
      continue;
    }
    const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const kind = ordered ? "ol" : "ul";
      if (!list || listKind !== kind) {
        list = document.createElement(kind);
        list.className = "response-list";
        root.append(list);
        listKind = kind;
      }
      const item = document.createElement("li");
      const content = (ordered || unordered)[1];
      const taskItem = content.match(/^\[([ xX])\]\s+(.+)$/);
      if (taskItem) {
        item.className = "task-list-item";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = taskItem[1].toLowerCase() === "x";
        checkbox.disabled = true;
        checkbox.setAttribute("aria-label", checkbox.checked ? "완료" : "미완료");
        item.append(checkbox);
        appendInline(item, taskItem[2], projectId);
      } else {
        appendInline(item, content, projectId);
      }
      list.append(item);
      continue;
    }
    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      resetList();
      const block = document.createElement("blockquote");
      appendInline(block, quote[1], projectId);
      root.append(block);
      continue;
    }
    resetList();
    paragraph.push(line);
  }
  flushParagraph();
  return root;
}

function markdownTable(lines, projectId) {
  const wrapper = document.createElement("div");
  wrapper.className = "table-scroll";
  const table = document.createElement("table");
  const header = document.createElement("thead");
  const headerRow = document.createElement("tr");
  for (const cell of tableCells(lines[0])) {
    const heading = document.createElement("th");
    appendInline(heading, cell, projectId);
    headerRow.append(heading);
  }
  header.append(headerRow);
  table.append(header);
  if (lines.length > 1) {
    const body = document.createElement("tbody");
    for (const line of lines.slice(1)) {
      const row = document.createElement("tr");
      for (const cell of tableCells(line)) {
        const value = document.createElement("td");
        appendInline(value, cell, projectId);
        row.append(value);
      }
      body.append(row);
    }
    table.append(body);
  }
  wrapper.append(table);
  return wrapper;
}

function tableCells(line) {
  return String(line)
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replace(/\\\|/g, "|"));
}

function codeBlock(text, language) {
  const wrapper = document.createElement("div");
  wrapper.className = "code-block";
  const header = document.createElement("div");
  header.className = "code-header";
  header.append(
    textElement("span", codeLanguageLabel(language)),
    iconButton("copy", "코드 복사", (event) => {
      requestCopy(event.currentTarget, text);
    }, "code-copy"),
  );
  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.textContent = text;
  if (language) code.dataset.language = language;
  pre.append(code);
  wrapper.append(header, pre);
  return wrapper;
}

function codeLanguageLabel(language) {
  const original = String(language || "").trim();
  const normalized = original.toLowerCase();
  if (!normalized || ["text", "txt", "plain", "plaintext"].includes(normalized)) {
    return "일반 텍스트";
  }
  return original;
}

function appendInline(parent, source, projectId) {
  const pattern = /\*\*([^*]+)\*\*|__([^_]+)__|~~([^~]+)~~|(?<!\*)\*([^*]+)\*(?!\*)|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;
  let cursor = 0;
  for (const match of source.matchAll(pattern)) {
    if (match.index > cursor) {
      parent.append(document.createTextNode(source.slice(cursor, match.index)));
    }
    if (match[1] != null || match[2] != null) {
      const strong = document.createElement("strong");
      appendInline(strong, match[1] ?? match[2], projectId);
      parent.append(strong);
    } else if (match[3] != null) {
      const deleted = document.createElement("del");
      appendInline(deleted, match[3], projectId);
      parent.append(deleted);
    } else if (match[4] != null) {
      const emphasis = document.createElement("em");
      appendInline(emphasis, match[4], projectId);
      parent.append(emphasis);
    } else if (match[5] != null) {
      parent.append(textElement("code", match[5], "inline-code"));
    } else {
      const link = textButton(match[6], "response-link");
      link.title = match[7];
      link.addEventListener("click", () => {
        vscode.postMessage({
          type: "openLink",
          target: match[7],
          projectId: projectId || state.selectedProjectId,
        });
      });
      parent.append(link);
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < source.length) parent.append(document.createTextNode(source.slice(cursor)));
}

function questionList(task) {
  const wrapper = document.createElement("section");
  wrapper.className = "questions";
  for (const question of task.questions) {
    const key = questionKey(task.taskId, question.questionId);
    const block = document.createElement("div");
    block.className = "question";
    block.append(textElement("strong", question.text, "question-title"));
    const options = document.createElement("div");
    options.className = "question-options";
    for (const option of question.options || []) {
      const button = textButton(option.label, "option-button");
      button.addEventListener("click", () => {
        submitQuestionAnswer(task, question, { optionId: option.optionId }, block);
      });
      options.append(button);
    }
    block.append(options);

    const custom = document.createElement("form");
    custom.className = "question-custom";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "직접 입력";
    input.setAttribute("aria-label", `${question.text}에 직접 답변`);
    const send = iconButton("send", "직접 입력 전송", null, "question-send");
    send.type = "submit";
    custom.append(input, send);
    custom.addEventListener("submit", (event) => {
      event.preventDefault();
      const freeText = input.value.trim();
      if (!freeText) return;
      submitQuestionAnswer(task, question, { optionId: null, freeText }, block);
    });
    const status = textElement("p", "", "question-status hidden");
    status.setAttribute("role", "status");
    block.append(custom, status);
    renderQuestionState(block, key);
    wrapper.append(block);
  }
  return wrapper;
}

function disableQuestion(block) {
  for (const control of block.querySelectorAll("button, input")) control.disabled = true;
}

function enableQuestion(block) {
  for (const control of block.querySelectorAll("button, input")) control.disabled = false;
}

function questionKey(taskId, questionId) {
  return `${taskId}:${questionId}`;
}

function submitQuestionAnswer(task, question, answer, block) {
  const key = questionKey(task.taskId, question.questionId);
  if (state.pendingAnswers.has(key)) return;
  const requestId = crypto.randomUUID();
  state.questionErrors.delete(key);
  state.pendingAnswers.set(key, {
    key,
    requestId,
    taskId: task.taskId,
    questionId: question.questionId,
    accepted: false,
  });
  renderQuestionState(block, key);
  vscode.postMessage({
    type: "answer",
    requestId,
    projectId: task.projectId || state.selectedProjectId,
    taskId: task.taskId,
    questionId: question.questionId,
    ...answer,
  });
}

function renderQuestionState(block, key) {
  const pending = state.pendingAnswers.get(key);
  const error = state.questionErrors.get(key);
  const status = block.querySelector(".question-status");
  if (pending) {
    disableQuestion(block);
    block.classList.add("pending");
    status.textContent = pending.accepted ? "답변을 반영하는 중…" : "답변을 전송하는 중…";
    status.className = "question-status pending";
  } else {
    enableQuestion(block);
    block.classList.remove("pending");
    status.textContent = error || "";
    status.className = `question-status${error ? " error" : " hidden"}`;
  }
}

function pendingAnswerForRequest(requestId) {
  return [...state.pendingAnswers.values()].find((pending) => pending.requestId === requestId);
}

function reconcilePendingAnswers() {
  const available = new Set();
  for (const task of state.tasks) {
    for (const question of task.questions || []) {
      available.add(questionKey(task.taskId, question.questionId));
    }
  }
  for (const key of state.pendingAnswers.keys()) {
    if (!available.has(key)) state.pendingAnswers.delete(key);
  }
  for (const key of state.questionErrors.keys()) {
    if (!available.has(key)) state.questionErrors.delete(key);
  }
}

function renderComposer() {
  const project = selectedProject();
  const activeTask = state.tasks.findLast((task) => ACTIVE_STATUSES.has(task.status));
  const active = Boolean(activeTask) || state.optimisticTurns.some((turn) => turn.projectId === state.selectedProjectId);
  const inputDisabled = !state.connected || !project || project.status === "unavailable";
  renderDraftAttachments();
  dom.promptInput.disabled = inputDisabled;
  dom.attachButton.disabled = inputDisabled || Boolean(state.attachmentRequestId);
  const hasUsableAgent = state.agents.some((agent) => (
    ["codex-cli", "claude-code"].includes(agent.agentId) && agent.usable
  ));
  dom.agentButton.disabled = inputDisabled || !hasUsableAgent;
  dom.approvalButton.disabled = inputDisabled;
  const mode = activeTask ? "stop" : "send";
  if (dom.sendButton.dataset.mode !== mode) {
    dom.sendButton.dataset.mode = mode;
    dom.sendButton.replaceChildren(mode === "stop" ? textElement("span", "", "stop-glyph") : icon("send"));
  }
  dom.sendButton.classList.toggle("is-stop", mode === "stop");
  dom.sendButton.setAttribute("aria-label", mode === "stop" ? "작업 중단" : "전송");
  dom.sendButton.title = mode === "stop" ? "작업 중단" : "전송";
  dom.sendButton.disabled = inputDisabled || (mode === "stop"
    ? state.cancelPendingTaskId === activeTask?.taskId
    : active || state.pendingRequestId || (!dom.promptInput.value.trim() && !state.draftAttachments.length));
  dom.modelSelect.disabled = Number(dom.modelSelect.dataset.optionCount || 0) <= 1;
  dom.effortSelect.disabled = Number(dom.effortSelect.dataset.optionCount || 0) <= 1;
  dom.speedSelect.disabled = Number(dom.speedSelect.dataset.optionCount || 0) <= 1;
  dom.composerHint.textContent = active
    ? "로컬에서 작업 · 다음 요청을 미리 입력할 수 있습니다"
    : state.pendingRequestId
      ? "요청을 전송하는 중…"
      : "로컬에서 작업 · / 명령 · @ 컨텍스트";
  dom.chatInputContainer.classList.toggle("working", active);
  positionScrollToBottomButton();
}

function selectedProject() {
  return state.projects.find((project) => project.projectId === state.selectedProjectId);
}

function selectedConversationId() {
  return state.selectedProjectId
    ? state.selectedConversationIds[state.selectedProjectId] || null
    : null;
}

function conversationAgentKey() {
  return selectedConversationId() || state.selectedProjectId || "default";
}

function selectedAgentId() {
  const project = selectedProject();
  return state.selectedAgents[conversationAgentKey()] || project?.agent || "codex-cli";
}

function resizeComposer() {
  dom.promptInput.style.height = "auto";
  dom.promptInput.style.height = `${Math.min(dom.promptInput.scrollHeight, 180)}px`;
}

function schedulePoll() {
  clearTimeout(state.pollTimer);
  if (document.visibilityState !== "visible") return;
  const active = state.tasks.some((task) => ACTIVE_STATUSES.has(task.status));
  const streamConnected = state.eventSocket?.readyState === WebSocket.OPEN;
  const delay = streamConnected
    ? (active ? 5_000 : 30_000)
    : (active ? 900 : 5_000);
  state.pollTimer = setTimeout(() => {
    refresh();
    schedulePoll();
  }, delay);
}

function connectEventStream() {
  if (
    state.eventSocket &&
    [WebSocket.CONNECTING, WebSocket.OPEN].includes(state.eventSocket.readyState)
  ) return;
  clearTimeout(state.eventReconnectTimer);
  let endpoint;
  try {
    endpoint = new URL("/api/v1/events", `${state.configuration.url}/`);
    endpoint.protocol = endpoint.protocol === "https:" ? "wss:" : "ws:";
  } catch {
    return;
  }

  const socket = new WebSocket(endpoint.href);
  state.eventSocket = socket;
  socket.addEventListener("message", (event) => {
    let payload;
    try {
      payload = JSON.parse(event.data);
    } catch {
      return;
    }
    if (payload.type === "ping") return;
    if (payload.projectId && payload.projectId !== state.selectedProjectId) return;
    if (!state.eventRefreshTimer) {
      state.eventRefreshTimer = setTimeout(() => {
        state.eventRefreshTimer = null;
        refresh();
      }, 55);
    }
  });
  socket.addEventListener("close", () => {
    if (state.eventSocket === socket) state.eventSocket = null;
    if (document.visibilityState === "visible") {
      state.eventReconnectTimer = setTimeout(connectEventStream, 1500);
    }
  });
  socket.addEventListener("error", () => socket.close());
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    refresh();
    schedulePoll();
    connectEventStream();
  } else {
    clearTimeout(state.pollTimer);
  }
});

let scrollUpdateFrame = null;
window.addEventListener("scroll", () => {
  if (scrollUpdateFrame) return;
  scrollUpdateFrame = requestAnimationFrame(() => {
    scrollUpdateFrame = null;
    updateScrollToBottomButton();
  });
}, { passive: true });
window.addEventListener("resize", () => {
  positionScrollToBottomButton();
  updateScrollToBottomButton();
});

function nearDocumentBottom() {
  return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 72;
}

function scrollToDocumentBottom(behavior = "auto") {
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior });
}

function updateScrollToBottomButton() {
  const hasConversation = state.tasks.length > 0 || state.optimisticTurns.some(
    (turn) => turn.projectId === state.selectedProjectId,
  );
  dom.scrollToBottomButton.classList.toggle(
    "hidden",
    !hasConversation || nearDocumentBottom(),
  );
  positionScrollToBottomButton();
}

function positionScrollToBottomButton() {
  const composer = document.querySelector(".composer");
  if (!composer) return;
  dom.scrollToBottomButton.style.bottom = `${Math.ceil(composer.getBoundingClientRect().height) + 24}px`;
}

function spinner() {
  const element = document.createElement("span");
  element.className = "spinner";
  element.setAttribute("aria-hidden", "true");
  return element;
}

function textElement(tag, text, className = "") {
  const element = document.createElement(tag);
  element.textContent = text == null ? "" : String(text);
  if (className) element.className = className;
  return element;
}

function textButton(text, className = "") {
  const button = textElement("button", text, className);
  button.type = "button";
  return button;
}

function iconButton(name, label, handler, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.title = label;
  button.setAttribute("aria-label", label);
  button.append(icon(name));
  if (handler) button.addEventListener("click", handler);
  return button;
}

function responseFeedbackKey(task) {
  const projectId = task.projectId || state.selectedProjectId || "project";
  const threadId = task.threadId || task.sessionId || "";
  const turnId = task.turnId || "";
  if (threadId && turnId) return `${projectId}:thread:${threadId}:turn:${turnId}`;
  return `${projectId}:task:${task.taskId}`;
}

function responseFeedbackButton(name, label, responseKey, feedback) {
  const selected = state.responseFeedback[responseKey] === feedback;
  const button = iconButton(name, label, () => {
    vscode.postMessage({
      type: "setResponseFeedback",
      responseKey,
      feedback: selected ? null : feedback,
    });
  }, "response-action response-feedback");
  button.setAttribute("aria-pressed", String(selected));
  return button;
}

function requestCopy(button, value) {
  if (!button) return;
  const requestId = crypto.randomUUID();
  state.copyTargets.set(requestId, {
    button,
    label: button.getAttribute("aria-label") || button.title || "복사",
  });
  vscode.postMessage({ type: "copyText", requestId, text: value });
}

function completeCopy(requestId) {
  const target = state.copyTargets.get(requestId);
  if (!target) return;
  state.copyTargets.delete(requestId);
  const { button, label } = target;
  if (!button.isConnected) return;
  clearTimeout(button.copyFeedbackTimer);
  button.classList.add("copy-confirmed");
  button.replaceChildren(icon("check"));
  button.title = "복사됨";
  button.setAttribute("aria-label", "복사됨");
  button.copyFeedbackTimer = setTimeout(() => {
    if (!button.isConnected) return;
    button.classList.remove("copy-confirmed");
    button.replaceChildren(icon("copy"));
    button.title = label;
    button.setAttribute("aria-label", label);
  }, 1500);
}

function icon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("icon");
  const definitions = {
    copy: ["M8 8h11v11H8z", "M5 16H4V5h11v1"],
    chevron: ["m9 6 6 6-6 6"],
    send: ["m5 12 7-7 7 7", "M12 19V5"],
    terminal: ["m5 7 4 4-4 4", "M11 15h8"],
    file: ["M6 3h8l4 4v14H6z", "M14 3v5h5"],
    image: ["M4 5h16v14H4z", "m5 16 4-4 3 3 3-4 4 5", "M15.5 8.5h.01"],
    close: ["M6 6l12 12", "M18 6 6 18"],
    check: ["m5 12 4 4L19 6"],
    "thumb-up": ["M7 10v10H3V10z", "M7 18h10.2a2 2 0 0 0 2-1.7l1-6A2 2 0 0 0 18.2 8H14l.6-3a2.3 2.3 0 0 0-4.2-1.6L7 10"],
    "thumb-down": ["M7 14V4H3v10z", "M7 6h10.2a2 2 0 0 1 2 1.7l1 6a2 2 0 0 1-2 2.3H14l.6 3a2.3 2.3 0 0 1-4.2 1.6L7 14"],
    expand: ["M14 5h5v5", "m19 5-6 6", "M10 19H5v-5", "m5 19 6-6"],
    refresh: ["M20 6v5h-5", "M19 11a7.5 7.5 0 1 0 .2 4.3"],
    shield: ["M12 3 19 6v5c0 4.5-2.8 7.5-7 10-4.2-2.5-7-5.5-7-10V6z"],
    warning: ["M12 3 22 20H2z", "M12 9v4", "M12 17h.01"],
    rocket: ["M14 5c2.5-2.5 5-2 7-2-0 2 .5 4.5-2 7l-5 5-5-5z", "M9 10 5 11l-2 4 5-1", "M14 15l-1 5 4-2 1-4"],
    spark: ["m12 3 1.3 4.7L18 9l-4.7 1.3L12 15l-1.3-4.7L6 9l4.7-1.3z"],
  };
  for (const data of definitions[name] || definitions.spark) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", data);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.8");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.append(path);
  }
  return svg;
}

function safeClass(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "-");
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDuration(start, end) {
  const milliseconds = Math.max(0, new Date(end) - new Date(start));
  const seconds = Math.max(1, Math.round(milliseconds / 1000));
  if (seconds < 60) return `${seconds}초`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}분 ${remainder}초` : `${minutes}분`;
}

function statusDescription(status) {
  return {
    queued: "작업을 준비하고 있습니다",
    interpreting: "요청을 이해하고 있습니다",
    resolving_session: "프로젝트 세션을 불러오고 있습니다",
    running_agent: "작업하고 있습니다",
    testing: "변경 사항을 확인하고 있습니다",
    awaiting_confirmation: "답변을 기다리고 있습니다",
    completed: "작업을 완료했습니다",
    failed: "작업에 실패했습니다",
    cancelled: "작업을 중단했습니다",
  }[status] || "작업 상태가 변경되었습니다";
}

vscode.postMessage({
  type: "ready",
  projectId: state.selectedProjectId,
  conversationId: selectedConversationId(),
});
schedulePoll();
connectEventStream();
