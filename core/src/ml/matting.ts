import { getSession, type ModelId } from "./models";

export type MattingQuality = "fast" | "hd";
/** what the cut-out looks for: people (MODNet) or any main object (ISNet) */
export type SubjectKind = "person" | "object";

type Src = CanvasImageSource & { width: number; height: number };

interface Prep {
  width: number;
  height: number;
  mean: [number, number, number];
  std: [number, number, number];
}

/**
 * Model input size.
 * - person (MODNet): short side ≈ 1.3× the photo, between 256 and 512 (fast) or 1024 (HD), in
 *   multiples of 32. Small photos stretched to 512 come out blurry and the model sees nothing.
 * - object (ISNet): fixed 1024², inputs x/255 − 0.5.
 */
function plan(kind: SubjectKind, quality: MattingQuality, W: number, H: number): Prep {
  if (kind === "object") return { width: 1024, height: 1024, mean: [0.5, 0.5, 0.5], std: [1, 1, 1] };
  const cap = quality === "hd" ? 1024 : 512;
  const short = Math.min(cap, Math.max(256, Math.round(Math.min(W, H) * 1.3)));
  const s = short / Math.min(W, H);
  const r32 = (v: number) => Math.max(32, Math.round((v * s) / 32) * 32);
  return { width: r32(W), height: r32(H), mean: [0.5, 0.5, 0.5], std: [0.5, 0.5, 0.5] };
}

/**
 * Person/subject matte at source resolution. Returns a canvas whose alpha channel
 * is the matte (white RGB), ready for `destination-in` compositing.
 */
export async function segmentSubject(src: Src, quality: MattingQuality, kind: SubjectKind = "person"): Promise<HTMLCanvasElement> {
  const id: ModelId = kind === "object" ? "objects" : "matting";
  const { ort, session } = await getSession(id);
  const p = plan(kind, quality, src.width, src.height);

  const c = document.createElement("canvas");
  c.width = p.width;
  c.height = p.height;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, p.width, p.height);
  const { data } = ctx.getImageData(0, 0, p.width, p.height);
  const plane = p.width * p.height;
  const input = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    for (let ch = 0; ch < 3; ch++) input[ch * plane + i] = (data[i * 4 + ch] / 255 - p.mean[ch]) / p.std[ch];
  }

  const feeds = { [session.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, p.height, p.width]) };
  const out = await session.run(feeds);
  const raw = out[session.outputNames[session.outputNames.length - 1]];
  const values = raw.data as Float32Array;

  // Some exports give logits, some probabilities: normalise either to 0..1.
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < plane; i++) {
    if (values[i] < lo) lo = values[i];
    if (values[i] > hi) hi = values[i];
  }
  const logits = lo < -0.01 || hi > 1.01;
  // ISNet's probabilities are relative: stretch them to the full range first.
  const stretch = kind === "object" && hi - lo > 1e-6;

  // matte values 0..1 first, then drop disconnected specks before writing alpha
  const alpha = new Float32Array(plane);
  for (let i = 0; i < plane; i++) {
    let a = logits ? 1 / (1 + Math.exp(-values[i])) : values[i];
    if (stretch) a = (values[i] - lo) / (hi - lo);
    alpha[i] = kind === "object" ? Math.min(1, Math.max(0, (a - 0.25) / 0.6)) : Math.min(1, Math.max(0, (a - 0.08) / 0.84));
  }
  removeSpecks(alpha, p.width, p.height);

  const small = new ImageData(p.width, p.height);
  for (let i = 0; i < plane; i++) {
    small.data[i * 4] = small.data[i * 4 + 1] = small.data[i * 4 + 2] = 255;
    small.data[i * 4 + 3] = Math.round(alpha[i] * 255);
  }
  ctx.putImageData(small, 0, 0);

  const mask = document.createElement("canvas");
  mask.width = src.width;
  mask.height = src.height;
  const m = mask.getContext("2d")!;
  m.imageSmoothingEnabled = true;
  m.imageSmoothingQuality = "high";
  m.drawImage(c, 0, 0, src.width, src.height);
  return mask;
}

/**
 * Keep the subject, drop specks: label solid regions on a coarse grid and clear any
 * region smaller than 4% of the largest one. Thin hair stays (it's attached to the head).
 */
function removeSpecks(alpha: Float32Array, w: number, h: number) {
  const g = Math.max(1, Math.ceil(Math.max(w, h) / 256));
  const gw = Math.ceil(w / g);
  const gh = Math.ceil(h / g);
  const on = new Uint8Array(gw * gh);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (alpha[y * w + x] > 0.35) on[Math.floor(y / g) * gw + Math.floor(x / g)] = 1;
  const label = new Int32Array(gw * gh).fill(-1);
  const sizes: number[] = [];
  const stack: number[] = [];
  for (let i = 0; i < on.length; i++) {
    if (!on[i] || label[i] >= 0) continue;
    const id = sizes.length;
    let n = 0;
    stack.push(i);
    label[i] = id;
    while (stack.length) {
      const c = stack.pop()!;
      n++;
      const cx = c % gw;
      const cy = (c - cx) / gw;
      for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
        if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
        const j = ny * gw + nx;
        if (on[j] && label[j] < 0) {
          label[j] = id;
          stack.push(j);
        }
      }
    }
    sizes.push(n);
  }
  if (sizes.length < 2) return;
  const biggest = Math.max(...sizes);
  const keep = sizes.map((n) => n >= biggest * 0.04);
  // a cell keeps its pixels if it, or a neighbour, belongs to a kept region (protects soft edges)
  const keepCell = new Uint8Array(gw * gh);
  for (let i = 0; i < label.length; i++) {
    if (label[i] >= 0 && keep[label[i]]) {
      const cx = i % gw;
      const cy = (i - cx) / gw;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx >= 0 && ny >= 0 && nx < gw && ny < gh) keepCell[ny * gw + nx] = 1;
      }
    }
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!keepCell[Math.floor(y / g) * gw + Math.floor(x / g)]) alpha[y * w + x] = 0;
}

/** Share of the photo the cut-out kept (0..1), to spot "nothing found". */
export function coverage(mask: HTMLCanvasElement): number {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(mask, 0, 0, s, s);
  const d = ctx.getImageData(0, 0, s, s).data;
  let n = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 127) n++;
  return n / (s * s);
}

/** If the photo already has a see-through background, its alpha is the cut-out. */
export function alphaMask(src: Src): HTMLCanvasElement | null {
  const probe = document.createElement("canvas");
  const k = Math.min(1, 256 / Math.max(src.width, src.height));
  probe.width = Math.max(1, Math.round(src.width * k));
  probe.height = Math.max(1, Math.round(src.height * k));
  const p = probe.getContext("2d", { willReadFrequently: true })!;
  p.drawImage(src, 0, 0, probe.width, probe.height);
  const d = p.getImageData(0, 0, probe.width, probe.height).data;
  let clear = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 200) clear++;
  if (clear / (d.length / 4) < 0.02) return null;
  const mask = document.createElement("canvas");
  mask.width = src.width;
  mask.height = src.height;
  const m = mask.getContext("2d")!;
  m.drawImage(src, 0, 0);
  m.globalCompositeOperation = "source-in";
  m.fillStyle = "#fff";
  m.fillRect(0, 0, mask.width, mask.height);
  return mask;
}
