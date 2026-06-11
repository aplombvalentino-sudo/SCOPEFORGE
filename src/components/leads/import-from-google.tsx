"use client";

/* "Import from Gmail" header action + the import drawer.
   Sandbox-driven: threads come from the integrations store, and the
   import itself goes through importThread (never useApp directly) so
   provenance, events, and the optional analysis run stay consistent.
   Trust framing follows the capability registry — minimal fetch,
   on demand, nothing stored until you import. */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { cx, timeAgo } from "@/lib/format";
import { CAPABILITY_BY_KEY, type InboxThread } from "@/lib/integrations";
import { useIntegrations } from "@/lib/integrations-store";
import { DUR, EASE } from "@/lib/motion";
import { useApp } from "@/lib/store";
import { STAGE_LABELS } from "@/lib/types";
import { Skeleton, useToast } from "@/components/ui/feedback";
import { CheckItem, Field, Input, Select, Toggle } from "@/components/ui/fields";
import { Icon } from "@/components/ui/icons";
import { Drawer } from "@/components/ui/overlays";
import { Badge, Button } from "@/components/ui/primitives";
import { mimeIcon } from "./drive-picker";

/* ---------------- company guess from sender domain ---------------- */

/** Small lexicon so demo domains segment into readable company names. */
const DOMAIN_WORDS = new Set([
  "bryggen", "padel", "harbor", "fern", "maison", "vey", "nordic", "garden",
  "rooms", "aurelia", "group", "roastery", "nord", "veldt", "cycles", "north",
  "atelier", "studio", "club", "agency", "media", "labs", "hotel", "digital",
]);

function segmentLabel(label: string): string[] | null {
  const n = label.length;
  const best: Array<string[] | null> = new Array<string[] | null>(n + 1).fill(null);
  best[0] = [];
  for (let i = 1; i <= n; i++) {
    for (let j = Math.max(0, i - 12); j < i; j++) {
      const prev = best[j];
      if (!prev) continue;
      const word = label.slice(j, i);
      if (DOMAIN_WORDS.has(word)) {
        best[i] = [...prev, word];
        break;
      }
    }
  }
  return best[n];
}

/** "mikkel@bryggenpadel.dk" → "Bryggen Padel" (falls back to "Bryggenpadel"). */
export function guessCompanyFromEmail(email: string): string {
  const domain = email.split("@")[1] ?? "";
  const label = (domain.split(".")[0] ?? "").toLowerCase();
  if (!label) return "";
  const words = segmentLabel(label) ?? [label];
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/* ---------------- shared bits ---------------- */

const WORK_STEPS = [
  "Fetching selected messages…",
  "Normalizing content…",
  "Writing provenance…",
];

function SandboxNote({ children }: { children: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-line bg-inset/60 px-2.5 py-2">
      <Badge tone="info" className="mt-px shrink-0">
        Sandbox
      </Badge>
      <p className="font-mono text-[10.5px] leading-relaxed text-ink-faint">{children}</p>
    </div>
  );
}

function RadioCard({
  checked,
  onSelect,
  label,
}: {
  checked: boolean;
  onSelect: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cx(
        "flex items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors duration-150",
        checked
          ? "border-accent-line bg-accent-soft/40"
          : "border-line bg-surface hover:border-line-strong"
      )}
    >
      <span
        className={cx(
          "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors duration-150",
          checked ? "border-accent" : "border-line-strong"
        )}
      >
        {checked && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
      </span>
      <span className="text-[12.5px] font-medium text-ink">{label}</span>
    </button>
  );
}

/* ---------------- the drawer ---------------- */

type TargetKind = "new" | "existing";

export function GmailImportDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const inboxThreads = useIntegrations((s) => s.inboxThreads);
  const importThread = useIntegrations((s) => s.importThread);
  const accountEmail = useIntegrations(
    (s) => s.connections.find((c) => c.provider === "google")?.accountEmail
  );
  const leads = useApp((s) => s.leads);

  const [search, setSearch] = useState("");
  const [thread, setThread] = useState<InboxThread | null>(null);
  const [selMsgs, setSelMsgs] = useState<Set<string>>(new Set());
  const [selAtts, setSelAtts] = useState<Set<string>>(new Set());
  const [targetKind, setTargetKind] = useState<TargetKind>("new");
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [projectType, setProjectType] = useState("");
  const [existingLeadId, setExistingLeadId] = useState("");
  const [runAnalysis, setRunAnalysis] = useState(true);
  const [working, setWorking] = useState(false);
  const [workStep, setWorkStep] = useState(0);

  const importTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (importTimer.current) clearTimeout(importTimer.current);
      if (stepTimer.current) clearInterval(stepTimer.current);
    },
    []
  );

  const openLeads = useMemo(
    () => leads.filter((l) => l.stage !== "won" && l.stage !== "lost"),
    [leads]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return inboxThreads;
    return inboxThreads.filter((t) =>
      `${t.subject} ${t.fromName} ${t.fromEmail} ${t.snippet}`.toLowerCase().includes(q)
    );
  }, [inboxThreads, search]);

  const attachments = useMemo(
    () => (thread ? thread.messages.flatMap((m) => m.attachments) : []),
    [thread]
  );

  function clearTimers() {
    if (importTimer.current) clearTimeout(importTimer.current);
    if (stepTimer.current) clearInterval(stepTimer.current);
    importTimer.current = null;
    stepTimer.current = null;
  }

  function handleClose() {
    clearTimers();
    setWorking(false);
    setThread(null);
    setSearch("");
    onClose();
  }

  function chooseThread(t: InboxThread) {
    setThread(t);
    setSelMsgs(new Set(t.messages.map((m) => m.id)));
    setSelAtts(new Set(t.messages.flatMap((m) => m.attachments.map((a) => a.id))));
    setTargetKind("new");
    setCompany(guessCompanyFromEmail(t.fromEmail));
    setContactName(t.fromName);
    setContactEmail(t.fromEmail);
    setProjectType("");
    setExistingLeadId(openLeads[0]?.id ?? "");
    setRunAnalysis(true);
  }

  function toggleIn(setter: typeof setSelMsgs) {
    return (id: string) =>
      setter((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
  }
  const toggleMsg = toggleIn(setSelMsgs);
  const toggleAtt = toggleIn(setSelAtts);

  const noMessages = selMsgs.size === 0;
  const canImport =
    !!thread &&
    !noMessages &&
    (targetKind === "existing" ? existingLeadId.length > 0 : company.trim().length > 1);

  function startImport() {
    if (!thread || !canImport || working) return;
    setWorking(true);
    setWorkStep(0);
    stepTimer.current = setInterval(
      () => setWorkStep((s) => Math.min(s + 1, WORK_STEPS.length - 1)),
      420
    );
    importTimer.current = setTimeout(() => {
      clearTimers();
      const leadId = importThread({
        threadId: thread.id,
        messageIds: [...selMsgs],
        attachmentIds: [...selAtts],
        target:
          targetKind === "existing"
            ? { kind: "existing", leadId: existingLeadId }
            : {
                kind: "new",
                company: company.trim(),
                contactName: contactName.trim() || thread.fromName,
                contactEmail: contactEmail.trim() || thread.fromEmail,
                projectType: projectType.trim() || "Unscoped inquiry",
              },
        runAnalysis,
      });
      setWorking(false);
      if (!leadId) {
        toast.error("Import failed", "The thread is no longer available in the sandbox inbox.");
        return;
      }
      toast.success(
        runAnalysis
          ? "Imported — provenance retained. Analysis running."
          : "Imported — provenance retained.",
        `"${thread.subject}" is now in the lead workspace.`
      );
      handleClose();
      router.push(`/leads/${leadId}`);
    }, 1200);
  }

  const fade = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: { duration: DUR.fast, ease: EASE },
  };

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title="Import from Gmail"
      width={560}
      meta={
        <span className="flex items-center gap-2 font-mono text-[11px] text-ink-faint">
          {accountEmail ?? "Google Workspace"}
          <Badge tone="info">Sandbox</Badge>
        </span>
      }
      footer={
        thread ? (
          <>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={working}
              disabled={!canImport}
              onClick={startImport}
            >
              <Icon name="download" size={13} />
              Import to workspace
            </Button>
          </>
        ) : undefined
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {!thread ? (
          /* ---------- step 1: pick a thread ---------- */
          <motion.div key="pick" {...fade} className="space-y-3">
            <SandboxNote>
              Sandbox inbox — in production this lists your last 30 days, fetched on demand,
              never stored until you import.
            </SandboxNote>

            <div className="relative">
              <Icon
                name="search"
                size={13}
                className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-faint"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subject, sender, or snippet…"
                aria-label="Search inbox threads"
                className="pl-8"
                autoFocus
              />
            </div>

            {filtered.length === 0 ? (
              <div className="well px-4 py-8 text-center">
                <p className="text-[12.5px] text-ink-mute">
                  {"No threads match — try the sender's name or a word from the subject."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((t) => {
                  const attCount = t.messages.reduce((n, m) => n + m.attachments.length, 0);
                  const imported = !!t.importedLeadId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        if (imported && t.importedLeadId) {
                          handleClose();
                          router.push(`/leads/${t.importedLeadId}`);
                        } else {
                          chooseThread(t);
                        }
                      }}
                      className="flex w-full flex-col gap-1 rounded-md border border-line bg-surface px-3 py-2.5 text-left transition-colors duration-150 hover:border-line-strong hover:bg-overlay/60"
                    >
                      <span className="flex w-full items-center gap-2">
                        <span className="text-[12.5px] font-medium text-ink">{t.fromName}</span>
                        {imported && <Badge tone="ok">Imported</Badge>}
                        {attCount > 0 && (
                          <span className="flex items-center gap-1 rounded-sm border border-line bg-inset px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">
                            <Icon name="doc" size={9} />
                            {attCount}
                          </span>
                        )}
                        <span className="flex-1" />
                        <span className="tnum font-mono text-[10.5px] text-ink-faint">
                          {timeAgo(t.receivedAt)}
                        </span>
                      </span>
                      <span className="w-full text-[12.5px] text-ink">{t.subject}</span>
                      <span className="w-full truncate text-[11.5px] text-ink-faint">
                        {t.snippet}
                      </span>
                      {imported && (
                        <span className="flex items-center gap-1 text-[11.5px] font-medium text-accent">
                          Open lead workspace
                          <Icon name="arrow-right" size={11} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-[11px] leading-relaxed text-ink-faint">
              {CAPABILITY_BY_KEY.email_import.not}
            </p>
          </motion.div>
        ) : working ? (
          /* ---------- step 3: import in flight ---------- */
          <motion.div key="working" {...fade}>
            <div className="panel px-4 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-soft">
                  <Icon name="mail" size={14} className="text-accent" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-ink">
                    {`Importing "${thread.subject}"`}
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={workStep}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -3 }}
                      transition={{ duration: DUR.fast, ease: EASE }}
                      className="font-mono text-[11px] text-ink-faint"
                    >
                      {WORK_STEPS[workStep]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
              <div className="mt-4 space-y-2.5">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-4/5" />
                <Skeleton className="h-3.5 w-1/2" />
              </div>
            </div>
          </motion.div>
        ) : (
          /* ---------- step 2: select content + target ---------- */
          <motion.div key="compose" {...fade} className="space-y-4">
            <button
              type="button"
              onClick={() => setThread(null)}
              className="flex items-center gap-1 text-[12px] text-ink-mute transition-colors duration-150 hover:text-ink"
            >
              <Icon name="chevron-left" size={12} />
              All threads
            </button>

            <div className="rounded-md border border-line bg-surface px-3 py-2.5">
              <p className="text-[13px] font-medium text-ink">{thread.subject}</p>
              <p className="mt-0.5 font-mono text-[11px] text-ink-faint">
                {`${thread.fromName} <${thread.fromEmail}>`} · {timeAgo(thread.receivedAt)}
              </p>
            </div>

            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <p className="microlabel">Messages</p>
                <p className="flex items-center gap-1 font-mono text-[10.5px] text-ink-faint">
                  <Icon name="lock" size={10} />
                  Only what you tick is fetched in full.
                </p>
              </div>
              <div className="rounded-md border border-line bg-surface p-1">
                {thread.messages.map((m) => (
                  <CheckItem
                    key={m.id}
                    checked={selMsgs.has(m.id)}
                    onChange={() => toggleMsg(m.id)}
                  >
                    <span className="inline-block align-top">
                      <span className="flex items-center gap-2">
                        <span className="text-[12.5px] font-medium text-ink">{m.fromName}</span>
                        <span className="tnum font-mono text-[10.5px] text-ink-faint">
                          {timeAgo(m.at)}
                        </span>
                      </span>
                      <span className="mt-0.5 block max-w-[400px] truncate text-[11.5px] text-ink-faint">
                        {m.bodyText
                          .split("\n")
                          .map((line) => line.trim())
                          .filter(Boolean)
                          .slice(0, 2)
                          .join(" ")}
                      </span>
                    </span>
                  </CheckItem>
                ))}
              </div>

              {attachments.length > 0 && (
                <>
                  <p className="microlabel mt-3 mb-1.5">Attachments</p>
                  <div className="rounded-md border border-line bg-surface p-1">
                    {attachments.map((a) => (
                      <CheckItem
                        key={a.id}
                        checked={selAtts.has(a.id)}
                        onChange={() => toggleAtt(a.id)}
                      >
                        <span className="inline-block align-top">
                          <span className="flex items-center gap-2">
                            <Icon
                              name={mimeIcon(a.mime)}
                              size={13}
                              className="shrink-0 text-ink-faint"
                            />
                            <span className="max-w-[300px] truncate text-[12.5px] text-ink">
                              {a.name}
                            </span>
                            <span className="tnum font-mono text-[10.5px] text-ink-faint">
                              {a.sizeKb} KB
                            </span>
                          </span>
                        </span>
                      </CheckItem>
                    ))}
                  </div>
                </>
              )}

              {noMessages && (
                <p className="mt-2 flex items-center gap-1.5 text-[12px] text-danger">
                  <Icon name="alert-triangle" size={12} />
                  Select at least one message — attachments can only come along with their
                  thread.
                </p>
              )}
            </div>

            <div className="border-t border-line pt-4">
              <p className="microlabel mb-2">Destination</p>
              <div role="radiogroup" aria-label="Import destination" className="grid grid-cols-2 gap-2">
                <RadioCard
                  checked={targetKind === "new"}
                  onSelect={() => setTargetKind("new")}
                  label="Create new lead"
                />
                <RadioCard
                  checked={targetKind === "existing"}
                  onSelect={() => setTargetKind("existing")}
                  label="Add to existing lead"
                />
              </div>

              {targetKind === "new" ? (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Company" hint="Guessed from the sender's domain — adjust if needed.">
                    <Input value={company} onChange={(e) => setCompany(e.target.value)} />
                  </Field>
                  <Field label="Project type">
                    <Input
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      placeholder="e.g. Website + booking platform"
                    />
                  </Field>
                  <Field label="Contact name">
                    <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
                  </Field>
                  <Field label="Contact email">
                    <Input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </Field>
                </div>
              ) : (
                <Field
                  label="Lead workspace"
                  className="mt-3"
                  hint="Appends below the existing raw intake — provenance is updated."
                >
                  <Select
                    value={existingLeadId}
                    onChange={(e) => setExistingLeadId(e.target.value)}
                  >
                    {openLeads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.company} — {STAGE_LABELS[l.stage]}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
            </div>

            <div className="flex items-start gap-2.5 rounded-md border border-line bg-surface px-3 py-2.5">
              <span className="mt-0.5">
                <Toggle
                  checked={runAnalysis}
                  onChange={setRunAnalysis}
                  label="Run intake analysis after import"
                />
              </span>
              <span className="min-w-0">
                <span className="block text-[12.5px] font-medium text-ink">
                  Run intake analysis after import
                </span>
                <span className="block text-[11.5px] leading-snug text-ink-faint">
                  Goals, missing info, and suggested questions land on the intake tab a few
                  seconds after import.
                </span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Drawer>
  );
}

/* ---------------- the header action ---------------- */

export function ImportFromGmail() {
  const conn = useIntegrations((s) => s.connections.find((c) => c.provider === "google"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const noteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!noteOpen) return;
    const onDown = (e: MouseEvent) => {
      if (noteRef.current && !noteRef.current.contains(e.target as Node)) setNoteOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNoteOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onEsc);
    };
  }, [noteOpen]);

  const importGranted =
    conn?.capabilities.some((c) => c.key === "email_import" && c.granted) ?? false;
  const live =
    !!conn && (conn.status === "connected" || conn.status === "partial") && importGranted;
  const needsReauth = !!conn && conn.status === "reconnect_required" && importGranted;

  if (needsReauth) {
    return (
      <div ref={noteRef} className="relative">
        <Button
          variant="secondary"
          className="opacity-60"
          aria-expanded={noteOpen}
          onClick={() => setNoteOpen((v) => !v)}
        >
          <Icon name="plug" size={14} />
          Import from Gmail
        </Button>
        <AnimatePresence>
          {noteOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 2, scale: 0.99 }}
              transition={{ duration: DUR.fast, ease: EASE }}
              className="absolute right-0 z-40 mt-1.5 w-72 rounded-lg border border-line bg-overlay p-3 shadow-e2"
            >
              <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink">
                <Icon name="key" size={12} className="shrink-0 text-warn" />
                Connection needs re-authorization
              </p>
              <p className="mt-1 text-[12px] leading-snug text-ink-mute">
                The Google token was revoked, so imports are paused. Nothing was deleted —
                re-authorizing restores the existing grants, no new scopes.
              </p>
              <Link
                href="/integrations"
                className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-accent transition-colors duration-150 hover:underline"
              >
                Re-authorize
                <Icon name="arrow-right" size={11} />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (!live) return null;

  return (
    <>
      <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
        <Icon name="plug" size={14} />
        Import from Gmail
      </Button>
      <GmailImportDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
