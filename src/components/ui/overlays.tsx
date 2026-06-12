"use client";

/* ================================================================
   Overlays: Modal, Drawer (right sheet), Menu (dropdown).
   All use the shared motion vocabulary and trap focus minimally.
   ================================================================ */

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cx } from "@/lib/format";
import {
  drawerVariants,
  modalVariants,
  overlayVariants,
} from "@/lib/motion";
import { Icon } from "./icons";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);
}

/* ---------- Modal ---------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 520,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  const mounted = useMounted();
  useEscape(open, onClose);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[12vh]">
          <motion.div
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/55 backdrop-blur-[2px]"
            aria-hidden
          />
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            role="dialog"
            aria-modal
            aria-label={title}
            style={{ maxWidth: width }}
            className="relative w-full rounded-xl border border-line bg-raised shadow-e3"
          >
            <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h2 className="font-display text-[15px] font-medium tracking-tight">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-overlay hover:text-ink"
              >
                <Icon name="x" size={14} />
              </button>
            </header>
            <div className="px-5 py-4">{children}</div>
            {footer && (
              <footer className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ---------- Drawer ---------- */

export function Drawer({
  open,
  onClose,
  title,
  meta,
  children,
  footer,
  width = 460,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  const mounted = useMounted();
  useEscape(open, onClose);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-black/45"
            aria-hidden
          />
          <motion.aside
            variants={drawerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            role="dialog"
            aria-modal
            aria-label={title}
            style={{ width: `min(${width}px, calc(100vw - 24px))` }}
            className="absolute top-2 right-2 bottom-2 flex flex-col overflow-hidden rounded-xl border border-line bg-raised shadow-e3"
          >
            <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <h2 className="font-display text-[15px] font-medium tracking-tight">{title}</h2>
                {meta && <div className="mt-1">{meta}</div>}
              </div>
              <button
                onClick={onClose}
                aria-label="Close panel"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-overlay hover:text-ink"
              >
                <Icon name="x" size={14} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && (
              <footer className="flex items-center justify-end gap-2 border-t border-line bg-surface px-5 py-3">
                {footer}
              </footer>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ---------- Menu (dropdown) ---------- */

export interface MenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export function Menu({
  items,
  trigger,
  align = "end",
  side = "bottom",
}: {
  items: MenuItem[];
  trigger: ReactNode;
  align?: "start" | "end";
  /** "top" opens the menu above the trigger — use near the bottom of the viewport */
  side?: "bottom" | "top";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    window.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: side === "top" ? -4 : 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: side === "top" ? -2 : 2, scale: 0.99 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            role="menu"
            className={cx(
              "absolute z-40 min-w-44 overflow-hidden rounded-lg border border-line bg-overlay p-1 shadow-e2",
              side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
              align === "end" ? "right-0" : "left-0"
            )}
          >
            {items.map((item) => (
              <button
                key={item.label}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={cx(
                  "flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors duration-100 disabled:opacity-40",
                  item.danger
                    ? "text-danger hover:bg-danger-soft"
                    : "text-ink hover:bg-accent-soft/60"
                )}
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
