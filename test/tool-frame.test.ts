/**
 * Tests for tool box per-kind colors and icons, and for the default skip of
 * user messages (pi-starline owns UserMessageComponent — see frame.ts).
 *
 * Runs in its own process (node --test isolates files), so the prototype
 * patches here must NOT enable includeUser.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

const THEME_KEY = Symbol.for("@earendil-works/pi-coding-agent:theme");
(globalThis as any)[THEME_KEY] = {
  fg: (color: string, text: string) => `<fg:${color}>${text}</fg>`,
  bg: (_color: string, text: string) => `\x1b[48;5;60m${text}\x1b[49m`,
  bold: (text: string) => `<b>${text}</b>`,
};

const { patchContainerBoxes, patchToolBoxFrames } = await import("../frame.ts");
const { ToolExecutionComponent, UserMessageComponent } = await import("@earendil-works/pi-coding-agent");
const { Text } = await import("@earendil-works/pi-tui");

patchToolBoxFrames({
  icons: true,
  toolColors: { bash: "bashCol", read: "readCol" },
});

function fakeToolBox(
  toolName: string,
  args: unknown,
  state: { isPartial?: boolean; isError?: boolean } = {},
): { render(width: number): string[] } {
  const component = Object.create(ToolExecutionComponent.prototype);
  component.hideComponent = false;
  component.hasRendererDefinition = () => false;
  component.contentText = new Text(`${toolName} doing things`, 0, 0);
  component.isPartial = state.isPartial ?? false;
  component.result = { isError: state.isError ?? false };
  component.expanded = false;
  component.imageComponents = [];
  component.imageSpacers = [];
  component.toolName = toolName;
  component.args = args;
  return component;
}

test("successful read gets its tool color and both icons", () => {
  const lines = fakeToolBox("read", { path: "src/index.ts" }).render(60);
  assert.match(lines[1], /^<fg:readCol>╭─+╮<\/fg>$/, "border in the tool color");
  assert.ok(lines[2].includes("\u{f06e}"), "read (eye) kind icon");
  assert.ok(lines[2].includes("\u{f06e6}"), "TypeScript file icon (nvim-web-devicons)");
  assert.ok(lines[2].includes("read doing things"), "call row kept");
});

test("successful bash gets its tool color and the terminal icon", () => {
  const lines = fakeToolBox("bash", { command: "ls" }).render(60);
  assert.match(lines[1], /^<fg:bashCol>╭─+╮<\/fg>$/);
  assert.ok(lines[2].includes("\u{f120}"), "terminal icon");
});

test("error stays red even for a colored tool", () => {
  const lines = fakeToolBox("read", { path: "a.ts" }, { isError: true }).render(60);
  assert.match(lines[1], /^<fg:error>╭─+╮<\/fg>$/);
});

test("pending stays muted even for a colored tool", () => {
  const lines = fakeToolBox("bash", {}, { isPartial: true }).render(60);
  assert.match(lines[1], /^<fg:borderMuted>╭─+╮<\/fg>$/);
});

test("unlisted tool falls back to the success color and the wrench icon", () => {
  const lines = fakeToolBox("mcp_server_thing", {}).render(60);
  assert.match(lines[1], /^<fg:success>╭─+╮<\/fg>$/);
  assert.ok(lines[2].includes("\u{f0ad}"), "default wrench icon");
});

test("read without a path arg falls back to the read tool icon", () => {
  const lines = fakeToolBox("read", {}).render(60);
  assert.ok(lines[2].includes("\u{f06e}"), "eye icon");
});

test("user messages are not framed by default (pi-starline owns them)", () => {
  patchContainerBoxes({ user: "userCol", custom: "customCol" });
  const component = new UserMessageComponent("hello" as never);
  const lines: string[] = component.render(60);
  assert.ok(!lines.some((l) => l.includes("╭")), "no frame on user messages by default");
  assert.ok(lines.join("\n").includes("hello"), "original render intact");
});
