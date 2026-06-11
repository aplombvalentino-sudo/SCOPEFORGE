"use client";

/* ================================================================
   Disconnect — token revocation happens either way; the choice is
   only about what happens to already-imported raw source content.
   ================================================================ */

import { useEffect, useState } from "react";
import { cx } from "@/lib/format";
import { PROVIDER_META, type IntegrationProvider } from "@/lib/integrations";
import { useIntegrations } from "@/lib/integrations-store";
import { Modal } from "@/components/ui/overlays";
import { Button } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/feedback";

const CHOICES: { purge: boolean; title: string; body: string }[] = [
  {
    purge: false,
    title: "Keep imported content",
    body: "Briefs and scopes built from imports stay in place. Raw source text stays until the standard 90-day purge.",
  },
  {
    purge: true,
    title: "Also purge raw source content",
    body: "Original message bodies and attachment references are deleted now. Extracted briefs and scopes remain.",
  },
];

export function DisconnectModal({
  provider,
  onClose,
}: {
  provider: IntegrationProvider | null;
  onClose: () => void;
}) {
  const disconnect = useIntegrations((s) => s.disconnect);
  const toast = useToast();

  /* keep the last provider so the exit animation renders content */
  const [current, setCurrent] = useState<IntegrationProvider | null>(provider);
  const [purge, setPurge] = useState(false);

  useEffect(() => {
    if (provider) {
      setCurrent(provider);
      setPurge(false);
    }
  }, [provider]);

  if (!current) return null;

  const meta = PROVIDER_META[current];

  const confirm = () => {
    disconnect(current, purge);
    onClose();
    toast.success(
      `${meta.name} disconnected — tokens revoked and deleted`,
      purge
        ? "Raw source content was purged. Extracted briefs and scopes remain."
        : "Imported content stays in place until the standard 90-day purge."
    );
  };

  return (
    <Modal
      open={provider !== null}
      onClose={onClose}
      title={`Disconnect ${meta.name}?`}
      width={520}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirm}>
            Disconnect {meta.name}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div role="radiogroup" aria-label="What happens to imported content" className="space-y-2">
          {CHOICES.map((choice) => {
            const selected = purge === choice.purge;
            return (
              <button
                key={choice.title}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setPurge(choice.purge)}
                className={cx(
                  "flex w-full items-start gap-2.5 rounded-md border px-3 py-2.5 text-left transition-colors duration-150",
                  selected
                    ? "border-accent-line bg-accent-soft/40"
                    : "border-line bg-inset hover:border-line-strong"
                )}
              >
                <span
                  className={cx(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-150",
                    selected ? "border-accent" : "border-line-strong"
                  )}
                >
                  {selected && <span className="h-2 w-2 rounded-full bg-accent" />}
                </span>
                <span>
                  <span className="block text-[13px] font-medium text-ink">{choice.title}</span>
                  <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-mute">
                    {choice.body}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="well flex items-start gap-2 px-3 py-2.5">
          <Icon name="lock" size={13} className="mt-0.5 shrink-0 text-ink-faint" />
          <p className="text-[12px] leading-relaxed text-ink-mute">
            Either way, tokens are revoked at {meta.consentHost} and deleted from the vault the
            moment you confirm. Reconnecting later starts from a fresh consent screen.
          </p>
        </div>
      </div>
    </Modal>
  );
}
