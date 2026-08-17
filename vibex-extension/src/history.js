"use strict";

const vscode = require("vscode");
const { SCHEME } = require("./sessionUri");
const { buildModelId } = require("./models");
const { historyPartsForTask, isActive } = require("./activity");

/**
 * Rebuilds a VIBEX conversation as native chat history.
 *
 * One VIBEX task is one request/response pair. A task that asked the user
 * something mid-run stores the exchange in `clarificationTurns`, so those are
 * expanded into their own turns to keep the transcript in real order — the same
 * order the iPad app shows for the same conversation.
 */
function buildChatHistory(tasks, { projectRoot, followLastTask } = {}) {
  const turns = [];
  const ordered = Array.isArray(tasks) ? tasks : [];

  for (const [index, task] of ordered.entries()) {
    const isLast = index === ordered.length - 1;
    if (isLast && followLastTask && isActive(task)) {
      // The caller streams this one live through `activeResponseCallback`;
      // only its request belongs in the static history.
      turns.push(requestTurnFor(task, task.userMessage, `${task.taskId}`, projectRoot));
      continue;
    }

    turns.push(requestTurnFor(task, task.userMessage, `${task.taskId}`, projectRoot));

    for (const [turnIndex, clarification] of (task.clarificationTurns || []).entries()) {
      const reply = String(clarification?.assistantReply || clarification?.question?.text || "").trim();
      if (reply) {
        turns.push(
          new vscode.ChatResponseTurn2(
            [new vscode.ChatResponseMarkdownPart(new vscode.MarkdownString(reply))],
            {},
            SCHEME,
          ),
        );
      }
      const answer = String(clarification?.answer || "").trim();
      if (answer) {
        turns.push(
          requestTurnFor(task, answer, `${task.taskId}-answer-${turnIndex}`, projectRoot),
        );
      }
    }

    const parts = historyPartsForTask(task, { projectRoot });
    if (parts.length) {
      turns.push(new vscode.ChatResponseTurn2(parts, {}, SCHEME));
    }
  }

  return turns;
}

function requestTurnFor(task, prompt, id, projectRoot) {
  return new vscode.ChatRequestTurn2(
    String(prompt || ""),
    undefined,
    referencesFor(task, projectRoot),
    SCHEME,
    [],
    undefined,
    id,
    task?.agentId ? buildModelId(task.agentId, task.agentModel || "") : undefined,
    undefined,
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
      value: vscode.Uri.joinPath(vscode.Uri.file(projectRoot), reference.relativePath),
    });
  }
  return references;
}

module.exports = { buildChatHistory };
