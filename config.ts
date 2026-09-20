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
  /** Frame user messages too — off by default because pi-starline owns them. */
  frameUserMessages: boolean;
  /** Prepend Nerd Font icons (tool kind / file type / message kind). */
  icons: boolean;
  /** Per-kind theme fg colors for message-box borders (any ThemeColor name). */
  messageBorderColors: MessageBorderColors;
  /**
   * Per-tool border color for successful executions (theme fg color names;
   * pending stays grey, error stays red). When set in settings, the map
   * REPLACES the defaults entirely — `{}` disables per-tool colors.
   */
  toolColors: Record<string, string>;
}

const DEFAULT_TOOL_COLORS: Record<string, string> = {
  bash: "bashMode",
  read: "toolTitle",
  edit: "syntaxVariable",
  write: "syntaxVariable",
  grep: "syntaxOperator",
  find: "syntaxOperator",
  ls: "syntaxOperator",
  mcp: "customMessageLabel",
};

const DEFAULTS: ToolboxConfig = {
  enabled: true,
  highlightBash: true,
  collapseAnchor: true,
  frameMessages: true,
  frameUserMessages: false,
  icons: true,
  messageBorderColors: {
    user: "toolTitle",
    compaction: "customMessageLabel",
    branch: "mdCode",
    skill: "accent",
    custom: "warning",
  },
  toolColors: DEFAULT_TOOL_COLORS,
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
      frameUserMessages: toolbox?.frameUserMessages ?? DEFAULTS.frameUserMessages,
      icons: toolbox?.icons ?? DEFAULTS.icons,
      messageBorderColors: {
        ...DEFAULTS.messageBorderColors,
        ...toolbox?.messageBorderColors,
      },
      // Replace, not merge: removing a tool's color must be expressible.
      toolColors: toolbox?.toolColors ?? DEFAULTS.toolColors,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

