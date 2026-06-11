"use client";

/* Onboarding task board — five titled lanes grouped by task.group.
   Toggling a task that completes its lane fires a lane-complete toast. */

import { motion } from "framer-motion";
import { teamById } from "@/lib/demo-data";
import { cx, dueIn, shortDate } from "@/lib/format";
import { itemVariants, listVariants } from "@/lib/motion";
import { useApp } from "@/lib/store";
import type { OnboardingFlow, OnboardingTask } from "@/lib/types";
import { useToast } from "@/components/ui/feedback";
import { CheckItem } from "@/components/ui/fields";
import { Icon, type IconName } from "@/components/ui/icons";
import { Avatar } from "@/components/ui/primitives";

type TaskGroup = OnboardingTask["group"];

const GROUP_ORDER: TaskGroup[] = ["kickoff", "access", "assets", "internal", "client"];

const GROUP_META: Record<
  TaskGroup,
  { label: string; blurb: string; icon: IconName; doneNote: string }
> = {
  kickoff: {
    label: "Kickoff",
    blurb: "Contract, deposit, momentum — the first 72 hours.",
    icon: "zap",
    doneNote: "Signature, deposit, and kickoff ceremony all closed.",
  },
  access: {
    label: "Access",
    blurb: "Credentials and system access before build starts.",
    icon: "shield",
    doneNote: "Every system reachable — build is unblocked.",
  },
  assets: {
    label: "Assets",
    blurb: "Source material the project cannot run without.",
    icon: "doc",
    doneNote: "Nothing left waiting in the client's drive.",
  },
  internal: {
    label: "Internal",
    blurb: "Atelier North side — handoff, environments, prep.",
    icon: "building",
    doneNote: "Handoff and environments squared away.",
  },
  client: {
    label: "Client",
    blurb: "Client-owed actions. Chase early, chase in writing.",
    icon: "leads",
    doneNote: "Client-owed list cleared — no chasing this week.",
  },
};

/** Absolute due date for a task: kickoff date + dueInDays. */
function taskDueIso(kickoffDate: string, days: number): string {
  const d = new Date(kickoffDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function DueChip({ kickoffDate, task }: { kickoffDate: string; task: OnboardingTask }) {
  const iso = taskDueIso(kickoffDate, task.dueInDays);
  if (task.done) {
    return (
      <span className="tnum inline-flex items-center gap-1 rounded-sm border border-line bg-inset px-1.5 py-px font-mono text-[10px] text-ink-faint">
        <Icon name="check" size={9} />
        {shortDate(iso)}
      </span>
    );
  }
  const due = dueIn(iso);
  return (
    <span
      className={cx(
        "tnum inline-flex items-center gap-1 rounded-sm border px-1.5 py-px font-mono text-[10px]",
        due.overdue
          ? "border-danger/25 bg-danger-soft text-danger"
          : "border-line bg-inset text-ink-mute"
      )}
    >
      <Icon name="clock" size={9} />
      {due.label}
    </span>
  );
}

export function TaskBoard({ flow }: { flow: OnboardingFlow }) {
  const toggleOnboardingTask = useApp((s) => s.toggleOnboardingTask);
  const toast = useToast();

  function handleToggle(task: OnboardingTask) {
    const completesGroup =
      !task.done &&
      flow.tasks
        .filter((t) => t.group === task.group && t.id !== task.id)
        .every((t) => t.done);
    toggleOnboardingTask(flow.id, task.id);
    if (completesGroup) {
      const meta = GROUP_META[task.group];
      toast.success(`${meta.label} checklist complete`, meta.doneNote);
    }
  }

  return (
    <motion.div
      variants={listVariants}
      initial="initial"
      animate="animate"
      className="grid gap-3 sm:grid-cols-2"
    >
      {GROUP_ORDER.map((group) => {
        const meta = GROUP_META[group];
        const tasks = flow.tasks.filter((t) => t.group === group);
        const done = tasks.filter((t) => t.done).length;
        const isClient = group === "client";
        return (
          <motion.section
            key={group}
            variants={itemVariants}
            layout
            className={cx(
              "panel overflow-hidden",
              isClient && "border-l-2 border-warn/35 border-l-warn/70 sm:col-span-2"
            )}
          >
            <header
              className={cx(
                "flex items-center justify-between gap-2 border-b border-line px-4 py-2.5",
                isClient && "bg-warn-soft/40"
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Icon
                  name={meta.icon}
                  size={13}
                  className={isClient ? "text-warn" : "text-ink-faint"}
                />
                <h3 className="font-display text-[13.5px] font-medium tracking-tight text-ink">
                  {meta.label}
                </h3>
                {isClient && <span className="microlabel !text-warn">Client-owed</span>}
              </div>
              <span className="tnum font-mono text-[11px] text-ink-faint">
                {done}/{tasks.length}
              </span>
            </header>
            <p className="px-4 pt-2.5 text-[11.5px] leading-snug text-ink-faint">{meta.blurb}</p>
            {tasks.length === 0 ? (
              <p className="px-4 pt-2 pb-3.5 text-[12px] text-ink-faint italic">
                No tasks in this lane.
              </p>
            ) : (
              <div className="p-2">
                {tasks.map((task) => {
                  const owner = task.ownerId ? teamById[task.ownerId] : undefined;
                  return (
                    <CheckItem
                      key={task.id}
                      checked={task.done}
                      onChange={() => handleToggle(task)}
                    >
                      <span className="block">{task.title}</span>
                      <span className="mt-1 flex items-center gap-1.5">
                        {owner && (
                          <Avatar
                            initials={owner.initials}
                            size={16}
                            title={`${owner.name} — ${owner.role}`}
                          />
                        )}
                        <DueChip kickoffDate={flow.kickoffDate} task={task} />
                      </span>
                    </CheckItem>
                  );
                })}
              </div>
            )}
          </motion.section>
        );
      })}
    </motion.div>
  );
}
