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

import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { ToolExecutionComponent } from "@earendil-works/pi-coding-agent";
import { getTheme, type ThemeLike } from "./theme-access.ts";

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

/** Cheap content fingerprint — avoids O(n) line-by-line cache comparison. */
function fingerprint(lines: string[]): string {
  if (lines.length === 0) return "";
  return `${lines.length}|${lines[0]}|${lines[lines.length - 1]}`;
}

const ANSI_RE = /\x1b\[[0-9;:?]*[ -/]*[@-~]/g;

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
  result?: { isError: boolean };
  selfRenderContainer: { render(width: number): string[] };
  contentBox: { render(width: number): string[] };
  contentText: { render(width: number): string[] };
  imageComponents: Array<{ render(width: number): string[] }>;
  imageSpacers: Array<{ render(width: number): string[] }>;
  hasRendererDefinition(): boolean;
  getRenderShell(): "default" | "self";
  __frameCache?: { width: number; fp: string; color: string; out: string[] };
}

export function patchToolBoxFrames(): void {
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
      const raw = source.render(w - 2);

      // The whole returned array is cached, not just the framed body.
      // pi-powerline-footer's compositor re-renders the entire root on every
      // mouse packet while scrolling, so an unchanged box must cost a
      // fingerprint check and nothing more — no re-copying its lines.
      const color = this.isPartial ? "borderMuted" : this.result?.isError ? "error" : "success";
      const fp = fingerprint(raw);
      // Image boxes skip the cache entirely: the text fingerprint says nothing
      // about an image component being swapped in (kitty PNG conversion
      // finishes asynchronously and rebuilds them), so a hit would freeze the
      // box on its pre-conversion frame.
      const cacheable = this.imageComponents.length === 0;
      const cache = this.__frameCache;
      if (cacheable && cache && cache.width === w && cache.fp === fp && cache.color === color) {
        return cache.out;
      }

      // pi's default shell pads content by one cell on every side; the frame
      // supplies the vertical part, so only the blank padding rows are dropped.
      const content = trimBlankEdges(raw);

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
      if (cacheable) this.__frameCache = { width: w, fp, color, out };
      return out;
    } catch {
      return originalRender.call(this, width);
    }
  };
}
