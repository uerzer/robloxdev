import JSZip from "jszip";

/**
 * Minimal Rojo project scaffold for a Roblox experience.
 * Generates a downloadable .zip with:
 *   - default.project.json (Rojo config)
 *   - src/server/… (ServerScriptService scripts)
 *   - src/client/… (StarterPlayerScripts)
 *   - src/shared/… (ReplicatedStorage shared modules)
 *   - src/workspace/… (Workspace models)
 *   - README.md
 */

const FILES: Record<string, string> = {
  "default.project.json": JSON.stringify(
    {
      name: "my-experience",
      tree: {
        $className: "DataModel",
        ServerScriptService: { $path: "src/server/ServerScriptService" },
        StarterPlayer: {
          StarterPlayerScripts: {
            $path: "src/client/StarterPlayer/StarterPlayerScripts",
          },
        },
        ReplicatedStorage: {
          Shared: { $path: "src/shared/ReplicatedStorage/Shared" },
        },
        Workspace: { $path: "src/workspace/Workspace" },
      },
    },
    null,
    2
  ),

  "src/server/ServerScriptService/GameManager.server.luau": `--!strict
-- GameManager.server.luau
-- Runs on the server. Manages game state, spawns, etc.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = require(ReplicatedStorage.Shared.Constants)

print(` + "`[Server] ${Shared.GAME_NAME} loaded — v{Shared.VERSION}`" + `)

Players.PlayerAdded:Connect(function(player)
\tprint(` + "`[Server] {player.Name} joined`" + `)
end)

Players.PlayerRemoving:Connect(function(player)
\tprint(` + "`[Server] {player.Name} left`" + `)
end)
`,

  "src/client/StarterPlayer/StarterPlayerScripts/ClientApp.client.luau": `--!strict
-- ClientApp.client.luau
-- Runs on the client. UI, input, camera, etc.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local Shared = require(ReplicatedStorage.Shared.Constants)

print(` + "`[Client] {Shared.GAME_NAME} — welcome, {player.Name}`" + `)
`,

  "src/shared/ReplicatedStorage/Shared/Constants.luau": `--!strict
-- Shared constants used by both server and client.

local Constants = {}

Constants.GAME_NAME = "My Experience"
Constants.VERSION = "0.1.0"
Constants.MAX_PLAYERS = 20

return Constants
`,

  "src/workspace/Workspace/.gitkeep": "",

  "README.md": `# My Experience

A Roblox experience built with [Rojo](https://rojo.space/) + Luau.

## Quick start

\\\`\\\`\\\`bash
# Install Rojo (if you haven't)
cargo install rojo
# or: brew install rojo

# Sync to Studio
rojo serve

# Then in Roblox Studio → Rojo plugin → Connect
\\\`\\\`\\\`

## Structure

\\\`\\\`\\\`
├── default.project.json    ← Rojo config
├── src/
│   ├── server/             ← ServerScriptService
│   ├── client/             ← StarterPlayerScripts
│   ├── shared/             ← ReplicatedStorage (shared modules)
│   └── workspace/          ← Workspace models
\\\`\\\`\\\`

## MCP integration

This project is designed to be driven by an AI agent via the
Roblox Studio MCP server. Once paired, the agent can:

- Read/write scripts
- Execute Luau code
- Insert assets
- Start/stop playtesting
- Navigate the character
- Capture screenshots

See the web app for the tunnel setup.
`,
};

export async function buildProjectZip(): Promise<Blob> {
  const zip = new JSZip();
  const root = zip.folder("my-experience")!;

  for (const [path, content] of Object.entries(FILES)) {
    root.file(path, content);
  }

  return root.generateAsync({ type: "blob", compression: "DEFLATE" });
}
