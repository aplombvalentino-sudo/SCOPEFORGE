"use client";

/* Data table primitives — dense, hairline rows, mono numerics. */

import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cx } from "@/lib/format";

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("overflow-x-auto rounded-lg border border-line bg-surface", className)}>
      <table className="w-full border-collapse text-left text-[13px]">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="border-b border-line bg-inset/60">{children}</thead>;
}

export function TH({
  children,
  className,
  numeric,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <th
      className={cx(
        "microlabel px-3.5 py-2.5 font-medium whitespace-nowrap",
        numeric && "text-right",
        className
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-line">{children}</tbody>;
}

export function TR({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={cx(
        "transition-colors duration-100",
        onClick && "cursor-pointer hover:bg-overlay/70",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TD({
  children,
  className,
  numeric,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td
      className={cx(
        "px-3.5 py-2.5 align-middle",
        numeric && "tnum text-right font-mono text-[12.5px]",
        className
      )}
      {...rest}
    >
      {children}
    </td>
  );
}
