"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

/** Counts up to a value when scrolled into view. Pattern from Magic UI "Number Ticker". */
export function NumberTicker({ value, className, suffix = "" }: { value: number; className?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduce) {
      el.textContent = `${value}${suffix}`;
      return;
    }
    const c = animate(0, value, {
      duration: 1.4,
      ease: [0.21, 0.47, 0.32, 0.98],
      onUpdate: (v) => (el.textContent = `${Math.round(v)}${suffix}`),
    });
    return () => c.stop();
  }, [inView, value, suffix, reduce]);

  return (
    <span ref={ref} className={className}>
      0{suffix}
    </span>
  );
}
