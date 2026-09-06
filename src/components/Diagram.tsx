import { useState } from "react";
import { ARCH_NODES, type ArchNode } from "../data";
import { cn, Reveal } from "./ui";

const ACCENT: Record<ArchNode["accent"], string> = {
  cy: "#4fd6e0",
  coral: "#ff5a4e",
  amb: "#ffb454",
  ok: "#46d48f",
};

const EDGE_LABELS = ["stdio", "local ipc", "read · write · run"];

const NODE_W = 192;
const NODE_H = 96;
const NODE_Y = 86;
const X = [16, 262, 508, 754];

export function Diagram() {
  const [activeId, setActiveId] = useState<string>("binary");
  const active = ARCH_NODES.find((n) => n.id === activeId) ?? ARCH_NODES[1];

  return (
    <div>
      <Reveal>
        <div className="overflow-x-auto rounded-xl border border-line-soft bg-panel/50 p-3 sm:p-5">
          <svg viewBox="0 0 962 268" className="h-auto w-full min-w-[760px]" role="img" aria-label="Data flow: AI client over stdio to StudioMCP binary, over local IPC to the Studio session and its data model">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0L10 5L0 10z" fill="#3b4a70" />
              </marker>
            </defs>

            {/* connectors */}
            {[0, 1, 2].map((i) => {
              const x1 = X[i] + NODE_W + 6;
              const x2 = X[i + 1] - 6;
              const y = NODE_Y + NODE_H / 2;
              const mid = (x1 + x2) / 2;
              return (
                <g key={i}>
                  <line x1={x1} y1={y} x2={x2} y2={y} stroke="#3b4a70" strokeWidth="1.4" className="flow-line" markerEnd="url(#arrow)" />
                  <circle r="3.2" fill={ACCENT[ARCH_NODES[i].accent]}>
                    <animateMotion dur={`${2.4 + i * 0.5}s`} repeatCount="indefinite" path={`M${x1},${y} L${x2},${y}`} />
                  </circle>
                  <text x={mid} y={y - 12} textAnchor="middle" fill="#5e6b88" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.12em" }}>
                    {EDGE_LABELS[i]}
                  </text>
                </g>
              );
            })}

            {/* nodes */}
            {ARCH_NODES.map((node, i) => {
              const isActive = node.id === activeId;
              const dim = !isActive;
              return (
                <g
                  key={node.id}
                  onClick={() => setActiveId(node.id)}
                  className="cursor-pointer transition-opacity duration-300"
                  opacity={dim ? 0.55 : 1}
                >
                  <rect
                    x={X[i]}
                    y={NODE_Y}
                    width={NODE_W}
                    height={NODE_H}
                    rx="10"
                    fill={isActive ? "#182238" : "#121a2c"}
                    stroke={isActive ? ACCENT[node.accent] : "#24304d"}
                    strokeWidth={isActive ? 1.6 : 1.2}
                  />
                  <rect x={X[i]} y={NODE_Y} width={NODE_W} height="3" rx="1.5" fill={ACCENT[node.accent]} opacity={isActive ? 0.9 : 0.45} />
                  <text x={X[i] + 16} y={NODE_Y + 38} fill={isActive ? ACCENT[node.accent] : "#e9eef8"} style={{ fontFamily: "Chakra Petch, sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: "0.04em" }}>
                    {node.title}
                  </text>
                  <text x={X[i] + 16} y={NODE_Y + 60} fill="#96a2bc" style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: 12 }}>
                    {node.sub}
                  </text>
                  <text x={X[i] + 16} y={NODE_Y + 80} fill="#5e6b88" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, letterSpacing: "0.08em" }}>
                    {isActive ? "● INSPECTING" : "○ CLICK TO INSPECT"}
                  </text>
                </g>
              );
            })}

            {/* floor labels */}
            <text x="16" y="40" fill="#5e6b88" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.2em" }}>
              SIGNAL PATH — ALL LOCAL, ALL ON THIS MAC
            </text>
            <text x="16" y="246" fill="#3d4a6b" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.12em" }}>
              deprecated legacy path: studio plugin ⇄ axum long-poll ⇄ separate binary (studio-rust-mcp-server)
            </text>
            <line x1="16" y1="228" x2="946" y2="228" stroke="#24304d" strokeWidth="1" strokeDasharray="2 6" opacity="0.7" />
          </svg>
        </div>
      </Reveal>

      {/* detail panel */}
      <Reveal delay={120}>
        <div key={active.id} className="fade-in mt-4 grid gap-4 rounded-xl border border-line-soft bg-panel/70 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full" style={{ background: ACCENT[active.accent] }} />
              <h3 className="font-display text-lg font-bold tracking-wide" style={{ color: ACCENT[active.accent] }}>
                {active.title}
              </h3>
              <span className="font-mono text-[10.5px] tracking-widest text-dim uppercase">/ {active.sub}</span>
            </div>
            <p className="max-w-2xl text-[14px] leading-relaxed text-mut">{active.role}</p>
          </div>
          <div className="sm:max-w-[280px]">
            <div className="mb-1.5 font-mono text-[10px] tracking-[0.2em] text-dim uppercase">where it lives</div>
            <code className="block break-all rounded-lg border border-line-soft bg-bg-deep/70 px-3 py-2.5 font-mono text-[11.5px] leading-relaxed text-cy">
              {active.lives}
            </code>
          </div>
        </div>
      </Reveal>

      {/* hop legend */}
      <Reveal delay={200}>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { k: "why stdio", v: "Zero-config spawning: the client launches the binary itself. No ports to manage, no firewall prompts, nothing listening on the network." },
            { k: "why it is safe-ish", v: "The channel never leaves loopback. The risk surface is your AI client — it can do anything the tools can, including execute_luau." },
            { k: "why studio_id", v: "Agents are stateless; the id makes multi-window workflows deterministic instead of “whichever Studio answered first”." },
          ].map((item) => (
            <div key={item.k} className="group rounded-lg border border-line-soft bg-panel/40 p-4 transition-colors duration-300 hover:border-line hover:bg-panel/70">
              <div className="mb-1.5 font-mono text-[10.5px] tracking-[0.18em] text-coral uppercase">{item.k}</div>
              <p className="text-[13px] leading-relaxed text-mut">{item.v}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
