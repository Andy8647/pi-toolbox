/**
 * pi-toolbox — Rounded transparent tool boxes for pi coding agent.
 *
 * - every tool box (built-in, MCP, other extensions) gets a self-drawn rounded
 *   frame with status-aware border colors and no background fill
 * - bash commands are syntax-highlighted
 *
 * Configuration (settings.json → "toolbox"):
 *   enabled: boolean        — enable/disable the extension (default: true)
 *   highlightBash: boolean  — syntax-highlight bash commands (default: true)
 *   collapseAnchor: boolean — `(ctrl+o to collapse)` row on expanded boxes (default: true)
 *   frameMessages: boolean  — rounded frame on message boxes (default: true)
 *   messageBorderColor: string — theme fg color for message-box borders (default: "accent")
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createBashToolDefinition } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { formatBashCallHighlighted } from "./bash-highlight.ts";
import { patchContainerBoxes, patchMessageBoxes, patchToolBoxFrames } from "./frame.ts";
import { loadConfig } from "./config.ts";
import type { ThemeLike } from "./theme-access.ts";

export { highlightBashCommand, formatBashCallHighlighted } from "./bash-highlight.ts";
export { stripBackgroundFills, patchContainerBoxes, patchMessageBoxes, patchToolBoxFrames } from "./frame.ts";

interface BashRenderState {
  startedAt?: number;
  endedAt?: number;
  callText?: Text;
}

/**
 * Re-register bash with a syntax-highlighted call row. Everything else about
 * the box (the frame, the transparent background) comes from the component
 * patch, so no other tool needs an override.
 */
function registerHighlightedBash(pi: ExtensionAPI, cwd: string): void {
  const definition = createBashToolDefinition(cwd) as any;

  pi.registerTool({
    name: "bash",
    label: "bash",
    description: definition.description,
    // Not inherited from the built-in on override — copy them explicitly
    ...(definition.promptSnippet ? { promptSnippet: definition.promptSnippet } : {}),
    ...(definition.promptGuidelines ? { promptGuidelines: definition.promptGuidelines } : {}),
    parameters: definition.parameters,
    ...(definition.prepareArguments ? { prepareArguments: definition.prepareArguments } : {}),
    ...(definition.executionMode ? { executionMode: definition.executionMode } : {}),

    async execute(toolCallId: any, params: any, signal: any, onUpdate: any, ctx: any) {
      return definition.execute(toolCallId, params, signal, onUpdate, ctx);
    },

    renderCall(args: any, theme: ThemeLike, context: any) {
      const state = context.state as BashRenderState;
      // Replicate the built-in renderCall's timing state — its renderResult
      // reads startedAt/endedAt for the "Took Xs" footer.
      if (context.executionStarted && state.startedAt === undefined) {
        state.startedAt = Date.now();
        state.endedAt = undefined;
      }
      const text = state.callText ?? new Text("", 0, 0);
      state.callText = text;
      text.setText(formatBashCallHighlighted(args, theme));
      return text;
    },

    renderResult: definition.renderResult,
  } as any);
}

/** Pi extension entry point. */
export default function (pi: ExtensionAPI): void {
  const config = loadConfig();
  if (!config.enabled) return;

  try {
    patchToolBoxFrames(config.collapseAnchor);
  } catch (error) {
    console.debug("[pi-toolbox] tool box frame patch failed:", error);
  }

  if (config.frameMessages) {
    try {
      patchMessageBoxes(config.messageBorderColor, config.collapseAnchor);
      patchContainerBoxes(config.messageBorderColor);
    } catch (error) {
      console.debug("[pi-toolbox] message box frame patch failed:", error);
    }
  }

  if (config.highlightBash) {
    try {
      registerHighlightedBash(pi, process.cwd());
    } catch (error) {
      console.debug("[pi-toolbox] bash highlight override failed:", error);
    }
  }

}
