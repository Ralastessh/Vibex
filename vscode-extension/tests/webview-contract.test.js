const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const extensionRoot = path.resolve(__dirname, "..");
const extensionPath = path.join(extensionRoot, "src", "extension.js");
const webviewPath = path.join(extensionRoot, "media", "main.js");
const extensionSource = fs.readFileSync(extensionPath, "utf8");
const webviewSource = fs.readFileSync(webviewPath, "utf8");

function extractWebviewHtml(source) {
  const start = source.indexOf("<!doctype html>");
  const closingTag = "</html>";
  const end = source.indexOf(closingTag, start);
  assert.notEqual(start, -1, "extension.js에 WebView HTML 시작점이 있어야 합니다.");
  assert.notEqual(end, -1, "extension.js에 WebView HTML 종료점이 있어야 합니다.");
  return source.slice(start, end + closingTag.length);
}

function parseAttributes(rawAttributes) {
  const attributes = new Map();
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of rawAttributes.matchAll(pattern)) {
    attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
}

function parseStartTags(html) {
  const tags = [];
  const pattern = /<([a-z][\w:-]*)(\s[^<>]*?)?>/gi;
  for (const match of html.matchAll(pattern)) {
    tags.push({
      name: match[1].toLowerCase(),
      attributes: parseAttributes(match[2] || ""),
      source: match[0],
    });
  }
  return tags;
}

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
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
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
    if (character === "\"" || character === "'" || character === "`") {
      quote = character;
      continue;
    }
    if (character === opening) depth += 1;
    if (character === closing) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error(`${opening}${closing} 블록을 끝까지 찾지 못했습니다.`);
}

function extractFunctionBody(source, functionName) {
  const marker = `function ${functionName}(`;
  const functionIndex = source.indexOf(marker);
  assert.notEqual(functionIndex, -1, `${functionName} 함수가 있어야 합니다.`);
  const openingBrace = source.indexOf("{", functionIndex + marker.length);
  assert.notEqual(openingBrace, -1, `${functionName} 함수 본문이 있어야 합니다.`);
  const closingBrace = findMatchingDelimiter(source, openingBrace, "{", "}");
  return source.slice(openingBrace + 1, closingBrace);
}

function extractPostMessages(source) {
  const messages = [];
  const marker = "vscode.postMessage";
  let cursor = 0;
  while (cursor < source.length) {
    const callIndex = source.indexOf(marker, cursor);
    if (callIndex === -1) break;
    const openingParen = source.indexOf("(", callIndex + marker.length);
    assert.notEqual(openingParen, -1, "postMessage 호출 괄호가 있어야 합니다.");
    const closingParen = findMatchingDelimiter(source, openingParen, "(", ")");
    const argument = source.slice(openingParen + 1, closingParen);
    const type = argument.match(/\btype\s*:\s*["']([^"']+)["']/)?.[1];
    if (type) messages.push({ type, argument });
    cursor = closingParen + 1;
  }
  return messages;
}

function extractHostCases(source) {
  return new Set(
    [...source.matchAll(/\bcase\s+["']([^"']+)["']\s*:/g)].map((match) => match[1]),
  );
}

const html = extractWebviewHtml(extensionSource);
const htmlTags = parseStartTags(html);
const postMessages = extractPostMessages(webviewSource);
const postMessageTypes = new Set(postMessages.map((message) => message.type));
const hostCases = extractHostCases(extensionSource);

test("WebView HTML ids are unique and the renderer contract ids exist", () => {
  const ids = htmlTags
    .map((tag) => tag.attributes.get("id"))
    .filter(Boolean);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  assert.deepEqual(duplicateIds, [], `중복 id: ${duplicateIds.join(", ")}`);

  const requiredIds = [
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
    "scrollToBottomButton",
    "composerHint",
    "selectedAgentLabel",
    "modelSelect",
    "effortSelect",
    "speedSelect",
    "runtimeButton",
    "runtimePanel",
    "modelChoices",
    "effortChoices",
    "speedChoices",
    "modelGroupButton",
    "speedGroupButton",
    "runtimeModelValue",
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
  ];
  const availableIds = new Set(ids);
  assert.deepEqual(
    requiredIds.filter((id) => !availableIds.has(id)),
    [],
    "media/main.js가 참조하는 필수 id가 HTML에 모두 있어야 합니다.",
  );
});

test("the first Codex view is only the conversation list", () => {
  assert.doesNotMatch(html, /id="backButton"|class="history-heading"/);
  assert.doesNotMatch(html, /이 프로젝트의 Codex · VS Code · CLI 대화/);
  assert.match(webviewSource, /threadView:\s*"history"/);
});

test("unsupported decorative controls are not rendered as dummy UI", () => {
  const forbiddenClasses = new Set([
    "back-button",
    "composer-icon",
    "approval-label",
    "assistant-actions",
  ]);
  const forbiddenLabels = /^(뒤로가기|첨부|나 대신 승인)$/;
  const violations = [];

  for (const tag of htmlTags) {
    const classNames = (tag.attributes.get("class") || "").split(/\s+/).filter(Boolean);
    const badClass = classNames.find((className) => forbiddenClasses.has(className));
    if (badClass) violations.push(`${tag.name}.${badClass}`);
    const accessibleLabel = tag.attributes.get("aria-label") || tag.attributes.get("title") || "";
    if (forbiddenLabels.test(accessibleLabel.trim())) {
      violations.push(`${tag.name}[label=${accessibleLabel}]`);
    }
  }

  assert.deepEqual(violations, []);
  assert.doesNotMatch(html, /나 대신 승인|[♡♥♧♣]/u);
  assert.doesNotMatch(webviewSource, /assistant-actions|[♡♥♧♣]/u);
});

test("assistant body is sourced from agentReply without synthesized Bridge metadata", () => {
  const taskTurn = extractFunctionBody(webviewSource, "taskTurn");
  const markdownArguments = [...taskTurn.matchAll(/\bmarkdownResponse\s*\(([^)]*)\)/g)]
    .map((match) => match[1].trim());

  assert.deepEqual(markdownArguments, ["task.agentReply, task.projectId"]);
  assert.match(taskTurn, /requestCopy[\s\S]*?task\.agentReply/);
  for (const field of ["summary", "testResults", "warnings", "sessionId"]) {
    assert.doesNotMatch(
      taskTurn,
      new RegExp(`\\btask\\s*\\.\\s*${field}\\b`),
      `task.${field}를 답변 본문에 합성하면 안 됩니다.`,
    );
  }
});

test("every visible WebView action has a postMessage and extension-host route", () => {
  const actionTypes = [
    "copyText",
    "openLink",
    "reviewTask",
    "openTaskFile",
    "undoTask",
    "cancel",
    "answer",
    "sendTask",
    "loadThreads",
    "openThread",
    "renameThread",
    "archiveThread",
    "setResponseFeedback",
    "openResponse",
  ];

  assert.deepEqual(
    actionTypes.filter((type) => !postMessageTypes.has(type)),
    [],
    "WebView action postMessage가 빠졌습니다.",
  );
  assert.match(extensionSource, /globalState\.update\(RESPONSE_FEEDBACK_KEY/);
  assert.match(webviewSource, /aria-pressed/);
  assert.deepEqual(
    actionTypes.filter((type) => !hostCases.has(type)),
    [],
    "extension host switch case가 빠졌습니다.",
  );

  const answerPost = postMessages.find((message) => message.type === "answer");
  assert.ok(answerPost, "answer postMessage가 있어야 합니다.");
  assert.match(answerPost.argument, /\.\.\.answer/);
  const questions = extractFunctionBody(webviewSource, "questionList");
  assert.match(questions, /\{ optionId: null, freeText \}/);

  const sendTask = postMessages.find((message) => message.type === "sendTask");
  assert.ok(sendTask, "sendTask postMessage가 있어야 합니다.");
  assert.match(sendTask.argument, /\brunOptions\s*:\s*selectedRunOptions\s*\(/);
  assert.match(sendTask.argument, /\bthreadMode\s*:\s*threadSelection\.mode/);
  assert.match(sendTask.argument, /\bthreadId\s*:\s*threadSelection\.threadId/);

  for (const field of ["model", "effort", "speedMode"]) {
    assert.match(
      extensionSource,
      new RegExp(`\\bbody\\.set\\(\\s*["']${field}["']\\s*,`),
      `${field} 실행 옵션을 backend task 요청으로 전달해야 합니다.`,
    );
  }
});

test("completed clarification turns remain in transcript order before the final reply", () => {
  const taskTurn = extractFunctionBody(webviewSource, "taskTurn");
  const originalUser = taskTurn.indexOf("task.userMessage");
  const clarification = taskTurn.indexOf("appendClarificationTurns(turn, task)");
  const finalReply = taskTurn.indexOf("task.agentReply");
  assert.ok(originalUser >= 0 && originalUser < clarification && clarification < finalReply);

  const history = extractFunctionBody(webviewSource, "appendClarificationTurns");
  assert.match(history, /task\.clarificationTurns\s*\|\|\s*task\.clarification_turns/);
  assert.match(history, /clarification\.assistantReply\s*\|\|\s*clarification\.assistant_reply/);
  assert.match(history, /clarification\.question/);
  assert.match(history, /clarification\.answer/);
  assert.match(history, /clarification\.answeredAt\s*\|\|\s*clarification\.answered_at/);
});

test("extension and WebView JavaScript pass Node syntax validation", () => {
  for (const file of [extensionPath, webviewPath]) {
    const result = spawnSync(process.execPath, ["--check", file], {
      cwd: extensionRoot,
      encoding: "utf8",
    });
    assert.equal(
      result.status,
      0,
      `${path.relative(extensionRoot, file)} syntax error:\n${result.stderr || result.stdout}`,
    );
  }
});
