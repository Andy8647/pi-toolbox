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
  state: { isPartial?: boolean; isError?: boolean; callRow?: string } = {},
): { render(width: number): string[] } {
  const component = Object.create(ToolExecutionComponent.prototype);
  component.hideComponent = false;
  component.hasRendererDefinition = () => false;
  component.contentText = new Text(state.callRow ?? `${toolName} doing things`, 0, 0);
  component.isPartial = state.isPartial ?? false;
  component.result = { isError: state.isError ?? false };
  component.expanded = false;
  component.imageComponents = [];
  component.imageSpacers = [];
  component.toolName = toolName;
  component.args = args;
  return component;
}

const ESCAPE_RE = /\x1b(?:\[[0-9;:?]*[ -/]*[@-~]|\][^\x07\x1b]*(?:\x07|\x1b\\)?)/g;
const visible = (line: string) => line.replace(ESCAPE_RE, "").replace(/<\/?fg:[^>]*>/g, "");

test("successful read gets its tool color; icons replace the tool-name word", () => {
  const lines = fakeToolBox("read", { path: "src/index.ts" }, { callRow: "read src/index.ts" }).render(60);
  assert.match(lines[1], /^<fg:readCol>╭─+╮<\/fg>$/, "border in the tool color");
  const row = visible(lines[2]);
  const kindIdx = row.indexOf("\u{f06e}");
  const fileIdx = row.indexOf("\u{f06e6}");
  const pathIdx = row.indexOf("src/index.ts");
  assert.ok(kindIdx >= 1, "kind icon has a leading space off the border");
  assert.ok(!row.includes("read"), "tool-name word removed (icon says it)");
  assert.ok(kindIdx < fileIdx && fileIdx < pathIdx, "kind → file → path order");
});

test("file icons carry their nvim-web-devicons brand color", () => {
  const lines = fakeToolBox("read", { path: "src/index.ts" }, { callRow: "read src/index.ts" }).render(60);
  // TypeScript brand color #0188d1 → truecolor escape right before the glyph.
  assert.ok(lines[2].includes("\x1b[38;2;1;136;209m\u{f06e6}\x1b[39m"), "colored TS glyph");
});

test("file icon falls back into the prefix when the path is not in the call row", () => {
  const lines = fakeToolBox("read", { path: "src/index.ts" }).render(60);
  const row = visible(lines[2]);
  assert.ok(row.indexOf("\u{f06e}") < row.indexOf("\u{f06e6}"), "kind icon before file icon");
  assert.ok(row.indexOf("\u{f06e6}") < row.indexOf("doing things"), "file icon still leads the row");
  assert.ok(!row.includes("read"), "tool-name word removed");
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

test("unlisted tool falls back to the accent color and the wrench icon", () => {
  const lines = fakeToolBox("mcp_server_thing", {}).render(60);
  assert.match(lines[1], /^<fg:accent>╭─+╮<\/fg>$/);
  assert.ok(lines[2].includes("\u{f0ad}"), "default wrench icon");
});

test("read without a path arg falls back to the read tool icon", () => {
  const lines = fakeToolBox("read", {}).render(60);
  assert.ok(lines[2].includes("\u{f06e}"), "eye icon");
});

test("file icon follows the ~-shortened display path", () => {
  // renderToolPath shortens $HOME to ~ in the display text; the raw args
  // path never appears in the row, so the icon must match the short form.
  const home = process.env.HOME!;
  const raw = `${home}/.pi/agent/settings.json`;
  const lines = fakeToolBox("edit", { path: raw }, { callRow: "edit ~/.pi/agent/settings.json" }).render(70);
  const row = visible(lines[2]);
  const fileIdx = row.indexOf("\ue60b"); // json glyph
  assert.ok(fileIdx >= 0, "json icon present");
  assert.ok(fileIdx < row.indexOf("~/.pi/agent"), "icon sits in front of the ~ path");
  assert.ok(!row.includes("edit"), "tool-name word removed");
});

test("file icon lands outside the OSC 8 hyperlink, never inside its URL", () => {
  // Real write/read renderCall wraps the path in an ST-terminated OSC 8
  // hyperlink whose URL contains the path — a naive indexOf would inject
  // the icon into the escape sequence (invisible + corrupts the link).
  const path = "/tmp/pi-toolbox-demo/demo.ts";
  const opener = `\x1b]8;;file://${path}\x1b\\`;
  const closer = "\x1b]8;;\x1b\\";
  const callRow = `write ${opener}\x1b[96m${path}\x1b[0m${closer}`;
  const lines = fakeToolBox("write", { path }, { callRow }).render(60);
  const row = lines[2];

  assert.ok(row.includes(opener), "hyperlink opener intact");
  assert.ok(!opener.includes("\u{f06e6}"), "URL not polluted by the icon");
  const vis = visible(row);
  const fileIdx = vis.indexOf("\u{f06e6}");
  assert.ok(fileIdx >= 0, "file icon visible");
  assert.ok(fileIdx < vis.indexOf(path), "icon sits in front of the path");
  assert.ok(!vis.includes("write"), "tool-name word removed");
});

test("user messages are not framed by default (pi-starline owns them)", () => {
  patchContainerBoxes({ user: "userCol", custom: "customCol" });
  const component = new UserMessageComponent("hello" as never);
  const lines: string[] = component.render(60);
  assert.ok(!lines.some((l) => l.includes("╭")), "no frame on user messages by default");
  assert.ok(lines.join("\n").includes("hello"), "original render intact");
});
