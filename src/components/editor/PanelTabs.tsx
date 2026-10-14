"use client";

import clsx from "clsx";
import { motion } from "motion/react";
import { useId } from "react";

/** Tabs at the top of a tool panel, with a sliding pill. */
export function PanelTabs<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  const id = useId();
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 rounded-full bg-ink/5 p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} role="tab" type="button" aria-selected={on} onClick={() => onChange(o.value)} className={clsx("relative flex-1 rounded-full py-2 text-sm font-bold transition-colors", on ? "text-ink" : "text-ink/60 hover:text-ink")}>
            {on && <motion.span layoutId={`tab-${id}`} className="absolute inset-0 rounded-full bg-white shadow-card" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
