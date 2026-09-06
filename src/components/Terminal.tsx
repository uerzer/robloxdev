import { useCallback, useEffect, useRef, useState } from "react";
import { BOOT_LINES, CHIP_LABELS } from "../data";
import { cn, Ic } from "./ui";

const TONE_CLASS: Record<string, string> = {
  cmd: "text-ink",
  sys: "text-mut",
  ok: "text-ok",
  tool: "text-cy",
  live: "text-dim",
};

export function Terminal({ onPhase }: { onPhase: (p: number) => void }) {
  const [count, setCount] = useState(0);
  const [heartbeats, setHeartbeats] = useState<string[]>([]);
  const [runId, setRunId] = useState(0);
  const timeouts = useRef<number[]>([]);
  const hbTimer = useRef<number | null>(null);

  const clearAll = useCallback(() => {
    timeouts.current.forEach((t) => window.clearTimeout(t));
    timeouts.current = [];
    if (hbTimer.current) window.clearInterval(hbTimer.current);
  }, []);

  useEffect(() => {
    clearAll();
    setCount(0);
    setHeartbeats([]);
    onPhase(0);

    let delay = 500;
    BOOT_LINES.forEach((line, i) => {
      delay += i === 0 ? 350 : 420 + Math.random() * 260;
      const t = window.setTimeout(() => {
        setCount(i + 1);
        onPhase(line.phase);
      }, delay);
      timeouts.current.push(t);
    });

    // heartbeat loop after boot
    const hbStart = window.setTimeout(() => {
      hbTimer.current = window.setInterval(() => {
        const ms = 8 + Math.floor(Math.random() * 34);
        const time = new Date().toLocaleTimeString("en-GB", { hour12: false });
        setHeartbeats((prev) => [...prev.slice(-4), `▍ heartbeat ${time} · ok · ${ms}ms`]);
      }, 2600);
    }, delay + 900);
    timeouts.current.push(hbStart);

    return clearAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  const replay = () => setRunId((r) => r + 1);

  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-bg-deep shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
      {/* chrome */}
      <div className="flex items-center justify-between border-b border-line-soft bg-panel px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#e0655c]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#e0b45c]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#5cb884]" />
        </div>
        <span className="font-mono text-[10.5px] tracking-wider text-dim">StudioMCP — zsh — 84×22</span>
        <button
          onClick={replay}
          className="flex items-center gap-1.5 rounded-md border border-line-soft px-2 py-1 font-mono text-[10.5px] tracking-wide text-mut transition-colors hover:border-line hover:text-ink"
        >
          <Ic.Refresh className="h-3 w-3" />
          replay
        </button>
      </div>

      {/* body */}
      <div className="term-scan term-lines relative min-h-[268px] px-4 py-4 font-mono text-[12px] leading-[1.9] sm:text-[12.5px]">
        {BOOT_LINES.slice(0, count).map((line, i) => (
          <div key={i} className={cn("fade-in whitespace-pre-wrap break-all", TONE_CLASS[line.tone])}>
            {line.text}
          </div>
        ))}
        {heartbeats.map((hb, i) => (
          <div key={`hb-${i}`} className={cn("fade-in whitespace-pre-wrap", TONE_CLASS.live)}>
            {hb}
          </div>
        ))}
        <div className="flex items-center gap-1 text-coral">
          <span className="text-dim">❯</span>
          <span className="cursor-blink inline-block h-[15px] w-[8px] translate-y-[2px] bg-coral/90" />
        </div>
      </div>
    </div>
  );
}

/* status chips that light up as the boot progresses */
export function LinkChips({ phase }: { phase: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {CHIP_LABELS.map((label, i) => {
        const lit = phase > i;
        return (
          <div
            key={label}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-all duration-500",
              lit ? "border-ok/40 bg-ok/[0.07]" : "border-line-soft bg-panel/60"
            )}
          >
            <span className="relative flex h-2 w-2">
              {lit && <span className="dot-ping absolute inline-flex h-full w-full rounded-full bg-ok" />}
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full transition-colors duration-500",
                  lit ? "bg-ok" : "bg-dim/60"
                )}
              />
            </span>
            <span
              className={cn(
                "font-mono text-[10.5px] tracking-[0.18em] transition-colors duration-500",
                lit ? "text-ok" : "text-dim"
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
      <span
        className={cn(
          "ml-1 font-mono text-[10.5px] tracking-widest transition-colors duration-700",
          phase >= 3 ? "text-ok" : "text-dim"
        )}
      >
        {phase >= 3 ? "LINK GREEN" : phase > 0 ? "HANDSHAKING…" : "IDLE"}
      </span>
    </div>
  );
}
