"use client";

/* Import + create modals for the leads module. Both write through addLead. */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { daysFromNow } from "@/lib/format";
import { useIntegrations } from "@/lib/integrations-store";
import { useApp } from "@/lib/store";
import type { Lead, LeadSource } from "@/lib/types";
import { useToast } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/fields";
import { Icon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/overlays";
import { Button } from "@/components/ui/primitives";
import { extractContact, newLeadId, SOURCE_LABELS } from "./lead-shared";

const SOURCE_OPTIONS = Object.entries(SOURCE_LABELS) as [LeadSource, string][];

/* ---------- Import lead (paste raw material) ---------- */

export function ImportLeadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const addLead = useApp((s) => s.addLead);
  const runIntakeAnalysis = useApp((s) => s.runIntakeAnalysis);
  const gmailReady = useIntegrations((s) => s.capabilityGranted("google", "email_import"));

  const [text, setText] = useState("");
  const [source, setSource] = useState<LeadSource>("email");
  const [company, setCompany] = useState("");

  const canSubmit = text.trim().length > 20 && company.trim().length > 1;

  function submit() {
    if (!canSubmit) return;
    const id = newLeadId(company);
    const contact = extractContact(text);
    const now = daysFromNow(0, 9);
    const lead: Lead = {
      id,
      company: company.trim(),
      contact: {
        name: contact?.name ?? "Unconfirmed contact",
        role: contact ? "From imported thread" : "Awaiting qualification",
        email: contact?.email ?? "",
      },
      source,
      projectType: "Unscoped inquiry",
      summary: text.replace(/\s+/g, " ").trim().slice(0, 150),
      value: 0,
      stage: "intake",
      risk: "medium",
      riskNote: "Imported raw — no budget or timeline confirmed yet.",
      tags: ["imported"],
      ownerId: "tm-maya",
      createdAt: now,
      lastActivityAt: now,
      rawIntake: text,
    };
    addLead(lead);
    runIntakeAnalysis(id, text);
    toast.success(
      "Lead imported — intake analysis running",
      `${company.trim()} landed at Intake. Goals, gaps, and suggested questions arrive in a few seconds.`
    );
    setText("");
    setCompany("");
    setSource("email");
    onClose();
    router.push(`/leads/${id}`);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import lead"
      width={620}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!canSubmit} onClick={submit}>
            <Icon name="sparkle" size={14} />
            Import &amp; analyze
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field
          label="Source material"
          hint="Intake analysis extracts goals, missing info, risks, and budget/timeline signals from whatever you paste."
        >
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste an email, call notes, transcript, or brief…"
            className="min-h-44 font-mono text-[12.5px]"
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Source type">
            <Select value={source} onChange={(e) => setSource(e.target.value as LeadSource)}>
              {SOURCE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Company">
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Harbor & Fern"
            />
          </Field>
        </div>
        {gmailReady && (
          <p className="flex items-start gap-1.5 text-[11.5px] leading-snug text-ink-faint">
            <Icon name="plug" size={11} className="mt-0.5 shrink-0" />
            {"Gmail is connected — “Import from Gmail” in the header pulls the original thread with provenance attached. Pasting here works just as well."}
          </p>
        )}
      </div>
    </Modal>
  );
}

/* ---------- New lead (manual entry) ---------- */

export function CreateLeadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const addLead = useApp((s) => s.addLead);
  const team = useApp((s) => s.team);

  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [projectType, setProjectType] = useState("");
  const [value, setValue] = useState("");
  const [source, setSource] = useState<LeadSource>("referral");
  const [ownerId, setOwnerId] = useState("tm-maya");

  const canSubmit = company.trim().length > 1 && projectType.trim().length > 1;

  function submit() {
    if (!canSubmit) return;
    const now = daysFromNow(0, 9);
    const estValue = Math.max(0, Math.round(Number(value) || 0));
    addLead({
      id: newLeadId(company),
      company: company.trim(),
      contact: {
        name: contactName.trim() || "Unconfirmed contact",
        role: "Primary contact",
        email: contactEmail.trim(),
      },
      source,
      projectType: projectType.trim(),
      summary: `${projectType.trim()} inquiry from ${company.trim()} — added manually, not yet qualified.`,
      value: estValue,
      stage: "intake",
      risk: "medium",
      tags: [],
      ownerId,
      createdAt: now,
      lastActivityAt: now,
    });
    toast.success(
      `${company.trim()} added to the pipeline`,
      "Sitting at Intake — import source material from the workspace to run analysis."
    );
    setCompany("");
    setContactName("");
    setContactEmail("");
    setProjectType("");
    setValue("");
    setSource("referral");
    setOwnerId("tm-maya");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New lead"
      width={560}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!canSubmit} onClick={submit}>
            <Icon name="plus" size={14} />
            Add lead
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Company">
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company name"
              autoFocus
            />
          </Field>
          <Field label="Project type">
            <Input
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              placeholder="e.g. Website redesign"
            />
          </Field>
          <Field label="Contact name">
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Full name"
            />
          </Field>
          <Field label="Contact email">
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="name@company.com"
            />
          </Field>
          <Field label="Est. value (EUR)" hint="Rough is fine — refine it during scoping.">
            <Input
              type="number"
              min={0}
              step={500}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
              className="tnum font-mono"
            />
          </Field>
          <Field label="Source">
            <Select value={source} onChange={(e) => setSource(e.target.value as LeadSource)}>
              {SOURCE_OPTIONS.map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Owner">
          <Select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            {team.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} — {member.role}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
