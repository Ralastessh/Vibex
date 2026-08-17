"use strict";

const vscode = require("vscode");

/**
 * Translates VIBEX task snapshots into native chat response parts.
 *
 * The bridge exposes a task as a *snapshot* (`agentReply`, `activityItems`,
 * `changedFiles`, `usage`), not as a delta stream, so both the live transcript
 * and the replayed history go through the same mapping here. {@link TaskRenderer}
 * keeps the "what did I already show" bookkeeping needed to turn repeated
 * snapshots into an append-only stream.
 */

const STATUS_MESSAGES = {
  queued: "대기 중입니다.",
  interpreting: "요청을 해석하고 있습니다.",
  awaiting_confirmation: "확인을 기다리고 있습니다.",
  resolving_session: "프로젝트 세션을 찾고 있습니다.",
  running_agent: "요청을 처리하고 있습니다.",
  testing: "테스트를 실행하고 있습니다.",
  completed: "완료되었습니다.",
  failed: "실패했습니다.",
  cancelled: "취소되었습니다.",
};

const ACTIVE_STATUSES = new Set([
  "queued",
  "interpreting",
  "awaiting_confirmation",
  "resolving_session",
  "running_agent",
  "testing",
]);

const ACTIVITY_LABELS = {
  reasoning: "작업 방향을 검토했습니다",
  plan: "작업 계획을 갱신했습니다",
  command: "명령을 실행했습니다",
  commandExecution: "명령을 실행했습니다",
  fileChange: "파일을 수정했습니다",
  mcpToolCall: "도구를 사용했습니다",
  dynamicToolCall: "도구를 사용했습니다",
  collabToolCall: "도구를 사용했습니다",
  webSearch: "웹을 검색했습니다",
  imageView: "이미지를 확인했습니다",
  enteredReviewMode: "리뷰 모드에 들어갔습니다",
  exitedReviewMode: "리뷰 모드를 마쳤습니다",
};

function isActive(task) {
  return ACTIVE_STATUSES.has(String(task?.status || ""));
}

const AGENT_DISPLAY_NAMES = {
  "claude-code": "Claude Code",
  "codex-cli": "Codex",
  "gemini-cli": "Gemini",
};

function formatTokens(count) {
  const value = Number(count) || 0;
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return String(value);
}

/**
 * The small trailing line under a finished answer: which agent and model
 * produced it and how many tokens the turn consumed. Rendered as subscript so
 * it reads like the timestamp VS Code already shows, not like reply content.
 */
function metaLineFor(task) {
  const parts = [];
  const agent = AGENT_DISPLAY_NAMES[String(task?.agentId || "")] || task?.agentId;
  if (agent) {
    const model = String(task?.agentModel || "").trim();
    parts.push(model ? `${agent} · ${model}` : String(agent));
  }
  const usage = task?.usage;
  if (usage && (usage.inputTokens || usage.outputTokens || usage.totalTokens)) {
    const total = usage.totalTokens || (usage.inputTokens || 0) + (usage.outputTokens || 0);
    parts.push(`${formatTokens(usage.inputTokens)}↑ ${formatTokens(usage.outputTokens)}↓ (총 ${formatTokens(total)} 토큰)`);
  }
  if (usage?.costUsd != null) {
    parts.push(`$${Number(usage.costUsd).toFixed(4)}`);
  }
  if (!parts.length) return undefined;
  const markdown = new vscode.MarkdownString(`<sub>${parts.join(" · ")}</sub>`);
  markdown.supportHtml = true;
  return markdown;
}

function statusMessage(status) {
  return STATUS_MESSAGES[String(status || "")] || "작업을 진행하고 있습니다.";
}

function activityItems(task) {
  return Array.isArray(task?.activityItems) ? task.activityItems : [];
}

function itemKind(item) {
  return String(item?.type || "item");
}

function itemLabel(item) {
  return ACTIVITY_LABELS[itemKind(item)] || "작업을 진행했습니다";
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

/**
 * Builds the tool invocation part for one activity item. Reasoning is handled
 * separately because VS Code renders it as collapsible thinking, not as a tool.
 */
function toolInvocationFor(item) {
  const kind = itemKind(item);
  const data = item?.data || {};
  const invocation = new vscode.ChatToolInvocationPart(kind, String(item.itemId));
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
      output: item.output ? { text: String(item.output).replace(/\n/g, "\r\n") } : undefined,
      state:
        typeof data.exitCode === "number" ? { exitCode: data.exitCode } : undefined,
    };
    return invocation;
  }

  if (kind === "fileChange") {
    const changes = Array.isArray(data.changes) ? data.changes : [];
    const paths = changes.map((change) => change?.path).filter(Boolean);
    invocation.invocationMessage = paths.length
      ? new vscode.MarkdownString(
          paths.length === 1
            ? `\`${paths[0]}\` 파일을 수정했습니다`
            : `${paths.length}개 파일을 수정했습니다`,
        )
      : itemLabel(item);
    if (paths.length > 1) {
      invocation.toolSpecificData = { input: "", output: paths.join("\n") };
    }
    return invocation;
  }

  const title = String(item.text || data.tool || data.name || "").trim() || itemLabel(item);
  invocation.invocationMessage = new vscode.MarkdownString(title);
  const output = String(item.output || "").trim();
  if (output && output !== title) {
    invocation.toolSpecificData = { input: "", output };
  }
  return invocation;
}

/**
 * Streams one task's evolving snapshot into a chat response.
 *
 * Call {@link apply} with each freshly fetched task; only what is new since the
 * previous call is pushed, so the same renderer can follow a task from `queued`
 * all the way to a terminal status without duplicating content.
 */
class TaskRenderer {
  constructor(stream, { projectRoot } = {}) {
    this.stream = stream;
    this.projectRoot = projectRoot;
    this.emittedReplyLength = 0;
    this.emittedThinking = new Map();
    this.emittedSignatures = new Map();
    this.emittedStatus = undefined;
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
    this.stream.markdown(new vscode.MarkdownString(reply.slice(this.emittedReplyLength)));
    this.emittedReplyLength = reply.length;
  }

  _renderFooter(task) {
    if (this.emittedFooter) return;
    this.emittedFooter = true;

    for (const warning of task?.warnings || []) {
      this.stream.warning(new vscode.MarkdownString(String(warning)));
    }

    for (const test of task?.testResults || []) {
      const icon = test.status === "passed" ? "$(check)" : test.status === "failed" ? "$(error)" : "$(circle-slash)";
      const line = new vscode.MarkdownString(
        `${icon} \`${test.command}\`${test.summary ? ` — ${test.summary}` : ""}`,
      );
      line.supportThemeIcons = true;
      this.stream.markdown(line);
    }

    for (const file of task?.changedFiles || []) {
      const absolute = this.projectRoot && file?.path
        ? vscode.Uri.joinPath(vscode.Uri.file(this.projectRoot), file.path)
        : undefined;
      if (absolute) this.stream.reference2(absolute);
    }

    if (task?.reviewAvailable) {
      this.stream.button({
        command: "vibex.openReview",
        title: "변경 사항 검토",
        arguments: [task.taskId],
      });
    }

    if (task?.usage && !this.emittedUsage) {
      this.emittedUsage = true;
      this.stream.usage({
        promptTokens: Number(task.usage.inputTokens || 0),
        completionTokens: Number(task.usage.outputTokens || 0),
      });
    }

    if (task?.error) {
      this.stream.warning(new vscode.MarkdownString(String(task.error)));
    }

    const metaLine = metaLineFor(task);
    if (metaLine) this.stream.markdown(metaLine);
  }
}

/**
 * Rebuilds the response parts of a finished (or in-flight but not followed)
 * task for the session transcript.
 */
function historyPartsForTask(task, { projectRoot } = {}) {
  const parts = [];

  for (const item of activityItems(task)) {
    if (itemKind(item) === "reasoning") {
      const text = String(item.text || "").trim();
      if (text) parts.push(new vscode.ChatResponseThinkingProgressPart(text, String(item.itemId)));
      continue;
    }
    parts.push(toolInvocationFor(item));
  }

  const reply = String(task?.agentReply || "").trim();
  if (reply) parts.push(new vscode.ChatResponseMarkdownPart(new vscode.MarkdownString(reply)));

  for (const test of task?.testResults || []) {
    const icon = test.status === "passed" ? "$(check)" : test.status === "failed" ? "$(error)" : "$(circle-slash)";
    const line = new vscode.MarkdownString(
      `${icon} \`${test.command}\`${test.summary ? ` — ${test.summary}` : ""}`,
    );
    line.supportThemeIcons = true;
    parts.push(new vscode.ChatResponseMarkdownPart(line));
  }

  for (const file of task?.changedFiles || []) {
    if (!projectRoot || !file?.path) continue;
    parts.push(
      new vscode.ChatResponseReferencePart(
        vscode.Uri.joinPath(vscode.Uri.file(projectRoot), file.path),
      ),
    );
  }

  if (task?.reviewAvailable) {
    parts.push(
      new vscode.ChatResponseCommandButtonPart({
        command: "vibex.openReview",
        title: "변경 사항 검토",
        arguments: [task.taskId],
      }),
    );
  }

  const error = String(task?.error || "").trim();
  if (error) {
    parts.push(new vscode.ChatResponseWarningPart(new vscode.MarkdownString(error)));
  }

  const metaLine = metaLineFor(task);
  if (metaLine) parts.push(new vscode.ChatResponseMarkdownPart(metaLine));

  return parts;
}

module.exports = {
  ACTIVE_STATUSES,
  TaskRenderer,
  historyPartsForTask,
  isActive,
  statusMessage,
};
