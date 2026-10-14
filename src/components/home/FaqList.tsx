"use client";

import { useId, useState, type ReactNode } from "react";
import clsx from "clsx";
import { FaPlus } from "react-icons/fa6";

/**
 * Accordion that glides open and shut (grid-rows 0fr → 1fr), one answer at a time.
 * Answers stay in the HTML so search engines still read them.
 */
export function FaqList({ items }: { items: { q: string; a: ReactNode }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const base = useId();

  return (
    <ul className="space-y-3">
      {items.map((f, i) => {
        const isOpen = open === i;
        const btn = `${base}-q${i}`;
        const panel = `${base}-a${i}`;
        return (
          <li key={f.q} className={clsx("rounded-3xl bg-white shadow-card ring-1 transition-[box-shadow,ring-color] duration-500", isOpen ? "ring-ink/10" : "ring-black/[0.04]")}>
            <h3>
              <button
                id={btn}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panel}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-xl font-bold tracking-[-0.01em]"
              >
                {f.q}
                <span
                  className={clsx(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full transition-[transform,background-color,color] duration-500 ease-[cubic-bezier(.21,.47,.32,.98)]",
                    isOpen ? "rotate-[135deg] bg-ink text-white" : "bg-ink/5",
                  )}
                >
                  <FaPlus aria-hidden className="text-xs" />
                </span>
              </button>
            </h3>
            <div
              id={panel}
              role="region"
              aria-labelledby={btn}
              inert={!isOpen}
              className={clsx("grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(.21,.47,.32,.98)]", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}
            >
              <div className="overflow-hidden">
                <p className={clsx("max-w-xl px-6 pb-6 text-[17px] leading-relaxed text-ink-soft transition-transform duration-500 ease-[cubic-bezier(.21,.47,.32,.98)]", isOpen ? "translate-y-0" : "-translate-y-2")}>{f.a}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
