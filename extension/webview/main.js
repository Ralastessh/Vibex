"use strict";

/**
 * Vibex sidebar webview.
 *
 * DESIGN RULE — this renderer draws NOTHING of its own. It reproduces the DOM
 * class structure of VS Code's native chat widget (`.interactive-session`,
 * `.interactive-item-container`, `.chat-input-container`, …) exactly as the
 * workbench renderer builds it, so that the verbatim-extracted stylesheet in
 * media/native-chat.css styles it identically to the real thing. If a piece of
 * UI looks different from native VS Code chat, the fix is to correct the DOM
 * structure or re-extract the CSS — never to hand-tune styles.
 */

const MarkdownIt = require("markdown-it");

const vscode = acquireVsCodeApi();
const md = new MarkdownIt({ html: false, linkify: true, breaks: false });

const state = {
  agents: [],
  projects: [],
  conversations: [],
  selectedConversationId: null,
  selectedProjectId: null,
  tasks: [],
  health: null,
  options: { modelId: null, effort: "", approvalMode: "default" },
  busy: false,
  connectionError: null,
  // Composer `/` and `@` assist popup.
  assistItems: [],
  assistIndex: 0,
  assistRange: null,
  mentionRequestId: null,
  mentionFiles: [],
};

const ACTIVE_STATUSES = new Set([
  "queued", "interpreting", "awaiting_confirmation",
  "resolving_session", "running_agent", "testing",
]);

const STATUS_MESSAGES = {
  queued: "대기 중입니다.",
  interpreting: "요청을 해석하고 있습니다.",
  awaiting_confirmation: "확인을 기다리고 있습니다.",
  resolving_session: "프로젝트 세션을 찾고 있습니다.",
  running_agent: "요청을 처리하고 있습니다.",
  testing: "테스트를 실행하고 있습니다.",
};

const AGENT_NAMES = { "claude-code": "Claude Code", "codex-cli": "Codex", "gemini-cli": "Gemini" };

/**
 * Slash commands offered by the composer.
 *
 * The bridge exposes no command API, so these are prompt shortcuts expanded
 * locally: `prompt` replaces the typed token, `action` runs in the webview.
 */
const SLASH_COMMANDS = [
  { value: "/clear", description: "입력 비우기", action: "clear" },
  { value: "/explain", description: "선택한 코드나 프로젝트 설명", prompt: "다음을 이해하기 쉽게 설명해줘: " },
  { value: "/fix", description: "문제를 조사하고 수정", prompt: "다음 문제의 원인을 조사하고 수정해줘: " },
  { value: "/test", description: "관련 테스트 작성 또는 실행", prompt: "다음 대상의 관련 테스트를 작성하거나 실행해줘: " },
  { value: "/review", description: "현재 변경사항 검토", prompt: "현재 프로젝트의 변경사항을 검토해줘. " },
];

// #region DOM helpers

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function codicon(name) {
  return el("span", `codicon codicon-${name}`);
}

function vibexMark() {
  const image = document.createElement("img");
  image.className = "vibex-welcome-logo";
  image.src = document.body.dataset.vibexIcon || "";
  image.alt = "";
  image.setAttribute("aria-hidden", "true");
  return image;
}

function renderMarkdown(text) {
  const host = el("div", "rendered-markdown");
  host.innerHTML = md.render(String(text || ""));
  for (const anchor of host.querySelectorAll("a[href]")) {
    anchor.addEventListener("click", (event) => {
      event.preventDefault();
      post({ type: "openLink", href: anchor.getAttribute("href") });
    });
  }
  return host;
}

function post(message) {
  vscode.postMessage(message);
}

// #endregion

// #region Layout skeleton (built once)

// The extracted stylesheet scopes most rules under the workbench root
// (`.monaco-workbench .interactive-session …`) and theme classes (`.vs-dark`).
// The webview body stands in for the workbench root, so it must carry the
// same classes; the theme class follows VS Code's own body class.
function syncWorkbenchClasses() {
  const body = document.body;
  const themeMap = [
    ["vscode-high-contrast-light", "hc-light"],
    ["vscode-high-contrast", "hc-black"],
    ["vscode-light", "vs"],
    ["vscode-dark", "vs-dark"],
  ];
  let desired = "vs-dark";
  for (const [webviewClass, workbenchClass] of themeMap) {
    if (body.classList.contains(webviewClass)) {
      desired = workbenchClass;
      break;
    }
  }
  // Only touch the attribute when something actually changes — the observer
  // below watches class mutations and must not be re-triggered by this sync.
  if (body.classList.contains("monaco-workbench") && body.classList.contains(desired)) {
    return;
  }
  body.classList.add("monaco-workbench");
  for (const [, workbenchClass] of themeMap) {
    if (workbenchClass !== desired) body.classList.remove(workbenchClass);
  }
  body.classList.add(desired);
}
syncWorkbenchClasses();
new MutationObserver(syncWorkbenchClasses).observe(document.body, {
  attributes: true,
  attributeFilter: ["class"],
});

const root = el("div", "interactive-session");
document.body.appendChild(root);

// Keep the active conversation name visible above the transcript, as in the
// native Chat/Codex panes. Global actions remain in VS Code's pane title bar.
const conversationHeader = el("div", "vibex-conversation-header");
const conversationTitle = el("div", "vibex-conversation-title", "새 대화");
conversationHeader.append(conversationTitle);

const list = el("div", "vibex-list");
root.append(conversationHeader, list);

// Composer — mirrors the DOM the workbench builds at runtime, captured from a
// live native chat session over the Chrome DevTools Protocol
// (scratchpad/domdump.js). Do not restructure by intuition: re-dump and match.
function toolbar(extraClasses) {
  const host = el("div", `monaco-toolbar ${extraClasses}`);
  const bar = el("div", "monaco-action-bar");
  const items = el("ul", "actions-container");
  bar.append(items);
  host.append(bar);
  return { host, items };
}

const inputPart = el("div", "interactive-input-part");
const inputAndToolbar = el("div", "interactive-input-and-side-toolbar");
const inputContainer = el("div", "chat-input-container");
const attachmentsContainer = el("div", "chat-attachments-container");
attachmentsContainer.style.display = "none"; // native hides it while empty
const attachedContext = el("div", "chat-attached-context");
attachmentsContainer.append(attachedContext);
const editorContainer = el("div", "chat-editor-container");
const editorHost = el("div", "interactive-input-editor");
// 네이티브 입력창은 Monaco 데코레이션으로 `/명령`·`@파일` 토큰에 색을 입힌다.
// textarea 는 부분 스타일이 불가능하므로, 같은 글꼴·줄바꿈 규칙으로 텍스트를
// 다시 그리는 미러를 뒤에 깔고 textarea 글자는 투명하게 둔다(캐럿만 보임).
const inputMirror = el("div", "vibex-input-mirror");
const textarea = document.createElement("textarea");
textarea.className = "vibex-input";
textarea.rows = 1;
editorHost.append(inputMirror, textarea);
editorContainer.append(editorHost);
textarea.addEventListener("scroll", () => {
  inputMirror.scrollTop = textarea.scrollTop;
});

const toolbars = el("div", "chat-input-toolbars");
const inputToolbar = toolbar("responsive responsive-last chat-input-toolbar");
const executeToolbar = toolbar("chat-execute-toolbar");
const executeItems = executeToolbar.items;
toolbars.append(inputToolbar.host, executeToolbar.host);
inputContainer.append(attachmentsContainer, editorContainer, toolbars);
inputAndToolbar.append(inputContainer);
inputPart.append(inputAndToolbar);

// Below the box, in native order: context-usage (empty), status (hidden while
// empty), then the secondary input toolbar carrying the session/option pills.
const secondaryToolbar = el("div", "chat-secondary-toolbar");
const contextUsage = el("div", "chat-context-usage-container");
const statusContainer = el("div", "chat-input-status-container has-no-actions");
statusContainer.style.display = "none";
const secondaryInputToolbar = toolbar("responsive responsive-all chat-secondary-input-toolbar");
secondaryToolbar.append(contextUsage, statusContainer, secondaryInputToolbar.host);
inputPart.append(secondaryToolbar);
root.append(inputPart);

textarea.addEventListener("focus", () => inputContainer.classList.add("focused"));
textarea.addEventListener("blur", () => inputContainer.classList.remove("focused"));
textarea.addEventListener("input", renderInputDecorations);
textarea.addEventListener("input", autoGrow);
textarea.addEventListener("keydown", (event) => {
  // The `/` `@` popup owns navigation and accept keys while it is open.
  if (handleAssistKey(event)) return;
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    submit();
  }
});

// #region Input decorations (`/명령`·`@파일` 토큰 색 + 첨부 칩)

/** 완성 수락·검색 결과로 실존이 확인된 파일들. 경로 -> {name, relativePath} */
const knownFiles = new Map();

function rememberFile(file) {
  if (file?.relativePath) knownFiles.set(file.relativePath, file);
}

/** 현재 입력에서 실존 파일과 매칭된 @토큰들. */
function mentionTokensInText() {
  const found = [];
  for (const match of textarea.value.matchAll(/(^|\s)@([^\s]+)/g)) {
    const path = match[2].replace(/[.,!?:;]+$/, "");
    if (knownFiles.has(path)) found.push(path);
  }
  return [...new Set(found)];
}

/** 입력 텍스트를 미러에 다시 그리며 유효 토큰에만 색을 입힌다. */
function renderInputDecorations() {
  const value = textarea.value;
  inputMirror.replaceChildren();

  // 문서 시작의 슬래시 명령 — 실제 등록된 명령일 때만 토큰으로 취급.
  let rest = value;
  const slash = value.match(/^\/[\w-]+/);
  if (slash && SLASH_COMMANDS.some((command) => command.value === slash[0])) {
    inputMirror.append(el("span", "vibex-token", slash[0]));
    rest = value.slice(slash[0].length);
  }

  // @파일 토큰 — knownFiles 에 있는 경로만 색을 입힌다.
  let cursor = 0;
  for (const match of rest.matchAll(/(^|\s)@([^\s]+)/g)) {
    const clean = match[2].replace(/[.,!?:;]+$/, "");
    if (!knownFiles.has(clean)) continue;
    const tokenStart = match.index + match[1].length;
    const tokenEnd = tokenStart + 1 + clean.length; // '@' + 경로
    inputMirror.append(document.createTextNode(rest.slice(cursor, tokenStart)));
    inputMirror.append(el("span", "vibex-token", `@${clean}`));
    cursor = tokenEnd;
  }
  inputMirror.append(document.createTextNode(rest.slice(cursor)));
  inputMirror.scrollTop = textarea.scrollTop;
  renderAttachmentPills();
}

/** @토큰과 1:1 로 대응하는 첨부 칩. 칩의 ✕ 는 본문 토큰도 함께 지운다. */
function renderAttachmentPills() {
  const tokens = mentionTokensInText();
  attachedContext.replaceChildren();
  attachmentsContainer.style.display = tokens.length ? "" : "none";
  for (const path of tokens) {
    const file = knownFiles.get(path);
    const pill = el("div", "chat-attached-context-attachment");
    const label = el("span", "monaco-icon-label");
    label.append(codicon("file"), el("span", "vibex-pill-name", file.name || path));
    const remove = el("a", "vibex-pill-remove");
    remove.title = "첨부 해제";
    remove.append(codicon("close"));
    remove.addEventListener("click", () => {
      const escaped = path.replace(/[.*+?^\${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`(^|\\s)@${escaped}(?=\\s|$)\\s?`, "g");
      textarea.value = textarea.value.replace(pattern, "$1").replace(/  +/g, " ").trimStart();
      refreshComposer();
      textarea.focus();
    });
    pill.append(label, remove);
    attachedContext.append(pill);
  }
}

/** textarea.value 를 코드로 바꾼 모든 지점에서 호출하는 단일 갱신점. */
function refreshComposer() {
  autoGrow();
  syncSendEnabled();
  renderInputDecorations();
}

// #endregion

function autoGrow() {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`;
  // The popup floats in viewport space, so it must follow the box as it grows.
  if (assistPopup.style.display !== "none") positionAssist();
}

// #endregion

// #region Composer assist (`/` commands and `@` file mentions)

// Appended to <body>, not to the composer: every composer ancestor sets
// `overflow: hidden`, so a popup parented there is clipped away and never
// becomes visible. It is positioned against the input box in viewport space
// by `positionAssist()` instead.
const assistPopup = el("div", "vibex-menu vibex-assist");
assistPopup.style.display = "none";
document.body.append(assistPopup);

/** Places the popup directly above the input box, flipping below if needed. */
function positionAssist() {
  const anchor = inputContainer.getBoundingClientRect();
  assistPopup.style.left = `${anchor.left}px`;
  assistPopup.style.width = `${anchor.width}px`;
  const height = assistPopup.offsetHeight;
  const above = anchor.top - height - 4;
  assistPopup.style.top = `${above >= 4 ? above : anchor.bottom + 4}px`;
}

/** The `/…` or `@…` token the caret currently sits in, if any. */
function assistTokenAtCaret() {
  const caret = textarea.selectionStart ?? textarea.value.length;
  const match = textarea.value.slice(0, caret).match(/(^|\s)([/@][^\s]*)$/u);
  if (!match) return null;
  const token = match[2];
  return { token, start: caret - token.length, end: caret };
}

function closeAssist() {
  state.assistItems = [];
  state.assistRange = null;
  assistPopup.style.display = "none";
  assistPopup.replaceChildren();
}

function updateAssist() {
  const range = assistTokenAtCaret();
  if (!range) {
    closeAssist();
    return;
  }
  state.assistRange = range;
  state.assistIndex = 0;

  if (range.token.startsWith("/")) {
    const query = range.token.toLocaleLowerCase();
    state.assistItems = SLASH_COMMANDS
      .filter((command) => command.value.startsWith(query))
      .map((command) => ({ kind: "command", label: command.value, ...command }));
    renderAssist();
    return;
  }

  // Files arrive asynchronously; render what is already cached so the popup
  // opens on the first keystroke instead of after the round-trip.
  state.assistItems = mentionItems(range.token.slice(1));
  renderAssist();
  state.mentionRequestId = `mention-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  post({ type: "searchMentions", requestId: state.mentionRequestId, query: range.token.slice(1) });
}

/** Cached mention candidates narrowed by the typed prefix. */
function mentionItems(query) {
  const needle = String(query || "").toLocaleLowerCase();
  return state.mentionFiles
    .filter((file) => !needle || file.relativePath.toLocaleLowerCase().includes(needle))
    .map((file) => ({ kind: "file", label: file.name, description: file.relativePath, file }));
}

function renderAssist() {
  if (!state.assistRange || !state.assistItems.length) {
    assistPopup.style.display = "none";
    assistPopup.replaceChildren();
    return;
  }
  if (state.assistIndex >= state.assistItems.length) state.assistIndex = 0;
  assistPopup.replaceChildren(
    ...state.assistItems.map((item, index) => {
      const row = el("div", `vibex-menu-item${index === state.assistIndex ? " checked" : ""}`);
      row.append(
        codicon(item.kind === "file" ? "file" : "terminal"),
        el("span", "vibex-assist-label", item.label),
        el("span", "vibex-assist-description", item.description || ""),
      );
      // Keep focus in the textarea so the caret offsets stay valid.
      row.addEventListener("mousedown", (event) => event.preventDefault());
      row.addEventListener("click", () => applyAssist(index));
      return row;
    }),
  );
  assistPopup.style.display = "";
  positionAssist();
}

/** Swaps the tracked token for `replacement` and puts the caret after it. */
function replaceAssistToken(replacement) {
  const range = state.assistRange || assistTokenAtCaret();
  if (!range) return;
  const value = textarea.value;
  textarea.value = value.slice(0, range.start) + replacement + value.slice(range.end);
  const caret = range.start + replacement.length;
  textarea.setSelectionRange(caret, caret);
  autoGrow();
  syncSendEnabled();
  renderInputDecorations();
}

function applyAssist(index) {
  const item = state.assistItems[index];
  if (!item) return;
  if (item.kind === "command" && item.action === "clear") {
    textarea.value = "";
    refreshComposer();
  } else if (item.kind === "command") {
    replaceAssistToken(item.prompt || `${item.value} `);
  } else {
    rememberFile(item.file);
    replaceAssistToken(`@${item.file.relativePath} `);
  }
  closeAssist();
  textarea.focus();
}

/** Returns true when the popup consumed the key. */
function handleAssistKey(event) {
  if (assistPopup.style.display === "none" || !state.assistItems.length) return false;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const delta = event.key === "ArrowDown" ? 1 : -1;
    const count = state.assistItems.length;
    state.assistIndex = (state.assistIndex + delta + count) % count;
    renderAssist();
    return true;
  }
  if ((event.key === "Enter" || event.key === "Tab") && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    applyAssist(state.assistIndex);
    return true;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    closeAssist();
    return true;
  }
  return false;
}

textarea.addEventListener("input", updateAssist);
textarea.addEventListener("click", updateAssist);
textarea.addEventListener("blur", () => setTimeout(closeAssist, 120));
window.addEventListener("resize", () => {
  if (assistPopup.style.display !== "none") positionAssist();
});

// #endregion

// #region Pickers (model / effort / approval / history)

let openMenu = null;

function closeMenu() {
  if (openMenu) {
    openMenu.remove();
    openMenu = null;
  }
}

document.addEventListener("click", (event) => {
  if (openMenu && !openMenu.contains(event.target)) closeMenu();
}, true);

function attachMenu(host, items, onPick) {
  return (event) => {
    event.stopPropagation();
    event.preventDefault();
    if (openMenu && openMenu.dataset.owner === host.dataset.pickerId) {
      closeMenu();
      return;
    }
    closeMenu();
    const menu = el("div", "vibex-menu");
    for (const item of items()) {
      if (item.group) {
        menu.append(el("div", "vibex-menu-group", item.group));
        continue;
      }
      const row = el("div", `vibex-menu-item${item.checked ? " checked" : ""}`);
      row.append(item.checked ? codicon("check") : el("span", "codicon"));
      row.append(el("span", undefined, item.label));
      row.addEventListener("click", () => {
        closeMenu();
        onPick(item.id);
      });
      menu.append(row);
    }

    // The composer's ancestors all clip overflow (the workbench renders its
    // dropdowns in an overlay container for the same reason), so the menu is
    // appended to <body> and positioned against the anchor in viewport space.
    host.dataset.pickerId ||= `picker-${++pickerIdSeq}`;
    menu.dataset.owner = host.dataset.pickerId;
    document.body.append(menu);
    const anchor = host.getBoundingClientRect();
    const height = menu.offsetHeight;
    const top = anchor.top - height - 4;
    menu.style.left = `${Math.max(4, Math.min(anchor.left, window.innerWidth - menu.offsetWidth - 4))}px`;
    // Flip below the anchor when there is not enough room above.
    menu.style.top = `${top >= 4 ? top : anchor.bottom + 4}px`;
    openMenu = menu;
  };
}
let pickerIdSeq = 0;

/**
 * The model picker, exactly as the workbench builds it:
 * li.action-item.chat-input-picker-item > div.action-label.model-picker-split >
 *   a.model-picker-section.model-picker-name > [codicon, .chat-input-picker-label]
 */
function modelPickerPill({ items, onPick }) {
  const host = el("li", "action-item chat-input-picker-item vibex-picker-host");
  const split = el("div", "action-label model-picker-split");
  const section = el("a", "model-picker-section model-picker-name");
  section.append(codicon("chat-model-provider-generic"));
  const labelSpan = el("span", "chat-input-picker-label", "기본 모델");
  section.append(labelSpan);
  split.append(section);
  host.append(split);
  section.addEventListener("click", attachMenu(host, items, onPick));
  return { host, labelSpan };
}

/**
 * A secondary-toolbar option picker, exactly as the workbench builds it:
 * li.action-item.chat-sessionPicker-container > div.action-item.chat-sessionPicker-item >
 *   div.monaco-dropdown > div.dropdown-label > a.action-label.chat-session-option-picker >
 *     span.chat-session-option-label
 */
function optionPickerPill({ label, items, onPick }) {
  const item = el("div", "action-item chat-sessionPicker-item vibex-picker-host");
  const dropdown = el("div", "monaco-dropdown");
  const dropdownLabel = el("div", "dropdown-label");
  const anchor = el("a", "action-label chat-session-option-picker");
  const labelSpan = el("span", "chat-session-option-label", label);
  anchor.append(labelSpan);
  dropdownLabel.append(anchor);
  dropdown.append(dropdownLabel);
  item.append(dropdown);
  anchor.addEventListener("click", attachMenu(item, items, onPick));
  return { host: item, labelSpan };
}

const modelPicker = modelPickerPill({
  items: modelItems,
  onPick: (id) => {
    state.options.modelId = id;
    post({ type: "setOption", id: "model", value: id });
    renderPickers();
  },
});

const effortPicker = optionPickerPill({
  label: "기본 추론",
  items: effortItems,
  onPick: (id) => {
    state.options.effort = id === "__default__" ? "" : id;
    post({ type: "setOption", id: "effort", value: state.options.effort });
    renderPickers();
  },
});

const approvalPicker = optionPickerPill({
  label: "기본 승인",
  items: approvalItems,
  onPick: (id) => {
    state.options.approvalMode = id;
    post({ type: "setOption", id: "approvalMode", value: id });
    renderPickers();
  },
});

// "+ " attach action — li.action-item.menu-entry > a.action-label.codicon.codicon-add-compact
const attachItem = el("li", "action-item menu-entry");
const attachButton = el("a", "action-label codicon codicon-add-compact");
attachButton.title = "프로젝트 파일 첨부";
attachItem.append(attachButton);
attachButton.addEventListener("click", () => post({ type: "pickAttachment" }));
inputToolbar.items.append(attachItem, modelPicker.host);

const optionContainer = el("li", "action-item chat-sessionPicker-container");
optionContainer.append(effortPicker.host, approvalPicker.host);
secondaryInputToolbar.items.append(optionContainer);

// Submit — li.action-item.menu-entry.chat-submit-button > a.action-label.codicon.codicon-arrow-up-compact
const sendItem = el("li", "action-item menu-entry chat-submit-button");
const sendButton = el("a", "action-label codicon codicon-arrow-up-compact");
sendButton.title = "보내기 (Enter)";
sendItem.append(sendButton);
executeItems.append(sendItem);
sendButton.addEventListener("click", submit);

// Stop — the workbench swaps the submit action for this one while a response is
// streaming, so the composer carries both and shows exactly one at a time.
const stopItem = el("li", "action-item menu-entry chat-stop-button");
const stopButton = el("a", "action-label codicon codicon-stop-circle");
stopButton.title = "생성 중지";
stopItem.append(stopButton);
executeItems.append(stopItem);
stopButton.addEventListener("click", () => {
  if (!state.busy) return;
  stopItem.classList.add("disabled");
  stopButton.classList.add("disabled");
  post({ type: "cancel" });
});

// Native submit button greys out while there is nothing to send — the
// workbench puts .disabled on both the item and the label.
function syncSendEnabled() {
  inputContainer.classList.toggle("working", state.busy);
  sendItem.style.display = state.busy ? "none" : "";
  stopItem.style.display = state.busy ? "" : "none";
  if (!state.busy) {
    stopItem.classList.remove("disabled");
    stopButton.classList.remove("disabled");
  }
  const disabled = !textarea.value.trim() || state.busy;
  sendItem.classList.toggle("disabled", disabled);
  sendButton.classList.toggle("disabled", disabled);
}
textarea.addEventListener("input", syncSendEnabled);
syncSendEnabled();

function selectedAgent() {
  const [agentId] = String(state.options.modelId || "").split("::");
  return state.agents.find((agent) => agent.agentId === agentId);
}

function modelItems() {
  const items = [];
  for (const agent of state.agents) {
    if (!agent.usable) continue;
    items.push({ group: agent.displayName });
    const models = agent.models?.length ? agent.models : [{ value: "", label: agent.displayName }];
    for (const model of models) {
      const id = `${agent.agentId}::${model.value || ""}`;
      items.push({ id, label: model.label, checked: state.options.modelId === id });
    }
  }
  return items;
}

function effortItems() {
  const agent = selectedAgent();
  const items = [{ id: "__default__", label: "기본 추론", checked: !state.options.effort }];
  for (const effort of agent?.efforts || []) {
    if (!effort.value) continue;
    items.push({ id: effort.value, label: effort.label, checked: state.options.effort === effort.value });
  }
  return items;
}

function approvalItems() {
  return [
    { id: "default", label: "기본 승인" },
    { id: "bypass", label: "승인 없이 진행" },
    { id: "autopilot", label: "오토파일럿" },
  ].map((item) => ({ ...item, checked: state.options.approvalMode === item.id }));
}

function renderPickers() {
  const [agentId, model] = String(state.options.modelId || "").split("::");
  const agent = state.agents.find((candidate) => candidate.agentId === agentId);
  const modelLabel = agent
    ? (agent.models.find((candidate) => candidate.value === (model || ""))?.label || agent.displayName)
    : "기본 모델";
  modelPicker.labelSpan.textContent = modelLabel;
  const effortLabel = state.options.effort
    ? (selectedAgent()?.efforts.find((candidate) => candidate.value === state.options.effort)?.label || state.options.effort)
    : "기본 추론";
  effortPicker.labelSpan.textContent = effortLabel;
  approvalPicker.labelSpan.textContent =
    { default: "기본 승인", bypass: "승인 없이 진행", autopilot: "오토파일럿" }[state.options.approvalMode] || "기본 승인";
}

function renderConversationTitle() {
  const selected = state.conversations.find(
    (conversation) => conversation.conversationId === state.selectedConversationId,
  );
  const title = String(selected?.title || "새 대화").trim() || "새 대화";
  conversationTitle.textContent = title;
  conversationTitle.title = title;
}

// #endregion

// #region Transcript rendering

function formatTokens(count) {
  const value = Number(count) || 0;
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return String(value);
}

function metaLine(task) {
  const parts = [];
  const agent = AGENT_NAMES[task.agentId] || task.agentId;
  if (agent) parts.push(task.agentModel ? `${agent} · ${task.agentModel}` : agent);
  const usage = task.usage;
  if (usage && (usage.inputTokens || usage.outputTokens || usage.totalTokens)) {
    const total = usage.totalTokens || (usage.inputTokens || 0) + (usage.outputTokens || 0);
    parts.push(`${formatTokens(usage.inputTokens)}↑ ${formatTokens(usage.outputTokens)}↓ (총 ${formatTokens(total)} 토큰)`);
  }
  if (usage?.costUsd != null) parts.push(`$${Number(usage.costUsd).toFixed(4)}`);
  const time = task.completedAt || task.updatedAt;
  if (time) {
    const at = new Date(time);
    if (!Number.isNaN(at.getTime())) {
      parts.push(at.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" }));
    }
  }
  return parts.join(" · ");
}

function attachmentSource(attachment) {
  return String(attachment?.dataUrl || "");
}

function requestRow(task) {
  const row = el("div", "interactive-item-container interactive-request");
  const value = el("div", "value");
  const prompt = String(task.agentPrompt || task.userMessage || "").trim();
  if (prompt) value.append(renderMarkdown(prompt));
  const images = (task.attachments || []).filter((attachment) => attachmentSource(attachment));
  if (images.length) {
    const gallery = el("div", "vibex-request-images");
    for (const attachment of images) {
      const link = el("button", "vibex-request-image");
      link.type = "button";
      link.title = attachment.name || "첨부 이미지";
      const image = document.createElement("img");
      image.src = attachmentSource(attachment);
      image.alt = attachment.name || "첨부 이미지";
      link.append(image);
      link.addEventListener("click", () => window.open(image.src, "_blank"));
      gallery.append(link);
    }
    value.append(gallery);
  }
  row.append(value);
  return row;
}

function hiddenWarning(text) {
  const value = String(text || "");
  return /실행 전 미커밋 변경사항이 \d+건 있었습니다/.test(value)
    || /기존 미커밋 (?:파일과 )?변경사항은 그대로 보존했습니다/.test(value);
}

function hiddenSkippedTest(test) {
  return String(test?.status || "") === "skipped"
    && /사용자가 테스트(?: 실행)?을 허용하지 않아/.test(String(test?.summary || ""));
}

function responseRow(task, { isLast }) {
  const row = el("div", "interactive-item-container interactive-response");
  if (isLast) row.classList.add("chat-most-recent-response");
  const value = el("div", "value");
  row.append(value);

  const active = ACTIVE_STATUSES.has(task.status);
  if (active) row.classList.add("chat-response-loading");

  // Reasoning — native thinking box structure.
  const reasoning = (task.activityItems || []).filter((item) => item.type === "reasoning" && (item.text || "").trim());
  if (reasoning.length) {
    const box = el("div", "chat-thinking-box");
    const listHost = el("div", "chat-used-context-list chat-thinking-items");
    for (const item of reasoning) {
      const entry = el("div", "chat-thinking-item markdown-content");
      entry.append(renderMarkdown(item.text));
      listHost.append(entry);
    }
    box.append(listHost);
    value.append(box);
  }

  // Non-reasoning activity — one label row per item, native used-context label styling.
  for (const item of task.activityItems || []) {
    if (item.type === "reasoning") continue;
    const label = el("div", "chat-used-context-label");
    const kind = item.type;
    let text = "";
    if (kind === "commandExecution" || kind === "command") {
      const command = Array.isArray(item.data?.command) ? item.data.command.join(" ") : item.data?.command;
      text = command ? String(command) : "명령을 실행했습니다";
      label.append(codicon("terminal"));
    } else if (kind === "fileChange") {
      const paths = (item.data?.changes || []).map((change) => change?.path).filter(Boolean);
      text = paths.length === 1 ? paths[0] : `${paths.length}개 파일을 수정했습니다`;
      label.append(codicon("edit"));
    } else if (kind === "webSearch") {
      text = item.text || "웹을 검색했습니다";
      label.append(codicon("search"));
    } else {
      text = item.text || item.data?.tool || "작업을 진행했습니다";
      label.append(codicon("tools"));
    }
    const code = el("code", undefined, text);
    label.append(code);
    value.append(label);
  }

  // Clarification turns (question -> answer) in original order.
  for (const clarification of task.clarificationTurns || []) {
    const reply = (clarification.assistantReply || clarification.question?.text || "").trim();
    if (reply) value.append(renderMarkdown(reply));
    const answer = (clarification.answer || "").trim();
    if (answer) {
      const answerRow = el("div", "interactive-item-container interactive-request");
      const answerValue = el("div", "value");
      answerValue.append(renderMarkdown(answer));
      answerRow.append(answerValue);
      value.append(answerRow);
    }
  }

  const reply = (task.agentReply || "").trim();
  if (reply) value.append(renderMarkdown(reply));

  if (active) {
    const progress = el("div", "chat-used-context-label");
    // 0.9.7의 검증된 독립 CSS 링. Codicon의 steps(30) 회전 규칙을 타지 않는다.
    const spinner = el("span", "vibex-response-spinner");
    spinner.setAttribute("aria-hidden", "true");
    progress.append(spinner);
    progress.append(el("span", undefined, ` ${STATUS_MESSAGES[task.status] || "진행 중입니다."}`));
    value.append(progress);
  }

  for (const warning of task.warnings || []) {
    if (hiddenWarning(warning)) continue;
    const widget = el("div", "chat-notification-widget");
    widget.append(codicon("warning"), el("span", undefined, String(warning)));
    value.append(widget);
  }

  for (const test of task.testResults || []) {
    if (hiddenSkippedTest(test)) continue;
    const label = el("div", "chat-used-context-label");
    label.append(codicon(test.status === "passed" ? "check" : test.status === "failed" ? "error" : "circle-slash"));
    label.append(el("code", undefined, ` ${test.command}${test.summary ? ` — ${test.summary}` : ""}`));
    value.append(label);
  }

  if (task.error) {
    const widget = el("div", "chat-notification-widget");
    widget.append(codicon("error"), el("span", undefined, String(task.error)));
    value.append(widget);
  }

  if (!active) {
    const footer = el("div", "chat-used-context-label vibex-meta");
    const actions = [];
    if (task.reviewAvailable) {
      const review = el("a", undefined, "변경 사항 검토");
      review.href = "#";
      review.addEventListener("click", (event) => {
        event.preventDefault();
        post({ type: "openReview", taskId: task.taskId });
      });
      actions.push(review);
    }
    const meta = metaLine(task);
    if (meta) footer.append(el("span", undefined, meta));
    if (actions.length && meta) footer.append(el("span", undefined, " · "));
    for (const action of actions) footer.append(action);
    if (footer.childNodes.length) value.append(footer);
  }

  return row;
}

function welcomeView() {
  // Match VS Code's native blank Chat Session hierarchy. The container owns
  // the available transcript height and centers the welcome mark above the
  // composer; the inner view supplies the native title/message spacing.
  const container = el("div", "chat-welcome-view-container");
  const host = el("div", "chat-welcome-view");
  const iconHost = el("div", "chat-welcome-view-icon large-icon");
  iconHost.append(vibexMark());
  const titleHost = el("div", "chat-welcome-view-title", "Vibex");
  const message = el("div", "chat-welcome-view-message");
  message.append(renderMarkdown("언제 어디서든 아이디어를 구상하고 실현해보세요."));
  host.append(iconHost, titleHost, message);
  container.append(host);
  return container;
}

function renderTranscript() {
  const stickToBottom =
    list.scrollHeight - list.scrollTop - list.clientHeight < 60;
  list.replaceChildren();

  if (state.connectionError) {
    const widget = el("div", "chat-notification-widget");
    widget.append(codicon("debug-disconnect"), el("span", undefined, state.connectionError));
    list.append(widget);
  }

  if (!state.tasks.length) {
    list.append(welcomeView());
    return;
  }

  state.tasks.forEach((task, index) => {
    if (task.userMessage || task.agentPrompt || task.attachments?.length) list.append(requestRow(task));
    list.append(responseRow(task, { isLast: index === state.tasks.length - 1 }));
  });

  if (stickToBottom) list.scrollTop = list.scrollHeight;
}

// #endregion

// #region Messaging

function submit() {
  const text = textarea.value.trim();
  if (!text || state.busy) return;
  closeAssist();
  textarea.value = "";
  refreshComposer();
  post({
    type: "send",
    text,
    modelId: state.options.modelId,
    effort: state.options.effort,
    approvalMode: state.options.approvalMode,
  });
}

window.addEventListener("message", (event) => {
  const message = event.data;
  switch (message.type) {
    case "state": {
      Object.assign(state, {
        agents: message.agents ?? state.agents,
        projects: message.projects ?? state.projects,
        conversations: message.conversations ?? state.conversations,
        selectedConversationId: message.selectedConversationId ?? state.selectedConversationId,
        selectedProjectId: message.selectedProjectId ?? state.selectedProjectId,
        tasks: message.tasks ?? state.tasks,
        health: message.health ?? state.health,
        busy: Boolean(message.busy),
        connectionError: message.connectionError ?? null,
      });
      if (message.options) Object.assign(state.options, message.options);
      if (!state.options.modelId) {
        const first = state.agents.find((agent) => agent.usable);
        if (first) state.options.modelId = `${first.agentId}::${first.models?.[0]?.value || ""}`;
      }
      // 안내 문구는 두지 않는다. `/`·`@` 는 입력하는 순간 자동완성이 뜬다.
      renderPickers();
      renderConversationTitle();
      renderTranscript();
      syncSendEnabled();
      break;
    }
    case "mentionResults": {
      if (message.requestId !== state.mentionRequestId) break; // 늦게 도착한 응답
      state.mentionFiles = Array.isArray(message.files) ? message.files : [];
      for (const file of state.mentionFiles) rememberFile(file);
      // Re-render from the refreshed cache only — going through updateAssist()
      // here would post another search and loop.
      const range = assistTokenAtCaret();
      if (!range || !range.token.startsWith("@")) break;
      state.assistRange = range;
      state.assistItems = mentionItems(range.token.slice(1));
      renderAssist();
      break;
    }
    case "insertMention": {
      rememberFile({
        relativePath: message.relativePath,
        name: message.relativePath.split("/").pop(),
      });
      const mention = `@${message.relativePath} `;
      const at = textarea.selectionStart ?? textarea.value.length;
      textarea.value = textarea.value.slice(0, at) + mention + textarea.value.slice(at);
      textarea.focus();
      refreshComposer();
      break;
    }
    case "taskUpdate": {
      const index = state.tasks.findIndex((task) => task.taskId === message.task.taskId);
      if (index >= 0) state.tasks[index] = message.task;
      else state.tasks.push(message.task);
      state.busy = ACTIVE_STATUSES.has(message.task.status);
      renderTranscript();
      syncSendEnabled();
      break;
    }
  }
});

post({ type: "ready" });

// #endregion
