export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Source rectangle to crop so it fills a dstW×dstH frame ("cover").
 * focusX/focusY (0..1) choose where the crop sits inside the leftover space;
 * zoom ≥ 1 crops tighter.
 */
export function coverRect(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  focusX = 0.5,
  focusY = 0.5,
  zoom = 1,
): Rect {
  const scale = Math.max(dstW / srcW, dstH / srcH) * Math.max(1, zoom);
  const w = Math.min(srcW, dstW / scale);
  const h = Math.min(srcH, dstH / scale);
  return {
    x: (srcW - w) * clamp(focusX, 0, 1),
    y: (srcH - h) * clamp(focusY, 0, 1),
    w,
    h,
  };
}

/** Destination rectangle that shows the whole source inside dstW×dstH ("contain"), centered. */
export function containRect(srcW: number, srcH: number, dstW: number, dstH: number): Rect {
  const scale = Math.min(dstW / srcW, dstH / srcH);
  const w = srcW * scale;
  const h = srcH * scale;
  return { x: (dstW - w) / 2, y: (dstH - h) / 2, w, h };
}

/**
 * Destination rectangle for "fit" framing: the whole photo, scaled by `zoom` (≤ 1 shrinks it
 * below the contain size) and placed by focusX/focusY within the empty space (0.5 = centered).
 */
export function fitRect(srcW: number, srcH: number, dstW: number, dstH: number, focusX = 0.5, focusY = 0.5, zoom = 1): Rect {
  const scale = Math.min(dstW / srcW, dstH / srcH) * clamp(zoom, 0.1, 1);
  const w = srcW * scale;
  const h = srcH * scale;
  return { x: (dstW - w) * clamp(focusX, 0, 1), y: (dstH - h) * clamp(focusY, 0, 1), w, h };
}

/** New focus after dragging a fitted photo by (dx, dy) output pixels: it simply follows the pointer. */
export function panFit(fit: Rect, outW: number, outH: number, focusX: number, focusY: number, dx: number, dy: number): { focusX: number; focusY: number } {
  const slackX = outW - fit.w;
  const slackY = outH - fit.h;
  return {
    focusX: slackX > 0.5 ? clamp(focusX + dx / slackX, 0, 1) : focusX,
    focusY: slackY > 0.5 ? clamp(focusY + dy / slackY, 0, 1) : focusY,
  };
}

/**
 * New focus after dragging the photo by (dx, dy) on-screen pixels.
 * displayScale = on-screen px per output px. Dragging right moves the photo right,
 * which reveals more of its left side, so focus decreases.
 */
export function panFocus(
  crop: Rect,
  srcW: number,
  srcH: number,
  outW: number,
  outH: number,
  focusX: number,
  focusY: number,
  dx: number,
  dy: number,
  displayScale: number,
): { focusX: number; focusY: number } {
  const slackX = srcW - crop.w;
  const slackY = srcH - crop.h;
  const srcPerScreenX = crop.w / outW / displayScale;
  const srcPerScreenY = crop.h / outH / displayScale;
  return {
    focusX: slackX > 0.5 ? clamp(focusX - (dx * srcPerScreenX) / slackX, 0, 1) : focusX,
    focusY: slackY > 0.5 ? clamp(focusY - (dy * srcPerScreenY) / slackY, 0, 1) : focusY,
  };
}

/** Greatest-common-divisor based ratio label, e.g. 1080×1350 → "4:5". */
export function ratioLabel(w: number, h: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const g = gcd(Math.round(w), Math.round(h));
  const rw = w / g;
  const rh = h / g;
  if (rw > 50 || rh > 50) return (w / h).toFixed(2) + ":1";
  return `${rw}:${rh}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

/**
 * Crop settings that frame a face for a profile picture: the face takes `faceFrac`
 * of the frame height and its center sits at `eyeLine` from the top.
 */
export function faceFocus(
  face: Rect,
  srcW: number,
  srcH: number,
  outW: number,
  outH: number,
  faceFrac = 0.38,
  eyeLine = 0.46,
): { focusX: number; focusY: number; zoom: number } {
  const base = coverRect(srcW, srcH, outW, outH);
  const wantH = face.h / faceFrac;
  const zoom = Math.max(1, Math.min(6, base.h / wantH));
  const crop = coverRect(srcW, srcH, outW, outH, 0.5, 0.5, zoom);
  const cx = face.x + face.w / 2;
  const cy = face.y + face.h / 2;
  const x = cx - crop.w / 2;
  const y = cy - crop.h * eyeLine;
  const slackX = srcW - crop.w;
  const slackY = srcH - crop.h;
  return {
    focusX: slackX > 0 ? Math.min(1, Math.max(0, x / slackX)) : 0.5,
    focusY: slackY > 0 ? Math.min(1, Math.max(0, y / slackY)) : 0.5,
    zoom,
  };
}

/** Map a point on the output frame back to source pixels (inverse of crop/fit). */
export function toSource(
  px: number,
  py: number,
  mode: "crop" | "fit",
  srcW: number,
  srcH: number,
  outW: number,
  outH: number,
  focusX: number,
  focusY: number,
  zoom: number,
): { x: number; y: number } {
  if (mode === "crop") {
    const r = coverRect(srcW, srcH, outW, outH, focusX, focusY, zoom);
    return { x: r.x + (px / outW) * r.w, y: r.y + (py / outH) * r.h };
  }
  const d = fitRect(srcW, srcH, outW, outH, focusX, focusY, zoom);
  return { x: ((px - d.x) / d.w) * srcW, y: ((py - d.y) / d.h) * srcH };
}
