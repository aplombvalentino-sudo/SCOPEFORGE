"use client";

/* ================================================================
   /notifications — the workspace inbox. Unread carry an accent
   edge; clicking marks read and jumps to the underlying record.
   ================================================================ */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { cx, timeAgo } from "@/lib/format";
import { itemVariants, listVariants } from "@/lib/motion";
import { PageHeader, PageTransition } from "@/components/ui/page";
import { Tabs, type TabDef } from "@/components/ui/tabs";
import { Button } from "@/components/ui/primitives";
import { Icon, type IconName } from "@/components/ui/icons";
import { EmptyState, useToast } from "@/components/ui/feedback";
import type { AppNotification } from "@/lib/types";

type FilterTab = "all" | "unread" | "alerts";

const KIND_META: Record<AppNotification["kind"], { icon: IconName; chipClass: string }> = {
  alert: { icon: "alert-triangle", chipClass: "bg-warn-soft text-warn" },
  info: { icon: "bell", chipClass: "bg-info-soft text-info" },
  success: { icon: "check", chipClass: "bg-ok-soft text-ok" },
};

const EMPTY_BODY: Record<FilterTab, string> = {
  all: "Proposal views, scope risks, inbound leads, and onboarding signals will land here as they happen.",
  unread:
    "Every notification has been read. New proposal views, scope alerts, and inbound leads will surface here the moment they happen.",
  alerts:
    "No live alerts. Scope risks, stale clarifications, and SLA-critical inbound raise alerts the moment they are detected.",
};

export default function NotificationsPage() {
  const router = useRouter();
  const toast = useToast();
  const notifications = useApp((s) => s.notifications);
  const markNotificationRead = useApp((s) => s.markNotificationRead);
  const markAllNotificationsRead = useApp((s) => s.markAllNotificationsRead);

  const [tab, setTab] = useState<FilterTab>("all");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const alertCount = notifications.filter((n) => n.kind === "alert").length;

  const tabs: TabDef<FilterTab>[] = [
    { value: "all", label: "All", count: notifications.length },
    { value: "unread", label: "Unread", count: unreadCount },
    { value: "alerts", label: "Alerts", count: alertCount },
  ];

  const filtered = notifications.filter((n) =>
    tab === "unread" ? !n.read : tab === "alerts" ? n.kind === "alert" : true
  );

  const handleMarkAll = () => {
    if (unreadCount === 0) return;
    markAllNotificationsRead();
    toast.success(
      "Inbox cleared",
      `${unreadCount} notification${unreadCount === 1 ? "" : "s"} marked read.`
    );
  };

  const handleOpen = (n: AppNotification) => {
    markNotificationRead(n.id);
    if (n.href) router.push(n.href);
  };

  return (
    <PageTransition>
      <PageHeader
        overline="WORKSPACE / NOTIFICATIONS"
        title="Notifications"
        description="Everything that moved without you — proposal views, scope risks, inbound leads, onboarding signals. Click through to act on the record."
        actions={
          <Button variant="secondary" onClick={handleMarkAll} disabled={unreadCount === 0}>
            <Icon name="check" size={13} />
            Mark all read
          </Button>
        }
      />

      <Tabs tabs={tabs} value={tab} onChange={setTab} className="mb-4" />

      {filtered.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon="inbox"
            title="Inbox zero — nothing needs you."
            body={EMPTY_BODY[tab]}
            action={
              tab !== "all" && notifications.length > 0 ? (
                <Button variant="ghost" size="sm" onClick={() => setTab("all")}>
                  View all notifications
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <motion.ul
          key={tab}
          variants={listVariants}
          initial="initial"
          animate="animate"
          className="panel divide-y divide-line overflow-hidden"
        >
          {filtered.map((n) => (
            <motion.li key={n.id} variants={itemVariants} layout>
              <button
                type="button"
                onClick={() => handleOpen(n)}
                className={cx(
                  "group relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-overlay/70",
                  !n.read && "bg-accent-soft/20"
                )}
              >
                {!n.read && (
                  <span
                    aria-hidden
                    className="absolute top-2.5 bottom-2.5 left-0 w-0.5 rounded-r-full bg-accent"
                  />
                )}
                <span
                  className={cx(
                    "mt-0.5 flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-md",
                    KIND_META[n.kind].chipClass
                  )}
                >
                  <Icon name={KIND_META[n.kind].icon} size={13} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span
                      className={cx(
                        "truncate text-[13px]",
                        n.read ? "text-ink-mute" : "font-medium text-ink"
                      )}
                    >
                      {n.title}
                    </span>
                    <span className="tnum shrink-0 font-mono text-[10.5px] tracking-wide text-ink-faint">
                      {timeAgo(n.at)}
                    </span>
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-snug text-ink-mute">
                    {n.body}
                  </span>
                </span>
                <Icon
                  name="chevron-right"
                  size={13}
                  className="mt-1.5 shrink-0 text-ink-faint opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-x-0.5 group-hover:opacity-100"
                />
              </button>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </PageTransition>
  );
}
