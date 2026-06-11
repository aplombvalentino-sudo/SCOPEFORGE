"use client";

/* ================================================================
   /help — docs-lite. Live-filtered article accordions on the left,
   human contact + product status on the right rail.
   ================================================================ */

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { cx } from "@/lib/format";
import { collapseVariants, itemVariants, listVariants } from "@/lib/motion";
import { PageHeader, PageTransition } from "@/components/ui/page";
import { Input } from "@/components/ui/fields";
import { Button, Kbd } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/feedback";
import { HELP_ARTICLES, type HelpArticle } from "@/components/library/help-articles";

function articleText(a: HelpArticle): string {
  return [
    a.title,
    ...a.paragraphs,
    ...(a.steps?.map((s) => s.text) ?? []),
    a.closing ?? "",
    ...(a.shortcuts?.map((s) => s.label) ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

function ArticleItem({
  article,
  open,
  onToggle,
}: {
  article: HelpArticle;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.article variants={itemVariants} layout className="panel overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-overlay/50"
      >
        <span
          className={cx(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors duration-200",
            open ? "border-accent-line bg-accent-soft" : "border-line bg-inset"
          )}
        >
          <Icon
            name={article.icon}
            size={13}
            className={open ? "text-accent" : "text-ink-faint"}
          />
        </span>
        <span className="flex-1 font-display text-[14px] font-medium tracking-tight text-ink">
          {article.title}
        </span>
        <Icon
          name="chevron-down"
          size={14}
          className={cx(
            "shrink-0 text-ink-faint transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            variants={collapseVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-line px-4 pt-3.5 pb-4">
              {article.paragraphs.map((p) => (
                <p key={p.slice(0, 40)} className="text-[13px] leading-relaxed text-ink-mute">
                  {p}
                </p>
              ))}

              {article.steps && (
                <ol className="space-y-2">
                  {article.steps.map((step, i) => (
                    <li key={step.text.slice(0, 40)} className="flex items-start gap-3">
                      <span className="tnum mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-line bg-inset font-mono text-[10.5px] text-ink-mute">
                        {i + 1}
                      </span>
                      <span className="min-w-0 text-[13px] leading-relaxed text-ink-mute">
                        {step.text}{" "}
                        <Link
                          href={step.href}
                          className="font-mono text-[11px] whitespace-nowrap text-accent transition-colors hover:underline"
                        >
                          {step.href}
                        </Link>
                      </span>
                    </li>
                  ))}
                </ol>
              )}

              {article.closing && (
                <p className="text-[13px] leading-relaxed text-ink-mute">{article.closing}</p>
              )}

              {article.shortcuts && (
                <div className="grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
                  {article.shortcuts.map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center justify-between gap-3 border-b border-line/60 py-1.5"
                    >
                      <span className="min-w-0 text-[12.5px] text-ink-mute">{s.label}</span>
                      <span className="flex shrink-0 gap-1">
                        {s.keys.map((k) => (
                          <Kbd key={k}>{k}</Kbd>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(["start-here"]));

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () => (q ? HELP_ARTICLES.filter((a) => articleText(a).includes(q)) : HELP_ARTICLES),
    [q]
  );

  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <PageTransition>
      <PageHeader
        overline="SUPPORT / HELP"
        title="Help"
        description="Short articles by the people who built the product — the golden path, the guardrails, and the keys."
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <div className="relative mb-3">
            <Icon
              name="search"
              size={14}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search articles — try "exclusions" or "margin floor"'
              className="pl-8.5"
              aria-label="Search help articles"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon="search"
              title={`No articles match "${query.trim()}"`}
              body="Try 'scope', 'margin', or 'follow-up' — or skip the docs and ask a human on the right."
              action={
                <Button variant="ghost" size="sm" onClick={() => setQuery("")}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <>
              <motion.div
                key={q}
                variants={listVariants}
                initial="initial"
                animate="animate"
                className="space-y-2.5"
              >
                {filtered.map((a) => (
                  <ArticleItem
                    key={a.id}
                    article={a}
                    open={openIds.has(a.id)}
                    onToggle={() => toggle(a.id)}
                  />
                ))}
              </motion.div>
              <p className="tnum mt-3 font-mono text-[11px] text-ink-faint">
                {filtered.length} of {HELP_ARTICLES.length} articles
                {q && ` matching "${query.trim()}"`}
              </p>
            </>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4">
          <div className="panel px-4 py-4">
            <p className="microlabel mb-2">Talk to a human</p>
            <p className="text-[12.5px] leading-relaxed text-ink-mute">
              Support is staffed by people who ship the product — no deflection bots, no
              ticket purgatory.
            </p>
            <a
              href="mailto:concierge@scopeforge.app"
              className="mt-3 flex items-center gap-2 rounded-md border border-line bg-inset px-2.5 py-2 transition-colors duration-150 hover:border-accent-line hover:bg-accent-soft/40"
            >
              <Icon name="mail" size={13} className="shrink-0 text-accent" />
              <span className="truncate font-mono text-[11.5px] text-ink">
                concierge@scopeforge.app
              </span>
            </a>
            <p className="tnum mt-2 font-mono text-[10.5px] text-ink-faint">
              response &lt; 4h on the Agency plan
            </p>
          </div>

          <div className="panel px-4 py-4">
            <p className="microlabel mb-2">Product status</p>
            <div className="flex items-center gap-2">
              <span className="pulse-dot h-1.5 w-1.5 shrink-0 rounded-full bg-ok" aria-hidden />
              <span className="text-[13px] font-medium text-ink">All systems operational</span>
            </div>
            <p className="tnum mt-1.5 font-mono text-[10.5px] leading-relaxed text-ink-faint">
              uptime 99.98% · last incident: none in 90 days
            </p>
          </div>
        </aside>
      </div>
    </PageTransition>
  );
}
