import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface ToolboxConfig {
  enabled: boolean;
  highlightBash: boolean;
}

const DEFAULTS: ToolboxConfig = {
  enabled: true,
  highlightBash: true,
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
    };
  } catch {
    return { ...DEFAULTS };
  }
}

