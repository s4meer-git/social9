"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";

/** Grows from slightly smaller to full size as it scrolls into the centre of the screen. */
export function ScrollScale({ children, className, from = 0.9 }: { children: ReactNode; className?: string; from?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 26, restDelta: 0.001 });
  const scale = useTransform(smooth, [0, 1], [from, 1]);
  const y = useTransform(smooth, [0, 1], [60, 0]);
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div ref={ref} style={{ scale, y }} className={className}>
      {children}
    </motion.div>
  );
}
