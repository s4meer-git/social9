"use client";

import { useRef, type ReactNode } from "react";
import clsx from "clsx";

/**
 * Card with a soft radial light that follows the cursor, plus a matching glow on
 * the border. Pattern popularised by Aceternity "card spotlight" / Magic UI "MagicCard";
 * implemented here from scratch so it ships with the app.
 */
export function SpotlightCard({
  children,
  className,
  color = "rgb(109 74 255 / 0.14)",
  border = "rgb(109 74 255 / 0.45)",
  size = 340,
}: {
  children: ReactNode;
  className?: string;
  color?: string;
  border?: string;
  size?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className={clsx("group/spot relative isolate", className)}
      style={{ ["--spot" as string]: color, ["--spot-border" as string]: border, ["--spot-size" as string]: `${size}px` }}
    >
      {/* border glow: a masked 1px ring lit near the cursor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{
          padding: 1,
          background: "radial-gradient(var(--spot-size) circle at var(--mx, 50%) var(--my, 50%), var(--spot-border), transparent 45%)",
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      {/* surface glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{ background: "radial-gradient(var(--spot-size) circle at var(--mx, 50%) var(--my, 50%), var(--spot), transparent 60%)" }}
      />
      {children}
    </div>
  );
}
