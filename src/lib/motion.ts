/* ================================================================
   Motion vocabulary — one set of curves and durations everywhere.
   Import these instead of inventing per-component values.
   ================================================================ */

import type { Transition, Variants } from "framer-motion";

/** Primary easing — fast start, soft landing. */
export const EASE = [0.22, 1, 0.36, 1] as const;

export const DUR = {
  fast: 0.15,
  base: 0.22,
  slow: 0.32,
  page: 0.4,
} as const;

export const transition: Transition = { duration: DUR.base, ease: EASE };

/** Standard page entry: rise 8px + fade. Wrap page roots in this. */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: DUR.page, ease: EASE } },
};

/** Staggered list container + item. */
export const listVariants: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.035, delayChildren: 0.05 } },
};

export const itemVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE } },
};

/** Drawer sliding from the right. */
export const drawerVariants: Variants = {
  initial: { x: "104%" },
  animate: { x: 0, transition: { duration: DUR.slow, ease: EASE } },
  exit: { x: "104%", transition: { duration: DUR.base, ease: EASE } },
};

/** Modal scale-settle. */
export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.97, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: DUR.base, ease: EASE } },
  exit: { opacity: 0, scale: 0.98, y: 4, transition: { duration: DUR.fast, ease: EASE } },
};

export const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DUR.base } },
  exit: { opacity: 0, transition: { duration: DUR.fast } },
};

/** Accordion / collapsible body. */
export const collapseVariants: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1, transition: { duration: DUR.slow, ease: EASE } },
  exit: { height: 0, opacity: 0, transition: { duration: DUR.base, ease: EASE } },
};
