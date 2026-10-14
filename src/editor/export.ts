import { convert, outputName } from "@social9/core/convert/pipeline";
import { formatById, type FormatId } from "@social9/core/convert/encoders";
import { renderOutput, renderScene, type SceneInput } from "./render";
import type { SaveSpec } from "./store";

export interface ExportResult {
  blob: Blob;
  width: number;
  height: number;
  format: FormatId;
  quality: number | null;
  /** false when a size goal was set and couldn't be met */
  hitTarget: boolean;
  notes: string[];
  filename: string;
}

/**
 * ⑦ Save: render at full resolution, then encode with the converter. Pixel size comes
 * from the editor (Size tool), so the converter's own resize step is switched off.
 * Re-encoding from a canvas drops all EXIF/GPS metadata.
 */
/**
 * The full-size scene is the slow part of saving. It only depends on the edits, not on the
 * save settings, so it's kept until an edit changes: switching format or size goal (and the
 * final Export) then only re-encodes.
 */
let lastScene: { deps: unknown[]; canvas: HTMLCanvasElement } | null = null;
export function fullScene(s: SceneInput): HTMLCanvasElement {
  const f = s.frame;
  const deps = [s.source, s.mask, s.faces, s.art, s.backdrops, f.bg, f.fx, f.strokes, f.extraFaces];
  if (lastScene && lastScene.deps.length === deps.length && lastScene.deps.every((d, i) => d === deps[i])) return lastScene.canvas;
  const canvas = renderScene(s, 1);
  lastScene = { deps, canvas };
  return canvas;
}

export async function exportImage(scene: SceneInput, spec: SaveSpec, sceneCanvas?: HTMLCanvasElement): Promise<ExportResult> {
  // let the "working" state paint before the heavy render starts
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
  const canvas = renderOutput(sceneCanvas ?? fullScene(scene), scene, 1);
  const r = await convert(canvas, { ...spec, dims: "original", rotate: 0, flipH: false, flipV: false, grayscale: false, fit: "cover" });
  const info = formatById(spec.format);
  const tag = scene.frame.pfp.enabled ? "profile" : (scene.frame.presetId ?? "social9");
  return {
    blob: new Blob([r.bytes as BlobPart], { type: info.mime }),
    width: r.width,
    height: r.height,
    format: spec.format,
    quality: r.quality,
    hitTarget: r.hit,
    notes: r.notes,
    filename: outputName(`${scene.source.name}-${tag}`, spec.format),
  };
}
