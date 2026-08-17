"use strict";

/**
 * Extracts the native chat UI stylesheet, VERBATIM, from the installed
 * VS Code's workbench CSS.
 *
 * This is the whole point of the VIBEX webview design rule: we never write
 * visual styles by hand. Every color, spacing, font and icon rule in the VIBEX
 * panel comes byte-for-byte from VS Code's own chat implementation. When
 * VS Code updates and the chat design changes, re-run:
 *
 *   node scripts/extract-native-chat-css.js
 *
 * Output: media/native-chat.css (generated — do not edit by hand).
 */

const fs = require("node:fs");
const path = require("node:path");

const SOURCE =
  process.argv[2] ||
  "/Applications/Visual Studio Code.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.css";
const OUTPUT = path.join(__dirname, "..", "media", "native-chat.css");

// A rule is kept when any selector in it touches the chat UI, the markdown
// renderer used inside chat, the codicon icon font, or the base monaco
// building blocks the chat widget is composed of.
const KEEP = new RegExp(
  [
    "\\.interactive-",
    "\\.chat-",
    "\\.codicon",
    "\\.rendered-markdown",
    "\\.monaco-button",
    "\\.monaco-text-button",
    "\\.monaco-inputbox",
    "\\.monaco-select-box",
    "\\.monaco-progress-container",
    "\\.monaco-toolbar",
    "\\.monaco-action-bar",
    "\\.monaco-dropdown",
    "\\.monaco-list",
    "\\.monaco-scrollable-element",
    "\\.monaco-tl-",
    "\\.detail-container",
    "\\.quick-input-", // pickers reuse these tokens in chat option dropdowns
  ].join("|"),
);

/**
 * Minimal CSS splitter: walks the sheet and yields top-level statements
 * (rules and at-rules) with balanced braces. Handles strings and comments.
 */
function* topLevelStatements(css) {
  let depth = 0;
  let start = 0;
  let inString = null;
  let inComment = false;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    const next = css[i + 1];
    if (inComment) {
      if (ch === "*" && next === "/") {
        inComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      if (ch === "\\") i++;
      else if (ch === inString) inString = null;
      continue;
    }
    if (ch === "/" && next === "*") {
      inComment = true;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = ch;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        yield css.slice(start, i + 1);
        start = i + 1;
      }
    } else if (ch === ";" && depth === 0) {
      // top-level at-statement like @import
      yield css.slice(start, i + 1);
      start = i + 1;
    }
  }
}

function selectorOf(statement) {
  const brace = statement.indexOf("{");
  return brace < 0 ? statement : statement.slice(0, brace);
}

function filterStatements(css) {
  const kept = [];
  for (const statement of topLevelStatements(css)) {
    const selector = selectorOf(statement).trim();
    if (selector.startsWith("@media") || selector.startsWith("@supports") || selector.startsWith("@container")) {
      const bodyStart = statement.indexOf("{");
      const body = statement.slice(bodyStart + 1, statement.lastIndexOf("}"));
      const inner = filterStatements(body);
      if (inner.trim()) kept.push(`${selector}{${inner}}`);
      continue;
    }
    if (selector.startsWith("@keyframes") || selector.startsWith("@-webkit-keyframes")) {
      // Animations are cheap to keep and chat rules reference several.
      kept.push(statement);
      continue;
    }
    if (selector.startsWith("@font-face")) {
      // Font files ship separately with a webview-safe URI; see glue CSS.
      continue;
    }
    if (KEEP.test(selector)) {
      kept.push(statement);
    }
  }
  return kept.join("\n");
}

/**
 * VS Code defines codicon glyphs (`.codicon-send:before { content: "\ec0f" }`)
 * in JavaScript, not in the stylesheet, so they are recovered from the
 * workbench bundle's icon registration table.
 */
function extractCodiconGlyphs(workbenchJsPath) {
  const js = fs.readFileSync(workbenchJsPath, "utf8");
  // Codepoints appear as hex (0xEA60), decimal (60134) or the minifier's
  // exponential form (6e4) — Number() parses all three.
  const pattern = /(\w[\w-]*):\s*[\w$]+\("([\w-]+)",(0x[0-9a-fA-F]+|\d+(?:e\d+)?)\)/g;
  const glyphs = new Map();
  const byProperty = new Map(); // minified table property name -> codepoint
  let match;
  while ((match = pattern.exec(js))) {
    glyphs.set(match[2], Number(match[3]));
    byProperty.set(match[1], Number(match[3]));
  }
  // Derived icons (e.g. chat-model-provider-generic → sparkle) are registered
  // at runtime as aliases of a base codicon; resolve them to the base glyph.
  const aliasPattern = /\("((?:chat|copilot|terminal|debug)[\w-]*)",\s*[\w$]+\.(\w+)\s*,/g;
  while ((match = aliasPattern.exec(js))) {
    const [, alias, property] = match;
    if (!glyphs.has(alias) && byProperty.has(property)) {
      glyphs.set(alias, byProperty.get(property));
    }
  }
  const rules = [...glyphs]
    .map(([name, code]) => `.codicon-${name}:before{content:"\\${code.toString(16)}"}`)
    .join("\n");
  return { rules, count: glyphs.size };
}

const WORKBENCH_JS = SOURCE.replace(/\.css$/, ".js");

/**
 * VS Code registers its design tokens (corner radii, spacing scale, font
 * sizes/weights) from JavaScript at runtime, so a webview never receives them.
 * They are recovered from the workbench bundle's token registration table
 * (`Il("cornerRadius.large", yl(8, "px"), …)`) and emitted as a `:root` block.
 */
function extractDesignTokens(workbenchJs) {
  const tokens = new Map();
  for (const match of workbenchJs.matchAll(/Il\("([\w.]+)",yl\((\d+(?:\.\d+)?),"(px|em|rem|%)?"\)/g)) {
    tokens.set(`--vscode-${match[1].replace(/\./g, "-")}`, `${match[2]}${match[3] || ""}`);
  }
  const rules = [...tokens].map(([name, value]) => `  ${name}: ${value};`).join("\n");
  return { block: `:root{\n${rules}\n}`, count: tokens.size };
}

const css = fs.readFileSync(SOURCE, "utf8");
const workbenchJs = fs.readFileSync(WORKBENCH_JS, "utf8");
const filtered = filterStatements(css);
const glyphs = extractCodiconGlyphs(WORKBENCH_JS);
const tokens = extractDesignTokens(workbenchJs);
const banner = `/*
 * GENERATED FILE — DO NOT EDIT.
 * Extracted verbatim from: ${SOURCE}
 * Extractor: scripts/extract-native-chat-css.js
 * Extracted at: ${new Date().toISOString()}
 * Every visual rule here is VS Code's own chat stylesheet, unmodified.
 * Codicon glyph rules (${glyphs.count}) and design tokens (${tokens.count})
 * are recovered from the workbench JS, since VS Code injects those from code
 * rather than CSS.
 */\n`;
fs.writeFileSync(OUTPUT, banner + tokens.block + "\n" + glyphs.rules + "\n" + filtered + "\n");
console.log(
  `kept ${Math.round(filtered.length / 1024)}KB of ${Math.round(css.length / 1024)}KB + ${glyphs.count} codicon glyphs -> ${OUTPUT}`,
);
