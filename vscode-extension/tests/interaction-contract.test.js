const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const extensionRoot = path.resolve(__dirname, "..");
const extensionSource = fs.readFileSync(
  path.join(extensionRoot, "src", "extension.js"),
  "utf8",
);
const webviewSource = fs.readFileSync(
  path.join(extensionRoot, "media", "main.js"),
  "utf8",
);

function findMatchingDelimiter(source, openingIndex, opening, closing) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = openingIndex; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (character === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (character === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (["\"", "'", "`"].includes(character)) {
      quote = character;
      continue;
    }
    if (character === opening) depth += 1;
    if (character === closing && --depth === 0) return index;
  }
  throw new Error(`${opening}${closing} 블록을 찾지 못했습니다.`);
}

function functionBody(source, name, prefix = "function ") {
  const marker = `${prefix}${name}(`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${name} 함수가 있어야 합니다.`);
  const openingParenthesis = source.indexOf("(", start + prefix.length + name.length);
  const closingParenthesis = findMatchingDelimiter(
    source,
    openingParenthesis,
    "(",
    ")",
  );
  const opening = source.indexOf("{", closingParenthesis + 1);
  const closing = findMatchingDelimiter(source, opening, "{", "}");
  return source.slice(opening + 1, closing);
}

function methodBody(source, name) {
  return functionBody(source, name, "async ");
}

function messageBranch(type) {
  const marker = `message.type === "${type}"`;
  const start = webviewSource.indexOf(marker);
  assert.notEqual(start, -1, `${type} 메시지 처리 분기가 있어야 합니다.`);
  const next = webviewSource.indexOf("} else if (message.type", start + marker.length);
  return webviewSource.slice(start, next === -1 ? undefined : next);
}

test("send is single-flight, optimistic, and frees the composer for a new draft", () => {
  const send = functionBody(webviewSource, "sendTask");
  assert.match(send, /!note\s*\|\|\s*!state\.selectedProjectId\s*\|\|\s*state\.pendingRequestId/);
  assert.match(send, /state\.pendingRequestId\s*=\s*crypto\.randomUUID\(\)/);
  assert.match(send, /type:\s*"sendTask"[\s\S]*requestId:\s*state\.pendingRequestId/);
  assert.match(send, /state\.optimisticTurns\.push/);
  assert.match(send, /promptInput\.value\s*=\s*""/);

  const accepted = messageBranch("taskAccepted");
  assert.match(accepted, /message\.requestId\s*===\s*state\.pendingRequestId/);
  assert.doesNotMatch(accepted, /promptInput\.value\s*=/);
  const rejected = messageBranch("taskRejected");
  assert.match(rejected, /!dom\.promptInput\.value\.trim\(\)/);
  assert.match(rejected, /dom\.promptInput\.value\s*=\s*rejected\.note/);

  const hostCreate = methodBody(extensionSource, "createTask");
  assert.match(hostCreate, /typedNote:\s*String\(note\)\.trim\(\)/);
  for (const field of ["model", "effort", "speedMode"]) {
    assert.match(hostCreate, new RegExp(`body\\.set\\(\"${field}\", runOptions\\.${field}\\)`));
  }
  const runtimeChoices = functionBody(webviewSource, "renderRuntimeChoices");
  assert.match(runtimeChoices, /\[\.\.\.select\.children\]/, "실제 HTMLCollection도 배열로 변환해야 합니다.");
  assert.match(runtimeChoices, /role",\s*"menuitemradio"/);
});

test("active work preserves draft input while the send button becomes stop", () => {
  const renderComposer = functionBody(webviewSource, "renderComposer");
  assert.match(renderComposer, /const activeTask\s*=\s*state\.tasks\.findLast/);
  assert.match(renderComposer, /dom\.promptInput\.disabled\s*=\s*inputDisabled/);
  assert.doesNotMatch(renderComposer, /dom\.promptInput\.disabled\s*=\s*inputDisabled\s*\|\|\s*active/);
  assert.match(renderComposer, /const mode\s*=\s*activeTask\s*\?\s*"stop"\s*:\s*"send"/);
  assert.match(renderComposer, /classList\.toggle\("is-stop"/);
  assert.match(renderComposer, /mode\s*===\s*"stop"\s*\?\s*"작업 중단"\s*:\s*"전송"/);
  for (const control of ["modelSelect", "effortSelect", "speedSelect"]) {
    assert.doesNotMatch(renderComposer, new RegExp(`dom\\.${control}\\.disabled[^;]*active`));
  }
  assert.match(renderComposer, /다음 요청을 미리 입력할 수 있습니다/);

  const primaryAction = functionBody(webviewSource, "handlePrimaryAction");
  assert.match(primaryAction, /findLast\(\(candidate\)\s*=>\s*ACTIVE_STATUSES\.has/);
  assert.match(primaryAction, /type:\s*"cancel"[\s\S]*taskId:\s*task\.taskId/);
  assert.doesNotMatch(webviewSource, /id="cancelButton"|dom\.cancelButton/);
  assert.match(extensionSource, /case\s+"cancel"[\s\S]*\/cancel[\s\S]*method:\s*"POST"/);
});

test("settings opens, closes with Escape, and its buttons invoke real host work", () => {
  assert.match(
    webviewSource,
    /settingsButton\.addEventListener\("click"[\s\S]*connectionPanel\.classList\.toggle[\s\S]*aria-expanded/,
  );
  assert.match(
    webviewSource,
    /event\.key\s*===\s*"Escape"[\s\S]*closeSettings\(\)[\s\S]*settingsButton\.focus\(\)/,
  );
  assert.match(webviewSource, /"pointerdown"[\s\S]*connectionPanel\.contains\(event\.target\)[\s\S]*closeSettings\(\)/);
  assert.match(
    webviewSource,
    /setupTailscaleButton\.addEventListener\("click"[\s\S]*type:\s*"setupTailscale"/,
  );
  assert.match(extensionSource, /case\s+"setupTailscale"[\s\S]*configureTailscale\(\)/);
  assert.match(extensionSource, /case\s+"setAgent"[\s\S]*에이전트는 프로젝트 설정이 아니라 다음 turn의 실행 옵션/);
});

test("model, effort, and speed are persisted per agent and sent on every turn", () => {
  const save = functionBody(webviewSource, "saveRunOptions");
  assert.match(save, /state\.runOptions\[selectedAgentId\(\)\]\s*=\s*selectedRunOptions\(\)/);
  assert.match(save, /persistViewState\(\)/);
  const persist = functionBody(webviewSource, "persistViewState");
  assert.match(persist, /runOptions:\s*state\.runOptions/);
  const selected = functionBody(webviewSource, "selectedRunOptions");
  assert.match(selected, /model:\s*dom\.modelSelect\.value/);
  assert.match(selected, /effort:\s*dom\.effortSelect\.value/);
  assert.match(selected, /speedMode:\s*dom\.speedSelect\.value/);
  const send = functionBody(webviewSource, "sendTask");
  assert.match(send, /runOptions:\s*selectedRunOptions\(\)/);
});

test("clarification supports both choices and a non-empty free-text answer", () => {
  const questions = functionBody(webviewSource, "questionList");
  assert.match(questions, /submitQuestionAnswer\(task, question, \{ optionId: option\.optionId \}/);
  assert.match(questions, /input\.placeholder\s*=\s*"직접 입력"/);
  assert.match(questions, /const freeText\s*=\s*input\.value\.trim\(\)/);
  assert.match(questions, /if\s*\(!freeText\)\s*return/);
  assert.match(questions, /submitQuestionAnswer\(task, question, \{ optionId: null, freeText \}/);
  const submit = functionBody(webviewSource, "submitQuestionAnswer");
  assert.match(submit, /if\s*\(state\.pendingAnswers\.has\(key\)\)\s*return/);
  assert.match(submit, /type:\s*"answer"[\s\S]*requestId,[\s\S]*\.\.\.answer/);
  assert.match(extensionSource, /case\s+"answer"[\s\S]*selectedOptionId:[\s\S]*freeText:/);
});

test("review, file diff, and undo are wired to host operations rather than decorative buttons", () => {
  const files = functionBody(webviewSource, "filesCard");
  assert.match(files, /type:\s*"undoTask"[\s\S]*taskId:\s*task\.taskId/);
  assert.match(files, /type:\s*"reviewTask"[\s\S]*taskId:\s*task\.taskId/);
  assert.match(files, /type:\s*"openTaskFile"[\s\S]*path:\s*file\.path/);
  assert.match(extensionSource, /case\s+"reviewTask"[\s\S]*openReview\(message\.taskId\)/);
  assert.match(extensionSource, /case\s+"openTaskFile"[\s\S]*openTaskFile\(message\.taskId, message\.path\)/);
  const undo = methodBody(extensionSource, "undoTask");
  assert.match(undo, /showWarningMessage\([\s\S]*modal:\s*true/);
  assert.match(undo, /\/undo`?,\s*\{\s*method:\s*"POST"/);
  assert.match(extensionSource, /"vscode\.diff"/);
});

test("WebSocket events are filtered, coalesced, and reconnected with polling fallback", () => {
  const stream = functionBody(webviewSource, "connectEventStream");
  assert.match(stream, /WebSocket\.CONNECTING, WebSocket\.OPEN/);
  assert.match(stream, /endpoint\.protocol\s*=\s*endpoint\.protocol\s*===\s*"https:"\s*\?\s*"wss:"\s*:\s*"ws:"/);
  assert.match(stream, /payload\.type\s*===\s*"ping"/);
  assert.match(stream, /payload\.projectId\s*!==\s*state\.selectedProjectId/);
  assert.match(stream, /state\.eventRefreshTimer[\s\S]*setTimeout\([\s\S]*refresh\(\)[\s\S]*55/);
  assert.match(stream, /"close"[\s\S]*setTimeout\(connectEventStream,\s*1500\)/);
  assert.match(stream, /"error"[\s\S]*socket\.close\(\)/);

  const poll = functionBody(webviewSource, "schedulePoll");
  assert.match(poll, /visibilityState\s*!==\s*"visible"/);
  assert.match(poll, /eventSocket\?\.readyState\s*===\s*WebSocket\.OPEN/);
  assert.match(poll, /active\s*\?\s*5_000\s*:\s*30_000/);
  assert.match(poll, /active\s*\?\s*900\s*:\s*5_000/);
});

test("task rendering follows only when already near the bottom", () => {
  const renderTasks = functionBody(webviewSource, "renderTasks");
  const capture = renderTasks.indexOf("const shouldFollow = nearDocumentBottom()");
  const mutation = Math.min(
    ...["cached.node.remove()", "cached.node.replaceWith(node)", "dom.taskList.append(cached.node)"]
      .map((needle) => renderTasks.indexOf(needle))
      .filter((index) => index >= 0),
  );
  assert.ok(capture >= 0 && capture < mutation, "DOM 변경 전에 사용자의 스크롤 위치를 캡처해야 합니다.");
  assert.match(renderTasks, /if\s*\(shouldFollow\)[\s\S]*requestAnimationFrame\(\(\)\s*=>[\s\S]*scrollToDocumentBottom/);
  const nearBottom = functionBody(webviewSource, "nearDocumentBottom");
  assert.match(nearBottom, /window\.scrollY\s*\+\s*window\.innerHeight/);
  assert.match(nearBottom, /document\.documentElement\.scrollHeight\s*-\s*72/);
});

test("copy completion acknowledgement is reflected in the clicked control", () => {
  assert.match(webviewSource, /type:\s*"copyText"[\s\S]*requestId/);
  assert.match(webviewSource, /message\.type\s*===\s*"copyTextCompleted"/);
  const complete = functionBody(webviewSource, "completeCopy");
  assert.match(complete, /copy-confirmed/);
  assert.match(complete, /replaceChildren\(icon\("check"\)\)/);
});

test("response feedback and expansion are real persisted host actions", () => {
  assert.match(webviewSource, /type:\s*"setResponseFeedback"/);
  assert.match(webviewSource, /type:\s*"openResponse"/);
  assert.match(extensionSource, /case\s+"setResponseFeedback"/);
  assert.match(extensionSource, /case\s+"openResponse"/);
  assert.match(extensionSource, /globalState\.update\(RESPONSE_FEEDBACK_KEY/);
  assert.match(extensionSource, /openTextDocument\(\{[\s\S]*language:\s*"markdown"/);
});

test("an active turn accepts a follow-up draft without allowing conflicting submission", () => {
  const composer = functionBody(webviewSource, "renderComposer");
  assert.match(composer, /dom\.promptInput\.disabled\s*=\s*inputDisabled/);
  assert.match(composer, /mode\s*===\s*"stop"[\s\S]*state\.cancelPendingTaskId/);
  assert.match(composer, /다음 요청을 미리 입력할 수 있습니다/);
});

const optimisticTurnImplemented = /optimistic|pendingTurn/.test(
  functionBody(webviewSource, "sendTask"),
);
test("the prompt appears optimistically as a user turn while task creation is pending", {
  todo: optimisticTurnImplemented
    ? false
    : "현재는 taskAccepted 뒤 서버 task 목록을 다시 읽을 때까지 사용자 말풍선이 나타나지 않습니다.",
}, () => {
  if (!optimisticTurnImplemented) return;
  const send = functionBody(webviewSource, "sendTask");
  assert.match(send, /optimistic|pendingTurn|userMessage/);
});

const emptyProjectGuardImplemented = /button\.disabled\s*=\s*!project\s*\|\|/.test(
  functionBody(webviewSource, "renderAgents"),
);
test("agent controls are inert when no project is selected", {
  todo: emptyProjectGuardImplemented
    ? false
    : "사용 가능한 agent 버튼은 project가 null일 때도 활성화될 수 있고 click 시 project.projectId를 읽습니다.",
}, () => {
  if (!emptyProjectGuardImplemented) return;
  const agents = functionBody(webviewSource, "renderAgents");
  assert.match(agents, /button\.disabled\s*=\s*!project\s*\|\|/);
});

const codexKeyboardSubmitImplemented = (
  /event\.key\s*===\s*"Enter"/.test(webviewSource) &&
  /event\.shiftKey/.test(webviewSource) &&
  !/\(event\.metaKey\s*\|\|\s*event\.ctrlKey\)\s*&&\s*event\.key\s*===\s*"Enter"/.test(
    webviewSource,
  )
);
test("Enter submits while Shift+Enter inserts a newline like the Codex composer", {
  todo: codexKeyboardSubmitImplemented
    ? false
    : "현재는 ⌘/Ctrl+Enter만 전송하며 Codex의 Enter 전송·Shift+Enter 줄바꿈 동작과 다릅니다.",
}, () => {
  if (!codexKeyboardSubmitImplemented) return;
  assert.match(webviewSource, /event\.key\s*===\s*"Enter"/);
  assert.match(webviewSource, /!event\.shiftKey/);
});

const pendingDraftProtected = (
  /pending(?:Request)?Note|submittedNote|optimistic/i.test(webviewSource) ||
  /pendingRequestId[\s\S]*promptInput\.disabled/.test(
    functionBody(webviewSource, "renderComposer"),
  )
);
test("an acknowledgement never erases text typed after the pending request", {
  todo: pendingDraftProtected
    ? false
    : "요청 대기 중 textarea는 편집 가능하지만 taskAccepted가 현재 값을 무조건 비워 새로 쓴 후속 요청을 잃을 수 있습니다.",
}, () => {
  if (!pendingDraftProtected) return;
  const accepted = messageBranch("taskAccepted");
  assert.match(accepted, /optimistic/i);
  assert.doesNotMatch(accepted, /promptInput\.value\s*=/i);
});

test("refresh failures disconnect the UI and stale host refreshes are discarded", () => {
  const refresh = methodBody(extensionSource, "refresh");
  assert.match(refresh, /const generation\s*=\s*\+\+this\.refreshGeneration/);
  assert.match(refresh, /if\s*\(generation\s*!==\s*this\.refreshGeneration\)\s*return/);
  assert.match(refresh, /requestedProjectId:\s*selectedProjectId\s*\|\|\s*null/);
  assert.match(refresh, /reportError\(error,\s*\{ connectionFailed:\s*true \}\)/);
  const stateBranch = messageBranch("state");
  assert.match(stateBranch, /message\.requestedProjectId[\s\S]*message\.requestedProjectId\s*!==\s*state\.selectedProjectId[\s\S]*return/);
});

test("markdown file links carry the selected project and resolve from its project root", () => {
  assert.match(webviewSource, /type:\s*"openLink"[\s\S]*projectId:\s*projectId\s*\|\|\s*state\.selectedProjectId/);
  assert.match(extensionSource, /case\s+"openLink"[\s\S]*message\.projectId/);
  assert.match(extensionSource, /resolveWorkspaceFile\([\s\S]*const projectRoot\s*=\s*this\.resolveProjectRoot\(projectId\)/);
  assert.match(extensionSource, /path\.resolve\(projectRoot, requestedPath\)/);
});

test("agent switching keeps one shared timeline and backend-owned session binding", () => {
  const switcher = functionBody(webviewSource, "selectAgent");
  assert.doesNotMatch(switcher, /state\.tasks\s*=\s*\[\]/);
  assert.match(switcher, /state\.threadView\s*=\s*"conversation"/);
  const selection = functionBody(webviewSource, "currentThreadSelection");
  assert.match(selection, /mode:\s*"auto"/);
  assert.match(selection, /threadId:\s*null/);
  const send = functionBody(webviewSource, "sendTask");
  assert.match(send, /conversationId:\s*selectedConversationId\(\)/);
  assert.match(send, /agentId:\s*selectedAgentId\(\)/);
});
