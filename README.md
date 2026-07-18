# pi-toolbox

Rounded transparent tool boxes with syntax highlighting for [pi](https://github.com/badlogic/pi-mono) coding agent.

## Features

- **Rounded borders** — ╭╮╰╯ box drawing instead of pi's default ┌┐└┘
- **Transparent background** — no solid background fill, works with terminal transparency
- **Status-aware border colors** — grey while executing, green on success, red on error
- **Bash syntax highlighting** — commands get token-level coloring (commands, flags, strings, variables, operators, etc.)
- **Scroll-safe caching** — content fingerprint caching prevents re-rendering on every scroll event

## Screenshot

[Image-#1]

## Installation

```bash
pi install git:github.com/Andy8647/pi-toolbox
```

Restart pi to activate.

## Configuration

Add a `toolbox` key to your `~/.pi/agent/settings.json`:

```json
{
  "toolbox": {
    "highlightBash": true,
    "enabled": true
  }
}
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable the extension |
| `highlightBash` | boolean | `true` | Syntax-highlight bash commands |

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
