"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#6d4aff", "#ff4fa3", "#d4ff4f", "#38bdf8", "#ffc93c", "#ff8a3d"];

/**
 * A one-shot confetti burst in brand colors, drawn on a canvas in the browser's top layer
 * (a manual popover), so it shows above modal dialogs. Skipped for reduced motion.
 */
export function Confetti({ fire }: { fire: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!fire || !canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    try {
      canvas.showPopover?.();
    } catch {
      // already showing
    }

    // two cannons from the lower corners, plus a gentle shower from the top
    type P = { x: number; y: number; vx: number; vy: number; r: number; vr: number; w: number; h: number; c: string; shape: number };
    const parts: P[] = [];
    const burst = (x: number, y: number, dir: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const a = (-Math.PI / 2) + dir * (0.35 + Math.random() * 0.5);
        const v = 9 + Math.random() * 9;
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3, w: 6 + Math.random() * 6, h: 4 + Math.random() * 6, c: COLORS[i % COLORS.length], shape: i % 3 });
      }
    };
    burst(0, H * 0.85, 1, 90);
    burst(W, H * 0.85, -1, 90);
    for (let i = 0; i < 60; i++) parts.push({ x: Math.random() * W, y: -20 - Math.random() * H * 0.4, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.2, w: 6 + Math.random() * 5, h: 4 + Math.random() * 5, c: COLORS[i % COLORS.length], shape: i % 3 });

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = Math.max(0, Math.min(1, (3400 - t) / 700));
      for (const p of parts) {
        p.vy += 0.28;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        if (p.shape === 0) {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2.4, 0, Math.PI * 2);
          ctx.fill();
        } else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.shape === 1 ? p.h : p.h / 2.5);
        ctx.restore();
      }
      if (t < 3400) raf = requestAnimationFrame(tick);
      else {
        ctx.clearRect(0, 0, W, H);
        try {
          canvas.hidePopover?.();
        } catch {
          // already hidden
        }
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fire]);

  return <canvas ref={ref} popover="manual" aria-hidden className="pointer-events-none fixed inset-0 m-0 h-dvh w-dvw border-0 bg-transparent p-0" />;
}
