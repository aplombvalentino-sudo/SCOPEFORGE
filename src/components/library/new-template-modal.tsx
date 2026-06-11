"use client";

/* New template modal — kind, name, description. Appends a
   session-local record alongside the seeded library. */

import { useState } from "react";
import type { Template, TemplateKind } from "@/lib/types";
import { daysFromNow } from "@/lib/format";
import { Modal } from "@/components/ui/overlays";
import { Button } from "@/components/ui/primitives";
import { Field, Input, Select, Textarea } from "@/components/ui/fields";
import { useToast } from "@/components/ui/feedback";
import { TEMPLATE_KIND_META, localId } from "./bits";

const KIND_ORDER: TemplateKind[] = ["proposal", "scope_module", "onboarding", "email"];

export function NewTemplateModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (t: Template) => void;
}) {
  const toast = useToast();
  const [kind, setKind] = useState<TemplateKind>("proposal");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const canSave = name.trim().length > 0 && description.trim().length > 0;

  const submit = () => {
    if (!canSave) return;
    const trimmed = name.trim();
    onCreate({
      id: localId("tp"),
      kind,
      name: trimmed,
      description: description.trim(),
      tags: [],
      usedCount: 0,
      updatedAt: daysFromNow(0, 10),
    });
    toast.success(
      "Template saved to library",
      `"${trimmed}" is live for the whole team. Demo note: it lives in this session only.`
    );
    setKind("proposal");
    setName("");
    setDescription("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New template"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" disabled={!canSave} onClick={submit}>
            Save to library
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field
          label="Kind"
          htmlFor="tpl-kind"
          hint="Where it appears: proposals, scope builder, onboarding, or the email composer."
        >
          <Select
            id="tpl-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as TemplateKind)}
          >
            {KIND_ORDER.map((k) => (
              <option key={k} value={k}>
                {TEMPLATE_KIND_META[k].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Name" htmlFor="tpl-name">
          <Input
            id="tpl-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Retainer renewal — quarterly review"
            autoFocus
          />
        </Field>
        <Field
          label="Description"
          htmlFor="tpl-desc"
          hint="One or two lines on when to reach for it — your future hires will read this."
        >
          <Textarea
            id="tpl-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="For month-11 renewal conversations: results recap, next-term options, price adjustment rationale."
            rows={3}
          />
        </Field>
      </div>
    </Modal>
  );
}
