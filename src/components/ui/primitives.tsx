"use client";

/* ================================================================
   Core primitives: Button, Badge, StagePill, RiskBadge, Avatar,
   Progress, Kbd. Tones come from semantic tokens only.
   ================================================================ */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "@/lib/format";
import { STAGE_LABELS, type RiskLevel, type Stage } from "@/lib/types";

/* ---------- Button ---------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const buttonBase =
  "inline-flex items-center justify-center gap-1.5 font-medium select-none whitespace-nowrap transition-[background-color,border-color,color,transform,box-shadow] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-on-accent border border-transparent hover:bg-accent-hover shadow-e1",
  secondary:
    "bg-raised text-ink border border-line hover:border-line-strong hover:bg-overlay",
  ghost: "bg-transparent text-ink-mute border border-transparent hover:text-ink hover:bg-accent-soft/50",
  danger:
    "bg-danger-soft text-danger border border-danger/25 hover:border-danger/50",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-7 px-2.5 text-[12.5px] rounded-sm",
  md: "h-8.5 px-3.5 text-[13px] rounded-md",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "secondary", size = "md", loading, className, children, disabled, ...rest },
    ref
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
        {...rest}
      >
        {loading && (
          <svg
            className="h-3.5 w-3.5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

/* ---------- Badge ---------- */

export type Tone = "neutral" | "accent" | "ok" | "warn" | "danger" | "info";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-inset text-ink-mute border-line",
  accent: "bg-accent-soft text-accent border-accent-line",
  ok: "bg-ok-soft text-ok border-ok/25",
  warn: "bg-warn-soft text-warn border-warn/25",
  danger: "bg-danger-soft text-danger border-danger/25",
  info: "bg-info-soft text-info border-info/25",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-px font-mono text-[10.5px] font-medium tracking-[0.05em] uppercase",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ---------- Stage pill ---------- */

const stageTones: Record<Stage, Tone> = {
  intake: "info",
  brief: "info",
  scoping: "accent",
  proposal_draft: "accent",
  proposal_sent: "warn",
  negotiation: "warn",
  won: "ok",
  lost: "neutral",
};

export function StagePill({ stage, className }: { stage: Stage; className?: string }) {
  return (
    <Badge tone={stageTones[stage]} className={className}>
      {STAGE_LABELS[stage]}
    </Badge>
  );
}

/* ---------- Risk badge ---------- */

const riskTones: Record<RiskLevel, Tone> = { low: "ok", medium: "warn", high: "danger" };

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <Badge tone={riskTones[level]} className={className}>
      <span
        className={cx(
          "inline-block h-1.5 w-1.5 rounded-full",
          level === "low" && "bg-ok",
          level === "medium" && "bg-warn",
          level === "high" && "bg-danger pulse-dot"
        )}
      />
      {level} risk
    </Badge>
  );
}

/* ---------- Avatar ---------- */

export function Avatar({
  initials,
  size = 26,
  className,
  title,
}: {
  initials: string;
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-line bg-overlay font-mono font-medium text-ink-mute",
        className
      )}
    >
      {initials}
    </span>
  );
}

/* ---------- Progress ---------- */

export function Progress({
  value,
  tone = "accent",
  className,
}: {
  value: number; // 0–100
  tone?: Tone;
  className?: string;
}) {
  const barColor =
    tone === "ok" ? "bg-ok" : tone === "warn" ? "bg-warn" : tone === "danger" ? "bg-danger" : "bg-accent";
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cx("h-1 w-full overflow-hidden rounded-full bg-inset", className)}
    >
      <div
        className={cx("h-full rounded-full transition-[width] duration-500", barColor)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* ---------- Kbd ---------- */

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-line bg-inset px-1 font-mono text-[10px] text-ink-faint">
      {children}
    </kbd>
  );
}

/* ---------- Dot separator ---------- */

export function Dot() {
  return <span className="mx-1.5 inline-block h-0.5 w-0.5 rounded-full bg-ink-faint align-middle" />;
}
