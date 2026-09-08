import { useCallback, useEffect, useRef, useState } from "react";
import { MCPClient, type ConnectionState, type MCPTool, type MCPResult } from "./lib/mcp";
import { generatePairScript, DEFAULT_OPTIONS, type PairOptions } from "./lib/pairScript";
import { buildProjectZip } from "./lib/project";

/* ─── helpers ─── */

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── icons ─── */

const Ic = {
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  ),
  Play: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  Stop: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  ),
  Copy: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  Link: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  ),
  Terminal: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M4 17l6-6-6-6M12 19h8" />
    </svg>
  ),
  Zap: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
};

/* ─── log entry ─── */

interface LogEntry {
  id: number;
  msg: string;
  kind: "info" | "ok" | "err" | "cmd";
  time: string;
}

/* ─── main app ─── */

export default function App() {
  const [step, setStep] = useState(0);
  const [pairOpts, setPairOpts] = useState<PairOptions>(DEFAULT_OPTIONS);
  const [tunnelUrl, setTunnelUrl] = useState("");
  const [connState, setConnState] = useState<ConnectionState>("idle");
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [toolArgs, setToolArgs] = useState<Record<string, string>>({});
  const [toolResult, setToolResult] = useState<MCPResult | null>(null);
  const [toolLoading, setToolLoading] = useState(false);

  const clientRef = useRef<MCPClient | null>(null);
  const logIdRef = useRef(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string, kind: LogEntry["kind"] = "info") => {
    const id = ++logIdRef.current;
    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    setLogs((prev) => [...prev.slice(-200), { id, msg, kind, time }]);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  /* ─── download project ─── */

  const downloadProject = async () => {
    const blob = await buildProjectZip();
    downloadBlob(blob, "my-experience.zip");
    addLog("downloaded my-experience.zip", "ok");
    setStep(1);
  };

  /* ─── download pair.sh ─── */

  const downloadPairScript = () => {
    const content = generatePairScript(pairOpts);
    const blob = new Blob([content], { type: "text/x-shellscript" });
    downloadBlob(blob, "pair.sh");
    addLog("downloaded pair.sh", "ok");
    setStep(2);
  };

  /* ─── connect to tunnel ─── */

  const connect = async () => {
    if (!tunnelUrl.trim()) return;
    const url = tunnelUrl.trim().replace(/\/$/, "");
    setTunnelUrl(url);
    addLog(`connecting to ${url}`, "cmd");

    const client = new MCPClient(url);
    clientRef.current = client;

    client.setCallbacks({
      onStateChange: (s) => {
        setConnState(s);
        if (s === "connected") {
          setStep(3);
          addLog("✓ connection established", "ok");
        }
      },
      onToolsChange: (t) => {
        setTools(t);
        addLog(`${t.length} tools loaded`, "ok");
      },
      onLog: addLog,
    });

    try {
      await client.connect();
    } catch (e) {
      addLog(`connection failed: ${(e as Error).message}`, "err");
    }
  };

  const disconnect = () => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    setConnState("idle");
    setTools([]);
    addLog("disconnected", "info");
  };

  /* ─── call tool ─── */

  const callTool = async () => {
    if (!selectedTool || !clientRef.current) return;
    setToolLoading(true);
    setToolResult(null);

    // Parse args
    const args: Record<string, any> = {};
    for (const [key, val] of Object.entries(toolArgs)) {
      if (val.trim()) {
        // Try to parse as JSON, fallback to string
        try {
          args[key] = JSON.parse(val);
        } catch {
          args[key] = val;
        }
      }
    }

    try {
      const result = await clientRef.current.callTool(selectedTool.name, args);
      setToolResult(result);
      addLog(`← ${selectedTool.name} returned`, "ok");
    } catch (e) {
      setToolResult({ isError: true, error: { message: (e as Error).message } });
      addLog(`← ${selectedTool.name} error: ${(e as Error).message}`, "err");
    } finally {
      setToolLoading(false);
    }
  };

  /* ─── quick actions ─── */

  const quickAction = async (name: string, args: Record<string, any>) => {
    if (!clientRef.current) return;
    addLog(`quick action: ${name}`, "cmd");
    try {
      const result = await clientRef.current.callTool(name, args);
      addLog(`✓ ${name} done`, "ok");
      if (result.content?.[0]?.text) {
        addLog(result.content[0].text.slice(0, 200), "info");
      }
    } catch (e) {
      addLog(`✗ ${name} failed: ${(e as Error).message}`, "err");
    }
  };

  /* ─── render ─── */

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* bg layers */}
      <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="fixed inset-0 noise opacity-40 pointer-events-none" />
      <div className="fixed inset-0 scan-line pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-coral/40 bg-coral/10">
              <Ic.Zap />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Roblox Studio MCP Bridge
              </h1>
              <p className="font-mono text-[11px] tracking-wider text-dim uppercase">
                remote control via cloudflare tunnel
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-mut">
            Set up a tunnel from this workspace to your local Mac so an AI agent can drive Roblox Studio.
            Download the project, run <code className="rounded bg-panel-2 px-1.5 py-0.5 text-cy">pair.sh</code>, paste the tunnel URL, and you're live.
          </p>
        </header>

        {/* architecture diagram */}
        <div className="mb-12 rounded-xl border border-line bg-panel/60 p-6">
          <div className="mb-4 font-mono text-[10.5px] tracking-[0.2em] text-dim uppercase">
            architecture
          </div>
          <div className="flex items-center justify-between gap-4 overflow-x-auto">
            {[
              { label: "This browser", sub: "MCP client", color: "cy" },
              { label: "Cloudflare tunnel", sub: "SSE over HTTPS", color: "violet" },
              { label: "Your Mac", sub: "supergateway", color: "amb" },
              { label: "StudioMCP", sub: "stdio binary", color: "coral" },
              { label: "Roblox Studio", sub: "live session", color: "ok" },
            ].map((node, i, arr) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-lg border-2 bg-bg-2",
                      node.color === "cy" && "border-cy/50 glow-cy",
                      node.color === "violet" && "border-violet/50",
                      node.color === "amb" && "border-amb/50",
                      node.color === "coral" && "border-coral/50 glow-coral",
                      node.color === "ok" && "border-ok/50 glow-ok"
                    )}
                  >
                    <span className={cn("font-mono text-xs font-bold", `text-${node.color}`)}>
                      {i + 1}
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="text-[12px] font-semibold text-ink">{node.label}</div>
                    <div className="font-mono text-[10px] text-dim">{node.sub}</div>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <svg className="h-6 w-12 text-dim" viewBox="0 0 48 24">
                    <path
                      d="M0 12h40M40 12l-6-6M40 12l-6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="animate-flow"
                      strokeDasharray="4 4"
                    />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* setup steps */}
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* left: steps */}
          <div className="space-y-6">
            {/* step 1: download project */}
            <div
              className={cn(
                "rounded-xl border p-6 transition-colors",
                step >= 0 ? "border-coral/40 bg-coral/[0.03]" : "border-line-soft bg-panel/50"
              )}
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-coral/40 bg-coral/10 font-display text-sm font-bold text-coral">
                  1
                </span>
                <h2 className="font-display text-lg font-bold">Download the Rojo project</h2>
              </div>
              <p className="mb-4 text-[13.5px] leading-relaxed text-mut">
                A minimal Roblox experience scaffold with server/client/shared structure. Extract it and open in Studio via Rojo.
              </p>
              <button
                onClick={downloadProject}
                className="flex items-center gap-2 rounded-lg border border-coral/40 bg-coral/10 px-4 py-2 font-mono text-[12px] font-semibold text-coral-soft transition-colors hover:bg-coral/15"
              >
                <Ic.Download />
                download my-experience.zip
              </button>
            </div>

            {/* step 2: pair.sh */}
            <div
              className={cn(
                "rounded-xl border p-6 transition-colors",
                step >= 1 ? "border-amb/40 bg-amb/[0.03]" : "border-line-soft bg-panel/50"
              )}
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amb/40 bg-amb/10 font-display text-sm font-bold text-amb">
                  2
                </span>
                <h2 className="font-display text-lg font-bold">Generate pair.sh</h2>
              </div>
              <p className="mb-4 text-[13.5px] leading-relaxed text-mut">
                This script bridges StudioMCP (stdio) → SSE → Cloudflare tunnel. Run it on your Mac where Roblox Studio is open.
              </p>

              {/* options */}
              <div className="mb-4 space-y-3">
                <div>
                  <label className="mb-1.5 block font-mono text-[10.5px] tracking-wider text-dim uppercase">
                    Port
                  </label>
                  <input
                    type="number"
                    value={pairOpts.port}
                    onChange={(e) => setPairOpts({ ...pairOpts, port: Number(e.target.value) })}
                    className="w-full rounded-lg border border-line bg-bg-2 px-3 py-2 font-mono text-[13px] text-ink focus:border-cy focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[10.5px] tracking-wider text-dim uppercase">
                    StudioMCP path
                  </label>
                  <input
                    type="text"
                    value={pairOpts.studioMcpPath}
                    onChange={(e) => setPairOpts({ ...pairOpts, studioMcpPath: e.target.value })}
                    className="w-full rounded-lg border border-line bg-bg-2 px-3 py-2 font-mono text-[13px] text-ink focus:border-cy focus:outline-none"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={pairOpts.useBrew}
                    onChange={(e) => setPairOpts({ ...pairOpts, useBrew: e.target.checked })}
                    className="h-4 w-4 rounded border-line bg-bg-2"
                  />
                  <span className="text-[13px] text-mut">Use Homebrew for cloudflared install</span>
                </label>
              </div>

              <button
                onClick={downloadPairScript}
                className="flex items-center gap-2 rounded-lg border border-amb/40 bg-amb/10 px-4 py-2 font-mono text-[12px] font-semibold text-amb transition-colors hover:bg-amb/15"
              >
                <Ic.Download />
                download pair.sh
              </button>

              <div className="mt-4 rounded-lg border border-line bg-bg-2/50 p-3">
                <div className="mb-2 font-mono text-[10.5px] tracking-wider text-dim uppercase">
                  run it
                </div>
                <code className="text-[12px] text-cy">
                  chmod +x pair.sh && ./pair.sh
                </code>
              </div>
            </div>

            {/* step 3: connect */}
            <div
              className={cn(
                "rounded-xl border p-6 transition-colors",
                step >= 2 ? "border-cy/40 bg-cy/[0.03]" : "border-line-soft bg-panel/50"
              )}
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cy/40 bg-cy/10 font-display text-sm font-bold text-cy">
                  3
                </span>
                <h2 className="font-display text-lg font-bold">Connect to the tunnel</h2>
              </div>
              <p className="mb-4 text-[13.5px] leading-relaxed text-mut">
                Once pair.sh is running, paste the tunnel URL it prints. The web app will connect as an MCP client.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://xxxx.trycloudflare.com"
                  value={tunnelUrl}
                  onChange={(e) => setTunnelUrl(e.target.value)}
                  disabled={connState === "connected"}
                  className="flex-1 rounded-lg border border-line bg-bg-2 px-3 py-2 font-mono text-[13px] text-ink placeholder:text-dim focus:border-cy focus:outline-none disabled:opacity-50"
                />
                {connState === "connected" ? (
                  <button
                    onClick={disconnect}
                    className="flex items-center gap-2 rounded-lg border border-coral/40 bg-coral/10 px-4 py-2 font-mono text-[12px] font-semibold text-coral-soft transition-colors hover:bg-coral/15"
                  >
                    <Ic.X />
                    disconnect
                  </button>
                ) : (
                  <button
                    onClick={connect}
                    disabled={!tunnelUrl.trim() || connState === "connecting"}
                    className="flex items-center gap-2 rounded-lg border border-cy/40 bg-cy/10 px-4 py-2 font-mono text-[12px] font-semibold text-cy transition-colors hover:bg-cy/15 disabled:opacity-50"
                  >
                    {connState === "connecting" ? (
                      <>
                        <div className="h-4 w-4 animate-spin-slow rounded-full border-2 border-cy border-t-transparent" />
                        connecting…
                      </>
                    ) : (
                      <>
                        <Ic.Link />
                        connect
                      </>
                    )}
                  </button>
                )}
              </div>

              {connState === "connected" && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-ok/40 bg-ok/10 px-3 py-2">
                  <div className="h-2 w-2 animate-pulse-dot rounded-full bg-ok" />
                  <span className="font-mono text-[12px] text-ok">
                    connected — {tools.length} tools available
                  </span>
                </div>
              )}
            </div>

            {/* step 4: MCP client */}
            {connState === "connected" && (
              <div className="rounded-xl border border-ok/40 bg-ok/[0.03] p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-ok/40 bg-ok/10 font-display text-sm font-bold text-ok">
                    4
                  </span>
                  <h2 className="font-display text-lg font-bold">Drive Roblox Studio</h2>
                </div>

                {/* quick actions */}
                <div className="mb-6">
                  <div className="mb-3 font-mono text-[10.5px] tracking-wider text-dim uppercase">
                    quick actions
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "List studios", action: () => quickAction("list_roblox_studios", {}) },
                      { label: "Get state", action: () => quickAction("get_studio_state", {}) },
                      { label: "Start play", action: () => quickAction("start_stop_play", { action: "start" }) },
                      { label: "Stop play", action: () => quickAction("start_stop_play", { action: "stop" }) },
                      { label: "Screenshot", action: () => quickAction("screen_capture", {}) },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        onClick={btn.action}
                        className="rounded-lg border border-line bg-panel-2 px-3 py-1.5 font-mono text-[11px] text-mut transition-colors hover:border-cy/40 hover:text-cy"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* tool selector */}
                <div className="mb-4">
                  <label className="mb-1.5 block font-mono text-[10.5px] tracking-wider text-dim uppercase">
                    select tool
                  </label>
                  <select
                    value={selectedTool?.name ?? ""}
                    onChange={(e) => {
                      const tool = tools.find((t) => t.name === e.target.value);
                      setSelectedTool(tool ?? null);
                      setToolArgs({});
                      setToolResult(null);
                    }}
                    className="w-full rounded-lg border border-line bg-bg-2 px-3 py-2 font-mono text-[13px] text-ink focus:border-cy focus:outline-none"
                  >
                    <option value="">— choose a tool —</option>
                    {tools.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* tool args */}
                {selectedTool && (
                  <div className="mb-4 space-y-3">
                    {Object.entries(selectedTool.inputSchema.properties ?? {}).map(([key, schema]) => (
                      <div key={key}>
                        <label className="mb-1.5 flex items-center gap-2 font-mono text-[10.5px] tracking-wider text-dim uppercase">
                          {key}
                          {selectedTool.inputSchema.required?.includes(key) && (
                            <span className="text-coral">*</span>
                          )}
                        </label>
                        <input
                          type="text"
                          placeholder={schema.description ?? schema.type ?? ""}
                          value={toolArgs[key] ?? ""}
                          onChange={(e) => setToolArgs({ ...toolArgs, [key]: e.target.value })}
                          className="w-full rounded-lg border border-line bg-bg-2 px-3 py-2 font-mono text-[13px] text-ink placeholder:text-dim focus:border-cy focus:outline-none"
                        />
                      </div>
                    ))}
                    <button
                      onClick={callTool}
                      disabled={toolLoading}
                      className="flex items-center gap-2 rounded-lg border border-ok/40 bg-ok/10 px-4 py-2 font-mono text-[12px] font-semibold text-ok transition-colors hover:bg-ok/15 disabled:opacity-50"
                    >
                      {toolLoading ? (
                        <>
                          <div className="h-4 w-4 animate-spin-slow rounded-full border-2 border-ok border-t-transparent" />
                          calling…
                        </>
                      ) : (
                        <>
                          <Ic.Play />
                          call {selectedTool.name}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* result */}
                {toolResult && (
                  <div
                    className={cn(
                      "rounded-lg border p-4",
                      toolResult.isError ? "border-coral/40 bg-coral/[0.03]" : "border-ok/40 bg-ok/[0.03]"
                    )}
                  >
                    <div className="mb-2 font-mono text-[10.5px] tracking-wider text-dim uppercase">
                      result
                    </div>
                    <pre className="overflow-x-auto font-mono text-[12px] text-ink">
                      {JSON.stringify(toolResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* right: log */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <div className="rounded-xl border border-line bg-panel/60 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Ic.Terminal />
                <span className="font-mono text-[11px] tracking-wider text-dim uppercase">
                  live log
                </span>
              </div>
              <div className="h-[500px] overflow-y-auto rounded-lg border border-line bg-bg-2/50 p-3">
                {logs.length === 0 ? (
                  <div className="flex h-full items-center justify-center font-mono text-[11px] text-dim">
                    waiting for events…
                  </div>
                ) : (
                  <div className="space-y-1">
                    {logs.map((log) => (
                      <div key={log.id} className="flex gap-2 font-mono text-[11px]">
                        <span className="shrink-0 text-dim">{log.time}</span>
                        <span
                          className={cn(
                            "shrink-0",
                            log.kind === "ok" && "text-ok",
                            log.kind === "err" && "text-coral",
                            log.kind === "cmd" && "text-cy",
                            log.kind === "info" && "text-mut"
                          )}
                        >
                          {log.kind === "ok" && "✓"}
                          {log.kind === "err" && "✗"}
                          {log.kind === "cmd" && "→"}
                          {log.kind === "info" && "·"}
                        </span>
                        <span className="break-all text-ink/85">{log.msg}</span>
                      </div>
                    ))}
                    <div ref={logEndRef} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* footer */}
        <footer className="mt-16 border-t border-line pt-6 text-center font-mono text-[11px] text-dim">
          <p>
            Built for driving Roblox Studio remotely via MCP + Cloudflare tunnel
          </p>
          <p className="mt-1">
            StudioMCP binary · supergateway · cloudflared · SSE transport
          </p>
        </footer>
      </div>
    </div>
  );
}
