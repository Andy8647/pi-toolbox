/**
 * Nerd Font icons for tool boxes and message boxes.
 *
 * File-type glyphs AND their brand colors are the nvim-web-devicons set
 * (extracted from nvim-material-icon); tool/message glyphs are the Font
 * Awesome range. All glyphs verified present in Maple Mono NF; any Nerd
 * Font works. Requires a Nerd Font — disable with `icons: false` otherwise.
 */

export interface FileIconEntry {
	/** Bare glyph. */
	icon: string;
	/** nvim-web-devicons brand color (hex). */
	color: string;
}

// ── File types (extension, lowercase) ───────────────────────────────────
export const FILE_EXT_ICONS: Record<string, FileIconEntry> = {
	"7z": { icon: "\u{f05c4}", color: "#afb42b" },
	"bash": { icon: "\u{ebca}", color: "#ff7043" },
	"bat": { icon: "\u{f018d}", color: "#ff7043" },
	"bmp": { icon: "\u{f021f}", color: "#25a6a0" },
	"bz2": { icon: "\u{f05c4}", color: "#afb42b" },
	"c": { icon: "\u{e649}", color: "#0188d1" },
	"cc": { icon: "\u{e646}", color: "#0188d1" },
	"cfg": { icon: "\u{f013}", color: "#42a5f5" },
	"clj": { icon: "\u{e642}", color: "#2ab6f6" },
	"cljs": { icon: "\u{e642}", color: "#2ab6f6" },
	"cmd": { icon: "\u{ebc4}", color: "#ff7043" },
	"conf": { icon: "\u{f013}", color: "#42a5f5" },
	"cpp": { icon: "\u{e646}", color: "#0188d1" },
	"cs": { icon: "\u{f031b}", color: "#0188d1" },
	"css": { icon: "\u{e749}", color: "#42a5f5" },
	"csv": { icon: "\u{f021b}", color: "#8bc34a" },
	"cxx": { icon: "\u{e646}", color: "#0188d1" },
	"dart": { icon: "\u{e64c}", color: "#59b6f0" },
	"diff": { icon: "\u{f4d2}", color: "#42a5f5" },
	"erl": { icon: "\u{f23f}", color: "#f54436" },
	"ex": { icon: "\u{e62d}", color: "#9575ce" },
	"exs": { icon: "\u{e62d}", color: "#9575ce" },
	"fish": { icon: "\u{f023a}", color: "#ff7043" },
	"fs": { icon: "\u{e7a7}", color: "#31b9db" },
	"fsx": { icon: "\u{e7a7}", color: "#31b9db" },
	"gif": { icon: "\u{f021f}", color: "#25a6a0" },
	"go": { icon: "\u{f07d3}", color: "#02acc1" },
	"gql": { icon: "\u{f0877}", color: "#ec417a" },
	"graphql": { icon: "\u{f0877}", color: "#ec417a" },
	"gz": { icon: "\u{f05c4}", color: "#afb42b" },
	"h": { icon: "\u{f0829}", color: "#0188d1" },
	"hh": { icon: "\u{f0fd}", color: "#0188d1" },
	"hpp": { icon: "\u{f0fd}", color: "#0188d1" },
	"hs": { icon: "\u{e61f}", color: "#ffa726" },
	"htm": { icon: "\u{f13b}", color: "#e44e27" },
	"html": { icon: "\u{f13b}", color: "#e44e27" },
	"ico": { icon: "\u{f021f}", color: "#25a6a0" },
	"ini": { icon: "\u{f013}", color: "#42a5f5" },
	"ipynb": { icon: "\u{f082e}", color: "#f57d01" },
	"java": { icon: "\u{f0f4}", color: "#f54436" },
	"jl": { icon: "\u{e624}", color: "#338a23" },
	"jpeg": { icon: "\u{f021f}", color: "#25a6a0" },
	"jpg": { icon: "\u{f021f}", color: "#25a6a0" },
	"js": { icon: "\u{f031e}", color: "#ffca29" },
	"json": { icon: "\u{e60b}", color: "#faa825" },
	"json5": { icon: "\u{e60b}", color: "#faa825" },
	"jsonc": { icon: "\u{e60b}", color: "#faa825" },
	"jsx": { icon: "\u{ed46}", color: "#ffca29" },
	"kt": { icon: "\u{e634}", color: "#1a95d9" },
	"kts": { icon: "\u{e634}", color: "#1a95d9" },
	"less": { icon: "\u{ed48}", color: "#0277bd" },
	"lisp": { icon: "\u{e6b0}", color: "#ef5351" },
	"lock": { icon: "\u{f023}", color: "#ffd550" },
	"log": { icon: "\u{f0f6}", color: "#afb42b" },
	"lua": { icon: "\u{e620}", color: "#42a5f5" },
	"markdown": { icon: "\u{eb1d}", color: "#42a5f5" },
	"md": { icon: "\u{eb1d}", color: "#42a5f5" },
	"mdx": { icon: "\u{eb1d}", color: "#ffca29" },
	"mjs": { icon: "\u{f031e}", color: "#ffca29" },
	"ml": { icon: "\u{e67a}", color: "#ff9800" },
	"mli": { icon: "\u{e67a}", color: "#ff9800" },
	"mov": { icon: "\u{f0381}", color: "#ff9800" },
	"mp3": { icon: "\u{f0386}", color: "#ee534f" },
	"mp4": { icon: "\u{f0381}", color: "#ff9800" },
	"nix": { icon: "\u{f313}", color: "#5175c2" },
	"pdf": { icon: "\u{f1c1}", color: "#ef5351" },
	"php": { icon: "\u{f031f}", color: "#2088e5" },
	"png": { icon: "\u{f021f}", color: "#25a6a0" },
	"prisma": { icon: "\u{e684}", color: "#00bfa5" },
	"properties": { icon: "\u{f013}", color: "#42a5f5" },
	"ps1": { icon: "\u{f0a0a}", color: "#04a9f4" },
	"py": { icon: "\u{ed1b}", color: "#3a87cb" },
	"r": { icon: "\u{e68a}", color: "#1976d3" },
	"rar": { icon: "\u{f05c4}", color: "#afb42b" },
	"rb": { icon: "\u{f0d2d}", color: "#f54436" },
	"rs": { icon: "\u{e68b}", color: "#ff7043" },
	"sass": { icon: "\u{e603}", color: "#ec417a" },
	"scala": { icon: "\u{e68e}", color: "#f54436" },
	"scss": { icon: "\u{e603}", color: "#ec417a" },
	"sh": { icon: "\u{f018d}", color: "#ff7043" },
	"sol": { icon: "\u{e656}", color: "#0188d1" },
	"sql": { icon: "\u{f1c0}", color: "#ffca29" },
	"svelte": { icon: "\u{e697}", color: "#ff5821" },
	"svg": { icon: "\u{f0721}", color: "#ffb300" },
	"swift": { icon: "\u{f06e5}", color: "#fe5e2f" },
	"tar": { icon: "\u{f05c4}", color: "#afb42b" },
	"tf": { icon: "\u{e69a}", color: "#5d6bc0" },
	"tfvars": { icon: "\u{e69a}", color: "#5d6bc0" },
	"toml": { icon: "\u{e6b2}", color: "#ef5351" },
	"ts": { icon: "\u{f06e6}", color: "#0188d1" },
	"tsv": { icon: "\u{f021b}", color: "#8bc34a" },
	"tsx": { icon: "\u{ed46}", color: "#04bcd4" },
	"txt": { icon: "\u{f0219}", color: "#42a5f5" },
	"vim": { icon: "\u{e62b}", color: "#44a047" },
	"vue": { icon: "\u{e6a0}", color: "#40b883" },
	"wasm": { icon: "\u{e6a1}", color: "#7d4dff" },
	"wav": { icon: "\u{f0386}", color: "#76b900" },
	"webm": { icon: "\u{f0381}", color: "#ff9800" },
	"webp": { icon: "\u{f021f}", color: "#25a6a0" },
	"xml": { icon: "\u{f022e}", color: "#8bc34a" },
	"xz": { icon: "\u{f05c4}", color: "#afb42b" },
	"yaml": { icon: "\u{f0219}", color: "#ff5252" },
	"yml": { icon: "\u{f0219}", color: "#ff5252" },
	"zig": { icon: "\u{e6a9}", color: "#faa825" },
	"zip": { icon: "\u{f05c4}", color: "#afb42b" },
	"zsh": { icon: "\u{f018d}", color: "#ff7043" },
};

// Extension aliases → an entry from the map above
export const FILE_EXT_ALIASES: Record<string, string> = {
	"mts": "ts",
	"cts": "ts",
	"cjs": "js",
	"pyi": "py",
	"hrl": "erl",
	"lhs": "hs",
	"edn": "clj",
	"hcl": "tf",
	"patch": "diff",
	"ejs": "html",
	"mmd": "md",
};

// ── Special filenames (basename, lowercase) ─────────────────────────────
export const FILE_NAME_ICONS: Record<string, FileIconEntry> = {
	".editorconfig": { icon: "\u{e652}", color: "#ffffff" },
	".env": { icon: "\u{f066a}", color: "#fbc02d" },
	".gitattributes": { icon: "\u{f02a2}", color: "#e64a19" },
	".gitignore": { icon: "\u{f02a2}", color: "#e64a19" },
	".npmrc": { icon: "\u{ed0e}", color: "#cc3837" },
	".nvmrc": { icon: "\u{ed0d}", color: "#4caf51" },
	"cargo.toml": { icon: "\u{e6b2}", color: "#ef5351" },
	"changelog.md": { icon: "\u{f1038}", color: "#8bc34a" },
	"docker-compose.yaml": { icon: "\u{f21f}", color: "#0088c9" },
	"docker-compose.yml": { icon: "\u{f21f}", color: "#0088c9" },
	"dockerfile": { icon: "\u{f21f}", color: "#0088c9" },
	"gemfile": { icon: "\u{eb48}", color: "#e63936" },
	"go.mod": { icon: "\u{f07d3}", color: "#ec417a" },
	"go.sum": { icon: "\u{f07d3}", color: "#ec417a" },
	"jsconfig.json": { icon: "\u{e60c}", color: "#ffca29" },
	"license": { icon: "\u{f0124}", color: "#ec6237" },
	"license.md": { icon: "\u{f0124}", color: "#ec6237" },
	"makefile": { icon: "\u{eba2}", color: "#ef5351" },
	"package-lock.json": { icon: "\u{ed0d}", color: "#f54436" },
	"package.json": { icon: "\u{ed0d}", color: "#4caf51" },
	"pom.xml": { icon: "\u{e82c}", color: "#ff7043" },
	"procfile": { icon: "\u{e607}", color: "#6964ba" },
	"readme.md": { icon: "\u{f05a}", color: "#42a5f5" },
	"tsconfig.json": { icon: "\u{e628}", color: "#0188d1" },
	"yarn.lock": { icon: "\u{e6a7}", color: "#0188d1" },
};

export const DEFAULT_FILE_ICON = "\u{f016}"; // fa-file-o
export const FOLDER_ICON = "\u{f07b}"; // fa-folder

/** Wrap a glyph in its truecolor escape (resets to default fg after). */
function colorize(glyph: string, hex: string): string {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `\x1b[38;2;${r};${g};${b}m${glyph}\x1b[39m`;
}

/** Bare glyph for a file path: exact basename first, then extension. */
export function fileGlyph(path: string): string {
	const base = (path.split("/").pop() ?? "").toLowerCase();
	const byName = FILE_NAME_ICONS[base];
	if (byName) return byName.icon;
	const ext = base.includes(".") ? (base.split(".").pop() ?? "") : "";
	const key = FILE_EXT_ALIASES[ext] ?? ext;
	return FILE_EXT_ICONS[key]?.icon ?? DEFAULT_FILE_ICON;
}

/** Colored glyph for a file path, in its nvim-web-devicons brand color. */
export function fileIcon(path: string): string {
	const base = (path.split("/").pop() ?? "").toLowerCase();
	const byName = FILE_NAME_ICONS[base];
	if (byName) return colorize(byName.icon, byName.color);
	const ext = base.includes(".") ? (base.split(".").pop() ?? "") : "";
	const key = FILE_EXT_ALIASES[ext] ?? ext;
	const entry = FILE_EXT_ICONS[key];
	return entry ? colorize(entry.icon, entry.color) : DEFAULT_FILE_ICON;
}

// ── Tool kinds ──────────────────────────────────────────────────────────
export const TOOL_ICONS: Record<string, string> = {
	bash: "\u{f120}", // fa-terminal
	read: "\u{f06e}", // fa-eye
	edit: "\u{f044}", // fa-edit
	write: "\u{f0c7}", // fa-floppy-o
	grep: "\u{f002}", // fa-search
	find: "\u{f07c}", // fa-folder-open
	ls: "\u{f07b}", // fa-folder
	todo: "\u{f046}", // fa-check-square-o
	subagent: "\u{f0c0}", // fa-users
	mcp: "\u{f12e}", // fa-puzzle-piece
	web_search: "\u{f0ac}", // fa-globe
	web_extract: "\u{f0c1}", // fa-link
};

export const DEFAULT_TOOL_ICON = "\u{f0ad}"; // fa-wrench

/** Tools whose args carry a file path that deserves a file-type icon. */
export const PATH_ARG_TOOLS = new Set(["read", "edit", "write"]);

/** Kind icon for a tool: its configured glyph or the generic wrench. */
export function toolKindIcon(toolName: string): string {
	return TOOL_ICONS[toolName] ?? DEFAULT_TOOL_ICON;
}

// ── Message boxes ───────────────────────────────────────────────────────
export const MESSAGE_ICONS = {
	user: "\u{f007}", // fa-user
	compaction: "\u{f066}", // fa-compress
	branch: "\u{f126}", // fa-code-fork
	skill: "\u{f0d0}", // fa-magic
	custom: "\u{f12e}", // fa-puzzle-piece
} as const;

