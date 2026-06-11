"use client";

/* Provenance block — where imported intake material came from.
   Rendered above the raw intake well whenever a lead carries
   provenance, so imported content is never presented as anonymous. */

import Link from "next/link";
import { teamById } from "@/lib/demo-data";
import { timeAgo } from "@/lib/format";
import type { Provenance } from "@/lib/types";
import { Icon, type IconName } from "@/components/ui/icons";
import { Avatar, Button } from "@/components/ui/primitives";

const SOURCE_META: Record<Provenance["source"], { icon: IconName; label: string }> = {
  gmail: { icon: "mail", label: "Imported from Gmail" },
  outlook: { icon: "mail", label: "Imported from Outlook" },
  upload: { icon: "upload", label: "Imported from upload" },
  manual: { icon: "pen", label: "Added manually" },
};

export function ProvenanceChip({ provenance }: { provenance: Provenance }) {
  const meta = SOURCE_META[provenance.source];
  const importer = provenance.importedBy ? teamById[provenance.importedBy] : undefined;
  const parts = provenance.parts ?? [];
  const hasDetailRow = parts.length > 0 || !!importer || !!provenance.importedAt;

  return (
    <div className="mb-3 rounded-md border border-line bg-surface px-3.5 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Icon name={meta.icon} size={13} className="shrink-0 text-accent" />
        <span className="text-[12.5px] font-medium text-ink">{meta.label}</span>
        {provenance.ref && (
          <span className="rounded-sm border border-line bg-inset px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">
            {provenance.ref}
          </span>
        )}
        <span className="flex-1" />
        <Link href="/integrations">
          <Button size="sm" variant="ghost">
            <Icon name="shield" size={12} />
            View source policy
          </Button>
        </Link>
      </div>
      {hasDetailRow && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-line pt-2">
          {parts.map((part) => (
            <span
              key={part}
              className="rounded-sm border border-line bg-inset px-1.5 py-0.5 font-mono text-[10.5px] text-ink-mute"
            >
              {part}
            </span>
          ))}
          <span className="flex-1" />
          {importer && (
            <Avatar
              initials={importer.initials}
              size={18}
              title={`Imported by ${importer.name}`}
            />
          )}
          {provenance.importedAt && (
            <span className="tnum font-mono text-[10.5px] text-ink-faint">
              {timeAgo(provenance.importedAt)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
