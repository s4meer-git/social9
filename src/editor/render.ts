import { compose, decoratePfp } from "@/lib/image/compose";
import { renderFrame } from "@/lib/image/render";
import { drawTexts } from "@/lib/image/text";
import { allFaces, outputSize, type Frame, type Source } from "./store";
import type { Face } from "@social9/core/ml/yunet";

export interface SceneInput {
  source: Source;
  frame: Frame;
  mask: HTMLCanvasElement | null;
  faces: Face[] | null;
  backdrops: Record<string, ImageBitmap>;
  art: Map<string, HTMLImageElement>;
}

/** Test hook: when a test sets `window.__s9perf = []`, render timings are recorded there. */
const timed = <T,>(kind: string, fn: () => T): T => {
  const log = typeof window !== "undefined" ? (window as unknown as { __s9perf?: [string, number][] }).__s9perf : undefined;
  if (!log) return fn();
  const t = performance.now();
  const r = fn();
  log.push([kind, performance.now() - t]);
  return r;
};

/** Source-sized composite (stages ①–④) at the given scale. */
export function renderScene(s: SceneInput, scale: number): HTMLCanvasElement {
  return timed("scene", () => renderSceneNow(s, scale));
}

function renderSceneNow(s: SceneInput, scale: number): HTMLCanvasElement {
  return compose({
    source: s.source.bitmap,
    mask: s.mask,
    strokes: s.frame.strokes,
    faces: allFaces(s.faces, s.frame),
    bg: s.frame.bg,
    fx: s.frame.fx,
    backdrop: s.frame.bg.image ? (s.backdrops[s.frame.bg.image] ?? null) : null,
    art: s.art,
    scale,
  });
}

/** Final framed output: ⑤ crop/fit to the output size, then ⑥ profile circle/ring. */
export function renderOutput(scene: HTMLCanvasElement, s: SceneInput, outScale = 1, target?: HTMLCanvasElement): HTMLCanvasElement {
  return timed("output", () => renderOutputNow(scene, s, outScale, target));
}

function renderOutputNow(scene: HTMLCanvasElement, s: SceneInput, outScale = 1, target?: HTMLCanvasElement): HTMLCanvasElement {
  const { width, height } = outputSize(s.frame, s.source);
  const w = Math.max(1, Math.round(width * outScale));
  const h = Math.max(1, Math.round(height * outScale));
  const framed = renderFrame(scene, { ...s.frame, width: w, height: h }, s.frame.pfp.enabled ? undefined : target);
  // ⑤b captions, on the framed picture, so they keep their place when the size changes
  if (s.frame.texts.length) drawTexts(framed.getContext("2d")!, s.frame.texts, w, h);
  const out = decoratePfp(framed, s.frame.pfp);
  if (target && out !== target) {
    target.width = out.width;
    target.height = out.height;
    target.getContext("2d")!.drawImage(out, 0, 0);
    return target;
  }
  return out;
}

/** Everything the renderer needs, read from the store. */
export function sceneFromState(s: SceneInput): SceneInput {
  return { source: s.source, frame: s.frame, mask: s.mask, faces: s.faces, backdrops: s.backdrops, art: s.art };
}
