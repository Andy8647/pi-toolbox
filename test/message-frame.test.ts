/**
 * Smoke test for the message-box frame patch: compaction and branch-summary
 * boxes must render with the same rounded, transparent frame as tool boxes,
 * in the configured border color, with no background fill escapes.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

// Minimal theme singleton — getTheme() reads this well-known symbol.
// bg() must emit a real fill sequence so stripBackgroundFills can remove it
// and visibleWidth treats it as zero-width.
const THEME_KEY = Symbol.for("@earendil-works/pi-coding-agent:theme");
(globalThis as any)[THEME_KEY] = {
  fg: (color: string, text: string) => `<fg:${color}>${text}</fg>`,
  bg: (_color: string, text: string) => `\x1b[48;5;60m${text}\x1b[49m`,
  bold: (text: string) => `<b>${text}</b>`,
};

const { patchContainerBoxes, patchMessageBoxes } = await import("../frame.ts");
const {
  BranchSummaryMessageComponent,
  CompactionSummaryMessageComponent,
  CustomMessageComponent,
  SkillInvocationMessageComponent,
  UserMessageComponent,
} = await import("@earendil-works/pi-coding-agent");
const { Text } = await import("@earendil-works/pi-tui");

const BG_FILL_RE = /\x1b\[48;[0-9;]*m|\x1b\[(?:4[0-7]|10[0-7])m/;

function fakeMessage() {
  return { tokensBefore: 357695, summary: "summary text" } as any;
}

for (const [name, Component, arg] of [
  ["compaction", CompactionSummaryMessageComponent, fakeMessage()],
  ["branch summary", BranchSummaryMessageComponent, fakeMessage()],
  ["skill invocation", SkillInvocationMessageComponent, { name: "demo", content: "skill text" }],
] as const) {
  test(`${name} box gets a rounded transparent accent frame`, () => {
    patchMessageBoxes("accent", true);
    const component = new (Component as any)(arg);
    const lines: string[] = component.render(60);

    assert.ok(lines.length >= 4, "blank spacer + frame top + content + frame bottom");
    assert.match(lines[1], /^<fg:accent>╭─+╮<\/fg>$/, "rounded top border in accent");
    assert.match(lines.at(-1)!, /^<fg:accent>╰─+╯<\/fg>$/, "rounded bottom border in accent");
    for (const line of lines.slice(2, -1)) {
      assert.match(line, /^<fg:accent>│<\/fg>/, "left border");
      assert.match(line, /<fg:accent>│<\/fg>$/, "right border");
    }
    const body = lines.join("\n");
    assert.ok(
      body.includes("[compaction]") || body.includes("[branch]") || body.includes("[skill]"),
      "label kept",
    );
    if (name === "compaction") assert.ok(body.includes("357,695"), "token count kept");
    assert.ok(!BG_FILL_RE.test(body), "no background fill escapes");
  });
}

test("expanded compaction box renders its summary inside the frame", () => {
  patchMessageBoxes("accent", true);
  const component = new CompactionSummaryMessageComponent(fakeMessage() as any);
  component.setExpanded(true);
  const lines: string[] = component.render(60);
  const body = lines.join("\n");
  assert.match(lines[1], /^<fg:accent>╭─+╮<\/fg>$/, "still framed when expanded");
  assert.ok(body.includes("summary text"), "summary kept");
  // The collapse anchor is only rendered when a key is bound to
  // app.tools.expand — outside a real session keyText() is empty by design.
});

test("user message gets a frame and keeps its OSC133 zone markers", () => {
  patchContainerBoxes("accent");
  const component = new UserMessageComponent("hello **world**" as never);
  const lines: string[] = component.render(60);

  assert.match(lines[0], /^\x1b\]133;A\x07/, "zone start on first line");
  assert.match(lines.at(-1)!, /^\x1b\]133;B\x07\x1b\]133;C\x07/, "zone end+final on last line");
  assert.ok(lines.some((l) => l.includes("╭")), "rounded top border present");
  assert.ok(lines.some((l) => l.includes("╰")), "rounded bottom border present");
  assert.ok(lines.join("\n").includes("hello"), "content kept");
  assert.ok(!BG_FILL_RE.test(lines.join("\n")), "no background fill escapes");
});

test("custom message with default rendering gets a frame", () => {
  patchContainerBoxes("accent");
  const component = new CustomMessageComponent({ customType: "notice", content: "pay attention" } as any);
  const lines: string[] = component.render(60);
  assert.ok(lines.some((l) => l.includes("╭")), "rounded top border present");
  const body = lines.join("\n");
  assert.ok(body.includes("[notice]"), "label kept");
  assert.ok(body.includes("pay attention"), "content kept");
});

test("custom message with an extension renderer is left alone", () => {
  patchContainerBoxes("accent");
  const renderer = () => new Text("extension-owned styling", 0, 0);
  const component = new CustomMessageComponent(
    { customType: "fancy", content: "ignored" } as any,
    renderer as any,
  );
  const lines: string[] = component.render(60);
  assert.ok(!lines.some((l) => l.includes("╭")), "no frame around renderer output");
  assert.ok(lines.join("\n").includes("extension-owned styling"), "renderer output kept");
});

test("unknown border color falls back to the original render", () => {
  patchMessageBoxes("accent", true);
  const component = new CompactionSummaryMessageComponent(fakeMessage() as any);
  (globalThis as any)[THEME_KEY] = {
    fg: () => {
      throw new Error("unknown color");
    },
    bg: (c: string, t: string) => t,
    bold: (t: string) => t,
  };
  const lines: string[] = component.render(60);
  // Original Box render has no rounded border.
  assert.ok(!lines.some((l) => l.includes("╭")), "no frame on fallback");
});
