import { useEffect, useState } from "react";
import { QUICK_CONNECT_CLIENTS } from "./data";
import { cn, Ic, Reveal, SectionHead, Tag } from "./components/ui";
import { LinkChips, Terminal } from "./components/Terminal";
import { Diagram } from "./components/Diagram";
import { SetupSection } from "./components/Setup";
import { FaqSection, Footer, RemoteSection, ToolsSection, TroubleshootSection } from "./components/Extras";

const NAV = [
  { id: "wire", label: "wire" },
  { id: "setup", label: "setup" },
  { id: "tools", label: "tools" },
  { id: "remote", label: "remote" },
  { id: "fixes", label: "fixes" },
];

const STATS = [
  { k: "tools exposed", v: "26" },
  { k: "transport", v: "stdio · zero ports" },
  { k: "things to install", v: "0 — it ships in Studio" },
  { k: "time to link green", v: "~2 minutes" },
];

function Header({ active }: { active: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-line-soft bg-bg/85 backdrop-blur-md" : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <a href="#top" className="group flex items-center gap-2.5">
          <Ic.Cube className="h-6 w-6 text-coral transition-transform duration-500 group-hover:rotate-[24deg]" />
          <span className="font-display text-[15px] font-bold tracking-[0.08em]">
            STUDIO<span className="text-coral">·</span>MCP
          </span>
          <span className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.18em] text-dim sm:inline">
            MACOS FIELD GUIDE
          </span>
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className={cn(
                "flex items-center gap-1.5 font-mono text-[11.5px] tracking-[0.14em] transition-colors duration-200",
                active === n.id ? "text-coral-soft" : "text-mut hover:text-ink"
              )}
            >
              <span
                className={cn(
                  "h-1 w-1 rounded-full transition-all duration-300",
                  active === n.id ? "bg-coral" : "bg-transparent"
                )}
              />
              {n.label.toUpperCase()}
            </a>
          ))}
        </nav>

        <a
          href="https://create.roblox.com/docs/studio/mcp"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 font-mono text-[11px] tracking-wider text-mut transition-all duration-200 hover:border-cy/50 hover:text-cy"
        >
          <Ic.Doc className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">official docs</span>
          <Ic.External className="h-3 w-3" />
        </a>
      </div>

      {/* mobile section nav */}
      <nav className="border-t border-line-soft bg-bg/85 backdrop-blur-md md:hidden">
        <div className="flex gap-5 overflow-x-auto px-5 py-2.5">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className={cn(
                "flex shrink-0 items-center gap-1.5 font-mono text-[11px] tracking-[0.14em] transition-colors",
                active === n.id ? "text-coral-soft" : "text-mut"
              )}
            >
              <span className={cn("h-1 w-1 rounded-full", active === n.id ? "bg-coral" : "bg-line")} />
              {n.label.toUpperCase()}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}

function Opener() {
  const [phase, setPhase] = useState(0);

  return (
    <section id="top" className="relative mx-auto max-w-6xl px-5 pb-14 pt-28 sm:px-8 sm:pt-36">
      <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        {/* left — the pitch */}
        <div>
          <Reveal>
            <div className="mb-5 flex flex-wrap items-center gap-2.5">
              <Tag tone="ok">● server ships built-in</Tag>
              <Tag tone="cy">stdio transport</Tag>
              <Tag tone="mut">
                <Ic.Apple className="h-3 w-3" /> macOS · arm64 + intel
              </Tag>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="font-display text-[2.6rem] font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.1rem]">
              WIRE AN AI AGENT
              <br />
              INTO YOUR{" "}
              <span className="relative inline-block text-coral">
                ROBLOX STUDIO
                <svg viewBox="0 0 300 12" className="absolute -bottom-2 left-0 w-full" preserveAspectRatio="none" aria-hidden>
                  <path d="M2 9 C 60 3, 180 3, 298 8" fill="none" stroke="#ff5a4e" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
                </svg>
              </span>
              .
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-7 max-w-xl text-[15.5px] leading-relaxed text-mut">
              The official <span className="text-ink">Roblox Studio MCP server</span> already lives inside the app on your Mac — one signed binary, no plugin, no npm, no ports.
              This guide walks the whole path: flip the switch in Studio, point Claude Code / Cursor / Claude Desktop at it, and watch your agent script, generate and playtest against the session you have open.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-8">
              <div className="mb-3 font-mono text-[10.5px] tracking-[0.22em] text-dim uppercase">live link status</div>
              <LinkChips phase={phase} />
            </div>
          </Reveal>

          <Reveal delay={320}>
            <div className="mt-8 border-t border-line-soft pt-6">
              <div className="mb-3 font-mono text-[10.5px] tracking-[0.22em] text-dim uppercase">quick-connect clients detected by studio</div>
              <div className="flex flex-wrap gap-2">
                {QUICK_CONNECT_CLIENTS.map((c) => (
                  <span
                    key={c}
                    className="rounded-md border border-line-soft bg-panel/60 px-2.5 py-1.5 font-mono text-[11px] text-mut transition-all duration-200 hover:-translate-y-0.5 hover:border-cy/40 hover:text-cy"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* right — the console */}
        <Reveal delay={200} className="lg:sticky lg:top-24">
          <Terminal onPhase={setPhase} />
          <p className="mt-3 flex items-center gap-2 font-mono text-[11px] text-dim">
            <Ic.Terminal className="h-3.5 w-3.5 text-cy" />
            simulated boot — this is what your client sees when it spawns the binary
          </p>
        </Reveal>
      </div>

      {/* stat band */}
      <Reveal delay={120}>
        <div className="mt-14 grid grid-cols-2 overflow-hidden rounded-xl border border-line-soft bg-panel/40 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.k}
              className={cn(
                "group px-5 py-4 transition-colors duration-300 hover:bg-panel-2/60",
                i > 0 && "border-l border-line-soft max-lg:[&:nth-child(3)]:border-l-0",
                i >= 2 && "max-lg:border-t max-lg:border-line-soft"
              )}
            >
              <div className="font-mono text-[10px] tracking-[0.2em] text-dim uppercase">{s.k}</div>
              <div className="mt-1 font-display text-[15px] font-bold text-ink transition-colors group-hover:text-coral-soft">{s.v}</div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

export default function App() {
  const [active, setActive] = useState("");

  useEffect(() => {
    const ids = NAV.map((n) => n.id);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-38% 0px -55% 0px" }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* ambient layers */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="bg-grid absolute inset-0" />
        <div className="glow-coral absolute -top-40 right-[-180px] h-[640px] w-[640px]" />
        <div className="glow-cy absolute bottom-[-220px] left-[-180px] h-[620px] w-[620px]" />
        <div className="noise absolute inset-0" />
      </div>

      <div className="relative z-10">
        <Header active={active} />
        <Opener />

        <main className="mx-auto max-w-6xl px-5 sm:px-8">
          <section id="wire" className="scroll-mt-24 py-16 sm:py-20">
            <SectionHead
              index="01"
              kicker="the wiring"
              title={<>One binary. No plugin, no ports, no package manager.</>}
              lede="Roblox folded the old plugin-and-long-poll server into Studio itself. Your AI client spawns the binary, talks MCP over stdio, and Studio answers from the session you have open. Click each hop to inspect it."
            />
            <Diagram />
          </section>

          <section id="setup" className="scroll-mt-24 py-16 sm:py-20">
            <SectionHead
              index="02"
              kicker="hands on"
              title={<>Five steps to <span className="text-ok">link green</span>.</>}
              lede="Tick each step as you go — progress sticks around between visits. Everything below is copy-pasteable and Mac-specific: real paths, real config files, no placeholders."
            />
            <SetupSection />
          </section>

          <section id="tools" className="scroll-mt-24 py-16 sm:py-20">
            <SectionHead
              index="03"
              kicker="the toolbox"
              title={<>Twenty-six ways to drive Studio.</>}
              lede="What the server actually exposes once the link is green — from surgical script edits to AI-generated meshes, playtest orchestration and full keyboard-and-mouse simulation."
            />
            <ToolsSection />
          </section>

          <section id="remote" className="scroll-mt-24 py-16 sm:py-20">
            <SectionHead
              index="04"
              kicker="beyond this mac"
              title={<>You said “remote”. Here's the honest way.</>}
              lede="The built-in server speaks stdio by design — it is deliberately pinned to this machine. If your agent lives somewhere else, you have two options, one of which you should treat like carrying a chainsaw through a crowd."
            />
            <RemoteSection />
          </section>

          <section id="fixes" className="scroll-mt-24 py-16 sm:py-20">
            <SectionHead
              index="05"
              kicker="when it breaks"
              title={<>Troubleshooting the link.</>}
              lede="Every failure mode observed in the wild, searchable. Open the one that matches your symptom — each comes with the likely cause and the exact commands to prove the fix."
            />
            <TroubleshootSection />
          </section>

          <section id="faq" className="scroll-mt-24 py-16 sm:py-20">
            <SectionHead
              index="06"
              kicker="quick answers"
              title={<>Fair questions.</>}
            />
            <FaqSection />
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
