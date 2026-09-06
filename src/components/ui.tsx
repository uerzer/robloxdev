import { useEffect, useRef, useState, type ReactNode } from "react";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ---------------- icons (hand-drawn, stroke = currentColor) ---------------- */

type IconProps = { className?: string };
const base = "inline-block shrink-0";

export const Ic = {
  Cube: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
      <path d="M12 2.5l8.2 4.6v9.8L12 21.5l-8.2-4.6V7.1z" />
      <path d="M12 12l8.2-4.9M12 12v9.5M12 12L3.8 7.1" strokeWidth="1.2" opacity="0.75" />
    </svg>
  ),
  Copy: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Check: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  ),
  Chevron: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  Search: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  ),
  Shield: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
      <path d="M12 2.5l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-6z" />
      <path d="M8.8 12l2.2 2.2 4.2-4.4" strokeLinecap="round" />
    </svg>
  ),
  Warn: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3L1.8 20.2h20.4z" />
      <path d="M12 9.5v5M12 17.6v.1" />
    </svg>
  ),
  Plug: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2.5V8m6-5.5V8M6 8h12v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6z" />
      <path d="M12 17v4.5" />
    </svg>
  ),
  Terminal: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="4" width="19" height="16" rx="2" />
      <path d="M6.5 9l4 3-4 3M12.5 15h5" />
    </svg>
  ),
  External: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4h6v6M20 4l-9 9M19 13.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4.5" />
    </svg>
  ),
  Refresh: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 5v5h-5M4 19v-5h5" />
      <path d="M19.5 10a8 8 0 0 0-14.2-3M4.5 14a8 8 0 0 0 14.2 3" />
    </svg>
  ),
  Apple: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.8 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.9-1.4-.1-2.8.9-3.5.9-.7 0-1.9-.8-3.1-.8-1.6 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3.1.7c1.3 0 2.1-1.1 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.6-3.6z" />
      <path d="M13.6 5.3c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.2 1.9-1 3 1 .1 2.1-.6 2.7-1.4z" />
    </svg>
  ),
  Doc: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2.5h8l4 4V21a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 21z" />
      <path d="M14 2.5v4h4M9.5 12h5m-5 4h5" />
    </svg>
  ),
  Signal: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, className)} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 18.5v.1M9 14.5v4.1M14 10v8.6M19 5.5v13.1" />
    </svg>
  ),
};

/* ---------------- scroll reveal ---------------- */

export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setOn(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={cn("reveal", on && "rev-on", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/* ---------------- code block with copy ---------------- */

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  };

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  return (
    <div className="group/code relative rounded-lg border border-line-soft bg-bg-deep/80 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line-soft/80 px-3.5 py-2">
        <span className="font-mono text-[10.5px] tracking-wider text-dim truncate">{label ?? "terminal"}</span>
        <button
          onClick={copy}
          aria-label="Copy code"
          className={cn(
            "flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10.5px] tracking-wide transition-all duration-200",
            copied
              ? "border-ok/50 bg-ok/10 text-ok"
              : "border-line-soft text-mut hover:border-line hover:text-ink hover:bg-panel-2"
          )}
        >
          {copied ? <Ic.Check className="h-3 w-3" /> : <Ic.Copy className="h-3 w-3" />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[12.5px] leading-relaxed text-ink/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ---------------- section header ---------------- */

export function SectionHead({
  index,
  kicker,
  title,
  lede,
}: {
  index: string;
  kicker: string;
  title: ReactNode;
  lede?: string;
}) {
  return (
    <Reveal className="mb-10 md:mb-14">
      <div className="flex items-center gap-3 mb-4">
        <span className="font-mono text-[11px] tracking-[0.25em] text-coral">{index}</span>
        <span className="h-px w-10 bg-line" />
        <span className="font-mono text-[11px] tracking-[0.25em] text-dim uppercase">{kicker}</span>
      </div>
      <h2 className="font-display text-3xl md:text-[2.6rem] leading-[1.05] font-bold tracking-tight max-w-3xl">
        {title}
      </h2>
      {lede && <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-mut">{lede}</p>}
    </Reveal>
  );
}

/* ---------------- tag pill ---------------- */

export function Tag({ children, tone = "mut" }: { children: ReactNode; tone?: "coral" | "cy" | "amb" | "ok" | "mut" }) {
  const tones: Record<string, string> = {
    coral: "border-coral/40 bg-coral/10 text-coral-soft",
    cy: "border-cy/40 bg-cy/10 text-cy",
    amb: "border-amb/40 bg-amb/10 text-amb",
    ok: "border-ok/40 bg-ok/10 text-ok",
    mut: "border-line text-mut",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] tracking-wider uppercase", tones[tone])}>
      {children}
    </span>
  );
}
