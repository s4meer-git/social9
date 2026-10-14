"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import { FaArrowsLeftRight } from "react-icons/fa6";

/**
 * Drag-to-compare slider. The "after" image sits underneath; the "before" image
 * is clipped to the left of the handle. Keyboard accessible via a range input.
 */
export function BeforeAfter({
  before,
  after,
  alt,
  ratio = "4/5",
  checker = false,
  className,
  rounded = "rounded-[28px]",
  intro = true,
  labels = ["Before", "After"],
  priority = false,
}: {
  before: string;
  after: string;
  alt: string;
  ratio?: string;
  checker?: boolean;
  className?: string;
  rounded?: string;
  intro?: boolean;
  labels?: [string, string];
  priority?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const clipOuter = useRef<HTMLDivElement>(null);
  const clipInner = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLDivElement>(null);
  const range = useRef<HTMLInputElement>(null);
  const dragging = useRef(false);
  const touched = useRef(false);
  const start = intro ? 78 : 50;

  /**
   * Move the divider. Transforms only, written straight to the DOM: no re-render and no
   * clip-path repaint per frame (Safari repainted the whole photo on every step).
   */
  const show = (pos: number) => {
    const hidden = 100 - pos;
    if (clipOuter.current) clipOuter.current.style.transform = `translateX(${-hidden}%)`;
    if (clipInner.current) clipInner.current.style.transform = `translateX(${hidden}%)`;
    if (handle.current) handle.current.style.transform = `translateX(${pos}%)`;
    if (range.current && document.activeElement !== range.current) range.current.value = String(Math.round(pos));
  };

  // A gentle sweep on first view so people see it's interactive.
  useEffect(() => {
    if (!intro) return;
    const el = box.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (t: number) => {
          if (touched.current) return;
          const p = Math.min(1, (t - t0) / 1400);
          show(78 - (1 - Math.pow(1 - p, 3)) * 30);
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [intro]);

  const move = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    show(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <div
      ref={box}
      className={clsx("group relative cursor-ew-resize select-none overflow-hidden touch-pan-y has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-violet", rounded, checker && "checker", className)}
      style={{ aspectRatio: ratio }}
      onPointerDown={(e) => {
        dragging.current = true;
        touched.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && move(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img decoding="async" src={after} alt={`${alt}, after`} className="absolute inset-0 h-full w-full object-cover" draggable={false} loading={priority ? "eager" : "lazy"} />
      <div ref={clipOuter} className="absolute inset-0 overflow-hidden will-change-transform" style={{ transform: `translateX(${start - 100}%)` }}>
        <div ref={clipInner} className="absolute inset-0 will-change-transform" style={{ transform: `translateX(${100 - start}%)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img decoding="async" src={before} alt={`${alt}, before`} className="absolute inset-0 h-full w-full object-cover" draggable={false} loading={priority ? "eager" : "lazy"} />
        </div>
      </div>

      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white">{labels[0]}</span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink">{labels[1]}</span>

      <div ref={handle} className="pointer-events-none absolute inset-0 will-change-transform" style={{ transform: `translateX(${start}%)` }}>
        <div className="absolute inset-y-0 -left-px w-0.5 bg-white shadow-[0_0_12px_rgb(0_0_0/0.35)]" />
        <div className="absolute left-0 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-float transition-transform group-active:scale-110">
          <FaArrowsLeftRight aria-hidden />
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        ref={range}
        defaultValue={start}
        onChange={(e) => {
          touched.current = true;
          show(Number(e.target.value));
        }}
        aria-label={`Compare before and after: ${alt}`}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
      />
    </div>
  );
}
