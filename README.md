# pi-toolbox

Rounded transparent tool boxes with syntax highlighting for [pi](https://github.com/badlogic/pi-mono) coding agent.

## Features

- **Rounded borders** — ╭╮╰╯ box drawing instead of pi's default ┌┐└┘
- **Every tool box** — built-in tools, MCP calls (pi-mcp-adapter), subagents, and any other extension's tools all get the same frame
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
    "collapseAnchor": true
  }
}
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable the extension |
| `highlightBash` | boolean | `true` | Syntax-highlight bash commands |
| `collapseAnchor` | boolean | `true` | Show a `(ctrl+o to collapse)` row at the bottom of expanded tool boxes |

## How it works

pi builds one `ToolExecutionComponent` per tool call, no matter which extension
registered the tool. The extension API cannot wrap another extension's
renderers, so pi-toolbox patches that component's `render` instead — which is
why MCP and subagent boxes are framed too. Only `bash` is re-registered, purely
to add syntax highlighting to the command row.

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
