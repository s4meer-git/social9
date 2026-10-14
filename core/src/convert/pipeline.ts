import { canFilter } from "../image/canvas-filter";
import { fitCanvasLimit } from "../image/limits";
import { encodeCanvas, formatById, padTo, type FormatId, type PdfPage } from "./encoders";

/** Everything the converter can do to one image, in the order it's applied. */
export interface ConvertSpec {
  format: FormatId;
  /** 0..1, lossy formats */
  quality: number;
  size: SizeMode;
  /** KB (1 KB = 1024 bytes); upper bound for max/range, the target for exact */
  kb: number;
  /** KB, lower bound for range */
  minKb: number;
  /** when the size limit can't be met at the lowest quality, shrink the pixel size */
  allowShrink: boolean;
  dims: DimMode;
  width: number;
  height: number;
  /** keep the aspect ratio when one side changes */
  lock: boolean;
  percent: number;
  /** print size, in `unit`, at `dpi` */
  printW: number;
  printH: number;
  unit: "cm" | "in" | "mm";
  dpi: number;
  /** how the photo fills an exact W×H box with a different ratio */
  fit: "cover" | "contain" | "stretch";
  rotate: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
  grayscale: boolean;
  /** color behind transparency (and padding for "contain") */
  matte: string;
  keepAlpha: boolean;
  pdfPage: PdfPage;
}

export type SizeMode = "none" | "max" | "exact" | "range";
export type DimMode = "original" | "exact" | "percent" | "print" | "longest";

export const defaultSpec: ConvertSpec = {
  format: "jpeg",
  quality: 0.86,
  size: "none",
  kb: 200,
  minKb: 20,
  allowShrink: true,
  dims: "original",
  width: 1080,
  height: 1080,
  lock: true,
  percent: 100,
  printW: 3.5,
  printH: 4.5,
  unit: "cm",
  dpi: 300,
  fit: "cover",
  rotate: 0,
  flipH: false,
  flipV: false,
  grayscale: false,
  matte: "#ffffff",
  keepAlpha: true,
  pdfPage: "fit",
};

/** Ready-made recipes for common jobs (forms, favicons, feeds). */
export const recipes: { id: string; name: string; hint: string; spec: Partial<ConvertSpec> }[] = [
  { id: "exam-photo", name: "Exam form photo", hint: "3.5 × 4.5 cm · 20–50 KB · JPG", spec: { format: "jpeg", dims: "print", printW: 3.5, printH: 4.5, unit: "cm", dpi: 200, fit: "cover", size: "range", minKb: 20, kb: 50 } },
  { id: "signature", name: "Signature", hint: "6 × 2 cm · 10–20 KB · JPG", spec: { format: "jpeg", dims: "print", printW: 6, printH: 2, unit: "cm", dpi: 200, fit: "contain", size: "range", minKb: 10, kb: 20, matte: "#ffffff" } },
  { id: "passport", name: "Passport photo", hint: "2 × 2 in · 600 × 600 · under 240 KB", spec: { format: "jpeg", dims: "exact", lock: false, width: 600, height: 600, fit: "cover", size: "max", kb: 240, dpi: 300 } },
  { id: "exact-50", name: "Exactly 50 KB", hint: "Same pixel size, exactly 50 KB", spec: { format: "jpeg", dims: "original", size: "exact", kb: 50 } },
  { id: "email", name: "For email", hint: "Longest side 1600 px · under 500 KB", spec: { format: "jpeg", dims: "longest", width: 1600, size: "max", kb: 500 } },
  { id: "web", name: "For websites", hint: "WebP · longest side 1920 px", spec: { format: "webp", dims: "longest", width: 1920, size: "none", quality: 0.82 } },
  { id: "ig-post", name: "Instagram post", hint: "1080 × 1350 · JPG", spec: { format: "jpeg", dims: "exact", lock: false, width: 1080, height: 1350, fit: "cover", size: "none", quality: 0.9 } },
  { id: "favicon", name: "Favicon", hint: "ICO · 16 to 256 px", spec: { format: "ico", dims: "exact", lock: false, width: 256, height: 256, fit: "contain", size: "none", keepAlpha: true } },
  { id: "pdf-a4", name: "Photo to PDF", hint: "A4 page · under 1 MB", spec: { format: "pdf", pdfPage: "a4", dims: "original", size: "max", kb: 1024 } },
];

const toInches = (v: number, unit: ConvertSpec["unit"]) => (unit === "in" ? v : unit === "cm" ? v / 2.54 : v / 25.4);

/** Output pixel size for a source of srcW×srcH (after rotation). */
export function targetSize(srcW: number, srcH: number, s: ConvertSpec): { w: number; h: number } {
  const clamp = (v: number) => Math.max(1, Math.min(16384, Math.round(v)));
  switch (s.dims) {
    case "exact": {
      if (s.lock) {
        // with the lock on, width drives and height follows the photo's ratio
        return { w: clamp(s.width), h: clamp((s.width * srcH) / srcW) };
      }
      return { w: clamp(s.width), h: clamp(s.height) };
    }
    case "percent":
      return { w: clamp((srcW * s.percent) / 100), h: clamp((srcH * s.percent) / 100) };
    case "print":
      return { w: clamp(toInches(s.printW, s.unit) * s.dpi), h: clamp(toInches(s.printH, s.unit) * s.dpi) };
    case "longest": {
      const k = Math.min(1, s.width / Math.max(srcW, srcH));
      return { w: clamp(srcW * k), h: clamp(srcH * k) };
    }
    default:
      return { w: srcW, h: srcH };
  }
}

type Src = CanvasImageSource & { width: number; height: number };

/** Rotate/flip/resize/grayscale into a fresh canvas at the exact output size. */
export function prepare(src: Src, s: ConvertSpec, scale = 1): HTMLCanvasElement {
  const turned = s.rotate === 90 || s.rotate === 270;
  const rw = turned ? src.height : src.width;
  const rh = turned ? src.width : src.height;

  // 1. orientation
  const oriented = document.createElement("canvas");
  oriented.width = rw;
  oriented.height = rh;
  const o = oriented.getContext("2d")!;
  o.translate(rw / 2, rh / 2);
  o.rotate((s.rotate * Math.PI) / 180);
  o.scale(s.flipH ? -1 : 1, s.flipV ? -1 : 1);
  o.drawImage(src, -src.width / 2, -src.height / 2);

  // 2. size + fit
  const t = targetSize(rw, rh, s);
  // never bigger than this device can draw (iPhone: 16.7 MP), or the file comes out blank
  const k = scale * fitCanvasLimit(t.w * scale, t.h * scale);
  const W = Math.max(1, Math.round(t.w * k));
  const H = Math.max(1, Math.round(t.h * k));
  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const c = out.getContext("2d")!;
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = "high";
  if (s.grayscale) c.filter = "grayscale(1)";
  const fixedBox = s.dims === "exact" ? !s.lock : s.dims === "print";
  if (!fixedBox || s.fit === "stretch") {
    c.drawImage(oriented, 0, 0, W, H);
  } else if (s.fit === "cover") {
    const k = Math.max(W / rw, H / rh);
    const sw = W / k;
    const sh = H / k;
    c.drawImage(oriented, (rw - sw) / 2, (rh - sh) / 2, sw, sh, 0, 0, W, H);
  } else {
    if (!s.keepAlpha || !formatById(s.format).alpha) {
      c.fillStyle = s.matte;
      c.fillRect(0, 0, W, H);
    }
    const k = Math.min(W / rw, H / rh);
    c.drawImage(oriented, (W - rw * k) / 2, (H - rh * k) / 2, rw * k, rh * k);
  }
  // Safari before 18 ignores ctx.filter: make it gray by hand
  if (s.grayscale && !canFilter()) {
    const d = c.getImageData(0, 0, W, H);
    const px = d.data;
    for (let i = 0; i < px.length; i += 4) px[i] = px[i + 1] = px[i + 2] = Math.round(px[i] * 0.2126 + px[i + 1] * 0.7152 + px[i + 2] * 0.0722);
    c.putImageData(d, 0, 0);
  }
  return out;
}

export interface ConvertResult {
  bytes: Uint8Array;
  width: number;
  height: number;
  quality: number | null;
  /** size goal met */
  hit: boolean;
  /** what we had to do, in plain words ("Reduced to 82% size to fit 50 KB") */
  notes: string[];
}

const KB = 1024;

/**
 * Convert with a file-size goal:
 *  - max:   the best quality that fits under the limit (shrinks pixels if allowed)
 *  - exact: as above, then padded with format-legal filler to exactly N KB
 *  - range: as max, then padded up if it came out under the minimum
 */
export async function convert(src: Src, s: ConvertSpec): Promise<ConvertResult> {
  const info = formatById(s.format);
  const enc = (canvas: HTMLCanvasElement, q: number) => encodeCanvas(canvas, s.format, { quality: q, dpi: s.dpi, matte: s.matte, keepAlpha: s.keepAlpha, pdfPage: s.pdfPage });
  const notes: string[] = [];

  let canvas = prepare(src, s);
  const want = targetSize(src.width, src.height, s);
  if (canvas.width * canvas.height < want.w * want.h * 0.98) notes.push(`Made at ${canvas.width} × ${canvas.height}, the largest size this device can create`);
  if (s.size === "none") {
    const bytes = await enc(canvas, s.quality);
    return { bytes, ...reported(canvas, s.format), quality: info.lossy ? s.quality : null, hit: true, notes };
  }

  const max = s.kb * KB;
  const min = s.size === "range" ? Math.min(s.minKb, s.kb) * KB : s.size === "exact" ? max : 0;

  /** best quality that fits `max` at this canvas, or the smallest attempt */
  const fit = async (c: HTMLCanvasElement) => {
    if (!info.lossy) {
      const b = await enc(c, 1);
      return { bytes: b, q: null as number | null, ok: b.length <= max };
    }
    const top = await enc(c, Math.max(s.quality, 0.92));
    if (top.length <= max) return { bytes: top, q: Math.max(s.quality, 0.92), ok: true };
    let lo = 0.04;
    let hi = Math.max(s.quality, 0.92);
    let best: { bytes: Uint8Array; q: number } | null = null;
    for (let i = 0; i < 9; i++) {
      const q = (lo + hi) / 2;
      const b = await enc(c, q);
      if (b.length <= max) {
        best = { bytes: b, q };
        lo = q;
      } else hi = q;
    }
    if (best) return { bytes: best.bytes, q: best.q as number | null, ok: true };
    const floor = await enc(c, 0.04);
    return { bytes: floor, q: 0.04 as number | null, ok: floor.length <= max };
  };

  let r = await fit(canvas);
  if (!r.ok && s.allowShrink) {
    // largest scale that fits, by binary search on the pixel size
    let lo = 0.05;
    let hi = 1;
    let best: { c: HTMLCanvasElement; r: typeof r; k: number } | null = null;
    for (let i = 0; i < 7; i++) {
      const k = (lo + hi) / 2;
      const c = prepare(src, s, k);
      const rr = await fit(c);
      if (rr.ok) {
        best = { c, r: rr, k };
        lo = k;
      } else hi = k;
    }
    if (best) {
      canvas = best.c;
      r = best.r;
      notes.push(`Pixel size reduced to ${canvas.width} × ${canvas.height} to fit ${s.kb} KB`);
    }
  }

  let bytes = r.bytes;
  let hit = r.ok;
  if (hit && bytes.length < min) {
    const padded = padTo(bytes, s.format, min);
    if (padded) bytes = padded;
    else {
      hit = s.size !== "exact";
      notes.push(`${info.label} can't be padded to an exact size`);
    }
  }
  if (!r.ok) notes.push(`Couldn't get the file under ${s.kb} KB. Allow a smaller pixel size, or choose JPG or WebP.`);
  return { bytes, ...reported(canvas, s.format), quality: r.q, hit, notes };
}

/** Pixel size to report: icons are written at 16–256 px, whatever the canvas size. */
function reported(c: HTMLCanvasElement, format: ConvertSpec["format"]) {
  if (format !== "ico") return { width: c.width, height: c.height };
  const side = [256, 128, 64, 48, 32, 16].find((v) => v <= Math.max(16, Math.min(256, c.width, c.height))) ?? 16;
  return { width: side, height: side };
}

export const outputName = (name: string, format: FormatId) => `${name.replace(/\.[^.]+$/, "") || "image"}.${formatById(format).ext}`;
