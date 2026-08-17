"use strict";

const vscode = require("vscode");

const VENDOR = "vibex";
const SESSION_TYPE = "vibex";
const SEPARATOR = "::";

/**
 * VIBEX runs local agent CLIs, so the native model picker lists one entry per
 * (agent, model) pair. The picker is the agent switch: choosing "Claude Code /
 * Opus" for one turn and "Codex / GPT-5.6 Sol" for the next keeps both turns in
 * the same VIBEX conversation, which is what the iPad app reads back.
 *
 * Nothing is ever generated through this provider — the chat participant talks
 * to the bridge directly — so the response callbacks stay empty, exactly like
 * the Claude Code provider in the upstream Copilot Chat extension.
 */
class VibexModelProvider {
  constructor(bridge, output) {
    this.bridge = bridge;
    this.output = output;
    this._onDidChange = new vscode.EventEmitter();
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
      } else if (!(await this.bridge.isHealthy())) {
        return [];
      }
      agents = await this.bridge.agents({ refresh: !options?.silent });
    } catch (error) {
      this.output.appendLine(`[models] 에이전트 목록을 읽지 못했습니다: ${error?.message || error}`);
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
          maxInputTokens: 200_000,
          maxOutputTokens: 64_000,
          isUserSelectable: true,
          isDefault: isFirst,
          category,
          capabilities: { imageInput: true, toolCalling: false },
          targetChatSessionType: SESSION_TYPE,
        });
        isFirst = false;
      }
    }
    return information;
  }

  async provideLanguageModelChatResponse() {
    // VIBEX turns are executed by the local agent CLI through the bridge; the
    // model entries above exist only to drive the native picker.
  }

  async provideTokenCount() {
    return 0;
  }
}

function buildModelId(agentId, modelValue) {
  return `${agentId}${SEPARATOR}${modelValue || ""}`;
}

function parseModelId(modelId) {
  const raw = String(modelId || "");
  const index = raw.indexOf(SEPARATOR);
  if (index < 0) return { agentId: raw, model: "" };
  return { agentId: raw.slice(0, index), model: raw.slice(index + SEPARATOR.length) };
}

module.exports = { VibexModelProvider, VENDOR, buildModelId, parseModelId };
