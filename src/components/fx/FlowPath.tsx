"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Text-on-a-path marquee in the spirit of the Wispr Flow ribbon: logos and letters
 * ride one looping curve. Everything is drawn on one canvas per frame. (One DOM element
 * per glyph on an animated `offset-path` made Safari repaint ~100 layers every frame.)
 */

export interface FlowItem {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
}

const W = 1200;
const H = 420;
// Sweeps in from the top left, dives, loops once and leaves on the right.
const PATH =
  "M -80 60 C 160 30, 240 330, 480 350 C 700 368, 890 262, 860 136 C 830 22, 610 26, 600 166 C 590 310, 820 392, 1010 326 C 1110 292, 1175 196, 1290 176";

// x of the loop, kept centred when the stage is wider than the screen
const FOCUS_X = 732;
// samples along the curve; positions in between are interpolated
const SAMPLES = 600;

/** One glyph: a letter, or an icon drawn from its SVG paths. */
type Glyph = { x: number; char?: string; icon?: number };
type IconArt = { paths: Path2D[]; vw: number; vh: number };
type Layout = { glyphs: Glyph[]; length: number; xs: Float32Array; ys: Float32Array; as: Float32Array; icons: IconArt[]; font: string; color: string };

export function FlowPath({
  items,
  speed = 70,
  className,
  tone = "text-[#9a97a6]",
  maxScale = 1.15,
  minScale = 0.72,
  fontSize = 23,
  zoom = 1,
  focus,
  decorative = false,
}: {
  items: FlowItem[];
  speed?: number;
  className?: string;
  /** text colour class for the logos and letters */
  tone?: string;
  maxScale?: number;
  /** floor for small screens; the stage is cropped around the loop instead of shrinking further */
  minScale?: number;
  fontSize?: number;
  /** stage width relative to the container (>1 lets the curve run past the edges) */
  zoom?: number;
  /** where the loop should sit, as a fraction of the container width */
  focus?: number;
  /** background use: hidden from assistive tech, guide line not drawn */
  decorative?: boolean;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const iconBox = useRef<HTMLSpanElement>(null);
  const svgPath = useRef<SVGPathElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const [layout, setLayout] = useState<Layout | null>(null);
  const [box, setBox] = useState({ scale: 1, shift: 0 });
  const [visible, setVisible] = useState(false);

  // Measure glyph advances with the real font, then tile the sequence to fill the path exactly.
  useLayoutEffect(() => {
    let cancelled = false;
    const build = () => {
      if (cancelled || !probe.current || !svgPath.current || !iconBox.current) return;
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) return;
      const cs = getComputedStyle(probe.current);
      const font = `${cs.fontWeight} ${fontSize}px ${cs.fontFamily}`;
      ctx.font = font;
      const iconW = fontSize + 1;
      const gap = fontSize * 1.5;
      const path = svgPath.current;
      const length = path.getTotalLength();

      // the icons' own SVG paths, read from the hidden render below
      const icons: IconArt[] = [...iconBox.current.querySelectorAll("svg")].map((svg) => {
        const vb = (svg.getAttribute("viewBox") ?? "0 0 24 24").split(/[\s,]+/).map(Number);
        return { paths: [...svg.querySelectorAll("path")].map((p) => new Path2D(p.getAttribute("d") ?? "")), vw: vb[2], vh: vb[3] };
      });

      // Cycle through the items until the path is full; the slack goes into the gaps only.
      const units = items.map((it, i) => {
        const parts: { char?: string; icon?: number; w: number }[] = [{ icon: i, w: iconW + fontSize * 0.45 }];
        for (const c of it.label) parts.push({ char: c, w: ctx.measureText(c).width });
        return { parts, w: parts.reduce((n, g) => n + g.w, 0) };
      });
      const picked: typeof units = [];
      let used = 0;
      for (let i = 0; used + units[i % units.length].w + gap <= length; i++) {
        picked.push(units[i % units.length]);
        used += units[i % units.length].w + gap;
      }
      const gapW = gap + (length - used) / Math.max(1, picked.length);

      const glyphs: Glyph[] = [];
      let x = 0;
      for (const u of picked) {
        for (const g of u.parts) {
          glyphs.push({ x: x + g.w / 2, char: g.char, icon: g.icon });
          x += g.w;
        }
        x += gapW;
      }

      // sample the curve once: position + heading
      const xs = new Float32Array(SAMPLES + 1);
      const ys = new Float32Array(SAMPLES + 1);
      const as = new Float32Array(SAMPLES + 1);
      for (let i = 0; i <= SAMPLES; i++) {
        const pt = path.getPointAtLength((i / SAMPLES) * length);
        xs[i] = pt.x;
        ys[i] = pt.y;
      }
      for (let i = 0; i <= SAMPLES; i++) {
        const a = Math.min(SAMPLES, i + 1);
        const b = Math.max(0, i - 1);
        as[i] = Math.atan2(ys[a] - ys[b], xs[a] - xs[b]);
      }
      setLayout({ glyphs, length, xs, ys, as, icons, font, color: getComputedStyle(iconBox.current).color });
    };
    if (document.fonts?.ready) document.fonts.ready.then(build);
    else build();
    return () => {
      cancelled = true;
    };
  }, [items, fontSize]);

  // Scale the fixed-size stage to the container, never smaller than 62% so text stays legible on phones.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const cw = e.contentRect.width;
      const scale = Math.max(minScale, Math.min(maxScale, (cw / W) * zoom));
      // slide the stage so the loop lands at `focus` (or the middle), never exposing a bare edge
      const want = (focus ?? 0.5) * cw - cw / 2 - (FOCUS_X - W / 2) * scale;
      const room = Math.max(0, (W * scale - cw) / 2);
      const shift = Math.max(-room, Math.min(room, want));
      setBox({ scale, shift });
    });
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, [maxScale, minScale, zoom, focus]);

  const running = visible && !reduce;

  // Draw: every glyph sits at (its offset + distance travelled) along the curve.
  useEffect(() => {
    const c = canvas.current;
    if (!c || !layout) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1) * box.scale;
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const { glyphs, length, xs, ys, as, icons, font, color } = layout;
    const iconSize = fontSize + 1;
    const draw = (travelled: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const g of glyphs) {
        const d = (((g.x + travelled) % length) / length) * SAMPLES;
        const i = Math.floor(d);
        const j = Math.min(SAMPLES, i + 1);
        const f = d - i;
        let da = as[j] - as[i];
        if (da > Math.PI) da -= 2 * Math.PI;
        else if (da < -Math.PI) da += 2 * Math.PI;
        const a = as[i] + da * f;
        const cos = Math.cos(a) * dpr;
        const sin = Math.sin(a) * dpr;
        ctx.setTransform(cos, sin, -sin, cos, (xs[i] + (xs[j] - xs[i]) * f) * dpr, (ys[i] + (ys[j] - ys[i]) * f) * dpr);
        if (g.char !== undefined) {
          if (g.char !== " ") ctx.fillText(g.char, 0, -fontSize * 0.1);
        } else if (g.icon !== undefined && icons[g.icon]) {
          const art = icons[g.icon];
          const k = iconSize / Math.max(art.vw, art.vh);
          ctx.translate(-(art.vw * k) / 2, -(art.vh * k) / 2 - fontSize * 0.1);
          ctx.scale(k, k);
          for (const p of art.paths) ctx.fill(p);
        }
      }
    };
    if (!running) {
      draw(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      draw((((now - start) / 1000) * speed) % length);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [layout, running, box.scale, speed, fontSize]);

  return (
    <div
      ref={wrap}
      aria-hidden={decorative || undefined}
      className={className}
      style={{
        height: H * box.scale,
        maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
      }}
    >
      {!decorative && (
        <ul className="sr-only">
          {items.map((it) => (
            <li key={it.label}>{it.label}</li>
          ))}
        </ul>
      )}
      <div
        aria-hidden
        className="relative left-1/2 top-0 select-none"
        style={{ width: W, height: H, transform: `translateX(calc(-50% + ${box.shift}px)) scale(${box.scale})`, transformOrigin: "50% 0" }}
      >
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 overflow-visible">
          <path ref={svgPath} d={PATH} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 7" strokeLinecap="round" className={decorative ? "text-transparent" : "text-ink/[0.07]"} />
        </svg>
        <span ref={probe} className="invisible absolute font-display font-bold" style={{ fontSize }}>
          a
        </span>
        {/* rendered once, read for their paths and colour, never shown */}
        <span ref={iconBox} className={`invisible absolute ${tone}`}>
          {items.map((it) => (
            <it.icon key={it.label} aria-hidden />
          ))}
        </span>
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
      </div>
    </div>
  );
}
