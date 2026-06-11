"use client";

/* ================================================================
   "Needs your attention" — the dashboard action queue.
   Assembled live from the store: due/overdue follow-ups, blocked
   brief questions, open change orders, unanalyzed intake.
   ================================================================ */

import Link from "next/link";
import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { cx, DEMO_NOW, dueIn, money, timeAgo } from "@/lib/format";
import { itemVariants, listVariants } from "@/lib/motion";
import { Icon, type IconName } from "@/components/ui/icons";
import { Badge, type Tone } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/feedback";
import { DashPanel } from "./panel";

interface QueueItem {
  id: string;
  icon: IconName;
  iconClass: string;
  title: string;
  meta: string;
  chip: { label: string; tone: Tone };
  href: string;
  /** trailing call-to-action label replacing the chevron (e.g. "Run analysis") */
  cta?: string;
  priority: number;
  sortAt: string;
}

function firstSentence(text: string): string {
  const idx = text.indexOf(". ");
  return idx > 0 ? text.slice(0, idx + 1) : text;
}

export function AttentionQueue() {
  const leads = useApp((s) => s.leads);
  const briefs = useApp((s) => s.briefs);
  const followUps = useApp((s) => s.followUps);
  const changeOrders = useApp((s) => s.changeOrders);
  const analyzingLeadId = useApp((s) => s.analyzingLeadId);

  const leadById = new Map(leads.map((l) => [l.id, l]));
  const todayKey = DEMO_NOW.toISOString().slice(0, 10);
  const items: QueueItem[] = [];

  /* Follow-ups due today or overdue */
  for (const f of followUps) {
    if (f.status === "done" || f.status === "skipped") continue;
    const due = dueIn(f.dueAt);
    const dueToday = f.dueAt.slice(0, 10) <= todayKey;
    if (!due.overdue && !dueToday) continue;
    const company = leadById.get(f.leadId)?.company ?? "Unknown lead";
    items.push({
      id: `q-${f.id}`,
      icon: "follow-up",
      iconClass: due.overdue ? "bg-danger-soft text-danger" : "bg-warn-soft text-warn",
      title: `Send follow-up #${f.sequenceStep} to ${company}`,
      meta: firstSentence(f.reason),
      chip: { label: due.label, tone: due.overdue ? "danger" : "warn" },
      href: "/follow-ups",
      priority: due.overdue ? 0 : 1,
      sortAt: f.dueAt,
    });
  }

  /* Intake waiting on analysis */
  for (const l of leads) {
    if (l.stage !== "intake" || l.intakeAnalysis) continue;
    items.push({
      id: `q-intake-${l.id}`,
      icon: "sparkle",
      iconClass: "bg-accent-soft text-accent",
      title: `Run intake analysis on ${l.company}`,
      meta: l.summary,
      chip: { label: `new ${timeAgo(l.createdAt)}`, tone: "accent" },
      href: `/leads/${l.id}`,
      cta: analyzingLeadId === l.id ? "Analyzing…" : "Run analysis",
      priority: 2,
      sortAt: l.createdAt,
    });
  }

  /* Briefs with unanswered questions */
  for (const b of briefs) {
    const open = b.openQuestions.filter((q) => !q.answered);
    if (open.length === 0) continue;
    const company = leadById.get(b.leadId)?.company ?? "Unknown lead";
    const blocking = b.status === "needs_clarification";
    items.push({
      id: `q-brief-${b.id}`,
      icon: "brief",
      iconClass: blocking ? "bg-warn-soft text-warn" : "bg-info-soft text-info",
      title: `${open.length} unanswered brief question${open.length === 1 ? "" : "s"} — ${company}`,
      meta: open[0].question,
      chip: blocking
        ? { label: "blocks scoping", tone: "warn" }
        : { label: "draft brief", tone: "neutral" },
      href: `/briefs/${b.id}`,
      priority: blocking ? 3 : 5,
      sortAt: b.updatedAt,
    });
  }

  /* Open change orders awaiting send */
  for (const c of changeOrders) {
    if (c.status !== "open") continue;
    items.push({
      id: `q-co-${c.id}`,
      icon: "change-order",
      iconClass: "bg-warn-soft text-warn",
      title: `Send pre-priced change order — ${c.projectName} (${money(c.price)})`,
      meta: `${c.requestedBy} · ${c.classification.replace(/_/g, " ")} · received ${timeAgo(c.receivedAt)}`,
      chip: { label: "awaiting send", tone: "info" },
      href: "/change-orders",
      priority: 4,
      sortAt: c.receivedAt,
    });
  }

  items.sort((a, b) => a.priority - b.priority || a.sortAt.localeCompare(b.sortAt));

  const breakdown: Array<[number, string, string]> = [
    [items.filter((i) => i.icon === "follow-up").length, "follow-up", "follow-ups"],
    [items.filter((i) => i.icon === "sparkle").length, "intake", "intakes"],
    [items.filter((i) => i.icon === "brief").length, "brief", "briefs"],
    [items.filter((i) => i.icon === "change-order").length, "change order", "change orders"],
  ];
  const caption = breakdown
    .filter(([n]) => n > 0)
    .map(([n, one, many]) => `${n} ${n === 1 ? one : many}`)
    .join(" · ");

  return (
    <DashPanel
      title="Needs your attention"
      caption={items.length === 0 ? "Queue is clear" : `${caption} — ordered by urgency`}
      bodyClassName="px-1.5 py-1.5"
      className="h-full"
    >
      {items.length === 0 ? (
        <EmptyState
          icon="check"
          title="Queue cleared"
          body="Nothing is waiting on you. Due follow-ups, blocked briefs, open change orders, and fresh intake surface here automatically."
        />
      ) : (
        <motion.ul
          variants={listVariants}
          initial="initial"
          animate="animate"
          className="divide-y divide-line/60"
        >
          {items.map((item) => (
            <motion.li key={item.id} variants={itemVariants} layout>
              <Link
                href={item.href}
                className="group flex items-center gap-3 rounded-md px-2.5 py-2.5 transition-colors duration-150 hover:bg-overlay/70"
              >
                <span
                  className={cx(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                    item.iconClass
                  )}
                >
                  <Icon name={item.icon} size={14} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-ink-mute">
                    {item.meta}
                  </span>
                </span>
                <Badge tone={item.chip.tone} className="hidden shrink-0 sm:inline-flex">
                  {item.chip.label}
                </Badge>
                {item.cta ? (
                  <span className="flex shrink-0 items-center gap-1 text-[12px] font-medium text-accent">
                    {item.cta}
                    <Icon
                      name="arrow-right"
                      size={12}
                      className="transition-transform duration-150 group-hover:translate-x-0.5"
                    />
                  </span>
                ) : (
                  <Icon
                    name="chevron-right"
                    size={14}
                    className="shrink-0 text-ink-faint transition-[transform,color] duration-150 group-hover:translate-x-0.5 group-hover:text-ink-mute"
                  />
                )}
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </DashPanel>
  );
}
