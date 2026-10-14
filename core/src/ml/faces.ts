import { getSession } from "./models";
import { decodeYunet, mapFace, nms, YUNET_SIZE, type Face } from "./yunet";

export type { Face };

type Src = CanvasImageSource & { width: number; height: number };

/** Letterbox a region of the source into a 640×640 BGR float tensor (YuNet's raw input). */
function toTensor(src: Src, sx: number, sy: number, sw: number, sh: number) {
  const scale = YUNET_SIZE / Math.max(sw, sh);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = YUNET_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, YUNET_SIZE, YUNET_SIZE);
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, Math.round(sw * scale), Math.round(sh * scale));
  const { data } = ctx.getImageData(0, 0, YUNET_SIZE, YUNET_SIZE);
  const plane = YUNET_SIZE * YUNET_SIZE;
  const f = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    f[i] = data[i * 4 + 2]; // B
    f[plane + i] = data[i * 4 + 1]; // G
    f[2 * plane + i] = data[i * 4]; // R
  }
  return { tensor: f, scale };
}

/**
 * Find faces at any size. One pass over the whole photo catches large faces;
 * on big photos, overlapping tiles catch the small faces in the background.
 */
export async function detectFaces(src: Src, threshold = 0.6): Promise<Face[]> {
  const { ort, session } = await getSession("faces");
  const W = src.width;
  const H = src.height;

  const regions: [number, number, number, number][] = [[0, 0, W, H]];
  if (Math.max(W, H) > 1400) {
    const tw = Math.ceil(W * 0.6);
    const th = Math.ceil(H * 0.6);
    for (const ox of [0, W - tw]) for (const oy of [0, H - th]) regions.push([ox, oy, tw, th]);
  }

  const all: Face[] = [];
  for (const [sx, sy, sw, sh] of regions) {
    const { tensor, scale } = toTensor(src, sx, sy, sw, sh);
    const out = await session.run({ [session.inputNames[0]]: new ort.Tensor("float32", tensor, [1, 3, YUNET_SIZE, YUNET_SIZE]) });
    for (const f of decodeYunet(out as never, threshold)) {
      const m = mapFace(f, scale, sx, sy);
      // Drop faces cut by an inner tile edge; the full-image pass or another tile has them whole.
      const cut =
        (sx > 0 && m.x < sx + 2) || (sy > 0 && m.y < sy + 2) || (sx + sw < W && m.x + m.w > sx + sw - 2) || (sy + sh < H && m.y + m.h > sy + sh - 2);
      if (!cut && m.w > 8 && m.h > 8) all.push(m);
    }
  }
  return nms(all, 0.3)
    .filter((f) => f.x + f.w > 0 && f.y + f.h > 0 && f.x < W && f.y < H)
    .sort((a, b) => a.x - b.x);
}
