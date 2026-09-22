# Changelog

What changed in each released version of pi-toolbox. Versions follow
[semantic versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.2] - 2026-09-22

### Removed

**The `collapseAnchor` option and its `(ctrl+o to collapse)` row are gone.**
The row existed because, before Pi 0.86.0, the only way to close one expanded
box was `ctrl+o` collapsing every box at once. Pi now toggles a single tool
box (and compaction/branch/skill message boxes) on a click anywhere in its
content, so the anchor row is redundant. A `toolbox.collapseAnchor` key in
`settings.json` is ignored.

## [0.3.1] - 2026-09-20

### Fixed

**File icon placement for home-relative paths.** pi's `renderToolPath`
shortens `$HOME` to `~` in the display text, so an edit on
`~/.pi/agent/settings.json` never contained the raw args path — the icon
fell back into the prefix (`✏️{} edit ~/.pi/...`) instead of sitting in
front of the path. The matcher now tries both the raw and the `~`-shortened
form.

### Added

**File icons render in their brand colors, with full-set coverage.** The
icon map now contains the complete nvim-web-devicons set — 736 extensions
and 1172 special filenames — each with its brand color applied as a
truecolor escape (TypeScript blue, Rust orange, Go cyan, ...), like lazyvim
and yazi. Unknown extensions fall back to an uncolored generic file icon.
Tool-kind icons (FA glyphs) intentionally stay uncolored; they follow the
call row.

### Changed

**The call row drops the tool-name word for file tools.** With the kind
icon in front, ` 󰛦 edit ~/x.ts` reads choppier than
` 󰛦 ~/x.ts` — the word is redundant, so read/edit/write rows are
just `kind icon + file icon + path`. Rows that don't start with the tool
name are left untouched.

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
stays grey, errors stay red, unlisted tools take the theme accent), and every
box's call row leads with a kind icon — file tools put the target file's
nvim-web-devicons glyph right in front of the path (`write /tmp/x.ts`
renders `  write 󰛦 /tmp/x.ts`).

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
