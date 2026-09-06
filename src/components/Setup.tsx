import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { CLIENTS, STEPS, type Block, type Step } from "../data";
import { cn, CodeBlock, Ic, Reveal } from "./ui";

const LS_KEY = "rbx-mcp-mac-progress:v1";

function loadProgress(): boolean[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === STEPS.length) return parsed.map(Boolean);
    }
  } catch {
    /* ignore */
  }
  return STEPS.map(() => false);
}

/* ---------------- block renderer ---------------- */

function Callout({ tone, text }: { tone: "info" | "warn" | "ok"; text: string }) {
  const map = {
    info: { border: "border-cy/35", icon: <Ic.Plug className="h-4 w-4 text-cy" />, label: "note", labelCls: "text-cy" },
    warn: { border: "border-amb/35", icon: <Ic.Warn className="h-4 w-4 text-amb" />, label: "heads up", labelCls: "text-amb" },
    ok: { border: "border-ok/35", icon: <Ic.Check className="h-4 w-4 text-ok" />, label: "good", labelCls: "text-ok" },
  }[tone];
  return (
    <div className={cn("rounded-lg border bg-panel/50 p-4", map.border)}>
      <div className={cn("mb-1.5 flex items-center gap-2 font-mono text-[10.5px] tracking-[0.18em] uppercase", map.labelCls)}>
        {map.icon}
        {map.label}
      </div>
      <p className="text-[13.5px] leading-relaxed text-mut">{text}</p>
    </div>
  );
}

function UiWalkthrough({ steps }: { steps: string[] }) {
  return (
    <ol className="relative space-y-0">
      {steps.map((s, i) => (
        <li key={i} className="relative flex gap-4 pb-4 last:pb-0">
          {i < steps.length - 1 && <span className="absolute left-[13px] top-7 h-[calc(100%-22px)] w-px border-l border-dashed border-line" />}
          <span className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line bg-panel-2 font-mono text-[11px] font-semibold text-cy">
            {i + 1}
          </span>
          <p className="pt-1 text-[14px] leading-relaxed text-ink/85">{s}</p>
        </li>
      ))}
    </ol>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "p":
      return <p className="text-[14.5px] leading-relaxed text-mut">{block.text}</p>;
    case "code":
      return <CodeBlock code={block.code} label={block.label} />;
    case "ui":
      return <UiWalkthrough steps={block.steps} />;
    case "callout":
      return <Callout tone={block.tone} text={block.text} />;
    case "list":
      return (
        <ul className="space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 rounded-lg border border-line-soft bg-bg-deep/50 px-4 py-3">
              <span className="mt-0.5 font-mono text-[11px] text-coral">❯</span>
              <span className="text-[13.5px] leading-relaxed text-ink/85">{item}</span>
            </li>
          ))}
        </ul>
      );
  }
}

/* ---------------- client tabs (step 3) ---------------- */

function ClientTabs() {
  const [active, setActive] = useState(CLIENTS[0].id);
  const client = CLIENTS.find((c) => c.id === active) ?? CLIENTS[0];

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <div className="flex overflow-x-auto border-b border-line bg-panel-2/70">
        {CLIENTS.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c.id)}
            className={cn(
              "relative shrink-0 px-4 py-2.5 font-mono text-[11.5px] tracking-wide transition-colors duration-200",
              active === c.id ? "text-ink" : "text-dim hover:text-mut"
            )}
          >
            {c.name}
            {active === c.id && <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-coral" />}
          </button>
        ))}
      </div>
      <div key={client.id} className="fade-in space-y-3.5 bg-panel/40 p-4 sm:p-5">
        <p className="text-[13.5px] leading-relaxed text-mut">{client.blurb}</p>
        {client.blocks.map((b) => (
          <CodeBlock key={b.label} code={b.code} label={b.label} />
        ))}
        {client.note && (
          <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-dim">
            <Ic.Doc className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cy" />
            {client.note}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------------- step card ---------------- */

function StepCard({ step, index, done, onToggle }: { step: Step; index: number; done: boolean; onToggle: () => void }) {
  return (
    <Reveal as="article" className={cn("scroll-mt-28 rounded-xl border p-5 transition-colors duration-300 sm:p-7", done ? "border-ok/30 bg-ok/[0.03]" : "border-line-soft bg-panel/50 hover:border-line")}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className={cn("font-display text-[2rem] font-bold leading-none tracking-tight", done ? "text-ok" : "text-coral")}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <div className="mb-1 font-mono text-[10.5px] tracking-[0.2em] text-dim uppercase">{step.kicker}</div>
            <h3 className="font-display text-xl font-bold tracking-tight sm:text-[1.35rem]">{step.title}</h3>
          </div>
        </div>
        <button
          onClick={onToggle}
          aria-pressed={done}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-[11px] tracking-wider transition-all duration-200",
            done
              ? "border-ok/50 bg-ok/10 text-ok hover:bg-ok/15"
              : "border-line text-mut hover:border-coral/50 hover:text-coral-soft"
          )}
        >
          {done ? <Ic.Check className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5 rounded-[4px] border border-current opacity-60" />}
          {done ? "done" : "mark done"}
        </button>
      </div>
      <div className="space-y-4">
        {step.blocks.map((b, i) => (
          <BlockView key={i} block={b} />
        ))}
        {step.id === "client" && <ClientTabs />}
      </div>
    </Reveal>
  );
}

/* ---------------- section ---------------- */

export function SetupSection() {
  const [done, setDone] = useState<boolean[]>(loadProgress);
  const allDone = done.every(Boolean);
  const firedRef = useRef(allDone);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(done));
    } catch {
      /* ignore */
    }
  }, [done]);

  useEffect(() => {
    if (allDone && !firedRef.current) {
      firedRef.current = true;
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.35 },
        colors: ["#ff5a4e", "#4fd6e0", "#ffb454", "#46d48f", "#e9eef8"],
        disableForReducedMotion: true,
      });
    }
    if (!allDone) firedRef.current = false;
  }, [allDone]);

  const toggle = (i: number) => setDone((prev) => prev.map((v, j) => (j === i ? !v : v)));
  const reset = () => setDone(STEPS.map(() => false));
  const count = done.filter(Boolean).length;
  const C = 2 * Math.PI * 30;

  const scrollToStep = (id: string) => {
    document.getElementById(`step-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-12">
      {/* sticky rail */}
      <Reveal className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-xl border border-line-soft bg-panel/60 p-5">
          <div className="mb-5 flex items-center gap-4">
            <div className="relative h-[76px] w-[76px]">
              <svg viewBox="0 0 76 76" className="h-full w-full -rotate-90">
                <circle cx="38" cy="38" r="30" fill="none" stroke="#1a2440" strokeWidth="6" />
                <circle
                  cx="38"
                  cy="38"
                  r="30"
                  fill="none"
                  stroke={allDone ? "#46d48f" : "#ff5a4e"}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={C - (C * count) / STEPS.length}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-display text-lg font-bold">
                {count}<span className="text-dim">/{STEPS.length}</span>
              </span>
            </div>
            <div>
              <div className="font-mono text-[10.5px] tracking-[0.2em] text-dim uppercase">setup progress</div>
              <div className={cn("font-display text-lg font-bold", allDone ? "text-ok" : "text-ink")}>
                {allDone ? "LINK GREEN" : "in flight"}
              </div>
            </div>
          </div>

          <ol className="space-y-1">
            {STEPS.map((s, i) => (
              <li key={s.id}>
                <button
                  onClick={() => scrollToStep(s.id)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-200",
                    done[i] ? "text-mut hover:bg-panel-2" : "text-ink/85 hover:bg-panel-2"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border transition-colors duration-300",
                      done[i] ? "border-ok/60 bg-ok/15 text-ok" : "border-line text-dim"
                    )}
                  >
                    {done[i] && <Ic.Check className="h-3 w-3" />}
                  </span>
                  <span className={cn("text-[13px] font-medium", done[i] && "line-through decoration-ok/50 decoration-1")}>
                    {s.title}
                  </span>
                </button>
              </li>
            ))}
          </ol>

          <button
            onClick={reset}
            className="mt-4 flex items-center gap-2 font-mono text-[10.5px] tracking-wider text-dim transition-colors hover:text-coral-soft"
          >
            <Ic.Refresh className="h-3 w-3" />
            reset progress
          </button>
        </div>
      </Reveal>

      {/* steps */}
      <div className="space-y-6">
        {allDone && (
          <div className="fade-in flex items-center gap-4 rounded-xl border border-ok/40 bg-ok/[0.06] p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ok/40 bg-ok/10">
              <Ic.Shield className="h-5 w-5 text-ok" />
            </span>
            <div>
              <div className="font-display text-base font-bold text-ok">Link established.</div>
              <p className="text-[13px] text-mut">Your agent can now read, generate, script and playtest against your live Studio session. Keep the quick prompts from step 05 handy.</p>
            </div>
          </div>
        )}
        {STEPS.map((step, i) => (
          <div key={step.id} id={`step-${step.id}`} className="scroll-mt-28">
            <StepCard step={step} index={i} done={done[i]} onToggle={() => toggle(i)} />
          </div>
        ))}
      </div>
    </div>
  );
}
