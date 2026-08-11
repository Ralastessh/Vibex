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

const state = {
  configuration: { url: "http://127.0.0.1:8787", managed: true },
  tailscale: { url: "http://vibex-pc:8788", ready: false, error: "" },
  connected: false,
  health: null,
  agents: [],
  projects: [],
  selectedProjectId: persistedState.selectedProjectId || null,
  runOptions: persistedState.runOptions || {},
  threadSelections: persistedState.threadSelections || {},
  threadView: "conversation",
  threads: [],
  threadsNextCursor: null,
  threadDetail: null,
  threadListSignature: null,
  tasks: [],
  error: "",
  pendingRequestId: null,
  optimisticTurns: [],
  pendingAnswers: new Map(),
  questionErrors: new Map(),
  copyTargets: new Map(),
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
    "cancelButton",
    "promptInput",
    "sendButton",
    "scrollToBottomButton",
    "composerHint",
    "selectedAgentLabel",
    "runtimeButton",
    "runtimePanel",
    "modelSelect",
    "effortSelect",
    "speedSelect",
    "backButton",
    "historyButton",
    "newThreadButton",
    "threadMenuButton",
    "threadMenu",
    "renameThreadButton",
    "archiveThreadButton",
    "historyPanel",
    "historyNewButton",
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
  state.tasks = [];
  state.threads = [];
  state.threadsNextCursor = null;
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
dom.sendButton.addEventListener("click", sendTask);
dom.promptInput.addEventListener("input", () => {
  resizeComposer();
  renderComposer();
});
dom.promptInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
    event.preventDefault();
    sendTask();
  }
});
dom.cancelButton.addEventListener("click", () => {
  const task = state.tasks.findLast((candidate) => ACTIVE_STATUSES.has(candidate.status));
  if (!task || state.cancelPendingTaskId) return;
  state.cancelPendingTaskId = task.taskId;
  state.cancelPendingProjectId = task.projectId;
  dom.cancelButton.disabled = true;
  vscode.postMessage({
    type: "cancel",
    requestId: crypto.randomUUID(),
    taskId: task.taskId,
    projectId: state.selectedProjectId,
  });
});
dom.scrollToBottomButton.addEventListener("click", () => {
  scrollToDocumentBottom("smooth");
});
dom.backButton.addEventListener("click", () => {
  if (state.threadView === "history") {
    state.threadView = "conversation";
    render();
  } else {
    openHistory();
  }
});
dom.historyButton.addEventListener("click", openHistory);
dom.newThreadButton.addEventListener("click", startNewThread);
dom.historyNewButton.addEventListener("click", startNewThread);
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
  const selection = currentThreadSelection();
  if (!selection.threadId) return;
  closeThreadMenu();
  vscode.postMessage({
    type: "renameThread",
    projectId: state.selectedProjectId,
    threadId: selection.threadId,
    name: threadTitle(),
  });
});
dom.archiveThreadButton.addEventListener("click", () => {
  const selection = currentThreadSelection();
  if (!selection.threadId) return;
  closeThreadMenu();
  vscode.postMessage({
    type: "archiveThread",
    projectId: state.selectedProjectId,
    threadId: selection.threadId,
  });
});
dom.runtimeButton.addEventListener("click", () => {
  if (dom.runtimeButton.disabled) return;
  const opening = dom.runtimePanel.classList.contains("hidden");
  dom.runtimePanel.classList.toggle("hidden", !opening);
  dom.runtimeButton.setAttribute("aria-expanded", String(opening));
  if (opening) requestAnimationFrame(() => dom.modelSelect.focus());
});

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
    state.tasks = message.tasks;
    const selection = currentThreadSelection();
    if (selection.mode === "new" && selection.requestId) {
      const materialized = state.tasks.find(
        (task) => task.clientTaskId === selection.requestId && task.threadId,
      );
      if (materialized) {
        state.threadSelections[state.selectedProjectId] = {
          mode: "resume",
          threadId: materialized.threadId,
          requestId: selection.requestId,
        };
      }
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
    const optimistic = state.optimisticTurns.find((turn) => turn.requestId === message.requestId);
    if (optimistic) {
      optimistic.accepted = true;
      optimistic.taskId = message.taskId || null;
    }
  } else if (message.type === "threadsLoaded") {
    if (message.projectId !== state.selectedProjectId) return;
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
    state.threadSelections[state.selectedProjectId] = {
      mode: "resume",
      threadId: message.thread.threadId,
      requestId: null,
    };
    state.threadView = "conversation";
    closeThreadMenu();
    persistViewState();
  } else if (message.type === "threadArchived") {
    if (message.projectId !== state.selectedProjectId) return;
    if (currentThreadSelection().threadId === message.threadId) startNewThread();
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
    state.error = message.message || "요청을 전송하지 못했습니다.";
  } else if (message.type === "copyTextCompleted") {
    completeCopy(message.requestId);
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
  });
}

function sendTask() {
  const note = dom.promptInput.value.trim();
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
    createdAt: new Date().toISOString(),
    accepted: false,
    taskId: null,
  });
  dom.promptInput.value = "";
  resizeComposer();
  vscode.postMessage({
    type: "sendTask",
    requestId: state.pendingRequestId,
    projectId: state.selectedProjectId,
    note,
    runOptions: selectedRunOptions(),
    threadMode: threadSelection.mode,
    threadId: threadSelection.threadId || null,
  });
  render();
  requestAnimationFrame(() => scrollToDocumentBottom("smooth"));
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
  const agent = state.agents.find((candidate) => candidate.agentId === project?.agent);
  dom.headerSubtitle.textContent = project
    ? `${agent?.displayName || "Local agent"} · ${project.status === "busy" ? "작업 중" : "로컬에서 작업"}`
    : "iPad · VS Code";
}

function renderAgents() {
  const project = selectedProject();
  const visibleAgents = state.agents.filter((agent) =>
    ["codex-cli", "claude-code"].includes(agent.agentId),
  );
  dom.agentSwitcher.replaceChildren(
    ...visibleAgents.map((agent) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `agent-button${project?.agent === agent.agentId ? " active" : ""}`;
      button.disabled = !project || !agent.usable || project.status === "busy";
      button.append(
        document.createTextNode(agent.displayName),
        textElement("span", agent.usable ? "Local CLI" : agent.note || "사용 불가"),
      );
      button.addEventListener("click", () => {
        if (!project) return;
        vscode.postMessage({
          type: "setAgent",
          projectId: project.projectId,
          agent: agent.agentId,
        });
      });
      return button;
    }),
  );
  const selectedAgent = visibleAgents.find((agent) => agent.agentId === project?.agent);
  dom.agentNote.textContent = project
    ? selectedAgent?.note || "프로젝트에서 사용할 로컬 에이전트를 선택하세요."
    : "";
}

function renderRunOptions() {
  const project = selectedProject();
  const agent = state.agents.find((candidate) => candidate.agentId === project?.agent);
  const saved = agent ? state.runOptions[agent.agentId] || {} : {};
  fillSelect(dom.modelSelect, agent?.models || [], saved.model);
  fillSelect(dom.effortSelect, agent?.efforts || [], saved.effort);
  fillSelect(dom.speedSelect, agent?.speedModes || [], saved.speedMode);

  const modelLabel = selectedOptionLabel(dom.modelSelect);
  const effortLabel = selectedOptionLabel(dom.effortSelect);
  const speedLabel = selectedOptionLabel(dom.speedSelect);
  const labels = [
    modelLabel && !modelLabel.startsWith("기본")
      ? modelLabel.replace(/^GPT-/, "")
      : agent?.displayName || "Agent",
  ];
  if (effortLabel && !effortLabel.startsWith("기본")) labels.push(effortLabel);
  if (speedLabel && !speedLabel.startsWith("기본")) labels.push(speedLabel);
  dom.selectedAgentLabel.textContent = labels.join(" · ");
  dom.runtimeButton.disabled = !project || !agent || hasActiveTask();
  if (dom.runtimeButton.disabled) closeRuntime();
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
  state.runOptions[project.agent] = selectedRunOptions();
  persistViewState();
  renderRunOptions();
}

function selectedRunOptions() {
  return {
    model: dom.modelSelect.value || "",
    effort: dom.effortSelect.value || "",
    speedMode: dom.speedSelect.value || "",
  };
}

function selectedOptionLabel(select) {
  return select.selectedOptions[0]?.textContent || "";
}

function persistViewState() {
  vscode.setState({
    selectedProjectId: state.selectedProjectId,
    runOptions: state.runOptions,
    threadSelections: state.threadSelections,
  });
}

function codexThreadsAvailable() {
  return selectedProject()?.agent === "codex-cli";
}

function currentThreadSelection() {
  const projectId = state.selectedProjectId;
  const saved = projectId ? state.threadSelections[projectId] : null;
  if (!saved || !["auto", "resume", "new"].includes(saved.mode)) {
    return { mode: "auto", threadId: null, requestId: null };
  }
  return {
    mode: saved.mode,
    threadId: saved.threadId || null,
    requestId: saved.requestId || null,
  };
}

function openHistory() {
  if (!codexThreadsAvailable() || !state.selectedProjectId) return;
  state.threadView = "history";
  closeSettings();
  closeRuntime();
  closeThreadMenu();
  vscode.postMessage({ type: "loadThreads", projectId: state.selectedProjectId });
  render();
}

function startNewThread() {
  if (!codexThreadsAvailable() || !state.selectedProjectId) return;
  state.threadSelections[state.selectedProjectId] = {
    mode: "new",
    threadId: null,
    requestId: null,
  };
  state.threadDetail = null;
  state.threadView = "conversation";
  state.error = "";
  turnNodes.clear();
  dom.taskList.replaceChildren();
  persistViewState();
  render();
  requestAnimationFrame(() => dom.promptInput.focus());
}

function threadTitle() {
  const selection = currentThreadSelection();
  if (selection.mode === "new") return "새 대화";
  if (selection.mode !== "resume" || !selection.threadId) {
    return selectedProject()?.displayName || "VIBEX";
  }
  const detail = state.threadDetail?.threadId === selection.threadId
    ? state.threadDetail
    : null;
  const summary = state.threads.find((thread) => thread.threadId === selection.threadId);
  const liveTask = state.tasks.findLast((task) => (
    task.threadId === selection.threadId || task.sessionId === selection.threadId
  ));
  return detail?.name || visibleStoredUserText(detail?.preview || "") ||
    summary?.name || visibleStoredUserText(summary?.preview || "") ||
    liveTask?.userMessage || "대화";
}

function renderThreadChrome() {
  const codex = codexThreadsAvailable();
  const selection = currentThreadSelection();
  const history = codex && state.threadView === "history";
  const hasThread = codex && selection.mode === "resume" && Boolean(selection.threadId);

  for (const element of document.querySelectorAll(".codex-only")) {
    element.classList.toggle("hidden", !codex);
  }
  for (const element of document.querySelectorAll(".thread-only")) {
    element.classList.toggle("hidden", !codex);
  }
  dom.threadMenuButton.classList.toggle("hidden", !hasThread || history);
  if (!hasThread || history) closeThreadMenu();
  dom.historyButton.classList.toggle("hidden", !codex || history);
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
    const signature = JSON.stringify(task);
    let cached = turnNodes.get(task.taskId);
    if (!cached || cached.signature !== signature) {
      const node = taskTurn(task);
      if (cached) cached.node.replaceWith(node);
      cached = { node, signature };
      turnNodes.set(task.taskId, cached);
    }
    dom.taskList.append(cached.node);
  }

  const active = state.tasks.findLast((task) => ACTIVE_STATUSES.has(task.status));
  dom.cancelButton.classList.toggle("hidden", !active);
  dom.cancelButton.disabled = !active || state.cancelPendingTaskId === active?.taskId;
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
  if (!codexThreadsAvailable() || selection.mode === "auto") return state.tasks;
  if (selection.mode === "resume" && selection.threadId) {
    return state.tasks.filter((task) => (
      task.threadId === selection.threadId || task.sessionId === selection.threadId
    ));
  }
  if (selection.mode === "new" && selection.requestId) {
    return state.tasks.filter((task) => task.clientTaskId === selection.requestId);
  }
  return [];
}

function storedThreadTasks(selection) {
  const detail = state.threadDetail;
  if (
    selection.mode !== "resume" ||
    !selection.threadId ||
    detail?.threadId !== selection.threadId ||
    !Array.isArray(detail.turns)
  ) return [];
  return detail.turns.map(storedTurnTask).filter(Boolean);
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

  if (task.userMessage || task.attachments?.length) {
    const user = document.createElement("section");
    user.className = "user-message";
    if (task.attachments?.length) user.append(attachmentPreview(task));
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

  appendClarificationTurns(turn, task);

  const assistant = document.createElement("section");
  assistant.className = "assistant-message";
  assistant.append(workLog(task));

  if (task.agentReply) assistant.append(markdownResponse(task.agentReply, task.projectId));
  if (task.error) assistant.append(textElement("div", task.error, "assistant-copy task-error"));
  if (task.questions?.length) assistant.append(questionList(task));
  if (task.changedFiles?.length) assistant.append(filesCard(task));

  if (task.agentReply) {
    const actions = document.createElement("nav");
    actions.className = "response-actions";
    actions.setAttribute("aria-label", "답변 작업");
    actions.append(iconButton("copy", "답변 복사", (event) => {
      requestCopy(event.currentTarget, task.agentReply);
    }, "response-action"));
    assistant.append(actions);
  }
  turn.append(assistant);
  return turn;
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
  const preview = document.createElement("figure");
  preview.className = "user-attachment";
  const stack = document.createElement("div");
  stack.className = "attachment-stack";
  const rendered = (task.attachments || []).filter((item) => item.kind === "rendered_view");
  const drawings = (task.attachments || []).filter((item) => item.kind === "drawing_overlay");
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
  preview.append(stack, textElement("figcaption", "iPad 화면 · 드로잉", "attachment-label"));
  return preview;
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
    textElement("span", language || "Code"),
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
  const active = hasActiveTask();
  const inputDisabled = !state.connected || !project || project.status === "unavailable";
  dom.promptInput.disabled = inputDisabled;
  dom.sendButton.disabled = inputDisabled || active || state.pendingRequestId || !dom.promptInput.value.trim();
  dom.modelSelect.disabled = Number(dom.modelSelect.dataset.optionCount || 0) <= 1 || active;
  dom.effortSelect.disabled = Number(dom.effortSelect.dataset.optionCount || 0) <= 1 || active;
  dom.speedSelect.disabled = Number(dom.speedSelect.dataset.optionCount || 0) <= 1 || active;
  dom.composerHint.textContent = active
    ? "작업 중 · 다음 요청을 미리 입력할 수 있습니다."
    : state.pendingRequestId
      ? "요청을 전송하는 중…"
      : "로컬에서 작업 · Enter 전송 · Shift+Enter 줄바꿈";
  positionScrollToBottomButton();
}

function selectedProject() {
  return state.projects.find((project) => project.projectId === state.selectedProjectId);
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
    check: ["m5 12 4 4L19 6"],
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

vscode.postMessage({ type: "ready", projectId: state.selectedProjectId });
schedulePoll();
connectEventStream();
