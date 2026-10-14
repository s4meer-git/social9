"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Cross-fades content when `id` changes (tool panels, tabs, pickers), so nothing snaps.
 * The old content leaves first, then the new one rises in.
 */
export function Swap({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={id}
        className={className}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
