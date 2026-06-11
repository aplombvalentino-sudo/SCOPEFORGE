"use client";

/* Drive attach — the per-file (drive.file) picker. Sandbox contents come
   from the integrations store; attaching appends to the lead's raw
   intake via attachDriveFiles, which also updates provenance. */

import { useMemo, useState } from "react";
import { timeAgo } from "@/lib/format";
import type { DriveFile } from "@/lib/integrations";
import { useIntegrations } from "@/lib/integrations-store";
import type { Lead } from "@/lib/types";
import { useToast } from "@/components/ui/feedback";
import { CheckItem } from "@/components/ui/fields";
import { Icon, type IconName } from "@/components/ui/icons";
import { Modal } from "@/components/ui/overlays";
import { Badge, Button } from "@/components/ui/primitives";

/** Rough mime → icon mapping shared by the import surfaces. */
export function mimeIcon(mime: string): IconName {
  if (mime.includes("spreadsheet")) return "analytics";
  return "doc";
}

function FileRow({ file, attached }: { file: DriveFile; attached?: boolean }) {
  /* inline-block stops CheckItem's checked line-through from bleeding
     into the row content — selected files should read selected, not done */
  return (
    <span className="inline-block align-top">
      <span className="flex items-center gap-2">
        <Icon name={mimeIcon(file.mime)} size={13} className="shrink-0 text-ink-faint" />
        <span className="max-w-[270px] truncate text-[12.5px] font-medium text-ink">
          {file.name}
        </span>
        <span className="tnum shrink-0 font-mono text-[10.5px] text-ink-faint">
          {file.sizeKb} KB
        </span>
        {attached && <Badge tone="ok">Attached</Badge>}
      </span>
      <span className="mt-0.5 flex items-center gap-1.5 pl-[21px] font-mono text-[10.5px] text-ink-faint">
        <span className="tnum">{timeAgo(file.modifiedAt)}</span>
        <span aria-hidden>·</span>
        <span className="truncate">{file.owner}</span>
      </span>
    </span>
  );
}

export function DrivePickerModal({
  open,
  onClose,
  lead,
}: {
  open: boolean;
  onClose: () => void;
  lead: Lead;
}) {
  const toast = useToast();
  const driveFiles = useIntegrations((s) => s.driveFiles);
  const attachDriveFiles = useIntegrations((s) => s.attachDriveFiles);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  /* attachDriveFiles records file names in provenance.parts — use that
     to keep already-attached files from being appended twice */
  const attachedNames = useMemo(
    () => new Set(lead.provenance?.parts ?? []),
    [lead.provenance]
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleClose() {
    setSelected(new Set());
    onClose();
  }

  function attach() {
    const ids = [...selected];
    if (ids.length === 0) return;
    attachDriveFiles(lead.id, ids);
    toast.success(
      `${ids.length} document${ids.length === 1 ? "" : "s"} attached — added to the intake material`,
      `Now part of the raw intake for ${lead.company}; provenance updated.`
    );
    setSelected(new Set());
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Attach from Drive"
      width={560}
      footer={
        <>
          <p className="mr-auto flex min-w-0 items-center gap-1.5 text-[11px] leading-snug text-ink-faint">
            <Icon name="lock" size={11} className="shrink-0" />
            {"Per-file access (drive.file) — SCOPEFORGE can only ever open files you pick here."}
          </p>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={selected.size === 0} onClick={attach}>
            <Icon name="doc" size={13} />
            {selected.size > 0
              ? `Attach ${selected.size} file${selected.size === 1 ? "" : "s"}`
              : "Attach files"}
          </Button>
        </>
      }
    >
      <div className="mb-3 flex items-start gap-2 rounded-md border border-line bg-inset/60 px-2.5 py-2">
        <Badge tone="info" className="mt-px shrink-0">
          Sandbox
        </Badge>
        <p className="font-mono text-[10.5px] leading-relaxed text-ink-faint">
          {"In production this opens Google's file picker — only the files you pick here ever become readable to SCOPEFORGE."}
        </p>
      </div>

      <div className="rounded-md border border-line bg-surface p-1">
        {driveFiles.map((file) => {
          const already = attachedNames.has(file.name);
          if (already) {
            return (
              <div
                key={file.id}
                className="flex w-full items-start gap-2.5 rounded-md px-2 py-1.5 opacity-60"
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-line bg-inset text-ink-faint">
                  <Icon name="check" size={11} />
                </span>
                <FileRow file={file} attached />
              </div>
            );
          }
          return (
            <CheckItem
              key={file.id}
              checked={selected.has(file.id)}
              onChange={() => toggle(file.id)}
            >
              <FileRow file={file} />
            </CheckItem>
          );
        })}
      </div>
    </Modal>
  );
}
