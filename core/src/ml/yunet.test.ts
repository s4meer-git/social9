import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { decodeYunet, mapFace, nms, YUNET_SIZE, YUNET_STRIDES } from "./yunet";
import { ORT_VERSION } from "./ort";

/** Empty heads with one confident anchor at (row, col) on stride 16. */
function fakeOutputs(row: number, col: number) {
  const out: Record<string, { data: Float32Array }> = {};
  for (const s of YUNET_STRIDES) {
    const n = (YUNET_SIZE / s) ** 2;
    out[`cls_${s}`] = { data: new Float32Array(n) };
    out[`obj_${s}`] = { data: new Float32Array(n) };
    out[`bbox_${s}`] = { data: new Float32Array(n * 4) };
    out[`kps_${s}`] = { data: new Float32Array(n * 10) };
  }
  const i = row * (YUNET_SIZE / 16) + col;
  out.cls_16.data[i] = 0.9;
  out.obj_16.data[i] = 0.9;
  out.bbox_16.data.set([0.5, 0.5, Math.log(4), Math.log(5)], i * 4);
  return out;
}

describe("decodeYunet", () => {
  it("decodes one anchor into a box in input pixels", () => {
    const faces = decodeYunet(fakeOutputs(10, 20));
    expect(faces).toHaveLength(1);
    const f = faces[0];
    // center = (col + 0.5) * 16 = 328, (row + 0.5) * 16 = 168; size = 4*16 × 5*16
    expect(f.x).toBeCloseTo(328 - 32);
    expect(f.y).toBeCloseTo(168 - 40);
    expect(f.w).toBeCloseTo(64);
    expect(f.h).toBeCloseTo(80);
    expect(f.score).toBeCloseTo(0.9);
  });

  it("drops anchors under the threshold", () => {
    const out = fakeOutputs(1, 1);
    out.obj_16.data[1 * 40 + 1] = 0.1;
    expect(decodeYunet(out, 0.6)).toHaveLength(0);
  });
});

describe("nms / mapFace", () => {
  it("keeps the best of overlapping boxes", () => {
    const a = { x: 0, y: 0, w: 100, h: 100, score: 0.9, landmarks: [] };
    const b = { x: 10, y: 10, w: 100, h: 100, score: 0.7, landmarks: [] };
    const c = { x: 300, y: 0, w: 50, h: 50, score: 0.8, landmarks: [] };
    expect(nms([b, a, c]).map((f) => f.score)).toEqual([0.9, 0.8]);
  });

  it("maps letterboxed coordinates back to the source", () => {
    const f = mapFace({ x: 64, y: 32, w: 64, h: 64, score: 1, landmarks: [64, 32] }, 0.5, 100, 200);
    expect(f).toMatchObject({ x: 228, y: 264, w: 128, h: 128, landmarks: [228, 264] });
  });
});

describe("runtime version", () => {
  it("matches the installed onnxruntime-web", () => {
    const pkg = JSON.parse(readFileSync("node_modules/onnxruntime-web/package.json", "utf8"));
    expect(ORT_VERSION).toBe(pkg.version);
  });
});
