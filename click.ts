/**
 * Click a tool box to expand just that box.
 *
 * pi never turns on mouse reporting (ctrl+o expands *every* box at once), so
 * this enables SGR mouse tracking itself, consumes the reports before they can
 * reach the editor, and maps the clicked terminal row back to the tool box
 * that rendered it.
 *
 * Trade-off: while mouse reporting is on, the terminal routes clicks/wheel to
 * pi instead of handling them natively. Hold Shift for native text selection
 * and scrollback wheel scrolling (Ghostty, iTerm2, WezTerm, Kitty, …).
 */

import { appendFileSync } from "node:fs";
import { findToolComponentAtLine, getTui, patchContainerRanges } from "./frame.ts";
import { mouseOwnedElsewhere } from "./config.ts";

// PI_TOOLBOX_DEBUG=1 traces mouse handling to ~/.pi/agent/pi-toolbox-debug.log.
// Logging to stdout is not an option — it is the rendered screen.
const DEBUG = process.env.PI_TOOLBOX_DEBUG === "1";

function debug(message: string): void {
  if (!DEBUG) return;
  try {
    const dir = process.env.PI_CODING_AGENT_DIR || `${process.env.HOME || "/tmp"}/.pi/agent`;
    appendFileSync(`${dir}/pi-toolbox-debug.log`, `${new Date().toISOString()} ${message}\n`);
  } catch {
    // debugging must never break the session
  }
}

interface UiContext {
  onTerminalInput(handler: (data: string) => { consume?: boolean; data?: string } | undefined): () => void;
}

// SGR mouse report: ESC [ < button ; col ; row (M=press, m=release)
const SGR_MOUSE_RE = /^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/;

const ENABLE_MOUSE = "\x1b[?1000h\x1b[?1006h";
const DISABLE_MOUSE = "\x1b[?1006l\x1b[?1000l";

// Module-level state is unreliable here (jiti may evaluate a module twice
// within one extension), and enabling mouse tracking twice would leave a
// stray disable behind — so the flag is global.
const MOUSE_KEY = Symbol.for("pi-toolbox:mouse");

function isActive(): boolean {
  return (globalThis as Record<symbol, boolean | undefined>)[MOUSE_KEY] === true;
}

function setActive(value: boolean): void {
  (globalThis as Record<symbol, boolean | undefined>)[MOUSE_KEY] = value;
}

function disableMouse(): void {
  if (!isActive()) return;
  setActive(false);
  try {
    process.stdout.write(DISABLE_MOUSE);
  } catch {
    // terminal already gone
  }
}

/** Terminal row (1-based, viewport) → index into the rendered line buffer. */
function bufferLineForRow(tui: any, row: number): number | undefined {
  const lines: string[] | undefined = tui?.previousLines;
  const height: number | undefined = tui?.terminal?.rows;
  if (!lines || !height) return undefined;
  const viewportTop =
    typeof tui.previousViewportTop === "number"
      ? tui.previousViewportTop
      : Math.max(0, lines.length - height);
  const index = viewportTop + row - 1;
  return index >= 0 && index < lines.length ? index : undefined;
}

function handleClick(row: number): void {
  const tui = getTui();
  if (!tui) {
    debug(`click row=${row} but no TUI captured yet`);
    return;
  }
  // Dialogs and selectors own the screen while they are up.
  if (typeof tui.hasOverlay === "function" && tui.hasOverlay()) {
    debug(`click row=${row} ignored: overlay open`);
    return;
  }

  const line = bufferLineForRow(tui, row);
  debug(
    `click row=${row} -> line=${line} (buffer=${tui.previousLines?.length} rows=${tui.terminal?.rows} viewportTop=${tui.previousViewportTop})`,
  );
  if (line === undefined) return;

  const component = findToolComponentAtLine(tui, line);
  debug(`  hit=${component ? component.constructor.name : "none"}`);
  if (!component) return;

  component.setExpanded(!component.expanded);
  tui.requestRender();
}

/** Returns an unsubscribe function, or undefined when there is no TTY to track. */
export function enableClickToExpand(ui: UiContext): (() => void) | undefined {
  if (isActive()) return undefined;
  if (!process.stdout.isTTY) return undefined;

  const owner = mouseOwnedElsewhere();
  if (owner) {
    // Enabling our own tracking here would fight the other extension's mode
    // handling, and its input listener consumes every report before ours runs.
    debug(`click-to-expand disabled: mouse owned by ${owner}`);
    return undefined;
  }

  patchContainerRanges();
  process.stdout.write(ENABLE_MOUSE);
  setActive(true);

  // Only "exit" — installing signal handlers would suppress Node's default
  // SIGINT/SIGTERM termination, which pi drives itself. Normal shutdown paths
  // (ctrl+c, /exit, session_shutdown) all reach this.
  process.on("exit", disableMouse);

  debug("mouse tracking enabled");

  const unsubscribe = ui.onTerminalInput((data) => {
    const match = SGR_MOUSE_RE.exec(data);
    if (!match) {
      if (DEBUG && data.includes("\x1b[<")) debug(`unmatched mouse-ish input: ${JSON.stringify(data)}`);
      return undefined;
    }
    debug(`mouse report ${JSON.stringify(data)}`);

    const button = Number(match[1]);
    const row = Number(match[3]);
    const isPress = match[4] === "M";

    // Everything mouse-shaped is swallowed — an unconsumed report would land
    // in the editor as garbage text.
    const isWheel = (button & 64) !== 0;
    const isDrag = (button & 32) !== 0;
    const isLeftButton = (button & 3) === 0;
    if (isPress && isLeftButton && !isWheel && !isDrag) {
      handleClick(row);
    }
    return { consume: true };
  });

  return () => {
    unsubscribe();
    disableMouse();
  };
}

export { disableMouse };
