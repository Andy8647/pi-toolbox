# Changelog

What changed in each released version of pi-toolbox. Versions follow
[semantic versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-09-19

### Added

**Message boxes get the same rounded transparent frame as tool boxes, each
kind in its own border color.** User messages, compaction and branch
summaries, skill invocations, and extension custom messages previously kept
pi's default filled-background bars, since they never go through
`ToolExecutionComponent`. Their components are now patched the same way.
User messages keep their OSC 133 zone markers, and custom messages rendered
by an extension-provided renderer are left untouched — the renderer owns its
styling.

**Tool boxes can take per-tool border colors and Nerd Font icons.** A
successful box uses its tool's configured color instead of green (pending
stays grey, errors stay red), and every box's call row gets a kind icon —
file tools additionally show the target file's nvim-web-devicons glyph
(`read foo.ts` renders an eye plus the TypeScript icon).

New settings under `toolbox`: `frameMessages` (default `true`) toggles the
message frames; `frameUserMessages` (default `false`) opts user messages in
— they are skipped by default because pi-starline patches the same
prototype, and two render patches on one prototype fight over the output;
`icons` (default `true`, requires a Nerd Font) toggles the icons;
`toolColors` maps tool names to success border colors (replaces defaults
when set); `messageBorderColors` picks a border color per message
kind — `user` (`toolTitle`), `compaction` (`customMessageLabel`), `branch`
(`mdCode`), `skill` (`accent`), `custom` (`warning`). Values are theme fg
color names, so they follow the active theme; tool boxes keep their
status-driven grey/green/red.

## [0.2.3] - 2026-09-18

### Fixed

**Bash syntax highlighting can no longer freeze the whole interface.** A `#`
that was neither at the start of a word nor inside quotes — `fill:#242f60`,
`a#b`, `url#frag` — was treated as a word break that no branch handled. The
scanner stopped advancing and pushed empty strings until the process ran out of
memory. Because the call row is re-rendered on every tool-argument delta, a
streaming command containing one of these deadlocked the TUI: 100% CPU, no
repaint, `ctrl+c` unresponsive, and the session file stopped updating. The
process could not recover on its own and survived closing the terminal tab.

Bare `\r` and other non-space whitespace (`\u00a0`, `\v`, `\f`) reached the same
dead end, because they are word breaks too.

The tokenizer now keeps a mid-word `#` inside the word, and the scanner can
never loop without consuming a character — an unhandled break character is
emitted as plain text instead of spinning. `test/bash-highlight.test.ts` covers
the reported shapes, a heredoc with a hex colour, and 400 randomized inputs
containing `#`, `\r` and non-ASCII spaces; every case asserts termination (a hang
is detected by a worker deadline) and that no character is dropped.

## [0.2.2] - 2026-08-10

### Added

**A collapse anchor row inside expanded tool boxes.** When a tool box is
expanded, the frame now ends with a `(ctrl+o to collapse)` row. With
[pi-starline](https://github.com/Andy8647/pi-starline) installed the row is
clickable (click it to collapse the box again); without Starline it reads as
an ordinary keyboard hint — `ctrl+o` really does collapse the box in Pi.
Set `toolbox.collapseAnchor: false` to opt out of the row entirely.

The anchor row is painted by Starline's `expandHintAction` matching it, so
neither extension needs to know about the other.

## [0.2.1] - 2026-07-26

### Changed

- Tool boxes stand down when another extension owns the mouse; clicking to
  expand a box is now opt-in rather than the default.

## [0.2.0] - 2026-07-26

### Added

- Rounded, status-aware tool box frames with bash highlighting.
- Click a tool box's border to expand just that box.

### Removed

- The fixed-editor-era click-to-expand that required Starline's compositor.
