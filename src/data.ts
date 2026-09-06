/* All facts sourced from create.roblox.com/docs/studio/mcp and
   github.com/Roblox/studio-rust-mcp-server (official, Nov 2025+). */

export const STUDIO_MCP_BIN = "/Applications/RobloxStudio.app/Contents/MacOS/StudioMCP";

export const QUICK_CONNECT_CLIENTS = [
  "Claude Code",
  "Claude Desktop",
  "Cursor",
  "Visual Studio Code",
  "Gemini CLI",
  "Codex CLI",
  "Antigravity",
];

/* ---------------- terminal boot script ---------------- */

export interface BootLine {
  text: string;
  tone: "cmd" | "sys" | "ok" | "tool" | "live";
  phase: number; // chips lit after this line renders (0..3)
}

export const BOOT_LINES: BootLine[] = [
  { text: `$ ${STUDIO_MCP_BIN}`, tone: "cmd", phase: 1 },
  { text: '[stdio] initialize ✓ — protocol v2025-03-26', tone: "sys", phase: 2 },
  { text: '[client] "claude-code" attached (pid 48211)', tone: "sys", phase: 2 },
  { text: '[ipc] studio session found → "ObbyRemake.rbxl" · id 7F3A', tone: "ok", phase: 3 },
  { text: "[tools] 26 registered · script_read · execute_luau · screen_capture …", tone: "tool", phase: 3 },
  { text: "[ready] link green — all actions target your open Studio", tone: "ok", phase: 3 },
];

export const CHIP_LABELS = ["MCP CLIENT", "STUDIO MCP", "STUDIO SESSION"];

/* ---------------- architecture nodes ---------------- */

export interface ArchNode {
  id: string;
  title: string;
  sub: string;
  role: string;
  lives: string;
  accent: "cy" | "coral" | "amb" | "ok";
}

export const ARCH_NODES: ArchNode[] = [
  {
    id: "client",
    title: "AI CLIENT",
    sub: "your agent",
    role: "Claude Code, Claude Desktop, Cursor, VS Code, Gemini CLI… The client spawns the server as a child process and speaks MCP over stdin/stdout. Every action starts here.",
    lives: "your terminal / editor",
    accent: "cy",
  },
  {
    id: "binary",
    title: "STUDIOMCP",
    sub: "local binary",
    role: "Ships inside RobloxStudio.app itself — no npm, no pip, no plugin to install. One signed binary bridges the protocol to your running Studio and exposes 26 tools.",
    lives: STUDIO_MCP_BIN,
    accent: "coral",
  },
  {
    id: "studio",
    title: "STUDIO SESSION",
    sub: "open window(s)",
    role: "The running Roblox Studio window. Enable it once under Assistant ▸ Manage MCP Servers. Several windows can connect at once — each tool call targets one via studio_id.",
    lives: "Assistant ▸ ⋯ ▸ Manage MCP Servers",
    accent: "amb",
  },
  {
    id: "datamodel",
    title: "DATAMODEL",
    sub: "your place",
    role: "The Explorer tree, Luau runtime, Creator Store, viewport and playtest harness. Everything the tools read, generate, edit and execute happens right here — locally.",
    lives: "game.* — Workspace, ServerScriptService, …",
    accent: "ok",
  },
];

/* ---------------- setup steps ---------------- */

export type Block =
  | { type: "p"; text: string }
  | { type: "code"; code: string; label: string }
  | { type: "ui"; steps: string[] }
  | { type: "callout"; tone: "info" | "warn" | "ok"; text: string }
  | { type: "list"; items: string[] };

export interface Step {
  id: string;
  kicker: string;
  title: string;
  blocks: Block[];
}

export const STEPS: Step[] = [
  {
    id: "studio",
    kicker: "the only dependency",
    title: "Get current Roblox Studio",
    blocks: [
      {
        type: "p",
        text: "The MCP server is built into Studio itself — there is nothing to install separately. You just need a recent build on this Mac. Confirm the server binary exists inside the app bundle:",
      },
      {
        type: "code",
        label: "terminal",
        code: `test -x "${STUDIO_MCP_BIN}" \\\n  && echo "✓ StudioMCP binary found" \\\n  || echo "✗ missing — update Studio from roblox.com/create"`,
      },
      {
        type: "callout",
        tone: "info",
        text: "If it is missing or Studio is older than the MCP rollout, download the latest Studio from create.roblox.com — the updater in the Roblox app also works. Works natively on Apple Silicon; no Rosetta needed.",
      },
    ],
  },
  {
    id: "enable",
    kicker: "inside studio",
    title: "Switch the server on",
    blocks: [
      {
        type: "p",
        text: "The server sits dormant until you opt in. It is a Studio setting, not a plugin — three clicks and the binary is ready to be launched by any MCP client:",
      },
      {
        type: "ui",
        steps: [
          "Open Roblox Studio (any place, even a blank Baseplate).",
          "Open the Assistant panel — View ▸ Assistant, or the spark icon on the Home tab.",
          "Click ⋯ in the Assistant header, then Manage MCP Servers.",
          "Turn on “Enable Studio as MCP server”.",
        ],
      },
      {
        type: "callout",
        tone: "ok",
        text: "The panel now shows Quick connect options and setup snippets for each client — Studio literally prints the config for your machine.",
      },
    ],
  },
  {
    id: "client",
    kicker: "pick your agent",
    title: "Connect an MCP client",
    blocks: [
      {
        type: "p",
        text: "Point one client at the binary. Quick connect (Assistant ▸ Manage MCP Servers) writes the config for you if your client is detected. Otherwise paste the config for your client from the tabs below, then fully restart that client.",
      },
      {
        type: "callout",
        tone: "warn",
        text: "MCP clients can read and modify whatever place you have open — including running Luau. Only connect clients you trust.",
      },
    ],
  },
  {
    id: "verify",
    kicker: "trust the green dot",
    title: "Verify the link",
    blocks: [
      {
        type: "p",
        text: "Two independent checks — one in Studio, one in your client:",
      },
      {
        type: "ui",
        steps: [
          "In Studio: Assistant ▸ ⋯ ▸ Manage MCP Servers. A green indicator with a connected-client count means the handshake succeeded.",
          "In Claude Code: run “claude mcp list” — Roblox_Studio should show ✓ Connected.",
          "Ask your agent: “List my open Roblox Studio sessions.” It should call list_roblox_studios and name your place.",
        ],
      },
      {
        type: "code",
        label: "claude code",
        code: `claude mcp list\n# Roblox_Studio  ${STUDIO_MCP_BIN}  ✓ Connected`,
      },
    ],
  },
  {
    id: "prompt",
    kicker: "first contact",
    title: "Send your first prompt",
    blocks: [
      {
        type: "p",
        text: "With a place open in Studio, try one of these. Watch Studio's Explorer and Output panels while the agent works — every tool call happens against your live session:",
      },
      {
        type: "list",
        items: [
          "“Use search_game_tree to find every Part named Checkpoint and list their positions.”",
          "“Read ServerScriptService.RoundManager with script_read, then add a 10-second intermission using multi_edit.”",
          "“Run execute_luau in Edit mode to print how many descendants Workspace has.”",
          "“Generate a low-poly palm tree with generate_procedural_model and place it at (0, 5, 0).”",
        ],
      },
      {
        type: "code",
        label: "what you should see",
        code: `⏵ tool  list_roblox_studios\n      → 1 session: "ObbyRemake" (studio_id 7F3A…)\n⏵ tool  execute_luau  [Edit]\n      → "317 descendants"\n✓ done in 2.1s — check Studio Output`,
      },
    ],
  },
];

/* ---------------- client configs ---------------- */

export interface ClientConfig {
  id: string;
  name: string;
  blurb: string;
  blocks: { label: string; code: string }[];
  note?: string;
}

export const CLIENTS: ClientConfig[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    blurb: "Registers the server project-wide or globally via the CLI. Supports Quick connect too.",
    blocks: [
      {
        label: "terminal",
        code: `claude mcp add Roblox_Studio -- "${STUDIO_MCP_BIN}"\n\n# confirm\nclaude mcp list`,
      },
    ],
    note: "Add --scope user to make it available in every project instead of just the current one.",
  },
  {
    id: "claude-desktop",
    name: "Claude Desktop",
    blurb: "Edit the desktop app config, then quit and relaunch Claude completely (check the menu bar).",
    blocks: [
      {
        label: "~/Library/Application Support/Claude/claude_desktop_config.json",
        code: `{\n  "mcpServers": {\n    "Roblox_Studio": {\n      "command": "${STUDIO_MCP_BIN}"\n    }\n  }\n}`,
      },
      {
        label: "open it quickly",
        code: `open -e "$HOME/Library/Application Support/Claude/claude_desktop_config.json"`,
      },
    ],
    note: "Keep valid JSON — a stray comma here silently kills every MCP server in the file.",
  },
  {
    id: "cursor",
    name: "Cursor",
    blurb: "Global MCP config, or use Cursor ▸ Settings ▸ MCP ▸ Add new global MCP server.",
    blocks: [
      {
        label: "~/.cursor/mcp.json",
        code: `{\n  "mcpServers": {\n    "Roblox_Studio": {\n      "command": "${STUDIO_MCP_BIN}"\n    }\n  }\n}`,
      },
      {
        label: "open it quickly",
        code: `mkdir -p ~/.cursor && open -e ~/.cursor/mcp.json`,
      },
    ],
  },
  {
    id: "vscode",
    name: "VS Code",
    blurb: "Per-workspace config; use the chat in Agent mode (Copilot) to talk to the server.",
    blocks: [
      {
        label: ".vscode/mcp.json (in your project)",
        code: `{\n  "servers": {\n    "Roblox_Studio": {\n      "type": "stdio",\n      "command": "${STUDIO_MCP_BIN}"\n    }\n  }\n}`,
      },
    ],
  },
  {
    id: "any",
    name: "Any stdio client",
    blurb: "Windsurf, Cline, Zed, Goose — anything that speaks MCP over stdio takes the standard shape:",
    blocks: [
      {
        label: "mcp config",
        code: `{\n  "mcpServers": {\n    "Roblox_Studio": {\n      "command": "${STUDIO_MCP_BIN}"\n    }\n  }\n}`,
      },
      {
        label: "or the raw CLI command",
        code: STUDIO_MCP_BIN,
      },
    ],
  },
];

/* ---------------- tools ---------------- */

export interface ToolDef {
  name: string;
  desc: string;
  cat: string;
}

export const TOOL_CATS = [
  { id: "scripts", label: "Scripts", color: "#4fd6e0" },
  { id: "assets", label: "Generation & Assets", color: "#ff5a4e" },
  { id: "model", label: "Data model", color: "#ffb454" },
  { id: "luau", label: "Luau", color: "#46d48f" },
  { id: "play", label: "Playtesting", color: "#9db2ff" },
  { id: "input", label: "Input simulation", color: "#c9e356" },
  { id: "docs", label: "Docs & skills", color: "#96a2bc" },
  { id: "session", label: "Session", color: "#e9eef8" },
] as const;

export const TOOLS: ToolDef[] = [
  { name: "script_read", desc: "Read a script by dot-path — whole file or a line range.", cat: "scripts" },
  { name: "multi_edit", desc: "Batch several edits into one op; creates the script if missing.", cat: "scripts" },
  { name: "script_search", desc: "Fuzzy-match script names across the game. Top 10 hits.", cat: "scripts" },
  { name: "script_grep", desc: "Pattern-search every script in the place. Top 50 matches.", cat: "scripts" },
  { name: "generate_mesh", desc: "Text prompt → textured 3D mesh, generated by Roblox AI.", cat: "assets" },
  { name: "generate_material", desc: "Create a custom material variant to apply to parts.", cat: "assets" },
  { name: "generate_procedural_model", desc: "Prompt-built models from primitives; supports reference images.", cat: "assets" },
  { name: "wait_job_finished", desc: "Block until a generation job resolves; returns final status.", cat: "assets" },
  { name: "search_asset", desc: "Search the Creator Store and your/group inventories with filters.", cat: "assets" },
  { name: "insert_asset", desc: "Insert any asset by numeric ID — models, meshes, audio, video…", cat: "assets" },
  { name: "upload_image", desc: "Batch-upload images from HTTP URLs; maps URLs to asset IDs.", cat: "assets" },
  { name: "store_image", desc: "Load a local image file into a URI other tools can consume.", cat: "assets" },
  { name: "search_game_tree", desc: "Flat JSON walk of the instance tree — filter by path, type, keyword.", cat: "model" },
  { name: "inspect_instance", desc: "Full property + attribute dump of one instance, with child summary.", cat: "model" },
  { name: "subagent", desc: "Spin up an explore or playtest subagent for multi-step jobs.", cat: "model" },
  { name: "execute_luau", desc: "Run Luau in Edit, Client or Server context. Returns result or error.", cat: "luau" },
  { name: "get_studio_state", desc: "Current play state and which datamodel contexts are available.", cat: "play" },
  { name: "start_stop_play", desc: "Start or stop a playtest from the agent.", cat: "play" },
  { name: "get_console_output", desc: "Pull lines from the Studio output log.", cat: "play" },
  { name: "screen_capture", desc: "Screenshot the viewport — optionally from a custom camera pose.", cat: "play" },
  { name: "character_navigation", desc: "Walk the player character to a position or instance path.", cat: "input" },
  { name: "user_keyboard_input", desc: "Sequenced key down/up/press, text input and waits.", cat: "input" },
  { name: "user_mouse_input", desc: "Move, click, scroll — at instances or screen coordinates.", cat: "input" },
  { name: "http_get", desc: "Fetch allowed Roblox docs (API reference, Creator docs) with search.", cat: "docs" },
  { name: "skill", desc: "Pull best-practice knowledge: debugging, device simulation, and more.", cat: "docs" },
  { name: "list_roblox_studios", desc: "Every connected Studio window with its name and studio_id.", cat: "session" },
];

/* ---------------- remote recipes ---------------- */

export const REMOTE_A: { label: string; code: string }[] = [
  {
    label: "from your other machine",
    code: `ssh -t you@your-mac "cd ~/my-roblox-place && claude"`,
  },
  {
    label: "or just attach VS Code",
    code: `# Remote-SSH extension → connect to your-mac → open the place folder\n# Claude Code runs on the Mac; stdio never leaves it`,
  },
];

export const REMOTE_B: { label: string; code: string }[] = [
  {
    label: "1 · bridge stdio → HTTP on the Mac",
    code: `npx -y supergateway \\\n  --stdio "${STUDIO_MCP_BIN}" \\\n  --port 8931`,
  },
  {
    label: "2 · open a quick tunnel (brew install cloudflared)",
    code: `cloudflared tunnel --url http://localhost:8931\n# → https://some-random-words.trycloudflare.com`,
  },
  {
    label: "3 · attach the remote client",
    code: `claude mcp add --transport sse roblox-remote \\\n  https://YOUR-TUNNEL.trycloudflare.com/sse`,
  },
];

/* ---------------- troubleshooting ---------------- */

export interface Fix {
  id: string;
  tag: "common" | "edge";
  symptom: string;
  cause: string;
  fix: string[];
  code?: string;
}

export const FIXES: Fix[] = [
  {
    id: "not-listed",
    tag: "common",
    symptom: "Roblox_Studio never appears in my client",
    cause: "Stale Studio build, wrong path, or invalid JSON killed the config.",
    fix: [
      "Update Roblox Studio to the latest build and restart it.",
      "Confirm the binary path exists and is executable.",
      "Validate your config JSON — one missing comma disables every server in the file.",
      "Fully quit the client (menu bar included) and relaunch.",
    ],
    code: `test -x "${STUDIO_MCP_BIN}" && echo OK\npython3 -m json.tool "$HOME/Library/Application Support/Claude/claude_desktop_config.json"`,
  },
  {
    id: "no-green",
    tag: "common",
    symptom: "No green indicator under Manage MCP Servers",
    cause: "The server was never enabled, or the client hasn't actually spawned it yet.",
    fix: [
      "Re-check “Enable Studio as MCP server” in Assistant ▸ ⋯ ▸ Manage MCP Servers.",
      "The indicator only lights once a client launches the binary — send any prompt first.",
      "Restart both Studio and the client; order doesn't matter, but both must be fresh.",
    ],
  },
  {
    id: "timeout",
    tag: "common",
    symptom: "Tools connect but every call times out",
    cause: "The binary launched, but no Studio session answered — or the wrong one did.",
    fix: [
      "Open a place in Studio; the server bridges to a running session only.",
      "Call list_roblox_studios and pass the right studio_id when several windows are open.",
      "If macOS Firewall is on, allow RobloxStudio: System Settings ▸ Network ▸ Firewall ▸ Options.",
    ],
  },
  {
    id: "gatekeeper",
    tag: "edge",
    symptom: "“StudioMCP cannot be opened” / quarantine errors",
    cause: "A side-loaded or re-downloaded app bundle picked up a quarantine flag.",
    fix: ["Strip the quarantine attribute from the app bundle, then restart Studio."],
    code: `xattr -dr com.apple.quarantine /Applications/RobloxStudio.app`,
  },
  {
    id: "permissions",
    tag: "common",
    symptom: "Agent asks for approval on every single tool call",
    cause: "Default client safety policy — expected for anything that writes to your place.",
    fix: [
      "Allowlist the read-only tools you use constantly (script_read, search_game_tree, inspect_instance) in your client's MCP permission settings.",
      "Leave execute_luau and multi_edit behind manual approval — they mutate your game.",
    ],
  },
  {
    id: "legacy-plugin",
    tag: "edge",
    symptom: "Using the old plugin server: “MCP Studio plugin is ready” never prints",
    cause: "studio-rust-mcp-server is deprecated — Roblox now recommends the built-in server.",
    fix: [
      "Migrate: remove the old plugin + config entry and follow the built-in setup above.",
      "If you must stay: toggle the MCP icon in the Plugins tab, restart Studio, and make sure nothing blocks the local long-poll port.",
    ],
  },
  {
    id: "json-multi",
    tag: "edge",
    symptom: "My other MCP servers broke after adding Roblox_Studio",
    cause: "The mcpServers dictionary needs comma-separated entries; duplication of keys is also fatal.",
    fix: [
      "Merge Roblox_Studio into the existing mcpServers object — don't add a second mcpServers key.",
      "Run the JSON lint below; fix whatever it reports, then restart the client.",
    ],
    code: `python3 -m json.tool ~/.cursor/mcp.json`,
  },
];

/* ---------------- faq ---------------- */

export const FAQS = [
  {
    q: "Does it cost anything?",
    a: "No. The server ships inside Roblox Studio. Some tools (generate_mesh, generate_material, generate_procedural_model) consume Roblox-side AI generation quota, and your AI client bills for its own tokens as usual.",
  },
  {
    q: "Is my place uploaded anywhere?",
    a: "The server runs fully local over stdio. But whatever a tool reads is handed to your AI client — meaning it reaches that client's model provider. Treat places under NDA accordingly, and only connect trusted clients.",
  },
  {
    q: "Can I run several Studio windows?",
    a: "Yes — that is what studio_id is for. Call list_roblox_studios, pick the id of the window you mean, and pass it with every subsequent tool call.",
  },
  {
    q: "Does it work during Team Create?",
    a: "The server talks to your local Studio session, including open Team Create sessions. Edits flow through Studio exactly as if you had made them, so uncommitted Team Create changes stay uncommitted until you publish.",
  },
  {
    q: "Why did Roblox deprecate the Rust plugin server?",
    a: "The built-in server removes the failure-prone moving parts — a separate binary, an HTTP long-poll bridge and a Studio plugin — and replaces them with one signed binary inside the app. The old repo stays online for existing workflows only.",
  },
];

export const OFFICIAL_LINKS = [
  { label: "Official docs — create.roblox.com/docs/studio/mcp", href: "https://create.roblox.com/docs/studio/mcp" },
  { label: "Legacy Rust server — github.com/Roblox/studio-rust-mcp-server", href: "https://github.com/Roblox/studio-rust-mcp-server" },
  { label: "Model Context Protocol — modelcontextprotocol.io", href: "https://modelcontextprotocol.io" },
];
