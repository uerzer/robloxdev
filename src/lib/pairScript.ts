/**
 * Generates pair.sh — the one-liner that bridges StudioMCP (stdio) → SSE → cloudflare tunnel.
 * Run this on the Mac where Roblox Studio is open.
 */

export interface PairOptions {
  port: number;
  studioMcpPath: string;
  useBrew: boolean;
}

export const DEFAULT_OPTIONS: PairOptions = {
  port: 8765,
  studioMcpPath: "/Applications/RobloxStudio.app/Contents/MacOS/StudioMCP",
  useBrew: true,
};

export function generatePairScript(opts: PairOptions = DEFAULT_OPTIONS): string {
  return `#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  pair.sh  —  Bridge Roblox Studio MCP → public tunnel
#  Run on the Mac where Roblox Studio is running.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

PORT=${opts.port}
STUDIO_MCP="${opts.studioMcpPath}"
LOG="/tmp/mcp-tunnel.log"

# ── 0. sanity ───────────────────────────────────────────────
if [ ! -x "$STUDIO_MCP" ]; then
  echo "✗ StudioMCP not found at $STUDIO_MCP"
  echo "  Is Roblox Studio installed? Update to the latest version."
  exit 1
fi

cleanup() {
  echo ""
  echo "→ shutting down…"
  [ -n "\${BRIDGE_PID:-}" ] && kill "$BRIDGE_PID" 2>/dev/null || true
  [ -n "\${TUNNEL_PID:-}" ] && kill "$TUNNEL_PID" 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

# ── 1. install supergateway (stdio → SSE bridge) ────────────
if ! command -v supergateway &>/dev/null; then
  echo "→ installing supergateway (stdio→SSE bridge)…"
  if command -v npm &>/dev/null; then
    npm install -g supergateway
  else
    echo "✗ npm not found. Install Node.js first: https://nodejs.org"
    exit 1
  fi
fi

# ── 2. install cloudflared ──────────────────────────────────
if ! command -v cloudflared &>/dev/null; then
  echo "→ installing cloudflared…"
${opts.useBrew ? `  if command -v brew &>/dev/null; then
    brew install cloudflared
  else
    echo "  (no brew — downloading binary)"
    curl -fsSL -o /usr/local/bin/cloudflared \\
      https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz
    chmod +x /usr/local/bin/cloudflared
  fi` : `  echo "  downloading binary…"
  curl -fsSL -o /tmp/cloudflared.tgz \\
    https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz
  tar -xzf /tmp/cloudflared.tgz -C /tmp
  sudo mv /tmp/cloudflared /usr/local/bin/
  sudo chmod +x /usr/local/bin/cloudflared`}
fi

# ── 3. start the MCP SSE bridge ─────────────────────────────
echo "→ starting supergateway on port $PORT…"
supergateway \\
  --stdio "$STUDIO_MCP" \\
  --port $PORT \\
  --corsAllowOrigin '*' \\
  --baseUrl "http://localhost:$PORT" \\
  > /tmp/mcp-bridge.log 2>&1 &
BRIDGE_PID=$!

# wait for bridge to be ready
for i in $(seq 1 20); do
  if curl -sf "http://localhost:$PORT/sse" -o /dev/null 2>/dev/null; then
    break
  fi
  sleep 0.5
done

# ── 4. open cloudflare tunnel ───────────────────────────────
echo "→ opening cloudflare tunnel…"
rm -f "$LOG"
cloudflared tunnel --url "http://localhost:$PORT" > "$LOG" 2>&1 &
TUNNEL_PID=$!

# ── 5. extract the tunnel URL ───────────────────────────────
echo "→ waiting for tunnel URL…"
TUNNEL_URL=""
for i in $(seq 1 30); do
  TUNNEL_URL=$(grep -oE 'https://[a-z0-9-]+\\.trycloudflare\\.com' "$LOG" 2>/dev/null | head -1 || true)
  if [ -n "$TUNNEL_URL" ]; then break; fi
  sleep 1
done

echo ""
echo "═══════════════════════════════════════════════════════"
if [ -n "$TUNNEL_URL" ]; then
  echo "  ✓  TUNNEL LIVE"
  echo ""
  echo "  $TUNNEL_URL"
  echo ""
  echo "  Paste this URL into the web app to connect."
else
  echo "  ⚠  Tunnel URL not detected — check $LOG"
  echo "  The tunnel may still be starting."
fi
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  bridge pid: $BRIDGE_PID"
echo "  tunnel pid: $TUNNEL_PID"
echo "  press Ctrl+C to stop"
echo ""

wait
`;
}
