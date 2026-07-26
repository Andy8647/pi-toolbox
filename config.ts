import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface ToolboxConfig {
  enabled: boolean;
  highlightBash: boolean;
  clickToExpand: boolean;
}

const DEFAULTS: ToolboxConfig = {
  enabled: true,
  highlightBash: true,
  clickToExpand: true,
};

export function loadConfig(): ToolboxConfig {
  try {
    const agentDir = process.env.PI_CODING_AGENT_DIR || `${process.env.HOME || "/tmp"}/.pi/agent`;
    const settings = JSON.parse(readFileSync(join(agentDir, "settings.json"), "utf-8"));
    const toolbox = settings?.toolbox;
    return {
      enabled: toolbox?.enabled ?? DEFAULTS.enabled,
      highlightBash: toolbox?.highlightBash ?? DEFAULTS.highlightBash,
      clickToExpand: toolbox?.clickToExpand ?? DEFAULTS.clickToExpand,
    };
  } catch {
    return { ...DEFAULTS };
  }
}
