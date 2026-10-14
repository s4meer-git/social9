import { getSession } from "./models";

type Src = CanvasImageSource & { width: number; height: number };

/** Largest crop sent to the model. Bigger areas are scaled down first; the fill is soft anyway. */
const MAX_CROP = 1536;

/**
 * Remove whatever is painted in `hole` (any pixel with alpha) and fill it in with MI-GAN,
 * on this device. Only a crop around the painted area is processed, and only the painted
 * area is changed, so the rest of the photo stays exactly as it was.
 * Returns a new canvas the size of the photo, or null if nothing was painted.
 */
export async function removeObject(src: Src, hole: HTMLCanvasElement): Promise<HTMLCanvasElement | null> {
  const W = src.width;
  const H = src.height;

  // where the painting is, at photo size
  const holeFull = document.createElement("canvas");
  holeFull.width = W;
  holeFull.height = H;
  const hctx = holeFull.getContext("2d", { willReadFrequently: true })!;
  hctx.drawImage(hole, 0, 0, W, H);
  const box = paintedBox(hctx, W, H);
  if (!box) return null;

  // the crop: the painted area plus plenty of surroundings for the model to copy from
  const margin = Math.max(48, Math.round(Math.max(box.w, box.h) * 0.75));
  const cx0 = Math.max(0, box.x - margin);
  const cy0 = Math.max(0, box.y - margin);
  const cx1 = Math.min(W, box.x + box.w + margin);
  const cy1 = Math.min(H, box.y + box.h + margin);
  const cw = cx1 - cx0;
  const ch = cy1 - cy0;
  const k = Math.min(1, MAX_CROP / Math.max(cw, ch));
  const w = Math.max(8, Math.round(cw * k));
  const h = Math.max(8, Math.round(ch * k));

  const crop = document.createElement("canvas");
  crop.width = w;
  crop.height = h;
  const cctx = crop.getContext("2d", { willReadFrequently: true })!;
  cctx.imageSmoothingQuality = "high";
  cctx.drawImage(src, cx0, cy0, cw, ch, 0, 0, w, h);
  const img = cctx.getImageData(0, 0, w, h).data;

  const mcrop = document.createElement("canvas");
  mcrop.width = w;
  mcrop.height = h;
  const mctx = mcrop.getContext("2d", { willReadFrequently: true })!;
  mctx.drawImage(holeFull, cx0, cy0, cw, ch, 0, 0, w, h);
  const m = mctx.getImageData(0, 0, w, h).data;

  // MI-GAN pipeline: uint8 RGB image, and a mask where 0 = fill this in, 255 = keep
  const plane = w * h;
  const image = new Uint8Array(3 * plane);
  const mask = new Uint8Array(plane);
  for (let i = 0; i < plane; i++) {
    image[i] = img[i * 4];
    image[plane + i] = img[i * 4 + 1];
    image[2 * plane + i] = img[i * 4 + 2];
    mask[i] = m[i * 4 + 3] > 8 ? 0 : 255;
  }

  const { ort, session } = await getSession("inpaint");
  const out = await session.run({
    image: new ort.Tensor("uint8", image, [1, 3, h, w]),
    mask: new ort.Tensor("uint8", mask, [1, 1, h, w]),
  });
  const y = out[session.outputNames[0]].data as Uint8Array;

  const filled = new ImageData(w, h);
  for (let i = 0; i < plane; i++) {
    filled.data[i * 4] = y[i];
    filled.data[i * 4 + 1] = y[plane + i];
    filled.data[i * 4 + 2] = y[2 * plane + i];
    filled.data[i * 4 + 3] = 255;
  }
  cctx.putImageData(filled, 0, 0);

  // keep only the painted area (soft edges come from the brush), then lay it on the photo
  cctx.globalCompositeOperation = "destination-in";
  cctx.drawImage(mcrop, 0, 0);

  const result = document.createElement("canvas");
  result.width = W;
  result.height = H;
  const rctx = result.getContext("2d")!;
  rctx.drawImage(src, 0, 0);
  rctx.imageSmoothingQuality = "high";
  rctx.drawImage(crop, 0, 0, w, h, cx0, cy0, cw, ch);
  return result;
}

/** Bounding box of every pixel with alpha, or null. */
function paintedBox(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const { data } = ctx.getImageData(0, 0, W, H);
  let x0 = W;
  let y0 = H;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
