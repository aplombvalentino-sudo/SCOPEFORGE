"use client";

/* ================================================================
   Form controls: Field wrapper, Input, Textarea, Select, Toggle.
   All controls share the same border/focus treatment.
   ================================================================ */

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cx } from "@/lib/format";
import { Icon } from "./icons";

const controlBase =
  "w-full rounded-md border border-line bg-inset text-[13px] text-ink placeholder:text-ink-faint transition-colors duration-150 hover:border-line-strong focus:border-accent-line focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50";

/* ---------- Field wrapper ---------- */

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="microlabel">
        {label}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-[12px] text-danger">
          <Icon name="alert-triangle" size={12} />
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}

/* ---------- Input ---------- */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      className={cx(
        controlBase,
        "h-8.5 px-3",
        invalid && "border-danger/50 focus:border-danger/60 focus:ring-danger/15",
        className
      )}
      {...rest}
    />
  );
});

/* ---------- Textarea ---------- */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cx(
          controlBase,
          "min-h-20 px-3 py-2 leading-relaxed",
          invalid && "border-danger/50",
          className
        )}
        {...rest}
      />
    );
  }
);

/* ---------- Select ---------- */

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, children, ...rest },
  ref
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cx(
          controlBase,
          "h-8.5 appearance-none pr-8 pl-3",
          invalid && "border-danger/50",
          className
        )}
        {...rest}
      >
        {children}
      </select>
      <Icon
        name="chevron-down"
        size={13}
        className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-ink-faint"
      />
    </div>
  );
});

/* ---------- Toggle ---------- */

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative h-[18px] w-8 shrink-0 rounded-full border transition-colors duration-200 disabled:opacity-50",
        checked ? "border-accent-line bg-accent" : "border-line-strong bg-inset"
      )}
    >
      <span
        className={cx(
          "absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full transition-[left,background-color] duration-200",
          checked ? "left-[calc(100%-15px)] bg-on-accent" : "left-0.5 bg-ink-faint"
        )}
      />
    </button>
  );
}

/* ---------- Checkbox row (tasks) ---------- */

export function CheckItem({
  checked,
  onChange,
  children,
  className,
}: {
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className={cx(
        "group flex w-full items-start gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors duration-150 hover:bg-overlay",
        className
      )}
    >
      <span
        className={cx(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-all duration-150",
          checked
            ? "border-accent bg-accent text-on-accent"
            : "border-line-strong bg-inset group-hover:border-accent-line"
        )}
      >
        {checked && <Icon name="check" size={11} strokeWidth={2.4} />}
      </span>
      <span
        className={cx(
          "text-[13px] leading-snug transition-colors duration-150",
          checked ? "text-ink-faint line-through decoration-line-strong" : "text-ink"
        )}
      >
        {children}
      </span>
    </button>
  );
}
