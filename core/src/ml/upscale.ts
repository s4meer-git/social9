import { getSession } from "./models";
import { fitCanvasLimit } from "../image/limits";
import { hasWebGPU } from "./ort";

type Src = CanvasImageSource & { width: number; height: number };

/** Longest side of an upscaled photo. Bigger files are slow to make and rarely needed. */
export const UPSCALE_MAX_SIDE = 4096;
/** The model works on squares this size (plus an overlap), so memory stays small. */
const TILE = 128;
const OVERLAP = 10;
const WINDOW = TILE + OVERLAP * 2;

/**
 * The scale we can actually use for this photo: the one you asked for, unless the result
 * would be bigger than UPSCALE_MAX_SIDE or than this device can draw.
 */
export function upscalePlan(width: number, height: number, factor: number) {
  let scale = Math.min(factor, UPSCALE_MAX_SIDE / Math.max(width, height));
  scale *= fitCanvasLimit(width * scale, height * scale);
  return { scale, width: Math.round(width * scale), height: Math.round(height * scale), limited: scale < factor - 1e-6 };
}

/**
 * Make a photo bigger and sharper with Real-ESRGAN (general x4v3), on this device.
 * The model always enlarges 4×; each tile is drawn into the result at the scale you chose.
 * Transparent areas stay transparent. `onProgress` gets 0..1.
 */
export async function upscale(src: Src, factor: number, onProgress?: (p: number) => void): Promise<HTMLCanvasElement> {
  const { ort, session } = await getSession("upscale");
  const plan = upscalePlan(src.width, src.height, factor);
  // Without a graphics chip, a big photo at 2× is halved first: the model's 4× then gives the
  // 2× you asked for, with a quarter of the work (minutes become seconds on a laptop CPU).
  const half = !(await hasWebGPU()) && plan.scale <= 2 && src.width * src.height > 600_000;
  const W = half ? Math.round(src.width / 2) : src.width;
  const H = half ? Math.round(src.height / 2) : src.height;
  /** how much each model input pixel grows in the result */
  const k = plan.width / W;

  const source = document.createElement("canvas");
  source.width = W;
  source.height = H;
  const sctx = source.getContext("2d", { willReadFrequently: true })!;
  sctx.imageSmoothingQuality = "high";
  sctx.drawImage(src, 0, 0, W, H);

  const out = document.createElement("canvas");
  out.width = plan.width;
  out.height = plan.height;
  const octx = out.getContext("2d")!;
  octx.imageSmoothingQuality = "high";

  const cols = Math.ceil(W / TILE);
  const rows = Math.ceil(H / TILE);
  const tile = document.createElement("canvas");
  const tctx = tile.getContext("2d")!;
  let done = 0;

  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      // the tile plus an overlap on every side. Every window is the same size (shifted inward
      // at the edges), so the GPU never has to rebuild the model for a new shape.
      const x0 = tx * TILE;
      const y0 = ty * TILE;
      const x1 = Math.min(W, x0 + TILE);
      const y1 = Math.min(H, y0 + TILE);
      const w = Math.min(W, WINDOW);
      const h = Math.min(H, WINDOW);
      const px0 = Math.min(Math.max(0, x0 - OVERLAP), W - w);
      const py0 = Math.min(Math.max(0, y0 - OVERLAP), H - h);

      const { data } = sctx.getImageData(px0, py0, w, h);
      const plane = w * h;
      const input = new Float32Array(3 * plane);
      for (let i = 0; i < plane; i++) {
        input[i] = data[i * 4] / 255;
        input[plane + i] = data[i * 4 + 1] / 255;
        input[2 * plane + i] = data[i * 4 + 2] / 255;
      }
      const result = await session.run({ [session.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, h, w]) });
      const y = result[session.outputNames[0]].data as Float32Array;

      // 4× tile back to pixels
      const ow = w * 4;
      const oh = h * 4;
      const oplane = ow * oh;
      const img = new ImageData(ow, oh);
      for (let i = 0; i < oplane; i++) {
        img.data[i * 4] = Math.max(0, Math.min(255, y[i] * 255 + 0.5));
        img.data[i * 4 + 1] = Math.max(0, Math.min(255, y[oplane + i] * 255 + 0.5));
        img.data[i * 4 + 2] = Math.max(0, Math.min(255, y[2 * oplane + i] * 255 + 0.5));
        img.data[i * 4 + 3] = 255;
      }
      tile.width = ow;
      tile.height = oh;
      tctx.putImageData(img, 0, 0);

      // keep only the middle (no overlap), drawn at the chosen scale
      octx.drawImage(tile, (x0 - px0) * 4, (y0 - py0) * 4, (x1 - x0) * 4, (y1 - y0) * 4, x0 * k, y0 * k, (x1 - x0) * k, (y1 - y0) * k);

      done++;
      onProgress?.(done / (cols * rows));
      // let the page breathe between tiles
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  // transparent photos keep their transparency (smoothly enlarged)
  if (hasTransparency(sctx, W, H)) {
    octx.globalCompositeOperation = "destination-in";
    octx.drawImage(source, 0, 0, plan.width, plan.height);
    octx.globalCompositeOperation = "source-over";
  }
  return out;
}

function hasTransparency(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const step = Math.max(1, Math.floor(Math.sqrt((W * H) / 40000)));
  const { data } = ctx.getImageData(0, 0, W, H);
  for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) if (data[(y * W + x) * 4 + 3] < 250) return true;
  return false;
}
