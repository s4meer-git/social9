import clsx from "clsx";
import type { ReactNode } from "react";

/**
 * Infinite horizontal scroller with edge fade. Pauses on hover.
 * Pattern from Magic UI "Marquee" / Aceternity "Infinite Moving Cards".
 */
export function Marquee({ children, reverse = false, speed = 40, className }: { children: ReactNode; reverse?: boolean; speed?: number; className?: string }) {
  return (
    <div className={clsx("group relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]", className)}>
      {[0, 1].map((k) => (
        <div
          key={k}
          aria-hidden={k === 1}
          inert={k === 1}
          className="flex shrink-0 animate-[marquee-x_var(--mq)_linear_infinite] items-center gap-[var(--mq-gap)] pr-[var(--mq-gap)] group-hover:[animation-play-state:paused]"
          style={{ ["--mq" as string]: `${speed}s`, ["--mq-gap" as string]: "1.25rem", animationDirection: reverse ? "reverse" : "normal" }}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
