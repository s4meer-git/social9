"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import clsx from "clsx";

/**
 * Cycles through words with a fade-and-rise transition, letter by letter.
 * (No blur filter: Safari keeps a filter layer per letter, which made the hero lag.)
 * Pattern from Aceternity "Flip Words"; re-implemented locally.
 */
export function FlipWords({ words, colors = [], interval = 2600, className }: { words: string[]; colors?: string[]; interval?: number; className?: string }) {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((x) => (x + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words.length, interval, reduce]);

  const word = words[i];
  return (
    <span className={clsx("relative inline-block whitespace-nowrap", className)}>
      {/* invisible longest word reserves the width so the line never jumps */}
      <span aria-hidden className="invisible">
        {words.reduce((a, b) => (b.length > a.length ? b : a), "")}
      </span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={word}
          className={clsx("absolute inset-0", colors[i % (colors.length || 1)])}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -22, scale: 1.05, transition: { duration: 0.22, ease: "easeIn" } }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          aria-live="polite"
        >
          {word.split("").map((ch, k) => (
            <motion.span
              key={k}
              className="inline-block"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: k * 0.035, duration: 0.35 }}
            >
              {ch === " " ? " " : ch}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
