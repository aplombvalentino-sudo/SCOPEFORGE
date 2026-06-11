"use client";

/* ================================================================
   Custom SVG charts — no chart library. Sparkline (area),
   BarRow (horizontal compare), FunnelSteps, RingGauge.
   All animate in with framer-motion and respect reduced motion.
   ================================================================ */

import { motion, useReducedMotion } from "framer-motion";
import { cx, pct } from "@/lib/format";

/* ---------- Sparkline / area ---------- */

export function Sparkline({
  data,
  width = 220,
  height = 56,
  className,
  showDot = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  showDot?: boolean;
}) {
  const reduced = useReducedMotion();
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pad = 4;
  const stepX = (width - pad * 2) / (data.length - 1);
  const points = data.map((v, i) => ({
    x: pad + i * stepX,
    y: pad + (height - pad * 2) * (1 - (v - min) / range),
  }));
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;
  const last = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="Trend chart"
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <motion.path
        d={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.8"
        strokeLinecap="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
      {showDot && (
        <circle cx={last.x} cy={last.y} r="2.6" fill="var(--accent)" />
      )}
    </svg>
  );
}

/* ---------- Horizontal bar row (e.g. margin by service) ---------- */

export function BarRow({
  label,
  value,
  max,
  display,
  tone = "accent",
  className,
}: {
  label: string;
  value: number;
  max: number;
  display?: string;
  tone?: "accent" | "warn" | "danger" | "ok";
  className?: string;
}) {
  const reduced = useReducedMotion();
  const widthPct = Math.max(2, (value / max) * 100);
  const barColor =
    tone === "warn" ? "bg-warn" : tone === "danger" ? "bg-danger" : tone === "ok" ? "bg-ok" : "bg-accent";
  return (
    <div className={cx("flex items-center gap-3", className)}>
      <span className="w-32 shrink-0 truncate text-[12.5px] text-ink-mute">{label}</span>
      <div className="h-4 flex-1 overflow-hidden rounded-sm bg-inset">
        <motion.div
          className={cx("h-full rounded-sm opacity-80", barColor)}
          initial={reduced ? false : { width: 0 }}
          animate={{ width: `${widthPct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <span className="tnum w-12 shrink-0 text-right font-mono text-[12px] text-ink">
        {display ?? pct(value)}
      </span>
    </div>
  );
}

/* ---------- Vertical mini bars (monthly series) ---------- */

export function MiniBars({
  data,
  labels,
  height = 88,
  className,
  formatValue,
}: {
  data: number[];
  labels?: string[];
  height?: number;
  className?: string;
  formatValue?: (v: number) => string;
}) {
  const reduced = useReducedMotion();
  const max = Math.max(...data) || 1;
  return (
    <div className={cx("flex items-end gap-2", className)} style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <span className="tnum font-mono text-[10px] text-ink-faint opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            {formatValue ? formatValue(v) : v}
          </span>
          <motion.div
            className="w-full max-w-9 rounded-t-sm bg-accent/75 transition-colors duration-150 group-hover:bg-accent"
            initial={reduced ? false : { height: 0 }}
            animate={{ height: `${Math.max(3, (v / max) * 72)}%` }}
            transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          />
          {labels && (
            <span className="microlabel !text-[9.5px]">{labels[i]}</span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------- Funnel ---------- */

export function FunnelSteps({
  steps,
  className,
}: {
  steps: { label: string; value: number }[];
  className?: string;
}) {
  const reduced = useReducedMotion();
  const max = steps[0]?.value || 1;
  return (
    <div className={cx("space-y-2", className)}>
      {steps.map((s, i) => {
        const w = Math.max(8, (s.value / max) * 100);
        const conversion = i > 0 ? Math.round((s.value / steps[i - 1].value) * 100) : null;
        return (
          <div key={s.label} className="flex items-center gap-3">
            <span className="microlabel w-16 shrink-0">{s.label}</span>
            <div className="relative h-6 flex-1">
              <motion.div
                className="absolute inset-y-0 left-0 flex items-center rounded-sm border border-accent-line/40 bg-accent-soft px-2"
                initial={reduced ? false : { width: 0 }}
                animate={{ width: `${w}%` }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="tnum font-mono text-[11.5px] font-medium text-accent">
                  {s.value}
                </span>
              </motion.div>
            </div>
            <span className="tnum w-12 shrink-0 text-right font-mono text-[11px] text-ink-faint">
              {conversion !== null ? `${conversion}%` : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Ring gauge (margin health) ---------- */

export function RingGauge({
  value,
  size = 88,
  label,
  display,
  tone = "accent",
}: {
  value: number; // 0–100
  size?: number;
  label?: string;
  display?: string;
  tone?: "accent" | "warn" | "danger" | "ok";
}) {
  const reduced = useReducedMotion();
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = (Math.min(100, Math.max(0, value)) / 100) * c;
  const color =
    tone === "warn" ? "var(--warn)" : tone === "danger" ? "var(--danger)" : tone === "ok" ? "var(--ok)" : "var(--accent)";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={label}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--inset)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={reduced ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - filled }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum font-display text-[16px] font-medium">{display ?? pct(value)}</span>
        {label && <span className="microlabel !text-[8.5px]">{label}</span>}
      </div>
    </div>
  );
}
