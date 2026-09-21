/**
 * Rounded transparent frames for *every* tool box.
 *
 * Re-registering tools with `renderShell: "self"` only reaches tools this
 * extension registers itself — tools owned by other extensions (MCP via
 * pi-mcp-adapter, subagents, …) keep pi's default filled-background shell,
 * and the extension API exposes no way to wrap another extension's renderers
 * (`getAllTools()` returns name/description/parameters only).
 *
 * So the frame is applied one level lower, on ToolExecutionComponent — the
 * component pi builds for every tool call regardless of who registered it.
 * Extensions import the same live module instance as the host app, so
 * patching the prototype reaches every tool box in the session.
 */

import { homedir } from "node:os";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import {
  BranchSummaryMessageComponent,
  CompactionSummaryMessageComponent,
  CustomMessageComponent,
  keyText,
  SkillInvocationMessageComponent,
  ToolExecutionComponent,
  UserMessageComponent,
} from "@earendil-works/pi-coding-agent";
import { getTheme, type ThemeLike } from "./theme-access.ts";
import { fileIcon, MESSAGE_ICONS, PATH_ARG_TOOLS, toolKindIcon } from "./icons.ts";

// Solid background fills: truecolor/256 "48;…" sequences and the standard
// 40-47 / 100-107 bg colors. pi's shell and some built-in renderers (edit)
// paint toolPendingBg/toolSuccessBg/toolErrorBg into their lines; stripping
// the fills keeps the whole frame transparent. \x1b[49m (default bg) is kept.
const BG_FILL_RE = /\x1b\[48;[0-9;]*m|\x1b\[(?:4[0-7]|10[0-7])m/g;

export function stripBackgroundFills(line: string): string {
  return line.replace(BG_FILL_RE, "");
}

function padToWidth(line: string, width: number): string {
  const w = visibleWidth(line);
  if (w === width) return line;
  if (w < width) return line + " ".repeat(width - w);
  return truncateToWidth(line, width);
}

/**
 * The `(ctrl+o to collapse)` row an expanded box shows as its last content
 * line — the same text bash boxes render natively when open
 * (bash-execution.js), built through the same `keyText` so it follows
 * whatever is bound to `app.tools.expand`. It is a truthful keyboard hint
 * for every user, and pi-starline's click-to-collapse additionally hit-tests
 * it as the anchor that closes the box. Undefined when no key is bound —
 * with nothing on screen to match, there is no anchor to show.
 */
function collapseAnchorLine(theme: ThemeLike): string | undefined {
  let keys = "";
  try {
    keys = keyText("app.tools.expand" as never);
  } catch {
    return undefined;
  }
  if (!keys) return undefined;
  return (
    theme.fg("muted", "(") +
    theme.fg("dim", keys) +
    theme.fg("muted", " to collapse") +
    theme.fg("muted", ")")
  );
}

/** Cheap content fingerprint — avoids O(n) line-by-line cache comparison. */
function fingerprint(lines: string[]): string {
  if (lines.length === 0) return "";
  return `${lines.length}|${lines[0]}|${lines[lines.length - 1]}`;
}

const ANSI_RE = /\x1b\[[0-9;:?]*[ -/]*[@-~]/g;

/** CSI and OSC (BEL- or ST-terminated) escape sequences. */
const ESCAPE_RE = /\x1b(?:\[[0-9;:?]*[ -/]*[@-~]|\][^\x07\x1b]*(?:\x07|\x1b\\)?)/g;

/**
 * Find `needle` in the row's *visible* text and return the raw string index
 * of that occurrence — never inside an escape sequence. pi hyperlinks file
 * paths (OSC 8), so a naive indexOf hits the invisible `file://` URL first
 * and would inject the icon into the escape sequence itself.
 */
function visibleIndexOf(row: string, needle: string): number {
  let plain = "";
  const map: number[] = [];
  let last = 0;
  for (const m of row.matchAll(ESCAPE_RE)) {
    for (let j = last; j < m.index; j++) {
      map.push(j);
      plain += row[j];
    }
    last = m.index + m[0].length;
  }
  for (let j = last; j < row.length; j++) {
    map.push(j);
    plain += row[j];
  }
  const pi = plain.lastIndexOf(needle);
  return pi >= 0 ? map[pi] : -1;
}

/**
 * When `idx` sits inside an OSC 8 hyperlink (opener before it, no closer in
 * between), return the opener's start so the icon lands outside the link.
 * Otherwise return `idx` unchanged.
 */
function outsideHyperlink(row: string, idx: number): number {
  const opener = row.lastIndexOf("\x1b]8;;", idx);
  if (opener < 0) return idx;
  const after = row[opener + 6];
  if (after === "\x07" || after === "\x1b") return idx; // that's a closer
  const closer = Math.max(row.lastIndexOf("\x1b]8;;\x07", idx), row.lastIndexOf("\x1b]8;;\x1b\\", idx));
  return opener > closer ? opener : idx;
}

/** A padding row from pi's default shell: spaces plus background escapes. */
function isBlankRow(line: string): boolean {
  return line.replace(ANSI_RE, "").trim() === "";
}

function trimBlankEdges(lines: string[]): string[] {
  let start = 0;
  let end = lines.length;
  while (start < end && isBlankRow(lines[start])) start++;
  while (end > start && isBlankRow(lines[end - 1])) end--;
  return start === 0 && end === lines.length ? lines : lines.slice(start, end);
}

/**
 * Draw the rounded frame. Border color tracks tool state:
 *   pending (streaming/executing) → borderMuted (grey)
 *   success                      → success (green)
 *   error                        → error (red)
 */
function drawFrame(lines: string[], width: number, theme: ThemeLike, color: string): string[] {
  const inner = Math.max(2, width - 2);
  const bc = (s: string) => theme.fg(color, s);
  const out: string[] = [bc(`╭${"─".repeat(inner)}╮`)];
  for (const line of lines) {
    out.push(`${bc("│")}${padToWidth(stripBackgroundFills(line), inner)}${bc("│")}`);
  }
  out.push(bc(`╰${"─".repeat(inner)}╯`));
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════
// The frame patch
// ═══════════════════════════════════════════════════════════════════════════

interface ToolBoxInternals {
  hideComponent: boolean;
  isPartial: boolean;
  expanded: boolean;
  toolName: string;
  args?: unknown;
  result?: { isError: boolean };
  selfRenderContainer: { render(width: number): string[] };
  contentBox: { render(width: number): string[] };
  contentText: { render(width: number): string[] };
  imageComponents: Array<{ render(width: number): string[] }>;
  imageSpacers: Array<{ render(width: number): string[] }>;
  hasRendererDefinition(): boolean;
  getRenderShell(): "default" | "self";
  __frameCache?: { width: number; fp: string; color: string; expanded: boolean; out: string[] };
}

export interface ToolFrameOptions {
  collapseAnchor?: boolean;
  /** Prepend a Nerd Font icon (tool kind or target file type) to the call row. */
  icons?: boolean;
  /** Per-tool-name border color for successful executions (theme fg color names). */
  toolColors?: Record<string, string>;
}

export function patchToolBoxFrames(options: ToolFrameOptions = {}): void {
  const { collapseAnchor = true, icons = false, toolColors = {} } = options;
  const proto = ToolExecutionComponent.prototype as unknown as ToolBoxInternals & {
    render(width: number): string[];
    __toolboxFramed?: boolean;
  };
  if (proto.__toolboxFramed) return;
  proto.__toolboxFramed = true;

  const originalRender = proto.render;

  proto.render = function (this: ToolBoxInternals, width: number): string[] {
    const theme = getTheme();
    if (!theme) return originalRender.call(this, width);
    try {
      if (this.hideComponent) return [];

      const w = Math.max(4, width);
      const source = !this.hasRendererDefinition()
        ? this.contentText
        : this.getRenderShell() === "self"
          ? this.selfRenderContainer
          : this.contentBox;
      // The icon cells come off the call row's render width so nothing
      // truncates. Layout: ` <kind> write <file> /tmp/x.ts` — the kind icon
      // leads, the file-type icon sits directly in front of the path (the
      // same role `$` plays for bash). When the path can't be located in
      // the rendered row, the file icon falls back into the prefix.
      let kindPrefix = "";
      let fileGlyph = "";
      let filePath = "";
      if (icons) {
        kindPrefix = ` ${toolKindIcon(this.toolName)} `;
        if (PATH_ARG_TOOLS.has(this.toolName)) {
          const p = (this.args as { path?: unknown } | undefined)?.path;
          if (typeof p === "string" && p) {
            fileGlyph = fileIcon(p);
            filePath = p;
          }
        }
      }      const iconCells =
        (kindPrefix ? visibleWidth(kindPrefix) : 0) + (fileGlyph ? visibleWidth(fileGlyph) + 1 : 0);
      const raw = source.render(w - 2 - iconCells);

      // The whole returned array is cached, not just the framed body.
      // pi-powerline-footer's compositor re-renders the entire root on every
      // mouse packet while scrolling, so an unchanged box must cost a
      // fingerprint check and nothing more — no re-copying its lines.
      //
      // Border color tracks tool state, then per-tool identity: pending is
      // grey and error is red no matter what; a successful box takes its
      // tool's configured color, falling back to the theme accent.
      const color = this.isPartial
        ? "borderMuted"
        : this.result?.isError
          ? "error"
          : toolColors[this.toolName] || "accent";
      const fp = fingerprint(raw);
      // Image boxes skip the cache entirely: the text fingerprint says nothing
      // about an image component being swapped in (kitty PNG conversion
      // finishes asynchronously and rebuilds them), so a hit would freeze the
      // box on its pre-conversion frame.
      const cacheable = this.imageComponents.length === 0;
      const cache = this.__frameCache;
      if (
        cacheable &&
        cache &&
        cache.width === w &&
        cache.fp === fp &&
        cache.color === color &&
        cache.expanded === this.expanded
      ) {
        return cache.out;
      }

      // pi's default shell pads content by one cell on every side; the frame
      // supplies the vertical part, so only the blank padding rows are dropped.
      const content = trimBlankEdges(raw);
      if (icons && content.length > 0) {
        let row = kindPrefix + content[0];
        if (fileGlyph) {
          // renderToolPath shortens $HOME to `~` in the display text — try
          // the raw path first, then its shortened form.
          const home = homedir();
          const candidates =
            filePath.startsWith(home) ? [filePath, `~${filePath.slice(home.length)}`] : [filePath];
          let at = -1;
          for (const candidate of candidates) {
            const idx = visibleIndexOf(row, candidate);
            if (idx >= 0) {
              at = outsideHyperlink(row, idx);
              break;
            }
          }
          row =
            at >= 0
              ? row.slice(0, at) + fileGlyph + " " + row.slice(at)
              : kindPrefix + fileGlyph + " " + content[0];
        }
        content[0] = row;
      }
      // An expanded box gets a collapse anchor as its last content row. pi
      // itself only renders an expand hint, and only while collapsed, for the
      // tool types this component covers — so without this row there is no
      // way back but ctrl+o closing every box at once.
      if (collapseAnchor && this.expanded && content.length > 0) {
        const anchor = collapseAnchorLine(theme);
        if (anchor) content.push(anchor);
      }

      const out: string[] = [""];
      if (content.length > 0) {
        for (const line of drawFrame(content, w, theme, color)) out.push(line);
      }
      // Images stay outside the frame: their lines carry terminal graphics
      // payloads that padding/truncation would corrupt.
      for (let i = 0; i < this.imageComponents.length; i++) {
        const spacer = this.imageSpacers[i];
        if (spacer) for (const line of spacer.render(w)) out.push(line);
        const image = this.imageComponents[i];
        if (image) for (const line of image.render(w)) out.push(line);
      }

      if (out.length === 1) return [];
      if (cacheable) this.__frameCache = { width: w, fp, color, expanded: this.expanded, out };
      return out;
    } catch {
      return originalRender.call(this, width);
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Message boxes (compaction / branch summary)
// ═══════════════════════════════════════════════════════════════════════════

interface MessageBoxInternals {
  children: Array<{ render(width: number): string[] }>;
  expanded: boolean;
  render(width: number): string[];
  __msgFrameCache?: { width: number; fp: string; sample: string; out: string[] };
}

/**
 * Compaction, branch-summary, and skill-invocation boxes are plain `Box`es
 * with a filled `customMessageBg` background — ToolExecutionComponent never
 * sees them, so the frame patch above leaves them in pi's default style. They
 * get the same rounded, transparent frame here, each drawn in its own color
 * from `borderColors` to keep them distinct from the tool state colors and
 * from each other. Children are rendered directly, skipping the Box's
 * background fill and padding, so the frame is the only chrome; on any
 * mismatch the original Box render runs.
 */
export function patchMessageBoxes(
  borderColors: { compaction: string; branch: string; skill: string },
  collapseAnchor = true,
  icons = false,
): void {
  for (const [cls, borderColor, icon] of [
    [CompactionSummaryMessageComponent, borderColors.compaction, MESSAGE_ICONS.compaction],
    [BranchSummaryMessageComponent, borderColors.branch, MESSAGE_ICONS.branch],
    [SkillInvocationMessageComponent, borderColors.skill, MESSAGE_ICONS.skill],
  ] as const) {
    const proto = cls.prototype as unknown as MessageBoxInternals & { __toolboxFramed?: boolean };
    if (proto.__toolboxFramed) continue;
    proto.__toolboxFramed = true;

    const originalRender = proto.render;

    proto.render = function (this: MessageBoxInternals, width: number): string[] {
      const theme = getTheme();
      if (!theme) return originalRender.call(this, width);
      try {
        const w = Math.max(4, width);
        // Frame + one cell of horizontal padding on each side (+2 for the icon).
        const contentWidth = Math.max(1, icons ? w - 6 : w - 4);
        const content: string[] = [];
        for (const child of this.children) {
          for (const line of child.render(contentWidth)) {
            content.push(stripBackgroundFills(line));
          }
        }
        if (content.length === 0) return [];
        if (collapseAnchor && this.expanded) {
          const anchor = collapseAnchorLine(theme);
          if (anchor) content.push(anchor);
        }
        const fp = fingerprint(content);
        // The border color escape acts as a theme sample — a theme switch
        // with identical content must not hit the cache.
        const sample = theme.fg(borderColor, "·");
        const cache = this.__msgFrameCache;
        if (cache && cache.width === w && cache.fp === fp && cache.sample === sample) return cache.out;
        const padded = content.map((line, i) =>
          icons && i === 0 ? ` ${icon} ${line}` : ` ${line}`,
        );
        const out = ["", ...drawFrame(padded, w, theme, borderColor)];
        this.__msgFrameCache = { width: w, fp, sample, out };
        return out;
      } catch {
        return originalRender.call(this, width);
      }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Container boxes (user messages / extension custom messages)
// ═══════════════════════════════════════════════════════════════════════════

// OSC 133 zone markers UserMessageComponent puts on its first/last line —
// terminals use them for prompt navigation, so the framed output keeps them
// in the same positions.
const OSC133_ZONE_START = "\x1b]133;A\x07";
const OSC133_ZONE_END = "\x1b]133;B\x07";
const OSC133_ZONE_FINAL = "\x1b]133;C\x07";

interface ContainerBoxInternals {
  children: Array<{ render(width: number): string[] }>;
  /** CustomMessageComponent's default box; absent on UserMessageComponent. */
  box?: { render(width: number): string[] };
  /** Set when an extension renderer supplies its own styled component. */
  customComponent?: unknown;
  render(width: number): string[];
  __msgFrameCache?: { width: number; fp: string; sample: string; out: string[] };
}

/**
 * User and extension custom messages are `Container`s whose visible box is an
 * inner `Box` with a filled background. The frame replaces that chrome: the
 * inner box renders one frame-width narrower, its background fills and
 * vertical padding rows are stripped, and the rounded border takes over —
 * the box's own horizontal padding is kept as the insets.
 */
export interface ContainerBoxOptions {
  icons?: boolean;
  /**
   * Frame user messages too. Default false: pi-starline already restyles
   * UserMessageComponent.prototype.render, and two render patches on the
   * same prototype fight over the output. Enable only without pi-starline.
   */
  includeUser?: boolean;
}

export function patchContainerBoxes(
  borderColors: { user: string; custom: string },
  options: ContainerBoxOptions = {},
): void {
  const { icons = false, includeUser = false } = options;
  const patch = (
    cls: { prototype: unknown },
    borderColor: string,
    icon: string,
    isUserMessage: boolean,
  ) => {
    const proto = cls.prototype as ContainerBoxInternals & { __toolboxFramed?: boolean };
    if (proto.__toolboxFramed) return;
    proto.__toolboxFramed = true;

    const originalRender = proto.render;

    proto.render = function (this: ContainerBoxInternals, width: number): string[] {
      const theme = getTheme();
      if (!theme) return originalRender.call(this, width);
      try {
        // An extension's custom renderer owns its styling — never frame it.
        if (this.customComponent) return originalRender.call(this, width);
        const box = this.box ?? this.children[0];
        if (!box) return originalRender.call(this, width);

        const w = Math.max(4, width);
        // Icons take two cells of the first row; rendering the box narrower
        // keeps every line lossless.
        const raw = box.render(icons ? w - 4 : w - 2).map(stripBackgroundFills);
        const content = trimBlankEdges(raw);
        if (content.length === 0) return [];
        if (icons) content[0] = ` ${icon} ${content[0].replace(/^ +/, "")}`;

        const fp = fingerprint(content);
        const sample = theme.fg(borderColor, "·");
        const cache = this.__msgFrameCache;
        if (cache && cache.width === w && cache.fp === fp && cache.sample === sample) return cache.out;

        const out = ["", ...drawFrame(content, w, theme, borderColor)];
        if (isUserMessage) {
          out[0] = OSC133_ZONE_START + out[0];
          out[out.length - 1] = OSC133_ZONE_END + OSC133_ZONE_FINAL + out[out.length - 1];
        }
        this.__msgFrameCache = { width: w, fp, sample, out };
        return out;
      } catch {
        return originalRender.call(this, width);
      }
    };
  };

  if (includeUser) patch(UserMessageComponent, borderColors.user, MESSAGE_ICONS.user, true);
  patch(CustomMessageComponent, borderColors.custom, MESSAGE_ICONS.custom, false);
}
