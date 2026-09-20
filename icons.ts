/**
 * Nerd Font icons for tool boxes and message boxes.
 *
 * File-type glyphs are the nvim-web-devicons set (extracted from
 * nvim-material-icon); tool/message glyphs are the Font Awesome range.
 * All glyphs verified present in Maple Mono NF; any Nerd Font works.
 * Requires a Nerd Font — disable with `icons: false` otherwise.
 */

// ── File types (extension, lowercase) ───────────────────────────────────
export const FILE_EXT_ICONS: Record<string, string> = {
	"7z": "\u{f05c4}",
	"bash": "\u{ebca}",
	"bat": "\u{f018d}",
	"bmp": "\u{f021f}",
	"bz2": "\u{f05c4}",
	"c": "\u{e649}",
	"cc": "\u{e646}",
	"cfg": "\u{f013}",
	"clj": "\u{e642}",
	"cljs": "\u{e642}",
	"cmd": "\u{ebc4}",
	"conf": "\u{f013}",
	"cpp": "\u{e646}",
	"cs": "\u{f031b}",
	"css": "\u{e749}",
	"csv": "\u{f021b}",
	"cxx": "\u{e646}",
	"dart": "\u{e64c}",
	"diff": "\u{f4d2}",
	"erl": "\u{f23f}",
	"ex": "\u{e62d}",
	"exs": "\u{e62d}",
	"fish": "\u{f023a}",
	"fs": "\u{e7a7}",
	"fsx": "\u{e7a7}",
	"gif": "\u{f021f}",
	"go": "\u{f07d3}",
	"gql": "\u{f0877}",
	"graphql": "\u{f0877}",
	"gz": "\u{f05c4}",
	"h": "\u{f0829}",
	"hh": "\u{f0fd}",
	"hpp": "\u{f0fd}",
	"hs": "\u{e61f}",
	"htm": "\u{f13b}",
	"html": "\u{f13b}",
	"ico": "\u{f021f}",
	"ini": "\u{f013}",
	"ipynb": "\u{f082e}",
	"java": "\u{f0f4}",
	"jl": "\u{e624}",
	"jpeg": "\u{f021f}",
	"jpg": "\u{f021f}",
	"js": "\u{f031e}",
	"json": "\u{e60b}",
	"json5": "\u{e60b}",
	"jsonc": "\u{e60b}",
	"jsx": "\u{ed46}",
	"kt": "\u{e634}",
	"kts": "\u{e634}",
	"less": "\u{ed48}",
	"lisp": "\u{e6b0}",
	"lock": "\u{f023}",
	"log": "\u{f0f6}",
	"lua": "\u{e620}",
	"markdown": "\u{eb1d}",
	"md": "\u{eb1d}",
	"mdx": "\u{eb1d}",
	"mjs": "\u{f031e}",
	"ml": "\u{e67a}",
	"mli": "\u{e67a}",
	"mov": "\u{f0381}",
	"mp3": "\u{f0386}",
	"mp4": "\u{f0381}",
	"nix": "\u{f313}",
	"pdf": "\u{f1c1}",
	"php": "\u{f031f}",
	"png": "\u{f021f}",
	"prisma": "\u{e684}",
	"properties": "\u{f013}",
	"ps1": "\u{f0a0a}",
	"py": "\u{ed1b}",
	"r": "\u{e68a}",
	"rar": "\u{f05c4}",
	"rb": "\u{f0d2d}",
	"rs": "\u{e68b}",
	"sass": "\u{e603}",
	"scala": "\u{e68e}",
	"scss": "\u{e603}",
	"sh": "\u{f018d}",
	"sol": "\u{e656}",
	"sql": "\u{f1c0}",
	"svelte": "\u{e697}",
	"svg": "\u{f0721}",
	"swift": "\u{f06e5}",
	"tar": "\u{f05c4}",
	"tf": "\u{e69a}",
	"tfvars": "\u{e69a}",
	"toml": "\u{e6b2}",
	"ts": "\u{f06e6}",
	"tsv": "\u{f021b}",
	"tsx": "\u{ed46}",
	"txt": "\u{f0219}",
	"vim": "\u{e62b}",
	"vue": "\u{e6a0}",
	"wasm": "\u{e6a1}",
	"wav": "\u{f0386}",
	"webm": "\u{f0381}",
	"webp": "\u{f021f}",
	"xml": "\u{f022e}",
	"xz": "\u{f05c4}",
	"yaml": "\u{f0219}",
	"yml": "\u{f0219}",
	"zig": "\u{e6a9}",
	"zip": "\u{f05c4}",
	"zsh": "\u{f018d}",
};

// Extension aliases → a glyph from the map above
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
export const FILE_NAME_ICONS: Record<string, string> = {
	".editorconfig": "\u{e652}",
	".env": "\u{f066a}",
	".gitattributes": "\u{f02a2}",
	".gitignore": "\u{f02a2}",
	".npmrc": "\u{ed0e}",
	".nvmrc": "\u{ed0d}",
	"cargo.toml": "\u{e6b2}",
	"changelog.md": "\u{f1038}",
	"docker-compose.yaml": "\u{f21f}",
	"docker-compose.yml": "\u{f21f}",
	"dockerfile": "\u{f21f}",
	"gemfile": "\u{eb48}",
	"go.mod": "\u{f07d3}",
	"go.sum": "\u{f07d3}",
	"jsconfig.json": "\u{e60c}",
	"license": "\u{f0124}",
	"license.md": "\u{f0124}",
	"makefile": "\u{eba2}",
	"package-lock.json": "\u{ed0d}",
	"package.json": "\u{ed0d}",
	"pom.xml": "\u{e82c}",
	"procfile": "\u{e607}",
	"readme.md": "\u{f05a}",
	"tsconfig.json": "\u{e628}",
	"yarn.lock": "\u{e6a7}",
};

export const DEFAULT_FILE_ICON = "\u{f016}"; // fa-file-o
export const FOLDER_ICON = "\u{f07b}"; // fa-folder

/** Icon for a file path: exact basename first, then extension, then generic. */
export function fileIcon(path: string): string {
	const base = (path.split("/").pop() ?? "").toLowerCase();
	const byName = FILE_NAME_ICONS[base];
	if (byName) return byName;
	const ext = base.includes(".") ? (base.split(".").pop() ?? "") : "";
	const key = FILE_EXT_ALIASES[ext] ?? ext;
	return FILE_EXT_ICONS[key] ?? DEFAULT_FILE_ICON;
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

