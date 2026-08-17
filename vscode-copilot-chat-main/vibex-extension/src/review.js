"use strict";

const crypto = require("node:crypto");
const path = require("node:path");
const vscode = require("vscode");
const { BridgeError } = require("./bridge");

const REVIEW_DOCUMENT_SCHEME = "vibex-review";

/**
 * Serves the "before" and "after" contents of a reviewed file so VS Code's own
 * diff editor can show what a VIBEX task changed. The bridge already computed
 * the diff; nothing is written to the workspace.
 */
class ReviewDocumentProvider {
  constructor() {
    this.documents = new Map();
  }

  provideTextDocumentContent(uri) {
    return this.documents.get(uri.toString()) || "";
  }

  add(content, relativePath, side) {
    const fileName = path.basename(relativePath || "file") || "file";
    const uri = vscode.Uri.from({
      scheme: REVIEW_DOCUMENT_SCHEME,
      authority: side,
      path: `/${crypto.randomUUID()}/${fileName}`,
    });
    this.documents.set(uri.toString(), String(content ?? ""));

    // Review documents are immutable and short-lived. Keep the provider bounded
    // even when a session stays open for a long time.
    while (this.documents.size > 200) {
      this.documents.delete(this.documents.keys().next().value);
    }
    return uri;
  }

  dispose() {
    this.documents.clear();
  }
}

class ReviewService {
  constructor(bridge) {
    this.bridge = bridge;
    this.documents = new ReviewDocumentProvider();
    this.registration = vscode.workspace.registerTextDocumentContentProvider(
      REVIEW_DOCUMENT_SCHEME,
      this.documents,
    );
  }

  dispose() {
    this.registration.dispose();
    this.documents.dispose();
  }

  async openReview(taskId) {
    const review = await this.bridge.taskReview(taskId);
    const files = Array.isArray(review.files) ? review.files : [];
    if (!files.length) {
      await this.openRawReview(review);
      return;
    }

    let selected = files[0];
    if (files.length > 1) {
      const picked = await vscode.window.showQuickPick(
        files.map((file) => ({
          label: file.path,
          description: `+${file.additions || 0} -${file.deletions || 0}`,
          file,
        })),
        {
          title: "리뷰할 파일 선택",
          placeHolder: `${files.length}개 변경 파일`,
          matchOnDescription: true,
        },
      );
      if (!picked) return;
      selected = picked.file;
    }

    await this.openFileDiffWithFallback(taskId, selected.path, review);
  }

  async openRawReview(review) {
    const document = await vscode.workspace.openTextDocument({
      language: "diff",
      content: String(review.patch || ""),
    });
    await vscode.window.showTextDocument(document, { preview: true });
  }

  async openFileDiffWithFallback(taskId, relativePath, review) {
    try {
      const fileReview = await this.bridge.taskReviewFile(taskId, relativePath);
      if (fileReview?.isBinary) {
        await this.openRawReview(review);
        return;
      }
      await this.openFileDiff(fileReview, relativePath);
    } catch (error) {
      if (error instanceof BridgeError && [404, 409, 501].includes(error.status)) {
        await this.openRawReview(review);
        return;
      }
      throw error;
    }
  }

  async openFileDiff(fileReview, expectedPath) {
    if (!fileReview || typeof fileReview !== "object") {
      throw new BridgeError("파일 리뷰 응답이 올바르지 않습니다.");
    }
    const relativePath = String(fileReview.path || expectedPath || "");
    if (!relativePath || (fileReview.path && relativePath !== expectedPath)) {
      throw new BridgeError("파일 리뷰 응답의 경로가 요청과 일치하지 않습니다.");
    }
    const validBefore =
      fileReview.beforeExists === false
        ? fileReview.before == null || typeof fileReview.before === "string"
        : typeof fileReview.before === "string";
    const validAfter =
      fileReview.afterExists === false
        ? fileReview.after == null || typeof fileReview.after === "string"
        : typeof fileReview.after === "string";
    if (!validBefore || !validAfter) {
      throw new BridgeError("파일 리뷰 응답에 변경 전·후 내용이 없습니다.");
    }

    const beforeExists = fileReview.beforeExists !== false;
    const afterExists = fileReview.afterExists !== false;
    const beforeUri = this.documents.add(fileReview.before ?? "", relativePath, "before");
    const afterUri = this.documents.add(fileReview.after ?? "", relativePath, "after");
    await vscode.commands.executeCommand(
      "vscode.diff",
      beforeUri,
      afterUri,
      `${relativePath} (${beforeExists ? "변경 전" : "새 파일"} ↔ ${afterExists ? "변경 후" : "삭제됨"})`,
      { preview: true },
    );
  }
}

module.exports = { ReviewService, REVIEW_DOCUMENT_SCHEME };
