"use client";

/* ================================================================
   Shared marketing building blocks: scroll reveals, section intros,
   link-styled CTAs. Every landing/product/pricing section composes
   these so the rhythm stays consistent.
   ================================================================ */

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cx } from "@/lib/format";
import { EASE, itemVariants, listVariants } from "@/lib/motion";

/** Standard whileInView viewport per the build contract. */
export const VIEWPORT = { once: true, margin: "-80px" } as const;

/** Single-element scroll reveal. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.55, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Staggered container — pair with <RevealItem>. */
export function RevealList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={listVariants}
      initial="initial"
      whileInView="animate"
      viewport={VIEWPORT}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

/** Section heading block: mono overline, display title, lede. */
export function SectionIntro({
  overline,
  title,
  lede,
  center,
  className,
}: {
  overline: string;
  title: string;
  lede?: string;
  center?: boolean;
  className?: string;
}) {
  return (
    <Reveal className={cx(center && "mx-auto text-center", className)}>
      <p className="microlabel">{overline}</p>
      <h2 className="mt-2.5 max-w-2xl font-display text-[26px] leading-[1.12] font-medium tracking-tight text-ink sm:text-[30px]">
        {title}
      </h2>
      {lede && (
        <p
          className={cx(
            "mt-3 max-w-xl text-[14px] leading-relaxed text-ink-mute",
            center && "mx-auto"
          )}
        >
          {lede}
        </p>
      )}
    </Reveal>
  );
}

/** Link styled like the Button primitive (for href CTAs). */
export function LinkButton({
  href,
  children,
  variant = "secondary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const variants = {
    primary:
      "bg-accent text-on-accent border border-transparent hover:bg-accent-hover shadow-e1",
    secondary:
      "bg-raised text-ink border border-line hover:border-line-strong hover:bg-overlay",
    ghost:
      "bg-transparent text-ink-mute border border-transparent hover:text-ink hover:bg-accent-soft/50",
  } as const;
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex h-8.5 items-center justify-center gap-1.5 rounded-md px-3.5 text-[13px] font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow] duration-150",
        variants[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}

/** Big number + mono label, for proof strips. */
export function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="tnum font-display text-[19px] font-medium tracking-tight text-ink">
        {value}
      </span>
      <span className="microlabel">{label}</span>
    </div>
  );
}

/** Standard max-width section wrapper. */
export function MarketingSection({
  id,
  children,
  className,
  inner,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  inner?: string;
}) {
  return (
    <section id={id} className={cx("scroll-mt-20", className)}>
      <div className={cx("mx-auto max-w-6xl px-5", inner)}>{children}</div>
    </section>
  );
}
