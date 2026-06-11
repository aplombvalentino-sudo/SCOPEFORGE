"use client";

/* Service blueprint drawer — full deliverables, the exclusions moat,
   revision policy, and the start-a-scope action. */

import { useRouter } from "next/navigation";
import type { ServiceBlueprint } from "@/lib/types";
import { money } from "@/lib/format";
import { Drawer } from "@/components/ui/overlays";
import { Badge, Button } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/feedback";

export function ServiceDrawer({
  service,
  open,
  onClose,
}: {
  service: ServiceBlueprint | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  if (!service) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={service.name}
      width={500}
      meta={
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{service.category}</Badge>
          <Badge>{service.pricingMode === "retainer" ? "Retainer" : "Fixed fee"}</Badge>
          <span className="tnum font-mono text-[11px] text-ink-faint">
            Used {service.usedCount}×
          </span>
        </div>
      }
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              toast.info(
                "Blueprints are read-only in the demo",
                `"${service.name}" keeps its agreed pricing, deliverables, and exclusions.`
              )
            }
          >
            <Icon name="pen" size={12} />
            Edit blueprint
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onClose();
              router.push("/scopes");
            }}
          >
            Start a scope from this blueprint
            <Icon name="arrow-right" size={12} />
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <p className="text-[13px] leading-relaxed text-ink">{service.description}</p>

        <section className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-4">
          <div className="bg-inset px-3 py-2.5">
            <p className="microlabel">Base price</p>
            <p className="tnum mt-1 font-display text-[15px] font-medium">
              {money(service.basePrice)}
              {service.pricingMode === "retainer" && (
                <span className="font-mono text-[10.5px] text-ink-mute">/mo</span>
              )}
            </p>
          </div>
          <div className="bg-inset px-3 py-2.5">
            <p className="microlabel">Target margin</p>
            <p className="tnum mt-1 font-display text-[15px] font-medium">
              {service.targetMarginPct}%
            </p>
          </div>
          <div className="bg-inset px-3 py-2.5">
            <p className="microlabel">Timeline</p>
            <p className="tnum mt-1 font-display text-[15px] font-medium">
              {service.typicalTimelineWeeks} wks
            </p>
          </div>
          <div className="bg-inset px-3 py-2.5">
            <p className="microlabel">Revisions</p>
            <p className="tnum mt-1 font-display text-[15px] font-medium">
              {service.revisionRounds} {service.revisionRounds === 1 ? "round" : "rounds"}
            </p>
          </div>
        </section>

        <section>
          <p className="microlabel mb-2">Deliverables</p>
          {service.deliverables.length === 0 ? (
            <p className="text-[12.5px] text-ink-faint">
              None defined yet. A blueprint without deliverables can&apos;t seed a scope —
              add them before quoting from it.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {service.deliverables.map((d) => (
                <li key={d} className="flex items-start gap-2 text-[13px] leading-snug text-ink">
                  <Icon name="check" size={12} className="mt-0.5 shrink-0 text-accent" />
                  {d}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <p className="microlabel mb-1">Standard exclusions</p>
          <p className="mb-2 text-[12px] leading-relaxed text-ink-mute">
            Pre-agreed nos. Each one is a scope line the change-order engine can cite when a
            request lands outside it — this list is where the margin survives.
          </p>
          {service.standardExclusions.length === 0 ? (
            <p className="text-[12.5px] text-ink-faint">
              No exclusions yet — every undefined boundary becomes free work later.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {service.standardExclusions.map((x) => (
                <li
                  key={x}
                  className="flex items-start gap-2 rounded-md border border-danger/20 bg-danger-soft/40 px-2.5 py-1.5 text-[12.5px] leading-snug text-ink"
                >
                  <Icon name="x" size={11} className="mt-0.5 shrink-0 text-danger" />
                  {x}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="well flex items-start gap-2.5 px-3 py-2.5">
          <Icon name="shield" size={14} className="mt-0.5 shrink-0 text-ink-faint" />
          <p className="text-[12px] leading-relaxed text-ink-mute">
            <span className="tnum font-medium text-ink">
              {service.revisionRounds} revision {service.revisionRounds === 1 ? "round" : "rounds"}
            </span>{" "}
            included in scope. Further rounds are quoted as pre-priced change orders, not
            absorbed — the revision line is written into every proposal built from this
            blueprint.
          </p>
        </section>
      </div>
    </Drawer>
  );
}
