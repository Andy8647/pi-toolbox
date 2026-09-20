# pi-toolbox

Rounded transparent tool boxes with syntax highlighting for [pi](https://github.com/badlogic/pi-mono) coding agent.

## Features

- **Rounded borders** — ╭╮╰╯ box drawing instead of pi's default ┌┐└┘
- **Every tool box** — built-in tools, MCP calls (pi-mcp-adapter), subagents, and any other extension's tools all get the same frame
- **Every message box** — compaction and branch summaries, skill invocations, and extension custom messages get the same frame, each kind in its own border color (user messages are left to pi-starline by default)
- **Per-tool border colors** — successful boxes take their tool's color (bash/read/edit/write/… configurable); pending stays grey, errors stay red
- **Nerd Font icons** — every box gets a kind icon; file tools additionally show the target file's nvim-web-devicons glyph (`read foo.ts` → eye + TypeScript icon)
- **Transparent background** — no solid background fill, works with terminal transparency
- **Status-aware border colors** — grey while executing, green on success, red on error
- **Bash syntax highlighting** — commands get token-level coloring (commands, flags, strings, variables, operators, etc.)
- **Collapse anchor** — an expanded box shows a `(ctrl+o to collapse)` row as its last line, the same text bash boxes show natively; pi-starline additionally makes it clickable to close just that box
- **Scroll-safe caching** — content fingerprint caching prevents re-rendering on every scroll event

## Screenshot

[Image-#1]

## Installation

```bash
pi install npm:@andy8647/pi-toolbox
```

Or straight from the repo:

```bash
pi install git:github.com/Andy8647/pi-toolbox
```

Restart pi to activate.

## Releasing

`.github/workflows/publish.yml` publishes to npm on a published GitHub Release,
using npm's Trusted Publisher (OIDC) — no `NPM_TOKEN` secret. Bump `version` in
`package.json`, tag `vX.Y.Z`, and publish the release; the workflow fails fast
if the tag and the manifest version disagree.

## Configuration

Add a `toolbox` key to your `~/.pi/agent/settings.json`:

```json
{
  "toolbox": {
    "enabled": true,
    "highlightBash": true,
    "collapseAnchor": true,
    "frameMessages": true,
    "frameUserMessages": false,
    "icons": true,
    "toolColors": {
      "bash": "bashMode",
      "read": "toolTitle",
      "edit": "syntaxVariable",
      "write": "syntaxType",
      "grep": "syntaxOperator",
      "find": "syntaxOperator",
      "ls": "syntaxOperator"
    },
    "messageBorderColors": {
      "user": "toolTitle",
      "compaction": "customMessageLabel",
      "branch": "mdCode",
      "skill": "accent",
      "custom": "warning"
    }
  }
}
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable the extension |
| `highlightBash` | boolean | `true` | Syntax-highlight bash commands |
| `collapseAnchor` | boolean | `true` | Show a `(ctrl+o to collapse)` row at the bottom of expanded tool boxes |
| `frameMessages` | boolean | `true` | Frame compaction/branch/skill/custom-message boxes like tool boxes |
| `frameUserMessages` | boolean | `false` | Also frame user messages — off by default because pi-starline already restyles `UserMessageComponent`, and two render patches on one prototype fight over the output. Enable only without pi-starline |
| `icons` | boolean | `true` | Nerd Font icons on every box. Requires a Nerd Font; set `false` otherwise |
| `toolColors` | object | see above | Border color per tool name for successful executions (pending stays grey, errors stay red). When set, the map **replaces** the defaults — `{}` disables per-tool colors |
| `messageBorderColors` | object | see above | Per-kind message-box border colors; merged over the defaults |

All color values are theme fg color names (`ThemeColor`), so they follow the
active theme. Default palette rationale: tool boxes reserve green/red/grey for
execution status, so message kinds get hues that don't collide —
`customMessageLabel` (mauve, matching the `[compaction]` label) for
compactions, `mdCode` (peach) for branch summaries, `accent` (sky) for skill
invocations, `warning` (yellow) for extension notices.

## How it works

pi builds one `ToolExecutionComponent` per tool call, no matter which extension
registered the tool. The extension API cannot wrap another extension's
renderers, so pi-toolbox patches that component's `render` instead — which is
why MCP and subagent boxes are framed too. Message boxes (compaction, branch
summary, skill invocation, extension custom message) never go through that
component; their own prototypes get the same treatment, with two exceptions
that keep their native styling: custom messages rendered by an
extension-provided renderer, and `!` bash-mode executions, which already draw
their own border. User messages are skipped by default because pi-starline
patches the same prototype. Only `bash` is re-registered, purely to add syntax
highlighting to the command row.

An unchanged box returns its cached line array outright, because a compositor
like [pi-powerline-footer](https://github.com/Andy8647/pi-powerline-footer)'s
fixed editor re-renders the whole root on every mouse packet while scrolling.
Measured against unpatched pi at 300 boxes / 2400 lines: +0.03 ms per full
render.

### No mouse handling

Expanding a single box by clicking it was tried and removed. It requires
turning on terminal mouse reporting, which takes the wheel and clicks away from
the terminal for the entire session, and it cannot coexist with an extension
that already owns the mouse — pi-powerline-footer's fixed-editor compositor
consumes every SGR mouse report for its own scrolling and selection. Use
`ctrl+o` to toggle tool output.

## Compatible themes

For the best transparent experience, set tool background colors to `""` in your theme:

```json
{
  "toolPendingBg": "",
  "toolSuccessBg": "",
  "toolErrorBg": ""
}
```

## License

MIT
