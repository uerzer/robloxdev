import { useMemo, useState } from "react";
import { FAQS, FIXES, OFFICIAL_LINKS, REMOTE_A, REMOTE_B, TOOL_CATS, TOOLS } from "../data";
import { cn, CodeBlock, Ic, Reveal, Tag } from "./ui";

/* ================= toolbox ================= */

export function ToolsSection() {
  const [cat, setCat] = useState<string>("all");
  const shown = cat === "all" ? TOOLS : TOOLS.filter((t) => t.cat === cat);
  const colorOf = (id: string) => TOOL_CATS.find((c) => c.id === id)?.color ?? "#96a2bc";

  return (
    <div>
      <Reveal>
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setCat("all")}
            className={cn(
              "rounded-full border px-3.5 py-1.5 font-mono text-[11px] tracking-wider transition-all duration-200",
              cat === "all" ? "border-coral/60 bg-coral/10 text-coral-soft" : "border-line-soft text-mut hover:border-line hover:text-ink"
            )}
          >
            ALL · {TOOLS.length}
          </button>
          {TOOL_CATS.map((c) => {
            const n = TOOLS.filter((t) => t.cat === c.id).length;
            const active = cat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCat(active ? "all" : c.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[11px] tracking-wider transition-all duration-200",
                  active ? "border-coral/60 bg-coral/10 text-coral-soft" : "border-line-soft text-mut hover:border-line hover:text-ink"
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                {c.label.toUpperCase()} · {n}
              </button>
            );
          })}
        </div>
      </Reveal>

      <div key={cat} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((tool, i) => (
          <Reveal
            key={tool.name}
            delay={Math.min(i * 35, 280)}
            className="group rounded-lg border border-line-soft bg-panel/40 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-line hover:bg-panel/80"
          >
            <div className="mb-2 flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full transition-transform duration-300 group-hover:scale-125" style={{ background: colorOf(tool.cat) }} />
              <code className="font-mono text-[13px] font-semibold text-ink">{tool.name}</code>
            </div>
            <p className="text-[12.5px] leading-relaxed text-mut">{tool.desc}</p>
          </Reveal>
        ))}
      </div>

      <Reveal delay={100}>
        <p className="mt-6 flex items-start gap-2.5 text-[12.5px] leading-relaxed text-dim">
          <Ic.Signal className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cy" />
          Showing {shown.length} of {TOOLS.length} tools. Every call takes a studio_id so one agent can drive several Studio windows without cross-talk.
        </p>
      </Reveal>
    </div>
  );
}

/* ================= remote ================= */

function Recipe({
  tag,
  tagTone,
  title,
  blurb,
  blocks,
}: {
  tag: string;
  tagTone: "ok" | "amb";
  title: string;
  blurb: string;
  blocks: { label: string; code: string }[];
}) {
  return (
    <div className="flex flex-col rounded-xl border border-line-soft bg-panel/50 p-5 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-bold tracking-tight">{title}</h3>
        <Tag tone={tagTone}>{tag}</Tag>
      </div>
      <p className="mb-5 text-[13.5px] leading-relaxed text-mut">{blurb}</p>
      <div className="space-y-3.5">
        {blocks.map((b) => (
          <CodeBlock key={b.label} code={b.code} label={b.label} />
        ))}
      </div>
    </div>
  );
}

export function RemoteSection() {
  return (
    <div className="space-y-6">
      <Reveal>
        <div className="grid gap-6 lg:grid-cols-2">
          <Recipe
            tag="recommended"
            tagTone="ok"
            title="A · Move the agent, not the server"
            blurb="The stdio server must sit next to Studio. So run your client on the Mac — over SSH or VS Code Remote-SSH — and keep the whole chain on loopback. Nothing is exposed, nothing to secure."
            blocks={REMOTE_A}
          />
          <Recipe
            tag="advanced · risky"
            tagTone="amb"
            title="B · Bridge stdio → SSE, then tunnel"
            blurb="When the client genuinely can't run on the Mac: wrap the binary in an stdio-to-HTTP bridge, push it through a Cloudflare tunnel, and attach remotely over SSE."
            blocks={REMOTE_B}
          />
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="flex gap-4 rounded-xl border border-amb/35 bg-amb/[0.05] p-5">
          <Ic.Shield className="mt-0.5 h-5 w-5 shrink-0 text-amb" />
          <div>
            <div className="mb-1 font-mono text-[11px] tracking-[0.2em] text-amb uppercase">threat model, honestly</div>
            <p className="text-[13.5px] leading-relaxed text-mut">
              A tunnelled Roblox_Studio endpoint hands whoever holds the URL <span className="text-ink">execute_luau</span> and full write access to your open place — that is a remote shell into your game.
              Use a paid tunnel with <span className="text-ink">Cloudflare Access</span> or an auth proxy, rotate the URL after each session, and never leave it running overnight. Quick <code className="rounded bg-bg-deep px-1.5 py-0.5 font-mono text-[12px] text-cy">trycloudflare.com</code> URLs are guessable — treat them as one-shot.
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal delay={180}>
        <div className="overflow-x-auto rounded-xl border border-line-soft">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line-soft bg-panel-2/60 font-mono text-[10.5px] tracking-[0.18em] text-dim uppercase">
                <th className="px-5 py-3.5 font-medium">transport</th>
                <th className="px-5 py-3.5 font-medium">moving parts</th>
                <th className="px-5 py-3.5 font-medium">reach</th>
                <th className="px-5 py-3.5 font-medium">verdict</th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-mut">
              <tr className="border-b border-line-soft/70 transition-colors hover:bg-panel/50">
                <td className="px-5 py-3.5 font-mono text-[12px] text-ok">stdio · built-in</td>
                <td className="px-5 py-3.5">1 signed binary</td>
                <td className="px-5 py-3.5">this Mac</td>
                <td className="px-5 py-3.5 text-ink/85">use this — it is the product</td>
              </tr>
              <tr className="border-b border-line-soft/70 transition-colors hover:bg-panel/50">
                <td className="px-5 py-3.5 font-mono text-[12px] text-amb">SSE · bridged + tunnelled</td>
                <td className="px-5 py-3.5">supergateway + cloudflared</td>
                <td className="px-5 py-3.5">anywhere</td>
                <td className="px-5 py-3.5 text-ink/85">fine with real auth, fragile without</td>
              </tr>
              <tr className="transition-colors hover:bg-panel/50">
                <td className="px-5 py-3.5 font-mono text-[12px] text-dim">HTTP long-poll · legacy plugin</td>
                <td className="px-5 py-3.5">plugin + axum + binary</td>
                <td className="px-5 py-3.5">this Mac</td>
                <td className="px-5 py-3.5 text-ink/85">deprecated by Roblox — migrate off</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Reveal>
    </div>
  );
}

/* ================= troubleshooting ================= */

export function TroubleshootSection() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(FIXES[0].id);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FIXES;
    return FIXES.filter((f) =>
      [f.symptom, f.cause, f.fix.join(" "), f.code ?? ""].join(" ").toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-12">
      {/* search + stats rail */}
      <Reveal className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-xl border border-line-soft bg-panel/60 p-5">
          <div className="mb-4 font-mono text-[10.5px] tracking-[0.2em] text-dim uppercase">symptom lookup</div>
          <div className="relative">
            <Ic.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. green dot, timeout, json…"
              className="w-full rounded-lg border border-line-soft bg-bg-deep/70 py-2.5 pl-9 pr-3 font-mono text-[12.5px] text-ink placeholder:text-dim focus:border-coral/60 focus:outline-none focus:ring-2 focus:ring-coral/15"
            />
          </div>
          <div className="mt-5 space-y-2.5">
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-mut">known issues</span>
              <span className="font-mono text-ink">{FIXES.length}</span>
            </div>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-mut">matching</span>
              <span className={cn("font-mono", filtered.length === 0 ? "text-coral-soft" : "text-ok")}>{filtered.length}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-line-soft">
              <div
                className="h-full rounded-full bg-coral transition-all duration-500 ease-out"
                style={{ width: `${(filtered.length / FIXES.length) * 100}%` }}
              />
            </div>
          </div>
          <p className="mt-5 border-t border-line-soft pt-4 text-[12px] leading-relaxed text-dim">
            90% of Studio MCP failures on macOS are: stale Studio build, broken JSON, or Studio not running when the tool fires. Check those first.
          </p>
        </div>
      </Reveal>

      {/* accordion */}
      <div className="space-y-3">
        {filtered.map((fix) => {
          const isOpen = open === fix.id;
          return (
            <Reveal key={fix.id} className="overflow-hidden rounded-xl border border-line-soft bg-panel/50">
              <button
                onClick={() => setOpen(isOpen ? null : fix.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-panel-2/50"
              >
                <Tag tone={fix.tag === "common" ? "coral" : "mut"}>{fix.tag}</Tag>
                <span className="flex-1 text-[14.5px] font-semibold text-ink/90">{fix.symptom}</span>
                <Ic.Chevron className={cn("h-4 w-4 text-dim transition-transform duration-300", isOpen && "rotate-180 text-coral")} />
              </button>
              <div className={cn("grid transition-all duration-300 ease-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                <div className="overflow-hidden">
                  <div className="space-y-4 border-t border-line-soft px-5 py-5">
                    <p className="text-[13.5px] leading-relaxed text-mut">
                      <span className="font-mono text-[10.5px] tracking-[0.18em] text-cy uppercase">likely cause — </span>
                      {fix.cause}
                    </p>
                    <ol className="space-y-2">
                      {fix.fix.map((f, i) => (
                        <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed text-mut">
                          <span className="font-mono text-[11px] text-coral">{String(i + 1).padStart(2, "0")}</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ol>
                    {fix.code && <CodeBlock code={fix.code} label="terminal" />}
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}

        {filtered.length === 0 && (
          <div className="fade-in rounded-xl border border-dashed border-line bg-panel/30 px-6 py-12 text-center">
            <Ic.Search className="mx-auto mb-3 h-6 w-6 text-dim" />
            <p className="font-mono text-[12.5px] text-mut">no matches for “{query}”</p>
            <p className="mt-1.5 text-[13px] text-dim">Try “timeout”, “json”, “plugin” or “gatekeeper”.</p>
            <button
              onClick={() => setQuery("")}
              className="mt-4 rounded-lg border border-line px-4 py-2 font-mono text-[11px] tracking-wider text-mut transition-colors hover:border-coral/50 hover:text-coral-soft"
            >
              clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= faq + footer ================= */

export function FaqSection() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {FAQS.map((f, i) => (
        <Reveal key={f.q} delay={i * 60} className="rounded-xl border border-line-soft bg-panel/40 p-5 transition-colors duration-300 hover:border-line hover:bg-panel/70">
          <div className="mb-2.5 flex items-start gap-3">
            <span className="font-display text-lg font-bold text-coral">Q</span>
            <h3 className="font-display text-[15px] font-semibold leading-snug">{f.q}</h3>
          </div>
          <p className="text-[13px] leading-relaxed text-mut">{f.a}</p>
        </Reveal>
      ))}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="relative border-t border-line-soft bg-bg-deep/60">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
          <div className="max-w-sm">
            <div className="mb-3 flex items-center gap-2.5">
              <Ic.Cube className="h-5 w-5 text-coral" />
              <span className="font-display text-base font-bold tracking-wide">STUDIO·MCP</span>
              <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[9.5px] tracking-widest text-dim">MACOS</span>
            </div>
            <p className="text-[12.5px] leading-relaxed text-dim">
              An unofficial field guide. Facts verified against the official Roblox docs and the studio-rust-mcp-server repo — when they drift, the official docs win.
            </p>
          </div>
          <div>
            <div className="mb-3 font-mono text-[10.5px] tracking-[0.2em] text-dim uppercase">sources</div>
            <ul className="space-y-2.5">
              {OFFICIAL_LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="link-underline inline-flex items-center gap-2 text-[13px] text-mut transition-colors hover:text-cy"
                  >
                    <Ic.External className="h-3.5 w-3.5" />
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:text-right">
            <div className="mb-3 font-mono text-[10.5px] tracking-[0.2em] text-dim uppercase">session</div>
            <p className="font-mono text-[12px] leading-relaxed text-mut">
              transport: stdio<br />
              tools: 26 · installs: 0<br />
              <span className="text-ok">● link green</span>
            </p>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-line-soft pt-6 sm:flex-row sm:items-center">
          <span className="font-mono text-[11px] text-dim">built for Mac-first Roblox devs · not affiliated with Roblox Corporation</span>
          <span className="font-mono text-[11px] text-dim">
            <Ic.Apple className="mr-1.5 inline h-3.5 w-3.5 align-[-2px] text-mut" />
            tested on Apple Silicon &amp; Intel
          </span>
        </div>
      </div>
    </footer>
  );
}
