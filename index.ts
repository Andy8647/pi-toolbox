/**
 * pi-toolbox — Rounded transparent tool boxes for pi coding agent.
 *
 * Overrides built-in tool rendering with self-drawn rounded frames,
 * status-aware border colors, and bash syntax highlighting.
 *
 * Configuration (settings.json → "toolbox"):
 *   highlightBash: boolean  — syntax-highlight bash commands (default: true)
 *   enabled: boolean        — enable/disable the extension (default: true)
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  createBashToolDefinition,
  createEditToolDefinition,
  createFindToolDefinition,
  createGrepToolDefinition,
  createLsToolDefinition,
  createReadToolDefinition,
  createWriteToolDefinition,
} from "@earendil-works/pi-coding-agent";
import { Text, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

interface ThemeLike {
  fg(color: string, text: string): string;
  bold(text: string): string;
}

interface FrameComponent {
  render(width: number): string[];
  invalidate?(): void;
}

function padToWidth(line: string, width: number): string {
  const w = visibleWidth(line);
  if (w === width) return line;
  if (w < width) return line + " ".repeat(width - w);
  return truncateToWidth(line, width);
}

// Solid background fills: truecolor/256 "48;…" sequences and the standard
// 40-47 / 100-107 bg colors. Built-in tool renderers (e.g. edit) paint their
// own toolSuccessBg/toolErrorBg into content lines; stripping the fills keeps
// the whole frame transparent. \x1b[49m (default bg) is kept.
const BG_FILL_RE = /\x1b\[48;[0-9;]*m|\x1b\[(?:4[0-7]|10[0-7])m/g;

export function stripBackgroundFills(line: string): string {
  return line.replace(BG_FILL_RE, "");
}

/** Shared border-drawing for the frame halves.
 * Border color transitions with tool state:
 *   pending (streaming/executing) → borderMuted (grey)
 *   success                      → success (green)
 *   error                        → error (red)
 */
class FramePiece {
  protected readonly theme: ThemeLike;
  protected borderColor: string;

  constructor(theme: ThemeLike, isPartial: boolean, isError: boolean) {
    this.theme = theme;
    this.borderColor = isPartial ? "borderMuted" : isError ? "error" : "success";
  }

  protected bc(s: string): string {
    return this.theme.fg(this.borderColor, s);
  }

  protected bodyLines(lines: string[], width: number): string[] {
    const inner = Math.max(2, width - 2);
    return lines.map((line) => `${this.bc("│")}${padToWidth(stripBackgroundFills(line), inner)}${this.bc("│")}`);
  }
}

/** Cheap content fingerprint — avoids O(n) line-by-line comparison. */
function contentFingerprint(lines: string[]): string {
  if (lines.length === 0) return "";
  // First + last line + count catches streaming appends and content edits.
  return `${lines.length}|${lines[0]}|${lines[lines.length - 1]}`;
}

/** Top half of the tool box: ╭────╮ + framed content rows. */
export class ToolCallFrameComponent extends FramePiece {
  private readonly inner: FrameComponent;
  private cache: { width: number; fingerprint: string; out: string[] } | null = null;

  constructor(inner: FrameComponent, theme: ThemeLike, isPartial: boolean, isError: boolean) {
    super(theme, isPartial, isError);
    this.inner = inner;
  }

  invalidate(): void {
    this.cache = null;
    this.inner.invalidate?.();
  }

  render(width: number): string[] {
    const w = Math.max(4, width);
    const lines = this.inner.render(w - 2);
    if (lines.length === 0) return lines;
    // Use content fingerprint instead of reference equality — pi-tui's
    // built-in Text component may return new array instances on every
    // render(), which causes scroll repaints to miss the reference cache
    // and re-compute bodyLines (regex + visibleWidth) for every visible
    // tool box on every scroll event.
    const fp = contentFingerprint(lines);
    if (this.cache && this.cache.width === w && this.cache.fingerprint === fp) {
      return this.cache.out;
    }
    const top = this.bc(`╭${"─".repeat(w - 2)}╮`);
    const out = [top, ...this.bodyLines(lines, w)];
    this.cache = { width: w, fingerprint: fp, out };
    return out;
  }
}

/** Bottom half of the tool box: framed content rows + ╰────╯. */
export class ToolResultFrameComponent extends FramePiece {
  private readonly inner: FrameComponent;
  private cache: { width: number; fingerprint: string; out: string[] } | null = null;

  constructor(inner: FrameComponent, theme: ThemeLike, isPartial: boolean, isError: boolean) {
    super(theme, isPartial, isError);
    this.inner = inner;
  }

  invalidate(): void {
    this.cache = null;
    this.inner.invalidate?.();
  }

  render(width: number): string[] {
    const w = Math.max(4, width);
    const lines = this.inner.render(w - 2);
    if (lines.length === 0) return lines;
    const fp = contentFingerprint(lines);
    if (this.cache && this.cache.width === w && this.cache.fingerprint === fp) {
      return this.cache.out;
    }
    const bottom = this.bc(`╰${"─".repeat(w - 2)}╯`);
    const out = [...this.bodyLines(lines, w), bottom];
    this.cache = { width: w, fingerprint: fp, out };
    return out;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Bash command syntax highlighting (custom tokenizer — highlight.js's bash
// grammar is too weak: no command names, flags, paths, or pipe operators)
// ═══════════════════════════════════════════════════════════════════════════

interface BashCallArgs {
  command?: string;
  timeout?: number;
}

// Shell grammar keywords (flow control) → syntaxKeyword
const SHELL_KEYWORDS = new Set([
  "if", "then", "else", "elif", "fi", "for", "while", "until", "do", "done",
  "case", "esac", "in", "function", "select", "time", "coproc", "{", "}", "!",
]);

// Common shell builtins → syntaxFunction (command color)
const SHELL_BUILTINS = new Set([
  "cd", "echo", "printf", "export", "alias", "unalias", "source", ".", "set",
  "unset", "shift", "exit", "return", "local", "declare", "typeset", "readonly",
  "eval", "exec", "test", "[", "[[", "read", "trap", "umask", "wait", "jobs",
  "fg", "bg", "kill", "let", "true", "false", "type", "hash", "builtin",
  "command", "dirs", "pushd", "popd", "disown", "shopt", "getopts", "history",
  "fc", "enable", "help", "times", "ulimit", "bind",
]);

const WORD_BREAK = /[\s'"`$|&;<>()#]/;

/**
 * Tokenize and color a shell command string.
 * `color(token, text)` maps a syntax token name to styled text (theme.fg).
 * Anything unrecognized passes through uncolored.
 */
export function highlightBashCommand(
  command: string,
  color: (token: string, text: string) => string
): string {
  const out: string[] = [];
  const push = (text: string, token: string | null) => {
    out.push(token && text ? color(token, text) : text);
  };

  let i = 0;
  const n = command.length;
  let expectCmd = true; // next word sits in command position

  while (i < n) {
    const c = command[i];

    // whitespace / newlines
    if (c === " " || c === "\t") { push(c, null); i++; continue; }
    if (c === "\n") { push(c, null); expectCmd = true; i++; continue; }

    // comment (only at word start)
    if (c === "#" && (i === 0 || command[i - 1] === " " || command[i - 1] === "\t" || command[i - 1] === "\n")) {
      const nl = command.indexOf("\n", i);
      const end = nl === -1 ? n : nl;
      push(command.slice(i, end), "syntaxComment");
      i = end;
      continue;
    }

    // operators (longest first)
    // fd redirects like 2>&1 (4 chars): target is not a command word
    const four = command.slice(i, i + 4);
    if (four === "2>&1" || four === "1>&2") {
      push(four, "syntaxOperator"); i += 4; continue;
    }
    const three = command.slice(i, i + 3);
    if (three === "&>>") {
      push(three, "syntaxOperator"); i += 3; continue;
    }
    const two = command.slice(i, i + 2);
    if (two === "&&" || two === "||") {
      push(two, "syntaxOperator"); i += 2; expectCmd = true; continue;
    }
    // other redirects: the next word is a file target, not a command
    if (two === ">>" || two === "2>" || two === ">&" || two === "<&" || two === "&>" || two === "<<") {
      push(two, "syntaxOperator"); i += 2; continue;
    }
    if (c === "|" || c === ";") {
      push(c, "syntaxOperator"); i++; expectCmd = true; continue;
    }
    if (c === ">" || c === "<") {
      push(c, "syntaxOperator"); i++; continue;
    }
    if (c === "&") { push(c, "syntaxOperator"); i++; expectCmd = true; continue; }
    if (c === "(") { push(c, "syntaxOperator"); i++; expectCmd = true; continue; }
    if (c === ")") { push(c, "syntaxOperator"); i++; expectCmd = false; continue; }

    // single-quoted string
    if (c === "'") {
      const q = command.indexOf("'", i + 1);
      const end = q === -1 ? n : q + 1;
      push(command.slice(i, end), "syntaxString");
      i = end;
      continue;
    }

    // double-quoted string (escape-aware)
    if (c === '"') {
      let j = i + 1;
      while (j < n) {
        if (command[j] === "\\") { j += 2; continue; }
        if (command[j] === '"') { j++; break; }
        j++;
      }
      push(command.slice(i, j), "syntaxString");
      i = j;
      continue;
    }

    // backtick substitution
    if (c === "`") {
      const q = command.indexOf("`", i + 1);
      const end = q === -1 ? n : q + 1;
      push(command.slice(i, end), "syntaxString");
      i = end;
      continue;
    }

    // variable: $VAR ${VAR} $1 $@ $? $(...)
    if (c === "$") {
      const m = /^\$(\([^)]*\)|\{[^}]*\}|[A-Za-z_][A-Za-z0-9_]*|[0-9@#?$!*_-])/.exec(command.slice(i));
      if (m) {
        push(m[0], "syntaxVariable");
        i += m[0].length;
        continue;
      }
      push(c, null); i++; continue;
    }

    // word
    let j = i;
    while (j < n && !WORD_BREAK.test(command[j])) j++;
    const word = command.slice(i, j);
    i = j;

    // assignment prefix in command position: VAR=value
    if (expectCmd && /^[A-Za-z_][A-Za-z0-9_]*=/.test(word)) {
      const eq = word.indexOf("=");
      push(word.slice(0, eq), "syntaxVariable");
      push("=", "syntaxOperator");
      push(word.slice(eq + 1), null);
      continue; // still expecting the command word
    }

    if (expectCmd) {
      if (SHELL_KEYWORDS.has(word)) push(word, "syntaxKeyword");
      else push(word, "syntaxFunction"); // builtins + external commands
      expectCmd = false;
      continue;
    }

    // flags: -x -abc --long --key=value
    if (/^--?[A-Za-z0-9][\w.-]*(=.*)?$/.test(word) && word !== "-") {
      const eq = word.indexOf("=");
      if (eq !== -1) {
        push(word.slice(0, eq), "syntaxType");
        push("=", "syntaxOperator");
        push(word.slice(eq + 1), null);
      } else {
        push(word, "syntaxType");
      }
      continue;
    }

    // numbers
    if (/^\d+(\.\d+)?$/.test(word)) { push(word, "syntaxNumber"); continue; }

    push(word, null);
  }

  return out.join("");
}

/**
 * Format the bash call row: bold `$` prompt + syntax-highlighted command.
 * Falls back to the built-in flat style when there is no command yet.
 */
export function formatBashCallHighlighted(args: BashCallArgs, theme: ThemeLike): string {
  const command = typeof args?.command === "string" ? args.command : "";
  const timeout = typeof args?.timeout === "number" ? args.timeout : undefined;
  const timeoutSuffix = timeout ? theme.fg("muted", ` (timeout ${timeout}s)`) : "";
  const prompt = theme.fg("toolTitle", theme.bold("$ "));

  if (!command) {
    return prompt + theme.fg("toolOutput", "...") + timeoutSuffix;
  }

  let highlighted: string;
  try {
    highlighted = highlightBashCommand(command, (token, text) => theme.fg(token, text));
  } catch {
    highlighted = command; // never break the tool row on a tokenizer bug
  }
  return prompt + highlighted + timeoutSuffix;
}

// ═══════════════════════════════════════════════════════════════════════════
// Tool registration
// ═══════════════════════════════════════════════════════════════════════════

interface ToolFrameState {
  startedAt?: number;
  endedAt?: number;
  interval?: unknown;
  callText?: Text;
  callInner?: FrameComponent;
  resultInner?: FrameComponent;
}

const TOOL_FACTORIES = {
  bash: createBashToolDefinition,
  read: createReadToolDefinition,
  write: createWriteToolDefinition,
  edit: createEditToolDefinition,
  grep: createGrepToolDefinition,
  find: createFindToolDefinition,
  ls: createLsToolDefinition,
} as const;

type ToolName = keyof typeof TOOL_FACTORIES;
type AnyToolDefinition = ReturnType<(typeof TOOL_FACTORIES)[ToolName]>;

function extractResultText(result: { content?: unknown }): string {
  const content = Array.isArray(result?.content) ? result.content : [];
  return content
    .filter((c): c is { type: string; text: string } => !!c && typeof c === "object" && (c as { type?: string }).type === "text")
    .map((c) => c.text)
    .join("\n");
}

function registerFramedTool(pi: ExtensionAPI, name: ToolName, definition: AnyToolDefinition): void {
  pi.registerTool({
    name,
    label: name,
    description: definition.description,
    // Not inherited from the built-in on override — copy them explicitly
    ...(definition.promptSnippet ? { promptSnippet: definition.promptSnippet } : {}),
    ...(definition.promptGuidelines ? { promptGuidelines: definition.promptGuidelines } : {}),
    parameters: definition.parameters,
    ...(definition.prepareArguments ? { prepareArguments: definition.prepareArguments } : {}),
    ...(definition.executionMode ? { executionMode: definition.executionMode } : {}),
    renderShell: "self",

    async execute(toolCallId, params, signal, onUpdate, ctx) {
      return definition.execute(toolCallId, params, signal, onUpdate, ctx);
    },

    renderCall(args, theme, context) {
      const state = context.state as ToolFrameState;
      let inner: FrameComponent;

      if (name === "bash") {
        // Replicate the built-in bash renderCall's timing state — its
        // renderResult reads startedAt/endedAt for the "Took Xs" footer.
        if (context.executionStarted && state.startedAt === undefined) {
          state.startedAt = Date.now();
          state.endedAt = undefined;
        }
        // Keep our own Text ref: context.lastComponent is the frame we return
        const text = state.callText ?? new Text("", 0, 0);
        state.callText = text;
        text.setText(formatBashCallHighlighted(args as BashCallArgs, theme));
        inner = text;
      } else if (definition.renderCall) {
        // Delegate with the built-in's own lastComponent (kept in our state,
        // since the frame we return would confuse its component reuse)
        inner = definition.renderCall(args, theme, {
          ...context,
          lastComponent: state.callInner as never,
        }) as FrameComponent;
        state.callInner = inner;
      } else {
        inner = new Text(theme.fg("toolTitle", theme.bold(name)), 0, 0);
      }

      return new ToolCallFrameComponent(inner, theme, context.isPartial ?? true, context.isError ?? false);
    },

    renderResult(result, options, theme, context) {
      const state = context.state as ToolFrameState;
      let inner: FrameComponent;

      if (definition.renderResult) {
        inner = definition.renderResult(result, options, theme, {
          ...context,
          lastComponent: state.resultInner as never,
        }) as FrameComponent;
        state.resultInner = inner;
      } else {
        const text = extractResultText(result as { content?: unknown });
        inner = new Text(theme.fg("toolOutput", text), 0, 0);
      }

      return new ToolResultFrameComponent(inner, theme, context.isPartial ?? false, context.isError ?? false);
    },
  });
}

/**
 * Re-register all built-in tools (bash, read, write, edit, grep, find, ls)
 * with self-drawn rounded frames. bash additionally gets syntax-highlighted
 * command rendering. Per-tool failures are isolated — one bad override never
 * breaks the others or the footer.
 */
export function registerToolFrames(pi: ExtensionAPI, cwd: string): void {
  for (const [name, factory] of Object.entries(TOOL_FACTORIES)) {
    try {
      registerFramedTool(pi, name as ToolName, factory(cwd) as AnyToolDefinition);
    } catch (error) {
      console.debug(`[powerline-footer] tool frame override for ${name} failed:`, error);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

interface ToolboxConfig {
  highlightBash: boolean;
  enabled: boolean;
}

function loadConfig(): ToolboxConfig {
  try {
    const agentDir = process.env.PI_CODING_AGENT_DIR ||
      `${process.env.HOME || "/tmp"}/.pi/agent`;
    const { readFileSync } = require("node:fs");
    const { join } = require("node:path");
    const raw = readFileSync(join(agentDir, "settings.json"), "utf-8");
    const settings = JSON.parse(raw);
    const toolbox = settings?.toolbox;
    return {
      highlightBash: toolbox?.highlightBash ?? true,
      enabled: toolbox?.enabled ?? true,
    };
  } catch {
    return { highlightBash: true, enabled: true };
  }
}

/** Pi extension entry point. */
export default function (pi: ExtensionAPI): void {
  const config = loadConfig();
  if (!config.enabled) return;
  registerToolFrames(pi, process.cwd());
}
