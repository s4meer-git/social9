"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";

/** Small deterministic PRNG so every scribble is irregular but stable between renders. */
function rand(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/**
 * One smooth zig-zag that only ever moves forward (left to right), so strokes
 * never cross. Points alternate above and below the middle with a little
 * irregularity, then a Catmull-Rom spline turns them into soft curves.
 */
function zigzag(w: number, h: number, seed: number) {
  const r = rand(seed);
  const mid = h / 2;
  const amp = Math.min(h * 0.26, 5.5);
  const pts: [number, number][] = [[-1, mid]];
  let x = -1;
  let up = r() > 0.5;
  while (x < w + 1) {
    x = Math.min(w + 1, x + 9 + r() * 5);
    pts.push([x, mid + (up ? -1 : 1) * amp * (0.6 + r() * 0.45)]);
    up = !up;
  }
  let d = `M ${pts[0][0]} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    // Catmull-Rom → cubic Bézier; clamp control x so the curve never turns back
    const c1x = Math.min(p2[0], p1[0] + (p2[0] - p0[0]) / 6);
    const c2x = Math.max(p1[0], p2[0] - (p3[0] - p1[0]) / 6);
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/** A small hand-drawn pencil held like a right hand would; the graphite point lands at (6.8, 27.2) of the 34px box. */
function Pencil() {
  return (
    <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden className="block drop-shadow-[0_4px_6px_rgb(0_0_0/0.25)]">
      <g transform="rotate(45 20 20)">
        <rect x="16" y="-4" width="8" height="30" rx="1.5" fill="#ffc93c" stroke="#0f0e17" strokeWidth="1.2" />
        <rect x="16" y="-4" width="2.6" height="30" fill="#ffe08a" />
        <rect x="16" y="-8" width="8" height="5" rx="1.5" fill="#ff8fab" stroke="#0f0e17" strokeWidth="1.2" />
        <rect x="16" y="-3.6" width="8" height="2.2" fill="#c4c0d2" stroke="#0f0e17" strokeWidth="1" />
        <path d="M16 26 L20 37 L24 26 Z" fill="#f2d2a9" stroke="#0f0e17" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M18.6 33 L20 37 L21.4 33 Z" fill="#2b2a33" />
      </g>
    </svg>
  );
}

/**
 * Crosses out its content live: a pencil draws a single granular zig-zag
 * across the text when it scrolls into view, then lifts away.
 */
export function PencilStrike({
  children,
  className,
  color = "#7a1240",
  delay = 0,
  duration = 2.2,
  seed = 7,
}: {
  children: ReactNode;
  className?: string;
  color?: string;
  delay?: number;
  duration?: number;
  seed?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const id = useId().replace(/:/g, "");
  const progress = useMotionValue(reduce ? 1 : 0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const pencilOpacity = useTransform(progress, [0, 0.02, 0.9, 1], [0, 1, 1, 0]);
  const lift = useTransform(progress, [0.9, 1], [0, -10]);
  // hidden until drawing starts, so a zero-length round cap never shows as a dot
  const lineOpacity = useTransform(progress, [0, 0.01], [0, 0.72]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const d = useMemo(() => (size ? zigzag(size.w, size.h, seed) : ""), [size, seed]);

  // Keep the pencil tip glued to the end of the line as it's drawn.
  useEffect(() => {
    return progress.on("change", (p) => {
      const path = pathRef.current;
      if (!path) return;
      const pt = path.getPointAtLength(path.getTotalLength() * p);
      x.set(pt.x);
      y.set(pt.y);
    });
  }, [progress, x, y]);

  useEffect(() => {
    if (!inView || reduce || !size) return;
    const c = animate(progress, 1, { duration, delay, ease: [0.37, 0, 0.63, 1] });
    return () => c.stop();
  }, [inView, reduce, size, progress, duration, delay]);

  return (
    <span ref={ref} className={clsx("relative inline-block", className)}>
      {children}
      {size && size.w > 0 && (
        <svg aria-hidden className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 overflow-visible" width={size.w} height={size.h + 10} viewBox={`0 -5 ${size.w} ${size.h + 10}`}>
          <defs>
            {/* pencil texture: rough edges, then graphite grain eaten into the stroke */}
            <filter id={`pencil-${id}`} x="-5%" y="-60%" width="110%" height="220%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} result="wobble" />
              <feDisplacementMap in="SourceGraphic" in2="wobble" scale="1.2" xChannelSelector="R" yChannelSelector="G" result="rough" />
              <feTurbulence type="fractalNoise" baseFrequency="2.4" numOctaves="3" seed={seed + 3} result="grain" />
              <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 2.15" result="grainAlpha" />
              <feComposite in="rough" in2="grainAlpha" operator="in" />
            </filter>
          </defs>
          <motion.path
            ref={pathRef}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#pencil-${id})`}
            className="mix-blend-multiply"
            style={{ pathLength: progress, opacity: lineOpacity }}
          />
        </svg>
      )}
      {size && !reduce && (
        <motion.span aria-hidden className="pointer-events-none absolute left-0 z-10" style={{ top: 0, x, y, opacity: pencilOpacity, translateY: lift }}>
          {/* tip at the bottom-left of the pencil box, placed on the drawing point */}
          <span className="absolute -left-[6.8px] -top-[27.2px] block">
            <Pencil />
          </span>
        </motion.span>
      )}
    </span>
  );
}
