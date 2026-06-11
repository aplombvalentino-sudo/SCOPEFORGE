/* ================================================================
   Single icon system — 24px grid, 1.8 stroke, round joins.
   Usage: <Icon name="leads" size={16} className="text-ink-mute" />
   Never import external icon libraries; add paths here instead.
   ================================================================ */

import type { ReactNode } from "react";

const P: Record<string, ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7.5" height="9.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="5.5" rx="1.5" />
      <rect x="13.5" y="11.5" width="7.5" height="9.5" rx="1.5" />
      <rect x="3" y="15.5" width="7.5" height="5.5" rx="1.5" />
    </>
  ),
  leads: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c.6-3.4 2.8-5.2 5.5-5.2s4.9 1.8 5.5 5.2" />
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M16.4 14.6c2.2.3 3.7 1.7 4.2 4.1" />
    </>
  ),
  brief: (
    <>
      <path d="M6 3.5h8.5L19 8v12.5H6z" />
      <path d="M14.5 3.5V8H19" />
      <path d="M9 12h7M9 15.5h7" />
    </>
  ),
  scope: (
    <>
      <path d="M12 3 4 7.5l8 4.5 8-4.5L12 3Z" />
      <path d="m4 12 8 4.5 8-4.5" />
      <path d="m4 16.5 8 4.5 8-4.5" />
    </>
  ),
  proposal: (
    <>
      <path d="M5.5 3.5h13v17h-13z" />
      <path d="M9 8h6M9 11.5h6M9 15h3.5" />
      <path d="m14.5 17.8 1.5 1.4 2.6-3" />
    </>
  ),
  onboarding: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v4.5l3 2" />
      <path d="M12 3.5V2M20.5 12H22M12 20.5V22M3.5 12H2" />
    </>
  ),
  "change-order": (
    <>
      <circle cx="6.5" cy="6" r="2.5" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="12" r="2.5" />
      <path d="M6.5 8.5v7M8.8 7.2c3.5 1 6 2.3 6.4 4.8" />
    </>
  ),
  template: (
    <>
      <rect x="4" y="4" width="13" height="13" rx="1.5" />
      <path d="M8 20h12V8" />
      <path d="M7.5 8.5h6M7.5 12h6" />
    </>
  ),
  service: (
    <>
      <path d="m12 3 8 4v10l-8 4-8-4V7l8-4Z" />
      <path d="M4 7.2 12 11l8-3.8M12 11v9.5" />
    </>
  ),
  "follow-up": (
    <>
      <path d="M4 5.5h16v11H9l-5 4z" />
      <path d="M8.5 9.5h7M8.5 12.5h4.5" />
    </>
  ),
  analytics: (
    <>
      <path d="M4 20.5V3.5" />
      <path d="M4 20.5h17" />
      <path d="M8 16v-5M12.5 16V7.5M17 16v-3" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7.5h10M18 7.5h2" />
      <circle cx="16" cy="7.5" r="2" />
      <path d="M4 16.5h2M10 16.5h10" />
      <circle cx="8" cy="16.5" r="2" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 3.1c-.8.4-1 .9-1 1.8" />
      <path d="M12 17.2v.1" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13.5 6 9.5Z" />
      <path d="M10 18.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.4-4.4" />
    </>
  ),
  command: (
    <>
      <path d="M9 9h6v6H9z" />
      <path d="M9 9H7a2 2 0 1 1 2-2v2ZM15 9h2a2 2 0 1 0-2-2v2ZM15 15h2a2 2 0 1 1-2 2v-2ZM9 15H7a2 2 0 1 0 2 2v-2Z" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  "chevron-down": <path d="m6 9.5 6 6 6-6" />,
  "chevron-up": <path d="m6 14.5 6-6 6 6" />,
  "chevron-right": <path d="m9.5 6 6 6-6 6" />,
  "chevron-left": <path d="m14.5 6-6 6 6 6" />,
  "arrow-right": <path d="M4 12h16m-6-6 6 6-6 6" />,
  "arrow-up-right": <path d="M7 17 17 7m-8.5 0H17v8.5" />,
  "alert-triangle": (
    <>
      <path d="M12 4 2.8 19.5h18.4L12 4Z" />
      <path d="M12 10v4M12 17.3v.1" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5c.8 4.3 2.2 5.7 6.5 6.5-4.3.8-5.7 2.2-6.5 6.5-.8-4.3-2.2-5.7-6.5-6.5 4.3-.8 5.7-2.2 6.5-6.5Z" />
      <path d="M19 14.5c.4 2 1 2.6 3 3-2 .4-2.6 1-3 3-.4-2-1-2.6-3-3 2-.4 2.6-1 3-3Z" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4m-5 5 5-5 5 5" />
      <path d="M4 16.5V20h16v-3.5" />
    </>
  ),
  send: <path d="M21 3 10.5 13.5M21 3l-7 18-3.5-7.5L3 10l18-7Z" />,
  pen: (
    <>
      <path d="m14.5 5 4.5 4.5L8 20.5l-5 1 1-5L14.5 5Z" />
      <path d="m12.5 7 4.5 4.5" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 6.5h15M9.5 6.5v-2h5v2M6.5 6.5l1 14h9l1-14" />
      <path d="M10 10.5v6M14 10.5v6" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="12" height="12" rx="1.5" />
      <path d="M5.5 15.5h-2v-12h12v2" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="1.5" />
      <path d="M3.5 9.5h17M8 2.5V6M16 2.5V6" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14.5" rx="1.5" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </>
  ),
  phone: (
    <path d="M5 4h4l1.5 4.5L8 10a13 13 0 0 0 6 6l1.5-2.5L20 15v4a1.5 1.5 0 0 1-1.7 1.5C10 19.5 4.5 14 3.5 5.7A1.5 1.5 0 0 1 5 4Z" />
  ),
  link: (
    <>
      <path d="M10 14a4.5 4.5 0 0 0 6.4.4l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.5 1.5" />
      <path d="M14 10a4.5 4.5 0 0 0-6.4-.4l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.5-1.5" />
    </>
  ),
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  kanban: (
    <>
      <rect x="3.5" y="4" width="5" height="16" rx="1" />
      <rect x="9.8" y="4" width="5" height="11" rx="1" />
      <rect x="16" y="4" width="5" height="7" rx="1" />
    </>
  ),
  list: <path d="M8.5 6h12M8.5 12h12M8.5 18h12M4 6h.1M4 12h.1M4 18h.1" />,
  more: <path d="M5 12h.1M12 12h.1M19 12h.1" />,
  grip: <path d="M9 6h.1M9 12h.1M9 18h.1M15 6h.1M15 12h.1M15 18h.1" />,
  download: (
    <>
      <path d="M12 4v12m-5-5 5 5 5-5" />
      <path d="M4 16.5V20h16v-3.5" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M19 14v6H4V5h6" />
    </>
  ),
  logout: (
    <>
      <path d="M9 4H4v16h5" />
      <path d="M15 8.5 18.5 12 15 15.5M18.5 12H9" />
    </>
  ),
  building: (
    <>
      <path d="M4.5 20.5v-16h9v16" />
      <path d="M13.5 9h6v11.5" />
      <path d="M4.5 20.5h16" />
      <path d="M7.5 8h3M7.5 11.5h3M7.5 15h3M16 12.5h1.5M16 16h1.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 5.5v6c0 4.5 3 7.5 7 9.5 4-2 7-5 7-9.5v-6L12 3Z" />
      <path d="m9 11.5 2.3 2.3L15.5 9" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.8" />
      <circle cx="12" cy="12" r="1.2" />
    </>
  ),
  zap: <path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12l1-8Z" />,
  activity: <path d="M3 12h4l2.5-7 5 14 2.5-7h4" />,
  archive: (
    <>
      <rect x="3.5" y="4" width="17" height="5" rx="1" />
      <path d="M5.5 9v11h13V9" />
      <path d="M10 13h4" />
    </>
  ),
  inbox: (
    <>
      <path d="M3.5 13.5 6 5h12l2.5 8.5v6h-17z" />
      <path d="M3.5 13.5H9a3 3 0 0 0 6 0h5.5" />
    </>
  ),
  euro: (
    <>
      <path d="M17.5 6.5A7 7 0 0 0 7 12a7 7 0 0 0 10.5 5.5" />
      <path d="M4.5 10.5h8M4.5 13.5h8" />
    </>
  ),
  doc: (
    <>
      <path d="M6 3.5h8.5L19 8v12.5H6z" />
      <path d="M14.5 3.5V8H19" />
    </>
  ),
  plug: (
    <>
      <path d="M9 7V3M15 7V3" />
      <path d="M6.5 7h11v4a5.5 5.5 0 0 1-11 0V7Z" />
      <path d="M12 16.5V21" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="1.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      <path d="M12 14.5v2.5" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15.5" r="4.5" />
      <path d="m11.5 12 8.5-8.5M17 7l3 3M14 10l2 2" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 5v5h-5" />
      <path d="M20 10a8.5 8.5 0 1 0 2 5.5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.3 3.8 5.2 3.8 8.5s-1.3 6.2-3.8 8.5c-2.5-2.3-3.8-5.2-3.8-8.5s1.3-6.2 3.8-8.5Z" />
    </>
  ),
};

export type IconName = keyof typeof P;

export function Icon({
  name,
  size = 16,
  className = "",
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {P[name]}
    </svg>
  );
}
