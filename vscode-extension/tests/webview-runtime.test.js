const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.resolve(__dirname, "..", "media", "main.js"),
  "utf8",
);

const DOM_IDS = [
  "connectionPanel", "workspacePanel", "projectTitle", "headerSubtitle",
  "pairingStatus", "tailscaleURL", "setupTailscaleButton", "refreshButton",
  "settingsButton", "connectionDot", "connectionText", "projectSelect",
  "projectState", "agentSwitcher", "agentNote", "errorBanner", "emptyState",
  "taskList", "promptInput", "sendButton", "composerHint", "chatInputContainer",
  "attachButton", "attachmentTray", "agentButton", "agentPanel",
  "agentChoices", "selectedAgentName", "agentSearchInput",
  "approvalButton", "approvalPanel", "approvalChoices", "approvalLabel",
  "promptAssist",
  "scrollToBottomButton", "selectedAgentLabel", "modelSelect", "effortSelect", "speedSelect",
  "runtimeButton", "runtimePanel", "runtimeSearchInput", "modelChoices", "effortChoices", "speedChoices",
  "modelGroupButton", "speedGroupButton", "runtimeModelValue",
  "historyButton", "newThreadButton", "threadMenuButton", "threadMenu",
  "renameThreadButton", "archiveThreadButton", "historyPanel",
  "threadList", "loadMoreThreadsButton", "conversationPanel", "composerRoot",
];

class FakeClassList {
  constructor(owner) {
    this.owner = owner;
  }

  add(...names) {
    for (const name of names) this.owner.classes.add(name);
  }

  remove(...names) {
    for (const name of names) this.owner.classes.delete(name);
  }

  contains(name) {
    return this.owner.classes.has(name);
  }

  toggle(name, force) {
    const enabled = force === undefined ? !this.contains(name) : Boolean(force);
    if (enabled) this.add(name);
    else this.remove(name);
    return enabled;
  }
}

class FakeNode {
  constructor(tagName = "#text", text = "") {
    this.tagName = tagName.toUpperCase();
    this._text = String(text);
    this.children = [];
    this.parentNode = null;
    this.listeners = new Map();
    this.attributes = new Map();
    this.classes = new Set();
    this.classList = new FakeClassList(this);
    this.dataset = {};
    this.style = {};
    this.disabled = false;
    this.value = "";
    this.selectionStart = 0;
    this.selectionEnd = 0;
    this.type = "";
    this.title = "";
    this.placeholder = "";
    this.selected = false;
    this.checked = false;
    this.scrollHeight = 72;
    this.focused = false;
    this.isConnected = true;
  }

  set className(value) {
    this.classes = new Set(String(value).split(/\s+/).filter(Boolean));
  }

  get className() {
    return [...this.classes].join(" ");
  }

  set textContent(value) {
    this._text = String(value ?? "");
    this.children = [];
  }

  get textContent() {
    return this._text + this.children.map((child) => child.textContent).join("");
  }

  get selectedOptions() {
    const selected = this.children.filter((child) => child.selected);
    return selected.length ? selected : this.children.slice(0, 1);
  }

  append(...nodes) {
    for (let node of nodes) {
      if (!(node instanceof FakeNode)) node = new FakeNode("#text", node);
      node.parentNode = this;
      this.children.push(node);
    }
  }

  appendChild(node) {
    this.append(node);
    return node;
  }

  replaceChildren(...nodes) {
    for (const child of this.children) child.parentNode = null;
    this.children = [];
    this._text = "";
    this.append(...nodes);
  }

  replaceWith(node) {
    if (!this.parentNode) return;
    const index = this.parentNode.children.indexOf(this);
    if (index >= 0) {
      node.parentNode = this.parentNode;
      this.parentNode.children[index] = node;
      this.parentNode = null;
    }
  }

  remove() {
    if (!this.parentNode) return;
    const index = this.parentNode.children.indexOf(this);
    if (index >= 0) this.parentNode.children.splice(index, 1);
    this.parentNode = null;
    this.isConnected = false;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }

  dispatch(type, init = {}) {
    const event = {
      type,
      target: this,
      currentTarget: this,
      defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; },
      ...init,
    };
    for (const listener of this.listeners.get(type) || []) listener(event);
    return event;
  }

  focus() {
    this.focused = true;
  }

  setSelectionRange(start, end) {
    this.selectionStart = start;
    this.selectionEnd = end;
  }

  contains(node) {
    return node === this || descendants(this).includes(node);
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    return queryAll([this], selector, false);
  }

  getBoundingClientRect() {
    return { width: 320, height: 120, top: 0, left: 0, right: 320, bottom: 120 };
  }
}

function descendants(node) {
  const result = [];
  for (const child of node.children) {
    result.push(child, ...descendants(child));
  }
  return result;
}

function matchesSimple(node, selector) {
  if (selector.startsWith(".")) return node.classList.contains(selector.slice(1));
  return node.tagName.toLowerCase() === selector.toLowerCase();
}

function matchesSelector(node, selector) {
  const parts = selector.trim().split(/\s+/);
  if (!matchesSimple(node, parts.at(-1))) return false;
  let ancestor = node.parentNode;
  for (let index = parts.length - 2; index >= 0; index -= 1) {
    while (ancestor && !matchesSimple(ancestor, parts[index])) ancestor = ancestor.parentNode;
    if (!ancestor) return false;
    ancestor = ancestor.parentNode;
  }
  return true;
}

function queryAll(roots, selector, includeRoots = true) {
  const candidates = [];
  for (const root of roots) {
    if (includeRoots) candidates.push(root);
    candidates.push(...descendants(root));
  }
  const selectors = selector.split(",").map((item) => item.trim());
  return [...new Set(candidates.filter((node) => selectors.some(
    (item) => matchesSelector(node, item),
  )))];
}

class FakeDocument {
  constructor() {
    this.elements = new Map(DOM_IDS.map((id) => [id, new FakeNode("div")]));
    for (const id of ["projectSelect", "modelSelect", "effortSelect", "speedSelect"]) {
      this.elements.get(id).tagName = "SELECT";
    }
    this.elements.get("promptInput").tagName = "TEXTAREA";
    for (const id of [
      "sendButton", "settingsButton", "refreshButton", "scrollToBottomButton",
      "runtimeButton",
      "attachButton", "agentButton", "approvalButton",
      "historyButton", "newThreadButton", "threadMenuButton",
      "renameThreadButton", "archiveThreadButton", "loadMoreThreadsButton",
    ]) {
      this.elements.get(id).tagName = "BUTTON";
    }
    this.elements.get("connectionPanel").classList.add("hidden");
    this.elements.get("workspacePanel").classList.add("hidden");
    this.elements.get("errorBanner").classList.add("hidden");
    this.elements.get("scrollToBottomButton").classList.add("hidden");
    this.elements.get("runtimePanel").classList.add("hidden");
    this.elements.get("agentPanel").classList.add("hidden");
    this.elements.get("approvalPanel").classList.add("hidden");
    this.elements.get("promptAssist").classList.add("hidden");
    this.elements.get("threadMenu").classList.add("hidden");
    this.elements.get("historyPanel").classList.add("hidden");
    this.elements.get("loadMoreThreadsButton").classList.add("hidden");
    this.elements.get("composerRoot").classList.add("composer");
    for (const id of ["historyButton", "newThreadButton"]) {
      this.elements.get(id).classList.add("codex-only");
    }
    for (const id of ["threadMenuButton"]) {
      this.elements.get(id).classList.add("thread-only");
    }
    this.listeners = new Map();
    this.visibilityState = "visible";
    this.documentElement = { scrollHeight: 1200 };
  }

  getElementById(id) {
    return this.elements.get(id);
  }

  createElement(tagName) {
    return new FakeNode(tagName);
  }

  createElementNS(_namespace, tagName) {
    return new FakeNode(tagName);
  }

  createTextNode(text) {
    return new FakeNode("#text", text);
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }

  dispatch(type, init = {}) {
    for (const listener of this.listeners.get(type) || []) {
      listener({ type, preventDefault() {}, ...init });
    }
  }

  querySelectorAll(selector) {
    return queryAll([...this.elements.values()], selector);
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

class FakeWindow {
  constructor() {
    this.listeners = new Map();
    this.scrollY = 600;
    this.innerHeight = 600;
    this.lastScroll = null;
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }

  dispatchMessage(data) {
    for (const listener of this.listeners.get("message") || []) listener({ data });
  }

  scrollTo(options) {
    this.lastScroll = options;
    this.scrollY = options.top;
  }
}

class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;

  static instances = [];

  constructor(url) {
    this.url = String(url);
    this.readyState = FakeWebSocket.CONNECTING;
    this.listeners = new Map();
    FakeWebSocket.instances.push(this);
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }

  emit(type, data = {}) {
    for (const listener of this.listeners.get(type) || []) listener(data);
  }

  close() {
    this.readyState = 3;
    this.emit("close");
  }
}

function createHarness(savedState = {}) {
  FakeWebSocket.instances = [];
  const document = new FakeDocument();
  const window = new FakeWindow();
  const messages = [];
  const persisted = [];
  const timers = [];
  let timerId = 0;
  const api = {
    postMessage(message) { messages.push(message); },
    getState() { return savedState; },
    setState(value) { persisted.push(value); },
  };
  const setTimeout = (callback, delay) => {
    const timer = { id: ++timerId, callback, delay, cleared: false };
    timers.push(timer);
    return timer.id;
  };
  const clearTimeout = (id) => {
    const timer = timers.find((candidate) => candidate.id === id);
    if (timer) timer.cleared = true;
  };
  const context = vm.createContext({
    acquireVsCodeApi: () => api,
    document,
    window,
    WebSocket: FakeWebSocket,
    URL,
    crypto: { randomUUID: crypto.randomUUID },
    setTimeout,
    clearTimeout,
    requestAnimationFrame: (callback) => callback(),
    console,
    Intl,
    Date,
    JSON,
    Map,
    Set,
  });
  vm.runInContext(source, context, { filename: "media/main.js" });
  return {
    document,
    window,
    messages,
    persisted,
    timers,
    socket: () => FakeWebSocket.instances.at(-1),
    element: (id) => document.getElementById(id),
    runTimer(delay) {
      const timer = timers.find((candidate) => !candidate.cleared && candidate.delay === delay);
      assert.ok(timer, `${delay}ms 타이머가 있어야 합니다.`);
      timer.cleared = true;
      timer.callback();
    },
    sendHostMessage(message) { window.dispatchMessage(message); },
    latestMessage(type) { return messages.findLast((message) => message.type === type); },
  };
}

function connectedState(overrides = {}) {
  return {
    type: "state",
    health: { projects: 1 },
    agents: [{
      agentId: "codex-cli",
      displayName: "Codex",
      usable: true,
      models: [{ value: "gpt-5.6", label: "GPT-5.6" }],
      efforts: [
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
      ],
      speedModes: [
        { value: "standard", label: "Standard" },
        { value: "fast", label: "Fast" },
      ],
    }],
    projects: [{
      projectId: "style-compass",
      displayName: "Style Compass",
      status: "idle",
      agent: "codex-cli",
    }],
    selectedProjectId: "style-compass",
    conversations: [{
      conversationId: "conversation-1",
      projectId: "style-compass",
      title: "공용 대화",
      createdAt: "2026-08-16T00:00:00Z",
      updatedAt: "2026-08-16T00:00:00Z",
      agentSessions: {},
      archived: false,
    }],
    selectedConversationId: "conversation-1",
    tasks: [],
    ...overrides,
  };
}

test("runtime: send is optimistic and acknowledgements never erase a newer draft", () => {
  const harness = createHarness();
  harness.sendHostMessage(connectedState());
  const input = harness.element("promptInput");
  input.value = "  이 프로젝트 설명해줘  ";
  input.dispatch("input");
  harness.element("sendButton").dispatch("click");

  const request = harness.latestMessage("sendTask");
  assert.equal(request.note, "이 프로젝트 설명해줘");
  assert.equal(request.projectId, "style-compass");
  assert.equal(input.value, "");
  assert.match(harness.element("taskList").textContent, /이 프로젝트 설명해줘/);
  assert.equal(Boolean(harness.element("sendButton").disabled), true);

  input.value = "다음 요청 초안";
  input.dispatch("input");
  harness.sendHostMessage({ type: "taskAccepted", requestId: "another-request" });
  assert.equal(input.value, "다음 요청 초안");
  harness.sendHostMessage({
    type: "taskAccepted",
    requestId: request.requestId,
    taskId: "task-accepted",
  });
  assert.equal(input.value, "다음 요청 초안");
  harness.sendHostMessage({ type: "taskRejected", requestId: request.requestId, message: "실패" });
  assert.equal(input.value, "다음 요청 초안");

  input.value = "재시도할 요청";
  input.dispatch("input");
  harness.element("sendButton").dispatch("click");
  const retry = harness.latestMessage("sendTask");
  assert.equal(input.value, "");
  harness.sendHostMessage({ type: "taskRejected", requestId: retry.requestId, message: "실패" });
  assert.equal(input.value, "재시도할 요청");
});

test("runtime: settings, keyboard close, and run-option changes behave through events", () => {
  const harness = createHarness();
  harness.sendHostMessage(connectedState());
  const panel = harness.element("connectionPanel");
  harness.element("settingsButton").dispatch("click");
  assert.equal(panel.classList.contains("hidden"), false);
  assert.equal(harness.element("settingsButton").getAttribute("aria-expanded"), "true");
  harness.document.dispatch("keydown", { key: "Escape" });
  assert.equal(panel.classList.contains("hidden"), true);
  assert.equal(harness.element("settingsButton").focused, true);

  harness.element("settingsButton").dispatch("click");
  harness.document.dispatch("pointerdown", { target: harness.element("taskList") });
  assert.equal(panel.classList.contains("hidden"), true);

  harness.element("effortSelect").value = "high";
  harness.element("effortSelect").dispatch("change");
  harness.element("speedSelect").value = "fast";
  harness.element("speedSelect").dispatch("change");
  assert.equal(harness.persisted.at(-1).runOptions["codex-cli"].effort, "high");
  assert.equal(harness.persisted.at(-1).runOptions["codex-cli"].speedMode, "fast");
});

test("runtime: active work morphs send into stop and sends the exact active task id", () => {
  const harness = createHarness();
  harness.sendHostMessage(connectedState({
    projects: [{
      projectId: "style-compass",
      displayName: "Style Compass",
      status: "busy",
      agent: "codex-cli",
    }],
    tasks: [{
      taskId: "task-running",
      projectId: "style-compass",
      status: "running_agent",
      userMessage: "버튼 색을 바꿔줘",
      createdAt: "2026-08-11T00:00:00Z",
      updatedAt: "2026-08-11T00:00:01Z",
    }],
  }));
  assert.equal(harness.element("promptInput").disabled, false);
  assert.equal(harness.element("sendButton").disabled, false);
  assert.equal(harness.element("sendButton").getAttribute("aria-label"), "작업 중단");
  assert.equal(harness.element("sendButton").classList.contains("is-stop"), true);
  harness.element("promptInput").value = "작업이 끝난 뒤 보낼 초안";
  harness.element("promptInput").dispatch("input");
  assert.equal(harness.element("promptInput").value, "작업이 끝난 뒤 보낼 초안");
  harness.element("sendButton").dispatch("click");
  const cancel = harness.latestMessage("cancel");
  assert.equal(cancel.type, "cancel");
  assert.equal(cancel.taskId, "task-running");
  assert.equal(cancel.projectId, "style-compass");
  assert.match(cancel.requestId, /^[0-9a-f-]{36}$/);
  harness.element("sendButton").dispatch("click");
  assert.equal(harness.messages.filter((message) => message.type === "cancel").length, 1);
});

test("runtime: clarification free text disables once and posts its complete identity", () => {
  const harness = createHarness();
  harness.sendHostMessage(connectedState({
    tasks: [{
      taskId: "task-question",
      projectId: "style-compass",
      origin: "ipad",
      status: "awaiting_confirmation",
      createdAt: "2026-08-11T00:00:00Z",
      updatedAt: "2026-08-11T00:00:01Z",
      questions: [{
        questionId: "question-theme",
        text: "어떤 테마로 바꿀까요?",
        options: [{ optionId: "dark", label: "어둡게" }],
      }],
    }],
  }));
  const taskList = harness.element("taskList");
  const form = taskList.querySelectorAll("form")[0];
  const input = form.querySelectorAll("input")[0];
  input.value = "채도가 낮은 남색";
  form.dispatch("submit");
  const answer = harness.latestMessage("answer");
  assert.equal(answer.type, "answer");
  assert.equal(answer.projectId, "style-compass");
  assert.equal(answer.taskId, "task-question");
  assert.equal(answer.questionId, "question-theme");
  assert.equal(answer.optionId, null);
  assert.equal(answer.freeText, "채도가 낮은 남색");
  assert.match(answer.requestId, /^[0-9a-f-]{36}$/);
  assert.equal(input.disabled, true);
  form.dispatch("submit");
  assert.equal(harness.messages.filter((message) => message.type === "answer").length, 1);

  harness.sendHostMessage({
    type: "answerRejected",
    requestId: answer.requestId,
    taskId: "task-question",
    message: "답변 충돌",
  });
  const updatedQuestion = harness.element("taskList").querySelector(".question");
  assert.match(updatedQuestion.querySelector(".question-status").textContent, /답변 충돌/);
  assert.equal(updatedQuestion.querySelector("input").disabled, false);
});

test("runtime: Enter sends, Shift+Enter keeps the draft, and IME composition does not send", () => {
  const harness = createHarness();
  harness.sendHostMessage(connectedState());
  const input = harness.element("promptInput");
  input.value = "여러 줄 초안";
  input.dispatch("keydown", { key: "Enter", shiftKey: true });
  input.dispatch("keydown", { key: "Enter", shiftKey: false, isComposing: true });
  assert.equal(harness.messages.filter((message) => message.type === "sendTask").length, 0);
  assert.equal(input.value, "여러 줄 초안");

  const event = input.dispatch("keydown", {
    key: "Enter",
    shiftKey: false,
    isComposing: false,
    keyCode: 13,
  });
  assert.equal(event.defaultPrevented, true);
  assert.equal(harness.latestMessage("sendTask").note, "여러 줄 초안");
});

test("runtime: stale project refreshes cannot restore the previous project's turns", () => {
  const harness = createHarness();
  const projects = [
    { projectId: "alpha", displayName: "Alpha", status: "idle", agent: "codex-cli" },
    { projectId: "beta", displayName: "Beta", status: "idle", agent: "codex-cli" },
  ];
  harness.sendHostMessage(connectedState({
    projects,
    selectedProjectId: "alpha",
    tasks: [{
      taskId: "alpha-task",
      projectId: "alpha",
      status: "completed",
      userMessage: "alpha의 이전 대화",
      createdAt: "2026-08-11T00:00:00Z",
      updatedAt: "2026-08-11T00:00:01Z",
    }],
  }));
  assert.match(harness.element("taskList").textContent, /alpha의 이전 대화/);

  harness.element("projectSelect").value = "beta";
  harness.element("projectSelect").dispatch("change");
  assert.doesNotMatch(harness.element("taskList").textContent, /alpha의 이전 대화/);
  assert.equal(harness.latestMessage("refresh").projectId, "beta");

  harness.sendHostMessage(connectedState({
    requestedProjectId: "alpha",
    projects,
    selectedProjectId: "alpha",
    tasks: [{
      taskId: "late-alpha-task",
      projectId: "alpha",
      status: "completed",
      userMessage: "늦게 도착한 alpha 응답",
    }],
  }));
  assert.doesNotMatch(harness.element("taskList").textContent, /늦게 도착한 alpha 응답/);
});

test("runtime: clarification history stays between the original request and final reply", () => {
  const harness = createHarness();
  harness.sendHostMessage(connectedState({
    tasks: [{
      taskId: "task-history",
      projectId: "style-compass",
      origin: "ipad",
      status: "completed",
      userMessage: "히어로를 수정해줘",
      createdAt: "2026-08-11T00:00:00Z",
      updatedAt: "2026-08-11T00:01:00Z",
      clarificationTurns: [{
        question: { questionId: "q1", text: "어느 부분을 어둡게 할까요?", options: [] },
        assistantReply: "범위를 먼저 확인할게요.",
        answer: "배경만 어둡게",
        selectedOptionId: "background",
        answeredAt: "2026-08-11T00:00:30Z",
      }],
      agentReply: "배경만 어둡게 변경했습니다.",
      questions: [],
    }],
  }));
  const transcript = harness.element("taskList").textContent;
  const ordered = [
    "히어로를 수정해줘",
    "범위를 먼저 확인할게요.",
    "어느 부분을 어둡게 할까요?",
    "배경만 어둡게",
    "배경만 어둡게 변경했습니다.",
  ].map((text) => transcript.indexOf(text));
  assert.ok(ordered.every((index) => index >= 0), transcript);
  assert.deepEqual([...ordered].sort((a, b) => a - b), ordered);

  harness.sendHostMessage(connectedState({
    tasks: [{
      taskId: "task-history",
      projectId: "style-compass",
      origin: "ipad",
      status: "completed",
      userMessage: "히어로를 수정해줘",
      clarificationTurns: [{
        question: { questionId: "q1", text: "어느 부분을 어둡게 할까요?", options: [] },
        assistantReply: "범위를 먼저 확인할게요.",
        answer: "배경만 어둡게",
        answeredAt: "2026-08-11T00:00:30Z",
      }],
      agentReply: "완료했습니다.",
    }],
  }));
  assert.match(harness.element("taskList").textContent, /배경만 어둡게/);
});

test("runtime: copy acknowledgement shows a check and restores the original action", () => {
  const harness = createHarness();
  harness.sendHostMessage(connectedState({
    tasks: [{
      taskId: "task-copy",
      projectId: "style-compass",
      status: "completed",
      userMessage: "복사할 메시지",
      createdAt: "2026-08-11T00:00:00Z",
      updatedAt: "2026-08-11T00:00:01Z",
    }],
  }));
  const button = harness.element("taskList").querySelector(".message-action");
  button.dispatch("click");
  const copy = harness.latestMessage("copyText");
  assert.equal(copy.text, "복사할 메시지");
  assert.match(copy.requestId, /^[0-9a-f-]{36}$/);
  harness.sendHostMessage({ type: "copyTextCompleted", requestId: copy.requestId });
  assert.equal(button.getAttribute("aria-label"), "복사됨");
  assert.equal(button.classList.contains("copy-confirmed"), true);
  harness.runTimer(1500);
  assert.equal(button.getAttribute("aria-label"), "메시지 복사");
});

test("runtime: response actions copy, rate, and open the exact assistant reply", () => {
  const harness = createHarness();
  harness.sendHostMessage(connectedState({
    tasks: [{
      taskId: "task-actions",
      projectId: "style-compass",
      threadId: "thread-actions",
      turnId: "turn-actions",
      status: "completed",
      userMessage: "설명해줘",
      agentReply: "정확한 답변",
      createdAt: "2026-08-11T00:00:00Z",
      completedAt: "2026-08-11T00:00:01Z",
    }],
  }));

  let actions = harness.element("taskList").querySelectorAll(".response-action");
  assert.deepEqual(
    actions.map((button) => button.getAttribute("aria-label")),
    ["답변 다시 생성", "답변 복사", "좋아요", "싫어요", "답변 크게 열기"],
  );

  actions[2].dispatch("click");
  const liked = harness.latestMessage("setResponseFeedback");
  assert.equal(liked.responseKey, "style-compass:thread:thread-actions:turn:turn-actions");
  assert.equal(liked.feedback, "like");
  harness.sendHostMessage({ ...liked, type: "responseFeedbackChanged" });

  actions = harness.element("taskList").querySelectorAll(".response-action");
  assert.equal(actions[2].getAttribute("aria-pressed"), "true");
  actions[2].dispatch("click");
  assert.equal(harness.latestMessage("setResponseFeedback").feedback, null);

  actions[4].dispatch("click");
  assert.equal(harness.latestMessage("openResponse").text, "정확한 답변");

  actions[0].dispatch("click");
  assert.equal(harness.latestMessage("regenerateTask").taskId, "task-actions");
});

test("runtime: text fences use the Korean plain-text label", () => {
  const harness = createHarness();
  harness.sendHostMessage(connectedState({
    tasks: [{
      taskId: "task-code",
      projectId: "style-compass",
      status: "completed",
      userMessage: "프로세스를 보여줘",
      agentReply: "```text\nPID 33778 — Python\n```",
      createdAt: "2026-08-11T00:00:00Z",
      completedAt: "2026-08-11T00:00:01Z",
    }],
  }));
  const codeBlock = harness.element("taskList").querySelector(".code-block");
  assert.match(codeBlock.querySelector(".code-header").textContent, /일반 텍스트/);
  assert.equal(codeBlock.querySelector("code").textContent, "PID 33778 — Python");
});

test("runtime: completed work hides transient reasoning and duration", () => {
  const harness = createHarness();
  harness.sendHostMessage(connectedState({
    tasks: [{
      taskId: "task-duration",
      projectId: "style-compass",
      status: "completed",
      userMessage: "완료 시간 확인",
      createdAt: "2026-08-11T00:00:00Z",
      completedAt: "2026-08-11T00:00:26Z",
      updatedAt: "2026-08-11T00:03:47Z",
    }],
  }));
  assert.doesNotMatch(harness.element("taskList").textContent, /26초 동안 작업함/);
  assert.doesNotMatch(harness.element("taskList").textContent, /3분 47초/);
});

test("runtime: a cancelled turn is visibly distinguished from completion", () => {
  const harness = createHarness();
  harness.sendHostMessage(connectedState({
    tasks: [{
      taskId: "task-cancelled",
      projectId: "style-compass",
      status: "cancelled",
      userMessage: "긴 작업",
      agentReply: "파일을 살펴보고 있습니다.",
      createdAt: "2026-08-11T00:00:00Z",
      completedAt: "2026-08-11T00:00:17Z",
      updatedAt: "2026-08-11T00:00:17Z",
    }],
  }));
  assert.match(harness.element("taskList").textContent, /17초 동안 작업함 · 중단됨/);
});

test("runtime: scrolling away exposes a working latest-message button", () => {
  const harness = createHarness();
  harness.document.documentElement.scrollHeight = 1800;
  harness.window.scrollY = 0;
  harness.window.innerHeight = 600;
  harness.sendHostMessage(connectedState({
    tasks: [{
      taskId: "task-scroll",
      projectId: "style-compass",
      status: "completed",
      userMessage: "긴 대화",
      createdAt: "2026-08-11T00:00:00Z",
      updatedAt: "2026-08-11T00:00:01Z",
    }],
  }));
  const button = harness.element("scrollToBottomButton");
  assert.equal(button.classList.contains("hidden"), false);
  button.dispatch("click");
  assert.equal(harness.window.lastScroll.top, 1800);
  assert.equal(harness.window.lastScroll.behavior, "smooth");
});

test("runtime: a refresh connection failure marks the composer offline", () => {
  const harness = createHarness();
  harness.sendHostMessage(connectedState());
  assert.equal(harness.element("promptInput").disabled, false);
  harness.sendHostMessage({
    type: "error",
    message: "Bridge 응답 시간이 초과되었습니다.",
    connectionFailed: true,
  });
  assert.equal(harness.element("promptInput").disabled, true);
  assert.equal(harness.element("workspacePanel").classList.contains("hidden"), true);
  assert.match(harness.element("errorBanner").textContent, /초과/);
});

test("runtime: WebSocket events coalesce refresh and reconnect after close", () => {
  const harness = createHarness();
  harness.sendHostMessage(connectedState());
  const socket = harness.socket();
  socket.readyState = FakeWebSocket.OPEN;
  socket.emit("message", { data: JSON.stringify({ type: "task", projectId: "other" }) });
  assert.equal(harness.timers.some((timer) => !timer.cleared && timer.delay === 55), false);
  socket.emit("message", { data: JSON.stringify({ type: "task", projectId: "style-compass" }) });
  socket.emit("message", { data: JSON.stringify({ type: "task", projectId: "style-compass" }) });
  assert.equal(harness.timers.filter((timer) => !timer.cleared && timer.delay === 55).length, 1);
  harness.runTimer(55);
  assert.equal(harness.latestMessage("refresh").projectId, "style-compass");

  socket.close();
  assert.equal(harness.timers.some((timer) => !timer.cleared && timer.delay === 1500), true);
  harness.runTimer(1500);
  assert.equal(FakeWebSocket.instances.length, 2);
});

test("runtime: switching agents preserves the shared VIBEX transcript", () => {
  const harness = createHarness();
  harness.sendHostMessage(connectedState({
    agents: [
      { agentId: "codex-cli", displayName: "Codex", usable: true, models: [], efforts: [], speedModes: [] },
      { agentId: "claude-code", displayName: "Claude", usable: true, models: [], efforts: [], speedModes: [] },
    ],
    tasks: [{
      taskId: "codex-turn",
      projectId: "style-compass",
      agentId: "codex-cli",
      origin: "vscode",
      status: "completed",
      userMessage: "Codex 질문",
      agentReply: "Codex 답변",
      createdAt: "2026-08-16T00:00:00Z",
      updatedAt: "2026-08-16T00:00:01Z",
    }],
  }));
  const before = harness.element("taskList").textContent;
  harness.element("agentButton").dispatch("click");
  harness.element("agentChoices").children[1].dispatch("click");
  assert.match(harness.element("taskList").textContent, /Codex 질문/);
  assert.match(harness.element("taskList").textContent, /Codex 답변/);
  assert.match(before, /Codex 질문/);
  assert.match(before, /Codex 답변/);

  harness.element("promptInput").value = "Claude에게 이어서 질문";
  harness.element("promptInput").dispatch("input");
  harness.element("sendButton").dispatch("click");
  const sent = harness.latestMessage("sendTask");
  assert.equal(sent.threadMode, "auto");
  assert.equal(sent.threadId, null);
  assert.equal(sent.conversationId, "conversation-1");
  assert.equal(sent.agentId, "claude-code");
});

test("runtime: shared chat sends auto mode and compact runtime popover is real", () => {
  const harness = createHarness();
  harness.sendHostMessage(connectedState());

  harness.element("runtimeButton").dispatch("click");
  assert.equal(harness.element("runtimePanel").classList.contains("hidden"), false);
  assert.equal(harness.element("runtimeButton").getAttribute("aria-expanded"), "true");
  assert.match(harness.element("effortChoices").textContent, /Medium/);
  assert.match(harness.element("effortChoices").textContent, /High/);
  assert.match(harness.element("modelChoices").textContent, /GPT-5\.6/);
  assert.match(harness.element("speedChoices").textContent, /표준/);
  assert.match(harness.element("speedChoices").textContent, /고속/);
  harness.element("modelGroupButton").dispatch("click");
  assert.equal(harness.element("modelChoices").classList.contains("hidden"), true);
  harness.element("modelGroupButton").dispatch("click");
  assert.equal(harness.element("modelChoices").classList.contains("hidden"), false);
  harness.document.dispatch("pointerdown", { target: harness.element("taskList") });
  assert.equal(harness.element("runtimePanel").classList.contains("hidden"), true);

  harness.element("promptInput").value = "공용 대화 계속";
  harness.element("promptInput").dispatch("input");
  harness.element("sendButton").dispatch("click");
  const sent = harness.latestMessage("sendTask");
  assert.equal(sent.threadMode, "auto");
  assert.equal(sent.threadId, null);
  assert.equal(sent.conversationId, "conversation-1");
});

test("runtime: attachment picker and agent selector are real composer actions", () => {
  const harness = createHarness();
  harness.sendHostMessage(connectedState({
    agents: [
      {
        agentId: "codex-cli",
        displayName: "Codex",
        usable: true,
        models: [{ value: "gpt-5.6", label: "GPT-5.6" }],
        efforts: [{ value: "medium", label: "Medium" }],
        speedModes: [{ value: "standard", label: "Standard" }],
      },
      {
        agentId: "claude-code",
        displayName: "Claude Code",
        usable: true,
        models: [{ value: "sonnet", label: "Sonnet" }],
        efforts: [{ value: "medium", label: "Medium" }],
        speedModes: [{ value: "standard", label: "Standard" }],
      },
    ],
  }));

  harness.element("agentButton").dispatch("click");
  assert.equal(harness.element("agentPanel").classList.contains("hidden"), false);
  harness.element("agentChoices").children[1].dispatch("click");
  assert.equal(harness.latestMessage("setAgent"), undefined);
  assert.equal(harness.element("composerRoot").classList.contains("hidden"), false);
  assert.equal(harness.element("promptInput").disabled, false);

  harness.element("attachButton").dispatch("click");
  const picker = harness.latestMessage("pickAttachments");
  assert.equal(picker.projectId, "style-compass");
  harness.sendHostMessage({
    type: "attachmentsSelected",
    requestId: picker.requestId,
    attachments: [{
      path: "/workspace/style-compass/mock.png",
      relativePath: "mock.png",
      name: "mock.png",
      kind: "image",
    }],
  });
  assert.equal(harness.element("attachmentTray").children.length, 1);
  assert.equal(harness.element("sendButton").disabled, false);
  harness.element("sendButton").dispatch("click");
  const attachmentTask = harness.latestMessage("sendTask");
  assert.equal(attachmentTask.attachments[0].name, "mock.png");
  assert.equal(attachmentTask.conversationId, "conversation-1");
  assert.equal(attachmentTask.agentId, "claude-code");
  assert.equal(harness.element("attachmentTray").children.length, 0);
  assert.equal(attachmentTask.threadMode, "auto");
  assert.equal(attachmentTask.threadId, null);
});

test("runtime: clarification choices are rendered only for iPad tasks", () => {
  const harness = createHarness();
  const question = {
    questionId: "q1",
    text: "어느 쪽으로 진행할까요?",
    options: [{ optionId: "a", label: "A안" }],
  };
  harness.sendHostMessage(connectedState({
    tasks: [{
      taskId: "vscode-question",
      projectId: "style-compass",
      origin: "vscode",
      status: "completed",
      createdAt: "2026-08-15T00:00:00Z",
      updatedAt: "2026-08-15T00:00:01Z",
      agentReply: "어느 쪽으로 진행할까요?",
      questions: [question],
    }],
  }));
  assert.doesNotMatch(harness.element("taskList").textContent, /A안/);
  assert.match(harness.element("taskList").textContent, /어느 쪽으로 진행할까요/);

  harness.sendHostMessage(connectedState({
    tasks: [{
      taskId: "ipad-question",
      projectId: "style-compass",
      origin: "ipad",
      status: "awaiting_confirmation",
      createdAt: "2026-08-15T00:00:00Z",
      updatedAt: "2026-08-15T00:00:01Z",
      questions: [question],
    }],
  }));
  assert.match(harness.element("taskList").textContent, /A안/);
});

test("runtime: approval selection is persisted and sent to the backend", () => {
  const harness = createHarness();
  harness.sendHostMessage(connectedState());

  harness.element("approvalButton").dispatch("click");
  assert.equal(harness.element("approvalPanel").classList.contains("hidden"), false);
  harness.element("approvalChoices").children[2].dispatch("click");
  assert.equal(harness.element("approvalLabel").textContent, "Autopilot(미리 보기)");

  const prompt = harness.element("promptInput");
  prompt.value = "승인 정책 확인";
  prompt.selectionStart = prompt.value.length;
  prompt.dispatch("input");
  harness.element("sendButton").dispatch("click");
  assert.equal(harness.latestMessage("sendTask").runOptions.approvalMode, "autopilot");
});

test("runtime: slash commands and project file mentions perform real actions", () => {
  const harness = createHarness();
  harness.sendHostMessage(connectedState());
  const prompt = harness.element("promptInput");

  prompt.value = "/fix";
  prompt.selectionStart = prompt.value.length;
  prompt.dispatch("input");
  assert.equal(harness.element("promptAssist").classList.contains("hidden"), false);
  harness.element("promptAssist").children[0].dispatch("click");
  assert.match(prompt.value, /문제의 원인을 조사하고 수정해줘/);

  prompt.value = "@App";
  prompt.selectionStart = prompt.value.length;
  prompt.dispatch("input");
  const search = harness.latestMessage("searchMentions");
  assert.equal(search.query, "App");
  harness.sendHostMessage({
    type: "mentionResults",
    requestId: search.requestId,
    files: [{
      path: "/workspace/style-compass/src/App.jsx",
      relativePath: "src/App.jsx",
      name: "App.jsx",
      kind: "file",
    }],
  });
  harness.element("promptAssist").children.at(-1).dispatch("click");
  assert.equal(harness.element("attachmentTray").children.length, 1);
});
