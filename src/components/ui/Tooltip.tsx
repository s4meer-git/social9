import clsx from "clsx";
import type { ReactNode } from "react";

/**
 * Lightweight tooltip: shows on hover and keyboard focus, with a small spring pop.
 * Pure CSS, so it costs nothing until hovered. `side` picks where it appears.
 */
export function Tooltip({
  label,
  children,
  side = "top",
  className,
  kbd,
}: {
  label: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "right" | "left";
  className?: string;
  /** optional keyboard shortcut shown after the label */
  kbd?: string;
}) {
  const pos = {
    top: "bottom-full left-1/2 mb-2.5 -translate-x-1/2 origin-bottom",
    bottom: "top-full left-1/2 mt-2.5 -translate-x-1/2 origin-top",
    right: "left-full top-1/2 ml-2.5 -translate-y-1/2 origin-left",
    left: "right-full top-1/2 mr-2.5 -translate-y-1/2 origin-right",
  }[side];
  const arrow = {
    top: "left-1/2 top-full -translate-x-1/2 -translate-y-1/2",
    bottom: "left-1/2 bottom-full -translate-x-1/2 translate-y-1/2",
    right: "top-1/2 right-full -translate-y-1/2 translate-x-1/2",
    left: "top-1/2 left-full -translate-y-1/2 -translate-x-1/2",
  }[side];
  return (
    <span className={clsx("group/tip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={clsx(
          "pointer-events-none absolute z-50 flex scale-90 items-center gap-2 whitespace-nowrap rounded-xl bg-ink px-3 py-1.5 text-[13px] font-semibold text-white opacity-0 shadow-pop transition-[opacity,transform] duration-200 ease-[cubic-bezier(.34,1.56,.64,1)]",
          "group-hover/tip:scale-100 group-hover/tip:opacity-100 group-has-[:focus-visible]/tip:scale-100 group-has-[:focus-visible]/tip:opacity-100",
          pos,
        )}
      >
        {label}
        {kbd && <kbd className="rounded-md bg-white/15 px-1.5 py-0.5 font-sans text-[11px] font-bold">{kbd}</kbd>}
        <span className={clsx("absolute h-2 w-2 rotate-45 bg-ink", arrow)} />
      </span>
    </span>
  );
}
