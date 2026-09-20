import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface MessageBorderColors {
  user: string;
  compaction: string;
  branch: string;
  skill: string;
  custom: string;
}

export interface ToolboxConfig {
  enabled: boolean;
  highlightBash: boolean;
  /** Append a `(ctrl+o to collapse)` anchor row to expanded tool boxes. */
  collapseAnchor: boolean;
  /** Give message boxes the same rounded transparent frame as tool boxes. */
  frameMessages: boolean;
  /** Per-kind theme fg colors for message-box borders (any ThemeColor name). */
  messageBorderColors: MessageBorderColors;
}

const DEFAULTS: ToolboxConfig = {
  enabled: true,
  highlightBash: true,
  collapseAnchor: true,
  frameMessages: true,
  messageBorderColors: {
    user: "toolTitle",
    compaction: "customMessageLabel",
    branch: "mdCode",
    skill: "accent",
    custom: "warning",
  },
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
      messageBorderColors: {
        ...DEFAULTS.messageBorderColors,
        ...toolbox?.messageBorderColors,
      },
    };
  } catch {
    return { ...DEFAULTS };
  }
}

