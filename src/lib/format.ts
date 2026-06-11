/** Fixed "now" so demo data renders deterministically (no hydration drift). */
export const DEMO_NOW = new Date("2026-06-10T09:30:00Z");

const eur = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const eurCompactFmt = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function money(n: number): string {
  return eur.format(n);
}

export function moneyCompact(n: number): string {
  return eurCompactFmt.format(n);
}

export function pct(n: number): string {
  return `${Math.round(n)}%`;
}

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});
const dateFullFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function shortDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function fullDate(iso: string): string {
  return dateFullFmt.format(new Date(iso));
}

/** "2h ago", "3d ago" — relative to the fixed demo clock. */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = DEMO_NOW.getTime() - then;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return dateFmt.format(new Date(iso));
}

/** "in 2d", "overdue 1d" */
export function dueIn(iso: string): { label: string; overdue: boolean } {
  const then = new Date(iso).getTime();
  const diffMs = then - DEMO_NOW.getTime();
  const days = Math.round(diffMs / 86400000);
  const hours = Math.round(diffMs / 3600000);
  if (diffMs < 0) {
    const od = Math.abs(days) || 1;
    return { label: `overdue ${od}d`, overdue: true };
  }
  if (hours < 24) return { label: `due in ${Math.max(hours, 1)}h`, overdue: false };
  return { label: `due in ${days}d`, overdue: false };
}

/** ISO string at a day offset from the demo clock. */
export function daysFromNow(days: number, hour = 9): string {
  const d = new Date(DEMO_NOW);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

export function marginPct(price: number, cost: number): number {
  if (price <= 0) return 0;
  return ((price - cost) / price) * 100;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
