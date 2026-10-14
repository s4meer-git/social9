import type { Face } from "@social9/core/ml/yunet";
import { coverRect } from "@social9/core/image/geometry";
import { canFilter, filterBlurFits } from "@social9/core/image/canvas-filter";
import { gradientLibrary } from "@/lib/backgrounds";
import { patternById } from "@/lib/patterns";
import { MIX } from "@/lib/stickers";

/*
 * Stages ①–④ of the editor pipeline (see docs/editor-architecture.md), in source pixels:
 *   ① cut-out: AI matte refined by brush strokes
 *   ② face pixels: blur / pixelate on the photo itself
 *   ③ background: composited under the subject
 *   ④ overlays: stickers / eyewear, tracked to face landmarks
 */

type Src = CanvasImageSource & { width: number; height: number };

export type BgMode = "original" | "transparent" | "color" | "gradient" | "pattern" | "image" | "blur";
export type BlurType = "gaussian" | "lens" | "radial" | "motion" | "zoom" | "tilt";

export interface BgSpec {
  mode: BgMode;
  color: string;
  /** brand gradient id ("violet-pink") or library gradient ("ui:12") */
  gradient: string;
  pattern: string;
  /** backdrop id: scene ("mountains"), library photo ("pfp/bokeh-1") or "upload" */
  image: string | null;
  /** 0..1 */
  blur: number;
  blurType: BlurType;
  /** degrees, motion blur direction */
  blurAngle: number;
  /** 0..1 vertical position of the sharp band (tilt-shift) */
  focus: number;
}

export type FaceEffect = "none" | "blur" | "pixelate" | "eyewear" | "sticker";

export interface FaceFx {
  effect: FaceEffect;
  /** "mix", a drawn sticker id, or "3d:<id>" */
  sticker: string;
  stickerSize: number;
  eyewear: string;
  eyewearSize: number;
  /** 0..1, blur/pixelate strength */
  strength: number;
  /** indices of faces left visible */
  kept: number[];
}

/** A brush stroke on the cut-out, in source pixels. Undoable, resolution independent. */
export interface Stroke {
  mode: "keep" | "erase";
  size: number;
  /** flat [x0, y0, x1, y1, …] */
  points: number[];
}

export interface PfpSpec {
  enabled: boolean;
  shape: "circle" | "square";
  /** "none", "holo" or a hex color */
  ring: string;
}

export const gradients: { id: string; name: string; from: string; to: string }[] = [
  { id: "violet-pink", name: "Candy", from: "#6d4aff", to: "#ff4fa3" },
  { id: "sunset", name: "Sunset", from: "#ffb347", to: "#ff4f7b" },
  { id: "ocean", name: "Ocean", from: "#38bdf8", to: "#6d4aff" },
  { id: "lime", name: "Fresh", from: "#d4ff4f", to: "#34d399" },
  { id: "peach", name: "Peach", from: "#ffe0cc", to: "#ff8fab" },
  { id: "studio", name: "Studio", from: "#f4f2f7", to: "#c4c0d2" },
  { id: "sky", name: "Sky", from: "#e0f2fe", to: "#7dd3fc" },
  { id: "night", name: "Night", from: "#1e1b4b", to: "#7c3aed" },
];

/** Colors of any gradient id, brand or library. */
export function gradientColors(id: string): string[] {
  if (id.startsWith("ui:")) return gradientLibrary[Number(id.slice(3))]?.colors ?? [gradients[0].from, gradients[0].to];
  const g = gradients.find((x) => x.id === id) ?? gradients[0];
  return [g.from, g.to];
}

export const gradientCss = (id: string) => `linear-gradient(135deg, ${gradientColors(id).join(", ")})`;

export const solidColors = ["#ffffff", "#0f0e17", "#f4f2f7", "#ffe9f3", "#efebff", "#e5f6ff", "#f4ffd6", "#fff5d6", "#ff4fa3", "#6d4aff", "#38bdf8", "#ffc93c"];

export { canFilter };

const newCanvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};

/** Blur a region into ctx. Uses ctx.filter where supported, a downscale trick elsewhere. */
export function drawBlurred(ctx: CanvasRenderingContext2D, src: Src, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number, radius: number) {
  if (filterBlurFits(radius)) {
    ctx.save();
    ctx.filter = `blur(${Math.max(1, radius)}px)`;
    ctx.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh);
    ctx.restore();
    return;
  }
  // No canvas filter (Safari before 18): shrink in halves, then grow back in doubles. Each
  // bilinear step averages neighbours, so the result is a smooth blur instead of big blocks.
  const f = Math.max(2, radius / 1.5);
  let cur: Src = src;
  let cw = sw;
  let ch = sh;
  let cx = sx;
  let cy = sy;
  const tw = Math.max(1, dw / f);
  const th = Math.max(1, dh / f);
  while (cw / 2 > tw && ch / 2 > th) {
    const c = newCanvas(cw / 2, ch / 2);
    const k = c.getContext("2d")!;
    k.imageSmoothingQuality = "high";
    k.drawImage(cur, cx, cy, cw, ch, 0, 0, c.width, c.height);
    cur = c;
    cw = c.width;
    ch = c.height;
    cx = cy = 0;
  }
  const tiny = newCanvas(tw, th);
  tiny.getContext("2d")!.drawImage(cur, cx, cy, cw, ch, 0, 0, tiny.width, tiny.height);
  let up: HTMLCanvasElement = tiny;
  while (up.width * 2 < dw && up.height * 2 < dh) {
    const c = newCanvas(up.width * 2, up.height * 2);
    const k = c.getContext("2d")!;
    k.imageSmoothingQuality = "high";
    k.drawImage(up, 0, 0, c.width, c.height);
    up = c;
  }
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(up, dx, dy, dw, dh);
  ctx.restore();
}

/** Blur a whole canvas with overscan so edges don't fade to transparent. */
function blurAll(ctx: CanvasRenderingContext2D, src: Src, W: number, H: number, r: number) {
  const pad = r * 2;
  drawBlurred(ctx, src, 0, 0, src.width, src.height, -pad, -pad, W + pad * 2, H + pad * 2, r);
}

/** Head-shaped ellipse around a detected face (YuNet boxes stop at the hairline). */
export function headEllipse(f: Face) {
  return { cx: f.x + f.w / 2, cy: f.y + f.h * 0.44, rx: f.w * 0.66, ry: f.h * 0.72 };
}

/** Eye positions (left then right on screen) and the roll angle of the eye line. */
export function eyeLine(f: Face) {
  const l = f.landmarks;
  let a = { x: f.x + f.w * 0.32, y: f.y + f.h * 0.38 };
  let b = { x: f.x + f.w * 0.68, y: f.y + f.h * 0.38 };
  if (l.length >= 4) {
    a = { x: l[0], y: l[1] };
    b = { x: l[2], y: l[3] };
    if (a.x > b.x) [a, b] = [b, a];
  }
  // Side-on faces put both eye points almost on top of each other, which reads as a 90° roll.
  // Real head tilt rarely passes ~35°, so anything steeper is treated as level.
  const raw = Math.atan2(b.y - a.y, b.x - a.x);
  const angle = Math.abs(raw) > 0.6 ? 0 : raw;
  return { a, b, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, dist: Math.hypot(b.x - a.x, b.y - a.y), angle };
}

/** Sticker id for face i, resolving "mix". */
export const stickerFor = (fx: FaceFx, i: number) => (fx.sticker === "mix" ? MIX[i % MIX.length] : fx.sticker);

/* ① cut-out ─────────────────────────────────────────────────────────── */

const refined = new WeakMap<object, { key: string; mask: object; canvas: HTMLCanvasElement }>();

/** AI matte plus brush strokes, at W×H. Cached per (strokes array, mask, size). */
export function refineMask(mask: HTMLCanvasElement, strokes: Stroke[], W: number, H: number): HTMLCanvasElement {
  const key = `${W}x${H}`;
  const hit = refined.get(strokes);
  if (hit && hit.key === key && hit.mask === mask) return hit.canvas;

  const out = newCanvas(W, H);
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(mask, 0, 0, W, H);
  if (strokes.length) {
    const sx = W / mask.width;
    const sy = H / mask.height;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const s of strokes) {
      ctx.save();
      ctx.globalCompositeOperation = s.mode === "keep" ? "source-over" : "destination-out";
      ctx.strokeStyle = "#fff";
      ctx.fillStyle = "#fff";
      const width = s.size * sx;
      ctx.lineWidth = width;
      if (canFilter()) ctx.filter = `blur(${Math.max(0.5, width * 0.06)}px)`; // soft brush edge
      ctx.beginPath();
      if (s.points.length === 2) {
        ctx.arc(s.points[0] * sx, s.points[1] * sy, width / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        for (let i = 0; i < s.points.length; i += 2) ctx.lineTo(s.points[i] * sx, s.points[i + 1] * sy);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  refined.set(strokes, { key, mask, canvas: out });
  return out;
}

/** Center of the subject (alpha-weighted), as 0..1 of the image. */
function subjectCenter(mask: HTMLCanvasElement): { x: number; y: number } {
  const s = 48;
  const c = newCanvas(s, s);
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(mask, 0, 0, s, s);
  const d = ctx.getImageData(0, 0, s, s).data;
  let sx = 0;
  let sy = 0;
  let sw = 0;
  for (let i = 0; i < s * s; i++) {
    const a = d[i * 4 + 3];
    sx += (i % s) * a;
    sy += Math.floor(i / s) * a;
    sw += a;
  }
  return sw ? { x: sx / sw / s, y: sy / sw / s } : { x: 0.5, y: 0.5 };
}

/* ③ background blur ─────────────────────────────────────────────────── */

/**
 * The background with the subject painted out ("clean plate"), so blurring it never
 * smears the person's colors into a halo around them.
 */
function cleanPlate(base: HTMLCanvasElement, mask: HTMLCanvasElement, W: number, H: number): HTMLCanvasElement {
  const bgOnly = newCanvas(W, H);
  const b = bgOnly.getContext("2d")!;
  b.drawImage(base, 0, 0);
  b.globalCompositeOperation = "destination-out";
  b.drawImage(mask, 0, 0, W, H);

  const plate = newCanvas(W, H);
  const p = plate.getContext("2d")!;
  const u = Math.max(W, H);
  // Wide blurs of the surroundings fill the hole; repeating builds up coverage.
  blurAll(p, base, W, H, u * 0.06);
  for (const r of [u * 0.08, u * 0.04, u * 0.02, u * 0.01]) for (let k = 0; k < 2; k++) blurAll(p, bgOnly, W, H, r);
  p.drawImage(bgOnly, 0, 0);
  return plate;
}

/**
 * The clean plate only depends on the photo, the cut-out and the face effects, not on the
 * blur settings, so dragging a blur slider reuses it (it's nine full-size blurs: the slow part).
 */
const plates = new WeakMap<HTMLCanvasElement, { source: unknown; key: string; plate: HTMLCanvasElement }>();

function blurBackground(o: CanvasRenderingContext2D, base: HTMLCanvasElement, mask: HTMLCanvasElement, W: number, H: number, bg: BgSpec, source: unknown, baseKey: string) {
  let hit = plates.get(mask);
  if (!hit || hit.source !== source || hit.key !== baseKey) {
    hit = { source, key: baseKey, plate: cleanPlate(base, mask, W, H) };
    plates.set(mask, hit);
  }
  const plate = hit.plate;
  const u = Math.max(W, H);
  const r = Math.max(1, u * (0.003 + bg.blur * 0.035));

  switch (bg.blurType) {
    case "motion": {
      const n = 18;
      const len = r * 4;
      const a = (bg.blurAngle * Math.PI) / 180;
      o.drawImage(plate, 0, 0);
      for (let k = 1; k < n; k++) {
        const t = (k / (n - 1) - 0.5) * len;
        o.globalAlpha = 1 / (k + 1);
        o.drawImage(plate, Math.cos(a) * t, Math.sin(a) * t);
      }
      o.globalAlpha = 1;
      return;
    }
    case "zoom": {
      const c = subjectCenter(mask);
      const cx = c.x * W;
      const cy = c.y * H;
      const n = 16;
      const amount = 0.02 + bg.blur * 0.16;
      o.drawImage(plate, 0, 0);
      for (let k = 1; k < n; k++) {
        const s = 1 + (k / (n - 1)) * amount;
        o.globalAlpha = 1 / (k + 1);
        o.drawImage(plate, cx - cx * s, cy - cy * s, W * s, H * s);
      }
      o.globalAlpha = 1;
      return;
    }
    case "lens": {
      blurAll(o, plate, W, H, r * 1.15);
      // bokeh bloom: bright spots glow a little
      if (canFilter()) {
        o.save();
        o.globalCompositeOperation = "screen";
        o.globalAlpha = 0.35 + bg.blur * 0.25;
        o.filter = `blur(${Math.round(r * 1.6)}px) brightness(1.15) contrast(1.9)`;
        const pad = r * 3;
        o.drawImage(plate, -pad, -pad, W + pad * 2, H + pad * 2);
        o.restore();
      }
      return;
    }
    case "radial":
    case "tilt": {
      // lightly softened everywhere, fully blurred away from the focus area
      blurAll(o, plate, W, H, r * 0.12);
      const far = newCanvas(W, H);
      const f = far.getContext("2d")!;
      blurAll(f, plate, W, H, r);
      f.globalCompositeOperation = "destination-in";
      let g: CanvasGradient;
      if (bg.blurType === "radial") {
        const c = subjectCenter(mask);
        const R = Math.hypot(W, H) / 2;
        g = f.createRadialGradient(c.x * W, c.y * H, R * 0.18, c.x * W, c.y * H, R * 0.85);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(1, "rgba(0,0,0,1)");
      } else {
        const y = bg.focus * H;
        const band = H * 0.12;
        const stop = (v: number) => Math.min(1, Math.max(0, v / H));
        g = f.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(stop(y - band * 2.5), "rgba(0,0,0,1)");
        g.addColorStop(stop(y - band), "rgba(0,0,0,0)");
        g.addColorStop(stop(y + band), "rgba(0,0,0,0)");
        g.addColorStop(stop(y + band * 2.5), "rgba(0,0,0,1)");
        g.addColorStop(1, "rgba(0,0,0,1)");
      }
      f.fillStyle = g;
      f.fillRect(0, 0, W, H);
      o.drawImage(far, 0, 0);
      return;
    }
    default:
      blurAll(o, plate, W, H, r);
  }
}

/* ② + ④ faces ───────────────────────────────────────────────────────── */

function applyPixelFx(ctx: CanvasRenderingContext2D, snapshot: HTMLCanvasElement, faces: Face[], fx: FaceFx) {
  faces.forEach((face, i) => {
    if (fx.kept.includes(i)) return;
    const e = headEllipse(face);
    const bx = e.cx - e.rx;
    const by = e.cy - e.ry;
    const bw = e.rx * 2;
    const bh = e.ry * 2;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(e.cx, e.cy, e.rx, e.ry, 0, 0, Math.PI * 2);
    ctx.clip();
    if (fx.effect === "blur") {
      const r = Math.max(face.w, face.h) * (0.06 + fx.strength * 0.16);
      const pad = r * 2;
      drawBlurred(ctx, snapshot, bx - pad, by - pad, bw + pad * 2, bh + pad * 2, bx - pad, by - pad, bw + pad * 2, bh + pad * 2, r);
    } else {
      const block = Math.max(3, face.w * (0.05 + fx.strength * 0.1));
      const small = newCanvas(bw / block, bh / block);
      small.getContext("2d")!.drawImage(snapshot, bx, by, bw, bh, 0, 0, small.width, small.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(small, bx, by, bw, bh);
    }
    ctx.restore();
  });
}

/**
 * Sticker/eyewear art rendered once, at a fixed high resolution with its shadow baked in,
 * then only scaled. Re-drawing SVG art with a live canvas shadow on every slider step made
 * the size sliders lag in Safari.
 */
const sprites = new WeakMap<HTMLImageElement, Map<string, HTMLCanvasElement>>();
const SPRITE = 480;
function sprite(img: HTMLImageElement, aspect: number, shadow: { blur: number; y: number; alpha: number }): { canvas: HTMLCanvasElement; pad: number } {
  // shadow sizes are fractions of the art's height
  const W = aspect >= 1 ? SPRITE : SPRITE * aspect;
  const H = W / aspect;
  const pad = Math.ceil(H * (shadow.blur * 2 + Math.abs(shadow.y)));
  const key = `${aspect.toFixed(3)}|${shadow.blur}|${shadow.y}|${shadow.alpha}`;
  let byImg = sprites.get(img);
  if (!byImg) sprites.set(img, (byImg = new Map()));
  let c = byImg.get(key);
  if (!c) {
    c = newCanvas(W + pad * 2, H + pad * 2);
    const x = c.getContext("2d")!;
    x.shadowColor = `rgb(0 0 0 / ${shadow.alpha})`;
    x.shadowBlur = H * shadow.blur;
    x.shadowOffsetY = H * shadow.y;
    x.drawImage(img, pad, pad, W, H);
    byImg.set(key, c);
  }
  return { canvas: c, pad: pad / H };
}

/** Draw a sprite centred at the origin, `w`×`h` on the picture. */
function drawSprite(ctx: CanvasRenderingContext2D, sp: { canvas: HTMLCanvasElement; pad: number }, w: number, h: number) {
  const p = sp.pad * h;
  ctx.drawImage(sp.canvas, -w / 2 - p, -h / 2 - p, w + p * 2, h + p * 2);
}

function applyOverlays(ctx: CanvasRenderingContext2D, faces: Face[], fx: FaceFx, art: Map<string, HTMLImageElement>) {
  faces.forEach((face, i) => {
    if (fx.kept.includes(i)) return;
    const eye = eyeLine(face);
    if (fx.effect === "sticker") {
      const img = art.get(stickerFor(fx, i));
      if (!img) return;
      const e = headEllipse(face);
      const size = Math.max(face.w, face.h) * 1.75 * (fx.stickerSize ?? 1);
      ctx.save();
      ctx.translate(e.cx, e.cy);
      ctx.rotate(eye.angle + ((((i * 37) % 11) - 5) * Math.PI) / 180);
      drawSprite(ctx, sprite(img, 1, { blur: 0.06, y: 0.03, alpha: 0.28 }), size, size);
      ctx.restore();
    } else if (fx.effect === "eyewear") {
      const img = art.get(`eye:${fx.eyewear}`);
      if (!img) return;
      // design: 200×80 with the eyes 80 units apart. Turned faces bring the eyes closer
      // together, so never go narrower than the face itself.
      const w = Math.max((eye.dist / 80) * 200, face.w * 1.12) * (fx.eyewearSize ?? 1);
      const h = (w * 80) / 200;
      ctx.save();
      ctx.translate(eye.mid.x, eye.mid.y);
      ctx.rotate(eye.angle);
      drawSprite(ctx, sprite(img, 200 / 80, { blur: 0.08, y: 0.04, alpha: 0.25 }), w, h);
      ctx.restore();
    }
  });
}

/* compose ───────────────────────────────────────────────────────────── */

export interface ComposeInput {
  source: Src;
  /** AI matte (alpha = subject), any resolution */
  mask: HTMLCanvasElement | null;
  strokes: Stroke[];
  faces: Face[];
  bg: BgSpec;
  fx: FaceFx;
  backdrop: Src | null;
  /** decoded overlay art: sticker ids and "eye:<id>" */
  art: Map<string, HTMLImageElement>;
  /** render scale relative to the source (preview < 1, export = 1) */
  scale: number;
}

/**
 * Layers that only change when their own inputs change, kept per source photo, so a slider
 * redraws only what it affects: dragging face strength reuses the background and the
 * cut-out; dragging blur amount reuses the photo and the cut-out. (Re-composing everything on
 * every step is what made sliders lag, most of all in Safari.)
 */
interface LayerCache {
  W: number;
  H: number;
  photo: HTMLCanvasElement;
  bg?: { key: string; mask: HTMLCanvasElement; backdrop: Src | null; canvas: HTMLCanvasElement };
  subject?: { mask: HTMLCanvasElement; canvas: HTMLCanvasElement };
}
const layerCache = new WeakMap<object, LayerCache>();

/** Only preview-sized layers are kept: full-size export layers would hold hundreds of MB (iPhone limits). */
const CACHE_MAX_PIXELS = 4_500_000;

function layersFor(source: Src, W: number, H: number): LayerCache {
  const keep = W * H <= CACHE_MAX_PIXELS;
  let c = keep ? layerCache.get(source) : undefined;
  if (!c || c.W !== W || c.H !== H) {
    const photo = newCanvas(W, H);
    const p = photo.getContext("2d")!;
    p.imageSmoothingQuality = "high";
    p.drawImage(source, 0, 0, W, H);
    c = { W, H, photo };
    if (keep) layerCache.set(source, c);
  }
  return c;
}

/** ③ the new background, at W×H */
/** `ai` is the model's own matte: the blur's clean plate is built from it, so brush touch-ups don't rebuild it */
function drawBackground(o: CanvasRenderingContext2D, photo: HTMLCanvasElement, ai: HTMLCanvasElement, W: number, H: number, bg: BgSpec, backdrop: Src | null, source: unknown) {
  o.imageSmoothingQuality = "high";
  switch (bg.mode) {
    case "color":
      o.fillStyle = bg.color;
      o.fillRect(0, 0, W, H);
      break;
    case "gradient": {
      const cs = gradientColors(bg.gradient);
      const lg = o.createLinearGradient(0, 0, W, H);
      cs.forEach((c, i) => lg.addColorStop(i / (cs.length - 1), c));
      o.fillStyle = lg;
      o.fillRect(0, 0, W, H);
      break;
    }
    case "pattern":
      patternById(bg.pattern).draw(o, W, H);
      break;
    case "image":
      if (backdrop) {
        const r = coverRect(backdrop.width, backdrop.height, W, H);
        o.drawImage(backdrop, r.x, r.y, r.w, r.h, 0, 0, W, H);
      }
      break;
    case "blur":
      blurBackground(o, photo, ai, W, H, bg, source, `${W}x${H}`);
      break;
  }
}

/** Source-sized scene with stages ①–④ applied. */
export function compose({ source, mask, strokes, faces, bg, fx, backdrop, art, scale }: ComposeInput): HTMLCanvasElement {
  const W = Math.round(source.width * scale);
  const H = Math.round(source.height * scale);
  const scaled = faces.map((f) => ({ ...f, x: f.x * scale, y: f.y * scale, w: f.w * scale, h: f.h * scale, landmarks: f.landmarks.map((v) => v * scale) }));
  const layers = layersFor(source, W, H);

  const out = newCanvas(W, H);
  const o = out.getContext("2d")!;
  const replaced = bg.mode !== "original" && !!mask;
  let m: HTMLCanvasElement | null = null;

  if (!replaced) {
    o.drawImage(layers.photo, 0, 0);
  } else {
    m = refineMask(mask!, strokes, W, H);
    // ③ background (cached until the background settings, cut-out or backdrop change)
    const key = JSON.stringify(bg);
    if (!layers.bg || layers.bg.key !== key || layers.bg.mask !== mask || layers.bg.backdrop !== backdrop) {
      const canvas = newCanvas(W, H);
      drawBackground(canvas.getContext("2d")!, layers.photo, mask!, W, H, bg, backdrop, source);
      layers.bg = { key, mask: mask!, backdrop, canvas };
    }
    // ① the cut-out subject (cached until the cut-out changes)
    if (!layers.subject || layers.subject.mask !== m) {
      const canvas = newCanvas(W, H);
      const s = canvas.getContext("2d")!;
      s.drawImage(layers.photo, 0, 0);
      s.globalCompositeOperation = "destination-in";
      s.drawImage(m, 0, 0);
      layers.subject = { mask: m, canvas };
    }
    o.drawImage(layers.bg.canvas, 0, 0);
    o.drawImage(layers.subject.canvas, 0, 0);
  }

  // ② blur/pixelate faces, on top of the finished picture, only inside each face
  if ((fx.effect === "blur" || fx.effect === "pixelate") && faces.length) {
    // a patch just big enough for the faces, not the whole picture
    const boxes = scaled.map((f) => headEllipse(f));
    const x0 = Math.max(0, Math.floor(Math.min(...boxes.map((e) => e.cx - e.rx)) - 2));
    const y0 = Math.max(0, Math.floor(Math.min(...boxes.map((e) => e.cy - e.ry)) - 2));
    const x1 = Math.min(W, Math.ceil(Math.max(...boxes.map((e) => e.cx + e.rx)) + 2));
    const y1 = Math.min(H, Math.ceil(Math.max(...boxes.map((e) => e.cy + e.ry)) + 2));
    if (x1 > x0 && y1 > y0) {
      const patch = newCanvas(x1 - x0, y1 - y0);
      const pc = patch.getContext("2d")!;
      pc.translate(-x0, -y0);
      applyPixelFx(pc, out, scaled, fx);
      if (replaced && bg.mode !== "blur" && m) {
        // a face that isn't in the cut-out sits behind the new background: leave the backdrop alone
        pc.globalCompositeOperation = "destination-in";
        pc.drawImage(m, 0, 0);
      }
      o.drawImage(patch, x0, y0);
    }
  }

  // ④ overlays on top of everything
  if ((fx.effect === "sticker" || fx.effect === "eyewear") && faces.length) applyOverlays(o, scaled, fx, art);
  return out;
}

/** Circle crop and/or ring for profile pictures, applied to the final frame (stage ⑥). */
export function decoratePfp(frame: HTMLCanvasElement, pfp: PfpSpec): HTMLCanvasElement {
  if (!pfp.enabled || (pfp.shape === "square" && pfp.ring === "none")) return frame;
  const size = Math.min(frame.width, frame.height);
  const out = newCanvas(frame.width, frame.height);
  const ctx = out.getContext("2d")!;
  const cx = frame.width / 2;
  const cy = frame.height / 2;
  const r = size / 2;
  if (pfp.shape === "circle") {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(frame, 0, 0);
    ctx.restore();
  } else {
    ctx.drawImage(frame, 0, 0);
  }
  if (pfp.ring !== "none") {
    const width = size * 0.045;
    ctx.save();
    ctx.lineWidth = width;
    if (pfp.ring === "holo" && "createConicGradient" in ctx) {
      const g = ctx.createConicGradient(-Math.PI / 2, cx, cy);
      ["#ff4fa3", "#ffc93c", "#d4ff4f", "#38bdf8", "#6d4aff", "#ff4fa3"].forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c));
      ctx.strokeStyle = g;
    } else {
      ctx.strokeStyle = pfp.ring === "holo" ? "#6d4aff" : pfp.ring;
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r - width / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  return out;
}
