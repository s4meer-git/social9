import { coverRect, fitRect } from "@social9/core/image/geometry";
import { drawBlurred } from "./compose";
import { filterBlurFits } from "@social9/core/image/canvas-filter";

export type FitMode = "crop" | "fit";
export type FillMode = "blur" | "color" | "transparent";

export interface FrameSpec {
  width: number;
  height: number;
  mode: FitMode;
  focusX: number;
  focusY: number;
  zoom: number;
  fill: FillMode;
  fillColor: string;
}

type Source = CanvasImageSource & { width: number; height: number };

const supportsCanvasFilter = (radius: number) => filterBlurFits(radius);

/** Paint a blurred, cover-scaled copy of the source over the whole canvas. */
function paintBlurredBackdrop(ctx: CanvasRenderingContext2D, src: Source, w: number, h: number) {
  const r = coverRect(src.width, src.height, w, h);
  const radius = Math.round(Math.max(w, h) / 30);
  if (supportsCanvasFilter(radius)) {
    ctx.save();
    ctx.filter = `blur(${radius}px) saturate(1.1)`;
    // overscan so the blurred edges don't fade to transparent
    ctx.drawImage(src, r.x, r.y, r.w, r.h, -radius * 2, -radius * 2, w + radius * 4, h + radius * 4);
    ctx.restore();
  } else {
    drawBlurred(ctx, src, r.x, r.y, r.w, r.h, -radius * 2, -radius * 2, w + radius * 4, h + radius * 4, radius);
  }
  ctx.fillStyle = "rgb(0 0 0 / 0.06)";
  ctx.fillRect(0, 0, w, h);
}

/** Draw the source into `canvas` at exactly spec.width×spec.height. */
export function renderFrame(src: Source, spec: FrameSpec, canvas: HTMLCanvasElement = document.createElement("canvas")) {
  const { width: w, height: h } = spec;
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (spec.mode === "crop") {
    const r = coverRect(src.width, src.height, w, h, spec.focusX, spec.focusY, spec.zoom);
    ctx.drawImage(src, r.x, r.y, r.w, r.h, 0, 0, w, h);
    return canvas;
  }

  if (spec.fill === "blur") {
    paintBlurredBackdrop(ctx, src, w, h);
  } else if (spec.fill === "color") {
    ctx.fillStyle = spec.fillColor;
    ctx.fillRect(0, 0, w, h);
  } // "transparent": leave the empty space clear
  const d = fitRect(src.width, src.height, w, h, spec.focusX, spec.focusY, spec.zoom);
  ctx.drawImage(src, 0, 0, src.width, src.height, d.x, d.y, d.w, d.h);
  return canvas;
}
