"use client";

import { useId, useState, type ReactNode } from "react";
import clsx from "clsx";
import { FaChevronDown } from "react-icons/fa6";

/**
 * The one place advanced settings live: closed by default, opens smoothly when asked.
 * Rule for every panel: show the 2–3 choices most people need, everything else goes here.
 */
export function MoreOptions({ children, label = "More options", openLabel = "Fewer options", className }: { children: ReactNode; label?: string; openLabel?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm font-bold text-ink-soft transition-colors hover:text-ink"
      >
        <FaChevronDown aria-hidden className={clsx("text-[10px] transition-transform duration-300", open && "rotate-180")} />
        {open ? openLabel : label}
      </button>
      <div id={id} inert={!open} className={clsx("grid transition-[grid-template-rows,opacity] duration-400 ease-[cubic-bezier(.21,.47,.32,.98)]", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="overflow-hidden">
          <div className="space-y-6 pt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Big, plain choice buttons in a row (the default control for the main decision). */
export function ChoiceRow<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; disabled?: boolean; title?: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={o.disabled}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={clsx(
            "min-w-0 flex-1 whitespace-nowrap rounded-2xl px-2 py-2.5 text-[13px] font-bold ring-1 transition-all disabled:cursor-not-allowed disabled:opacity-35 sm:px-3 sm:text-sm",
            value === o.value ? "bg-ink text-white ring-ink" : "bg-white ring-line hover:ring-ink/30",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
