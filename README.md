# pi-toolbox

Rounded transparent tool boxes with syntax highlighting for [pi](https://github.com/badlogic/pi-mono) coding agent.

## Features

- **Rounded borders** — ╭╮╰╯ box drawing instead of pi's default ┌┐└┘
- **Every tool box** — built-in tools, MCP calls (pi-mcp-adapter), subagents, and any other extension's tools all get the same frame
- **Transparent background** — no solid background fill, works with terminal transparency
- **Status-aware border colors** — grey while executing, green on success, red on error
- **Click to expand one box** — click any tool box to expand/collapse just that one; `ctrl+o` still toggles all of them
- **Bash syntax highlighting** — commands get token-level coloring (commands, flags, strings, variables, operators, etc.)
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
    "clickToExpand": true
  }
}
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable the extension |
| `highlightBash` | boolean | `true` | Syntax-highlight bash commands |
| `clickToExpand` | boolean | `true` | Click a tool box to expand only that box |

### About click-to-expand

pi does not enable mouse reporting on its own, so this extension turns on SGR
mouse tracking (`?1000` + `?1006`) for the session and consumes the reports
before they reach the editor. While it is on, the terminal routes clicks and
the scroll wheel to pi instead of handling them itself:

- **Hold Shift** for native text selection and scrollback wheel scrolling
  (works in Ghostty, iTerm2, WezTerm, Kitty, and most modern terminals).
- Set `"clickToExpand": false` to keep the terminal's default mouse behavior.

Mouse tracking is disabled again on shutdown.

## How it works

pi builds one `ToolExecutionComponent` per tool call, no matter which extension
registered the tool. The extension API cannot wrap another extension's
renderers, so pi-toolbox patches that component's `render` instead — which is
why MCP and subagent boxes are framed too. Only `bash` is re-registered, purely
to add syntax highlighting to the command row.

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
