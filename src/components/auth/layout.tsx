"use client";

/* ================================================================
   AuthSplit — the shared spatial frame for /login and /signup:
   form column (~440px) on the left, the layered AuthScene filling
   the right on lg+, a compact scene band on small screens. The
   card and scene carry shared layoutIds so the login↔signup
   transition reads as one continuous composition.
   ================================================================ */

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/shell/app-shell";
import { AuthScene } from "./scene";

export function AuthSplit({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col lg:min-h-[calc(100dvh-57px)] lg:flex-row">
      {/* compact scene band — small screens */}
      <div className="relative h-44 w-full overflow-hidden border-b border-line lg:hidden">
        <AuthScene compact />
      </div>

      {/* form column */}
      <div className="flex w-full flex-col items-center justify-center px-5 py-10 lg:w-[440px] lg:shrink-0 lg:px-9">
        <motion.div
          layoutId="auth-card"
          className="panel-raised w-full max-w-[400px] px-6 py-7 shadow-e2"
        >
          {children}
        </motion.div>
        <p className="mt-5 w-full max-w-[400px] text-center font-mono text-[9.5px] tracking-[0.09em] text-ink-faint uppercase">
          SOC 2 in progress · EU data residency · No passwords stored client-side
        </p>
      </div>

      {/* spatial scene — lg+ */}
      <motion.div
        layoutId="auth-scene"
        className="relative hidden flex-1 overflow-hidden border-l border-line lg:block"
      >
        <AuthScene />
      </motion.div>
    </div>
  );
}

export function AuthCardHeader({
  microlabel,
  title,
  lede,
}: {
  microlabel: string;
  title: string;
  lede?: string;
}) {
  return (
    <div>
      <Link href="/" aria-label="Scopeforge home" className="inline-flex">
        <Wordmark />
      </Link>
      <p className="microlabel mt-5">{microlabel}</p>
      <h1 className="mt-1.5 font-display text-[19px] font-medium tracking-tight text-ink">
        {title}
      </h1>
      {lede && (
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-mute">{lede}</p>
      )}
    </div>
  );
}

export function HairlineDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3" aria-hidden>
      <span className="h-px flex-1 bg-line" />
      <span className="microlabel">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
