import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface ToolboxConfig {
  enabled: boolean;
  highlightBash: boolean;
  /** Append a `(ctrl+o to collapse)` anchor row to expanded tool boxes. */
  collapseAnchor: boolean;
  /** Give compaction/branch-summary boxes the same rounded transparent frame. */
  frameMessages: boolean;
  /** Theme fg color for message-box borders (any ThemeColor name). */
  messageBorderColor: string;
}

const DEFAULTS: ToolboxConfig = {
  enabled: true,
  highlightBash: true,
  collapseAnchor: true,
  frameMessages: true,
  messageBorderColor: "accent",
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
      collapseAnchor: toolbox?.collapseAnchor ?? DEFAULTS.collapseAnchor,
      frameMessages: toolbox?.frameMessages ?? DEFAULTS.frameMessages,
      messageBorderColor: toolbox?.messageBorderColor ?? DEFAULTS.messageBorderColor,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

