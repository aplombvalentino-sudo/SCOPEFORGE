"use client";

/* ================================================================
   AuthScene — the spatial product vignette behind /login & /signup.
   A perspective stage with layered interface panels: pipeline board
   (deep), intake-analysis panel (mid), token-vault chip (front),
   blueprint grid floor. Depth comes from layering, hairline borders
   and elevation shadows — no gradients, no glow.

   Motion: pointer parallax (max ~10px, spring-smoothed) plus one
   slow ambient float on the front layer. Both are disabled under
   prefers-reduced-motion; the composition then renders static.
   ================================================================ */

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { cx } from "@/lib/format";
import { Icon } from "@/components/ui/icons";

const SPRING = { stiffness: 110, damping: 20, mass: 0.6 };

function useDepth(v: MotionValue<number>, px: number) {
  return useTransform(v, (n) => n * px);
}

const PIPE_COLUMNS: { name: string; cards: { label: string; value: string }[] }[] = [
  {
    name: "Intake",
    cards: [
      { label: "Bryggen Padel", value: "€26.8K" },
      { label: "Nordic Garden Rooms", value: "new" },
    ],
  },
  {
    name: "Scoping",
    cards: [{ label: "Aurelia Hospitality", value: "€48.0K" }],
  },
  {
    name: "Proposal",
    cards: [
      { label: "Maison Vey", value: "€31.5K" },
      { label: "Harbor & Fern", value: "€12.4K" },
    ],
  },
];

const INTAKE_CHIPS = ["3 goals", "Budget 150–200K DKK", "Deadline 15 Aug", "Court booking"];

function SceneLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[9.5px] font-medium tracking-[0.09em] text-ink-faint uppercase">
      {children}
    </span>
  );
}

function PipelinePanel() {
  return (
    <div className="panel-raised w-[320px] overflow-hidden shadow-e2">
      <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
        <SceneLabel>Pipeline — Atelier North</SceneLabel>
        <span className="font-mono text-[9.5px] text-ink-mute tnum">€118.7K open</span>
      </div>
      <div className="grid grid-cols-3 gap-2 p-3">
        {PIPE_COLUMNS.map((col) => (
          <div key={col.name} className="min-w-0">
            <p className="mb-1.5 font-mono text-[9px] tracking-[0.1em] text-ink-faint uppercase">
              {col.name}
            </p>
            <div className="space-y-1.5">
              {col.cards.map((card) => (
                <div key={card.label} className="well px-2 py-1.5">
                  <p className="truncate text-[10.5px] leading-tight font-medium text-ink">
                    {card.label}
                  </p>
                  <p className="mt-0.5 font-mono text-[9px] text-ink-faint tnum">{card.value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IntakePanel() {
  return (
    <div className="panel-raised w-[290px] overflow-hidden shadow-e2">
      <div className="flex items-center gap-2 border-b border-line px-3.5 py-2.5">
        <Icon name="sparkle" size={12} className="text-accent" />
        <SceneLabel>Intake analysis — Bryggen Padel</SceneLabel>
      </div>
      <div className="space-y-2.5 p-3.5">
        <div className="flex flex-wrap gap-1.5">
          {INTAKE_CHIPS.map((chip) => (
            <span
              key={chip}
              className="rounded-sm border border-accent-line bg-accent-soft px-1.5 py-px font-mono text-[9.5px] text-accent"
            >
              {chip}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          <span className="font-mono text-[9px] tracking-[0.08em] text-ink-faint uppercase">
            Scope confidence
          </span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-inset">
            <div className="h-full w-[84%] rounded-full bg-accent" />
          </div>
          <span className="font-mono text-[9.5px] text-ink-mute tnum">84%</span>
        </div>
      </div>
    </div>
  );
}

function VaultChip() {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-line bg-raised px-3 py-2.5 shadow-e3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-accent-line bg-accent-soft">
        <Icon name="lock" size={13} className="text-accent" />
      </span>
      <span className="min-w-0">
        <span className="block font-mono text-[9px] tracking-[0.1em] text-ink-faint uppercase">
          Token vault
        </span>
        <span className="block font-mono text-[10px] text-ink-mute">
          ENCRYPTED · AES-256-GCM
        </span>
      </span>
    </div>
  );
}

export function AuthScene({ compact = false }: { compact?: boolean }) {
  const reduced = useReducedMotion();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, SPRING);
  const sy = useSpring(my, SPRING);

  // translate per depth — deep layers move least, the front layer most
  const farX = useDepth(sx, 3);
  const farY = useDepth(sy, 2);
  const midX = useDepth(sx, 6);
  const midY = useDepth(sy, 4);
  const frontX = useDepth(sx, 10);
  const frontY = useDepth(sy, 7);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  }

  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <div
      aria-hidden
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative h-full w-full overflow-hidden bg-surface/60"
    >
      <div
        className="absolute inset-0"
        style={{ perspective: 1400, transformStyle: "preserve-3d" }}
      >
        {/* blueprint grid floor */}
        <div
          className="blueprint blueprint-fade absolute -right-[18%] bottom-[-10%] -left-[18%] h-[55%]"
          style={{ transform: "rotateX(54deg)", transformOrigin: "50% 100%" }}
        />

        {/* deep layer — pipeline board vignette */}
        {!compact && (
          <motion.div
            className="absolute top-[10%] left-[8%]"
            style={{ x: farX, y: farY, z: -140, rotateY: 10, rotateX: 4 }}
          >
            <PipelinePanel />
          </motion.div>
        )}

        {/* mid layer — intake-analysis panel */}
        <motion.div
          className={cx(
            "absolute",
            compact ? "top-1/2 right-[6%] -mt-12" : "right-[7%] bottom-[24%]"
          )}
          style={{ x: midX, y: midY, z: -50, rotateY: -10, rotateX: 2 }}
        >
          <IntakePanel />
        </motion.div>

        {/* front layer — token-vault chip with one slow ambient float */}
        <motion.div
          className={cx(
            "absolute",
            compact ? "top-1/2 left-[7%] -mt-7" : "bottom-[14%] left-[16%]"
          )}
          style={{ x: frontX, y: frontY, z: 40 }}
        >
          <motion.div
            animate={reduced ? undefined : { y: [-4, 4] }}
            transition={{
              duration: 6,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "mirror",
            }}
          >
            <VaultChip />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
