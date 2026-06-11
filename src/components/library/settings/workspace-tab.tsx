"use client";

/* Settings → Workspace: identity, currency, numbering, danger zone. */

import { useState } from "react";
import { useApp } from "@/lib/store";
import { Modal } from "@/components/ui/overlays";
import { Button } from "@/components/ui/primitives";
import { Field, Input, Select } from "@/components/ui/fields";
import { useToast } from "@/components/ui/feedback";
import { SettingsPanel } from "./bits";

const CURRENCIES = [
  { code: "EUR", label: "EUR — Euro (€)" },
  { code: "DKK", label: "DKK — Danish krone (kr.)" },
  { code: "SEK", label: "SEK — Swedish krona (kr)" },
  { code: "GBP", label: "GBP — Pound sterling (£)" },
  { code: "USD", label: "USD — US dollar ($)" },
];

export function WorkspaceTab() {
  const toast = useToast();
  const workspace = useApp((s) => s.workspace);
  const leads = useApp((s) => s.leads);
  const templates = useApp((s) => s.templates);

  const [name, setName] = useState(workspace.name);
  const [domain, setDomain] = useState(workspace.domain);
  const [brandColor, setBrandColor] = useState(workspace.brandColor);
  const [currency, setCurrency] = useState("EUR");
  const [prefix, setPrefix] = useState("SF-2026-");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  return (
    <div className="max-w-2xl space-y-5">
      <SettingsPanel
        title="Identity"
        description="Shown on proposals, client onboarding pages, and every email the workspace sends."
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Workspace name" htmlFor="ws-name">
              <Input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field
              label="Domain"
              htmlFor="ws-domain"
              hint={`Client onboarding pages live at scope.${domain.trim() || "yourdomain.dk"}.`}
            >
              <Input
                id="ws-domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="font-mono"
              />
            </Field>
          </div>
          <Field
            label="Brand color"
            htmlFor="ws-color"
            hint="Accents on client-facing documents only — the app keeps its own palette."
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-8.5 w-8.5 shrink-0 rounded-md border border-line"
                style={{ backgroundColor: brandColor }}
              />
              <Input
                id="ws-color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-32 font-mono"
                spellCheck={false}
              />
            </div>
          </Field>
        </div>
      </SettingsPanel>

      <SettingsPanel
        title="Documents"
        description="Defaults stamped onto every new pricing model and proposal."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Default currency"
            htmlFor="ws-currency"
            hint="New documents only — existing ones keep the currency they were quoted in."
          >
            <Select
              id="ws-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Proposal numbering prefix"
            htmlFor="ws-prefix"
            hint="Next proposal: SF-2026-039"
          >
            <Input
              id="ws-prefix"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="tnum font-mono"
              spellCheck={false}
            />
          </Field>
        </div>
      </SettingsPanel>

      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={() =>
            toast.success(
              "Workspace settings saved",
              `Identity, ${currency} pricing, and ${prefix} numbering apply to every new document.`
            )
          }
        >
          Save workspace settings
        </Button>
      </div>

      <section className="rounded-lg border border-danger/25 bg-danger-soft/20 px-4 py-4">
        <p className="microlabel mb-2 !text-danger">Danger zone</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[13px] font-medium text-ink">Delete workspace</h3>
            <p className="mt-0.5 max-w-md text-[12px] leading-relaxed text-ink-mute">
              Permanently removes {workspace.name} — {leads.length} leads, {templates.length}{" "}
              templates, every proposal in flight, and all {workspace.seats} seats. There is no
              undo and no export grace period.
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
            Delete workspace
          </Button>
        </div>
      </section>

      <Modal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setConfirmName("");
        }}
        title={`Delete ${workspace.name}?`}
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDeleteOpen(false);
                setConfirmName("");
              }}
            >
              Keep workspace
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={confirmName !== workspace.name}
              onClick={() => {
                setDeleteOpen(false);
                setConfirmName("");
                toast.info(
                  "This is a demo — the workspace survives.",
                  `Nothing was deleted. ${workspace.name} and its pipeline live on.`
                );
              }}
            >
              I understand — delete everything
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink-mute">
          This deletes the entire workspace: pipeline, library, billing history, and team
          access. Clients lose their onboarding pages immediately.
        </p>
        <div className="mt-4">
          <Field
            label={`Type "${workspace.name}" to confirm`}
            htmlFor="ws-delete-confirm"
          >
            <Input
              id="ws-delete-confirm"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={workspace.name}
              autoComplete="off"
              spellCheck={false}
              invalid={confirmName.length > 0 && confirmName !== workspace.name}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
