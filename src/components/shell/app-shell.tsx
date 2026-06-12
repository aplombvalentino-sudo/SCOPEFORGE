"use client";

/* ================================================================
   Authenticated app chrome: sidebar, topbar, command palette.
   Sidebar is fixed on desktop, slides over on < lg screens.
   ================================================================ */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { cx } from "@/lib/format";
import { useApp } from "@/lib/store";
import { Icon, type IconName } from "@/components/ui/icons";
import { Avatar, Kbd } from "@/components/ui/primitives";
import { Menu } from "@/components/ui/overlays";
import { Toaster } from "@/components/ui/feedback";
import { ThemeToggle } from "@/components/theme";
import { CommandPalette } from "./command-palette";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Pipeline",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/leads", label: "Leads", icon: "leads" },
      { href: "/follow-ups", label: "Follow-ups", icon: "follow-up" },
    ],
  },
  {
    label: "Build",
    items: [
      { href: "/briefs", label: "Briefs", icon: "brief" },
      { href: "/scopes", label: "Scopes", icon: "scope" },
      { href: "/proposals", label: "Proposals", icon: "proposal" },
    ],
  },
  {
    label: "Delivery",
    items: [
      { href: "/onboarding", label: "Onboarding", icon: "onboarding" },
      { href: "/change-orders", label: "Change orders", icon: "change-order" },
    ],
  },
  {
    label: "Library",
    items: [
      { href: "/templates", label: "Templates", icon: "template" },
      { href: "/services", label: "Services", icon: "service" },
    ],
  },
  {
    label: "Insight",
    items: [
      { href: "/analytics", label: "Analytics", icon: "analytics" },
      { href: "/activity", label: "Activity", icon: "activity" },
    ],
  },
  {
    label: "Platform",
    items: [{ href: "/integrations", label: "Integrations", icon: "plug" }],
  },
];

/* ---------- Logo ---------- */

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      {/* forge mark: stacked strata with an accent edge */}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 6h16v3.5H4z" fill="var(--accent)" />
        <path d="M7 11.5h13V15H7z" fill="var(--ink-mute)" opacity="0.55" />
        <path d="M10 17h10v3.5H10z" fill="var(--ink-faint)" opacity="0.5" />
      </svg>
      {!compact && (
        <span className="font-display text-[14px] font-semibold tracking-[0.14em] text-ink">
          SCOPEFORGE
        </span>
      )}
    </span>
  );
}

/* ---------- Sidebar nav link ---------- */

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cx(
        "group relative flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors duration-150",
        active ? "text-ink" : "text-ink-mute hover:bg-overlay/70 hover:text-ink"
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 rounded-md border border-line bg-overlay shadow-e1"
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2.5">
        <Icon
          name={item.icon}
          size={15}
          className={cx(
            "transition-colors duration-150",
            active ? "text-accent" : "text-ink-faint group-hover:text-ink-mute"
          )}
        />
        {item.label}
      </span>
    </Link>
  );
}

/* ---------- Sidebar ---------- */

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const workspace = useApp((s) => s.workspace);
  const unread = useApp((s) => s.notifications.filter((n) => !n.read).length);
  const router = useRouter();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <Link href="/dashboard" aria-label="SCOPEFORGE dashboard" onClick={onNavigate}>
          <Wordmark />
        </Link>
      </div>

      <div className="mx-4 mb-3 flex items-center gap-2.5 rounded-lg border border-line bg-overlay/50 px-2.5 py-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-soft font-mono text-[10px] font-semibold text-accent">
          AN
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] leading-tight font-medium text-ink">
            {workspace.name}
          </p>
          <p className="microlabel !text-[9px]">{workspace.plan} plan</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-4" aria-label="Main navigation">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="microlabel mb-1.5 px-2.5">{section.label}</p>
            <div className="space-y-px">
              {section.items.map((item) => (
                <NavLink key={item.href} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-line px-4 py-3">
        <div className="space-y-px">
          <Link
            href="/notifications"
            onClick={onNavigate}
            className="flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium text-ink-mute transition-colors duration-150 hover:bg-overlay/70 hover:text-ink"
          >
            <Icon name="bell" size={15} className="text-ink-faint" />
            Notifications
            {unread > 0 && (
              <span className="tnum ml-auto flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-semibold text-on-accent">
                {unread}
              </span>
            )}
          </Link>
          <Link
            href="/settings"
            onClick={onNavigate}
            className="flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium text-ink-mute transition-colors duration-150 hover:bg-overlay/70 hover:text-ink"
          >
            <Icon name="settings" size={15} className="text-ink-faint" />
            Settings
          </Link>
          <Link
            href="/help"
            onClick={onNavigate}
            className="flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium text-ink-mute transition-colors duration-150 hover:bg-overlay/70 hover:text-ink"
          >
            <Icon name="help" size={15} className="text-ink-faint" />
            Help & docs
          </Link>
        </div>

        <div className="mt-3 flex items-center gap-2.5 border-t border-line pt-3">
          <Avatar initials="ML" size={28} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] leading-tight font-medium">Maya Lindqvist</p>
            <p className="truncate text-[11px] text-ink-faint">maya@ateliernorth.dk</p>
          </div>
          <Menu
            align="end"
            side="top"
            trigger={
              <button
                aria-label="Account menu"
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-overlay hover:text-ink"
              >
                <Icon name="more" size={15} />
              </button>
            }
            items={[
              { label: "Profile settings", onSelect: () => router.push("/settings?tab=profile") },
              { label: "Billing", onSelect: () => router.push("/settings?tab=billing") },
              { label: "Sign out", onSelect: () => router.push("/login"), danger: true },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- Shell ---------- */

export function AppShell({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="min-h-dvh bg-bg">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[228px] border-r border-line bg-surface lg:block">
        <SidebarContent />
      </aside>

      {/* mobile sidebar */}
      <AnimatePresence>
        {mobileNav && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileNav(false)}
            />
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 w-[238px] border-r border-line bg-surface"
            >
              <SidebarContent onNavigate={() => setMobileNav(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* main column */}
      <div className="lg:pl-[228px]">
        {/* topbar */}
        <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur-md lg:px-6">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink-mute lg:hidden"
            onClick={() => setMobileNav(true)}
            aria-label="Open navigation"
          >
            <Icon name="list" size={15} />
          </button>

          <button
            onClick={() => setPaletteOpen(true)}
            className="group flex h-8 flex-1 items-center gap-2 rounded-md border border-line bg-inset/60 px-3 text-[12.5px] text-ink-faint transition-colors duration-150 hover:border-line-strong hover:text-ink-mute sm:max-w-72"
          >
            <Icon name="search" size={13} />
            <span className="flex-1 text-left">Search or jump to…</span>
            <span className="hidden items-center gap-0.5 sm:flex">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/leads?new=1"
              className="flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-[12.5px] font-medium text-on-accent shadow-e1 transition-colors duration-150 hover:bg-accent-hover"
            >
              <Icon name="plus" size={13} strokeWidth={2.2} />
              New lead
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-8">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <Toaster />
    </div>
  );
}
