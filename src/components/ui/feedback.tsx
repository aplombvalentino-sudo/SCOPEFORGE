"use client";

/* Skeletons, empty states, and the toast system. */

import { create } from "zustand";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { cx } from "@/lib/format";
import { Icon, type IconName } from "./icons";
import { Button } from "./primitives";

/* ---------- Skeleton ---------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton", className)} aria-hidden />;
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 p-4" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-10" />
        </div>
      ))}
    </div>
  );
}

/* ---------- Empty state ---------- */

export function EmptyState({
  icon = "inbox",
  title,
  body,
  action,
  className,
}: {
  icon?: IconName;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        className
      )}
    >
      <div className="blueprint relative flex h-16 w-16 items-center justify-center rounded-xl border border-line bg-inset">
        <Icon name={icon} size={22} className="text-ink-faint" />
      </div>
      <h3 className="mt-4 font-display text-[15px] font-medium tracking-tight">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-mute">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---------- Toasts ---------- */

export interface Toast {
  id: number;
  kind: "success" | "error" | "info";
  title: string;
  body?: string;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

let toastId = 0;

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, 4200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

/** Convenience: const toast = useToast(); toast.success("Saved") */
export function useToast() {
  const push = useToasts((s) => s.push);
  return {
    success: (title: string, body?: string) => push({ kind: "success", title, body }),
    error: (title: string, body?: string) => push({ kind: "error", title, body }),
    info: (title: string, body?: string) => push({ kind: "info", title, body }),
  };
}

const toastIcons: Record<Toast["kind"], IconName> = {
  success: "check",
  error: "alert-triangle",
  info: "sparkle",
};

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-80 flex-col gap-2"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex items-start gap-2.5 rounded-lg border border-line bg-overlay px-3.5 py-3 shadow-e2"
          >
            <span
              className={cx(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                t.kind === "success" && "bg-ok-soft text-ok",
                t.kind === "error" && "bg-danger-soft text-danger",
                t.kind === "info" && "bg-accent-soft text-accent"
              )}
            >
              <Icon name={toastIcons[t.kind]} size={11} strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-ink">{t.title}</p>
              {t.body && <p className="mt-0.5 text-[12px] leading-snug text-ink-mute">{t.body}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="text-ink-faint transition-colors hover:text-ink"
            >
              <Icon name="x" size={12} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Inline error / system error panel ---------- */

export function ErrorPanel({
  title = "Something went wrong",
  body,
  retry,
}: {
  title?: string;
  body?: string;
  retry?: () => void;
}) {
  return (
    <div className="panel flex flex-col items-center px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-danger/25 bg-danger-soft">
        <Icon name="alert-triangle" size={20} className="text-danger" />
      </div>
      <h3 className="mt-3.5 font-display text-[15px] font-medium">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-[13px] text-ink-mute">{body}</p>}
      {retry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}
