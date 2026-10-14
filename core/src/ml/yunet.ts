/** Pure YuNet post-processing, kept separate from the runtime so it can be unit-tested. */

export interface Face {
  x: number;
  y: number;
  w: number;
  h: number;
  score: number;
  /** 5 landmarks: right eye, left eye, nose, mouth right, mouth left (x,y pairs) */
  landmarks: number[];
}

export const YUNET_SIZE = 640;
export const YUNET_STRIDES = [8, 16, 32] as const;

export type YunetOutputs = Record<string, { data: ArrayLike<number> }>;

/** Decode raw YuNet heads (cls/obj/bbox/kps per stride) into faces in input-pixel space. */
export function decodeYunet(out: YunetOutputs, scoreThreshold = 0.6, size = YUNET_SIZE): Face[] {
  const faces: Face[] = [];
  for (const s of YUNET_STRIDES) {
    const cols = size / s;
    const rows = size / s;
    const cls = out[`cls_${s}`].data;
    const obj = out[`obj_${s}`].data;
    const bbox = out[`bbox_${s}`].data;
    const kps = out[`kps_${s}`].data;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const score = Math.sqrt(Math.min(1, Math.max(0, cls[i])) * Math.min(1, Math.max(0, obj[i])));
        if (score < scoreThreshold) continue;
        const cx = (c + bbox[i * 4]) * s;
        const cy = (r + bbox[i * 4 + 1]) * s;
        const w = Math.exp(bbox[i * 4 + 2]) * s;
        const h = Math.exp(bbox[i * 4 + 3]) * s;
        const landmarks: number[] = [];
        for (let n = 0; n < 5; n++) {
          landmarks.push((kps[i * 10 + 2 * n] + c) * s, (kps[i * 10 + 2 * n + 1] + r) * s);
        }
        faces.push({ x: cx - w / 2, y: cy - h / 2, w, h, score, landmarks });
      }
    }
  }
  return faces;
}

export function iou(a: Face, b: Face): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  return inter / (a.w * a.h + b.w * b.h - inter || 1);
}

/** Greedy non-maximum suppression. */
export function nms(faces: Face[], threshold = 0.3): Face[] {
  const sorted = [...faces].sort((a, b) => b.score - a.score);
  const keep: Face[] = [];
  for (const f of sorted) {
    if (keep.every((k) => iou(k, f) < threshold)) keep.push(f);
  }
  return keep;
}

/** Map a face from a letterboxed/tiled input back to source pixels. */
export function mapFace(f: Face, scale: number, offX: number, offY: number): Face {
  return {
    x: f.x / scale + offX,
    y: f.y / scale + offY,
    w: f.w / scale,
    h: f.h / scale,
    score: f.score,
    landmarks: f.landmarks.map((v, i) => v / scale + (i % 2 === 0 ? offX : offY)),
  };
}
