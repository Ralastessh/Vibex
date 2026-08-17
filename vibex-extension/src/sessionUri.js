"use strict";

const vscode = require("vscode");

/**
 * VIBEX chat sessions are identified by the VIBEX conversation they render.
 * A conversation always belongs to exactly one registered project, so both ids
 * live in the resource and no extra lookup table is needed.
 *
 *   vibex:/<projectId>/<conversationId>
 */
const SCHEME = "vibex";

function forConversation(projectId, conversationId) {
  const project = String(projectId || "").trim();
  const conversation = String(conversationId || "").trim();
  if (!project || !conversation) {
    throw new Error("VIBEX 대화 주소에는 projectId와 conversationId가 모두 필요합니다.");
  }
  return vscode.Uri.from({ scheme: SCHEME, path: `/${project}/${conversation}` });
}

function parse(resource) {
  if (!resource || resource.scheme !== SCHEME) {
    throw new Error(`VIBEX 대화 주소가 아닙니다: ${resource?.toString?.() ?? resource}`);
  }
  const [, projectId, conversationId] = resource.path.split("/");
  if (!projectId || !conversationId) {
    throw new Error(`VIBEX 대화 주소를 해석하지 못했습니다: ${resource.toString()}`);
  }
  return { projectId, conversationId };
}

function tryParse(resource) {
  try {
    return parse(resource);
  } catch {
    return undefined;
  }
}

/**
 * True when the resource names a VIBEX conversation that already exists.
 *
 * A blank chat editor is opened with a placeholder resource (`vibex:/untitled-…`)
 * before the user has sent anything, and the real conversation is only created
 * by the controller's new-session handler on the first request. Callers must
 * treat that placeholder as an empty session rather than a lookup failure.
 */
function isConversation(resource) {
  return tryParse(resource) !== undefined;
}

module.exports = { SCHEME, forConversation, parse, tryParse, isConversation };
