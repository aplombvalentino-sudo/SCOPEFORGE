"use client";

/* Command palette — cmdk, heavily restyled to the token system. */

import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { useTheme } from "@/components/theme";
import { Icon } from "@/components/ui/icons";
import { Kbd } from "@/components/ui/primitives";
import { NAV_SECTIONS } from "./app-shell";
import { moneyCompact } from "@/lib/format";
import { STAGE_LABELS } from "@/lib/types";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const leads = useApp((s) => s.leads);
  const proposals = useApp((s) => s.proposals);
  const { toggle } = useTheme();

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[55] flex items-start justify-center p-4 pt-[14vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/55 backdrop-blur-[2px]"
            onClick={() => onOpenChange(false)}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-xl overflow-hidden rounded-xl border border-line bg-raised shadow-e3"
          >
            <Command label="Command palette" loop>
              <div className="flex items-center gap-2.5 border-b border-line px-4">
                <Icon name="command" size={15} className="text-accent" />
                <Command.Input
                  autoFocus
                  placeholder="Type a command or search…"
                  className="h-12 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-faint"
                />
                <Kbd>esc</Kbd>
              </div>
              <Command.List className="max-h-[46vh] overflow-y-auto p-2 [&_[cmdk-group-heading]]:microlabel [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
                <Command.Empty className="px-3 py-8 text-center text-[13px] text-ink-faint">
                  No results — try a lead name, page, or action.
                </Command.Empty>

                <Command.Group heading="Actions">
                  <PaletteItem onSelect={() => go("/leads?new=1")} icon="plus" label="Create new lead" shortcut="N" />
                  <PaletteItem onSelect={() => go("/leads/ld-harborfern")} icon="sparkle" label="Run intake analysis on newest lead" />
                  <PaletteItem onSelect={() => go("/follow-ups")} icon="follow-up" label="Review due follow-ups" />
                  <PaletteItem
                    onSelect={() => {
                      toggle();
                      onOpenChange(false);
                    }}
                    icon="settings"
                    label="Toggle light / dark theme"
                  />
                </Command.Group>

                <Command.Group heading="Go to">
                  {NAV_SECTIONS.flatMap((s) => s.items).map((item) => (
                    <PaletteItem
                      key={item.href}
                      onSelect={() => go(item.href)}
                      icon={item.icon}
                      label={item.label}
                    />
                  ))}
                </Command.Group>

                <Command.Group heading="Leads">
                  {leads.map((lead) => (
                    <PaletteItem
                      key={lead.id}
                      onSelect={() => go(`/leads/${lead.id}`)}
                      icon="building"
                      label={lead.company}
                      hint={`${STAGE_LABELS[lead.stage]} · ${moneyCompact(lead.value)}`}
                    />
                  ))}
                </Command.Group>

                <Command.Group heading="Proposals">
                  {proposals.slice(0, 5).map((p) => (
                    <PaletteItem
                      key={p.id}
                      onSelect={() => go(`/proposals/${p.id}`)}
                      icon="proposal"
                      label={p.title}
                    />
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function PaletteItem({
  onSelect,
  icon,
  label,
  hint,
  shortcut,
}: {
  onSelect: () => void;
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  hint?: string;
  shortcut?: string;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      value={label}
      className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-ink-mute transition-colors duration-100 data-[selected=true]:bg-accent-soft data-[selected=true]:text-ink"
    >
      <Icon name={icon} size={14} className="text-ink-faint" />
      <span className="flex-1 truncate">{label}</span>
      {hint && <span className="font-mono text-[10.5px] text-ink-faint">{hint}</span>}
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </Command.Item>
  );
}
