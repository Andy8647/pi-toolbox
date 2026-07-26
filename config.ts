import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface ToolboxConfig {
  enabled: boolean;
  highlightBash: boolean;
  clickToExpand: boolean;
}

// clickToExpand is opt-in: turning on mouse reporting takes the wheel and
// click away from the terminal for the whole session, and it cannot work at
// all when another extension already owns the mouse (see mouseOwnedElsewhere).
const DEFAULTS: ToolboxConfig = {
  enabled: true,
  highlightBash: true,
  clickToExpand: false,
};

function readSettings(): any {
  const agentDir = process.env.PI_CODING_AGENT_DIR || `${process.env.HOME || "/tmp"}/.pi/agent`;
  return JSON.parse(readFileSync(join(agentDir, "settings.json"), "utf-8"));
}

export function loadConfig(): ToolboxConfig {
  try {
    const toolbox = readSettings()?.toolbox;
    return {
      enabled: toolbox?.enabled ?? DEFAULTS.enabled,
      highlightBash: toolbox?.highlightBash ?? DEFAULTS.highlightBash,
      clickToExpand: toolbox?.clickToExpand ?? DEFAULTS.clickToExpand,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

/**
 * True when a known extension already drives mouse reporting.
 *
 * pi-powerline-footer's fixed-editor compositor (on by default) enables
 * `?1002h` and consumes *every* SGR mouse report for its own scrolling and
 * selection, so our reports never arrive — and our competing `?1000h` only
 * disturbs its mode handling. Detect it and stay out of the way instead of
 * pretending click-to-expand works.
 */
export function mouseOwnedElsewhere(): string | undefined {
  try {
    const settings = readSettings();
    const packages: string[] = Array.isArray(settings?.packages) ? settings.packages : [];
    const hasPowerline = packages.some((p) => typeof p === "string" && p.includes("powerline-footer"));
    if (hasPowerline && settings?.powerline?.fixedEditor !== false) {
      return "pi-powerline-footer (fixedEditor)";
    }
  } catch {
    // no settings, no known owner
  }
  return undefined;
}
