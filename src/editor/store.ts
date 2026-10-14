import { create } from "zustand";
import { decodeImage, readMetadata, type MetaItem } from "@social9/core/image/load";
import type { FillMode, FitMode } from "@/lib/image/render";
import type { BgSpec, FaceFx, PfpSpec, Stroke } from "@/lib/image/compose";
import { faceFocus } from "@social9/core/image/geometry";
import { loadStickerImage, MIX } from "@/lib/stickers";
import { loadEyewearImage } from "@/lib/eyewear";
import { platforms } from "@/lib/platforms";
import { defaultSpec, type ConvertSpec } from "@social9/core/convert/pipeline";
import type { Face } from "@social9/core/ml/yunet";
import type { MattingQuality, SubjectKind } from "@social9/core/ml/matting";
import type { BgTab, FacesTab, RailId, RetouchTab, Route } from "./tools";
import { newText, type TextItem } from "@/lib/image/text";

/* Editor state. The rules for how tools combine live in docs/editor-architecture.md. */

export interface Source {
  file: File;
  bitmap: ImageBitmap;
  name: string;
  width: number;
  height: number;
  metadata: MetaItem[];
}

/** The undoable document: framing plus every edit. */
export interface Frame {
  presetId: string | null;
  /** null = keep the original size */
  width: number | null;
  height: number | null;
  mode: FitMode;
  focusX: number;
  focusY: number;
  zoom: number;
  fill: FillMode;
  fillColor: string;
  bg: BgSpec;
  fx: FaceFx;
  pfp: PfpSpec;
  /** brush refinements of the cut-out, in source pixels */
  strokes: Stroke[];
  /** faces you added by hand (ones the detector missed), in source pixels */
  extraFaces: Face[];
  /** which version of the photo: 0 = as opened, then one per erase or upscale */
  photo: number;
  /** captions, placed on the finished picture */
  texts: TextItem[];
}

/** Save settings: the converter's spec, used with the editor's own pixel size. */
export type SaveSpec = ConvertSpec;

export const initialFrame: Frame = {
  presetId: null,
  width: null,
  height: null,
  mode: "crop",
  focusX: 0.5,
  focusY: 0.5,
  zoom: 1,
  fill: "blur",
  fillColor: "#ffffff",
  bg: { mode: "original", color: "#ffffff", gradient: "violet-pink", pattern: "mesh-candy", image: null, blur: 0.5, blurType: "gaussian", blurAngle: 0, focus: 0.5 },
  fx: { effect: "none", sticker: "mix", stickerSize: 1, eyewear: "pixel", eyewearSize: 1, strength: 0.6, kept: [] },
  pfp: { enabled: false, shape: "circle", ring: "none" },
  strokes: [],
  extraFaces: [],
  photo: 0,
  texts: [],
};

type AiTask = "mask" | "faces" | "retouch";
export type PointerMode = "move" | "brush" | "addFace" | "erase";

/** What profile mode overwrote, so leaving it puts things back. */
type Restore = Pick<Frame, "presetId" | "width" | "height" | "mode" | "focusX" | "focusY" | "zoom">;

interface EditorState {
  source: Source | null;
  loading: boolean;
  error: string | null;
  activeTool: RailId;
  bgTab: BgTab;
  facesTab: FacesTab;
  retouchTab: RetouchTab;
  /** the caption being edited */
  textId: string | null;
  /** 0..1 while an upscale runs */
  retouchProgress: number;
  platformId: string;
  frame: Frame;
  save: SaveSpec;
  past: Frame[];
  future: Frame[];
  /** show the untouched original while held */
  compare: boolean;
  pointer: PointerMode;
  brush: { mode: "keep" | "erase"; size: number };
  pfpRestore: Restore | null;

  // AI results for the current photo (caches, not history)
  mask: HTMLCanvasElement | null;
  maskQuality: MattingQuality | null;
  /** quality of the cut-out being computed */
  maskJob: MattingQuality | null;
  /** what the cut-out looks for; "auto" = people if a face is found, otherwise any object */
  subject: "auto" | SubjectKind;
  /** model used (or being used) for the current cut-out */
  maskKind: SubjectKind | null;
  /** "alpha" when the photo already had a see-through background */
  maskSource: "ai" | "alpha" | null;
  /** the cut-out kept almost nothing */
  maskEmpty: boolean;
  faces: Face[] | null;
  busy: Record<AiTask, boolean>;
  aiError: string | null;

  // assets the renderer draws
  backdrops: Record<string, ImageBitmap>;
  /** decoded overlay art: sticker ids and "eye:<id>" */
  art: Map<string, HTMLImageElement>;
  /** bumps when async assets load, so previews re-render */
  assetsVersion: number;

  loadFile: (file: File) => Promise<void>;
  open: (route: Route) => void;
  selectTool: (id: RailId) => void;
  setBgTab: (tab: BgTab) => void;
  setFacesTab: (tab: FacesTab) => void;
  setRetouchTab: (tab: RetouchTab) => void;
  /** remove what's painted in `hole` (source-size canvas) from the photo */
  eraseArea: (hole: HTMLCanvasElement) => Promise<void>;
  /** make the photo `factor` times bigger with the AI upscaler */
  upscalePhoto: (factor: number) => Promise<void>;
  addText: () => void;
  updateText: (id: string, patch: Partial<TextItem>, commit?: boolean) => void;
  removeText: (id: string) => void;
  selectText: (id: string | null) => void;
  enterProfile: () => void;
  leaveProfile: () => void;
  setPlatform: (id: string) => void;
  updateFrame: (patch: Partial<Frame>, commit?: boolean) => void;
  checkpoint: () => void;
  applyPreset: (presetId: string | null) => void;
  undo: () => void;
  redo: () => void;
  setSave: (patch: Partial<SaveSpec>) => void;
  setBg: (patch: Partial<BgSpec>, commit?: boolean) => void;
  setFx: (patch: Partial<FaceFx>, commit?: boolean) => void;
  setPfp: (patch: Partial<PfpSpec>) => void;
  toggleFace: (index: number) => void;
  addStroke: (s: Stroke) => void;
  clearStrokes: () => void;
  setPointer: (p: PointerMode) => void;
  setBrush: (patch: Partial<EditorState["brush"]>) => void;
  ensureMask: (quality?: MattingQuality) => Promise<void>;
  setSubject: (subject: "auto" | SubjectKind) => void;
  ensureFaces: () => Promise<void>;
  autoFrameFace: () => void;
  loadBackdrop: (id: string, file?: File) => Promise<void>;
  ensureArt: (ids: string[]) => void;
  setCompare: (on: boolean) => void;
}

const HISTORY_LIMIT = 60;

/** Edits that only make sense with transparency, so JPG would flatten them. */
export const needsAlpha = (f: Frame) => f.bg.mode === "transparent" || (f.pfp.enabled && f.pfp.shape === "circle") || (f.mode === "fit" && f.fill === "transparent");

const isProfilePreset = (id: string | null) => !!id && /profile|dp/i.test(id);
export const profilePresets = platforms.flatMap((p) => p.presets.filter((pr) => isProfilePreset(pr.id)).map((pr) => ({ ...pr, platform: p })));

const backdropUrl = (id: string) => (id.startsWith("pfp/") ? `/backdrops/${id}.webp` : `/backdrops/${id}.jpg`);

export const useEditor = create<EditorState>((set, get) => {
  /** JPG can't hold transparency: switch to PNG when an edit needs it. */
  // When we switched to PNG ourselves, remember what you had, so we can switch back.
  let autoFrom: SaveSpec["format"] | null = null;
  const keepAlphaFormat = () => {
    const { frame, save } = get();
    const alpha = needsAlpha(frame);
    if (alpha && (save.format === "jpeg" || save.format === "bmp" || save.format === "pdf")) {
      autoFrom = save.format;
      set({ save: { ...save, format: "png" } });
    } else if (!alpha && autoFrom && save.format === "png") {
      set({ save: { ...save, format: autoFrom } });
      autoFrom = null;
    }
  };

  /*
   * Photo versions. Erasing or upscaling makes a new version; the frame records which one is
   * shown, so undo and redo move between them. Each version keeps its own AI results.
   */
  type AiCache = Pick<EditorState, "mask" | "maskQuality" | "maskKind" | "maskSource" | "maskEmpty" | "faces">;
  const versions = new Map<number, { bitmap: ImageBitmap; ai: AiCache | null }>();
  let shown = 0;
  let nextVersion = 1;
  /** at most this many versions are kept (photos are big; phones have little memory) */
  const KEEP_VERSIONS = 6;
  const aiOf = (st: EditorState): AiCache => ({ mask: st.mask, maskQuality: st.maskQuality, maskKind: st.maskKind, maskSource: st.maskSource, maskEmpty: st.maskEmpty, faces: st.faces });
  const emptyAi: AiCache = { mask: null, maskQuality: null, maskKind: null, maskSource: null, maskEmpty: false, faces: null };

  /** Show the version the frame points at, swapping in its AI results. */
  const syncPhoto = () => {
    const st = get();
    const want = st.frame.photo;
    if (!st.source || want === shown) return;
    const target = versions.get(want);
    if (!target) return; // dropped to save memory: stay on what's shown
    const current = versions.get(shown);
    if (current) current.ai = aiOf(st);
    shown = want;
    set({ source: { ...st.source, bitmap: target.bitmap, width: target.bitmap.width, height: target.bitmap.height }, ...(target.ai ?? emptyAi) });
    refreshAi();
  };

  /** Re-run the AI the current edits depend on (after the photo changed). */
  const refreshAi = () => {
    const { frame } = get();
    if (frame.bg.mode !== "original" || frame.pfp.enabled) get().ensureMask();
    if (frame.fx.effect !== "none" || frame.pfp.enabled) get().ensureFaces();
  };

  /** Add a photo version and show it, as one undoable step. */
  const pushVersion = (bitmap: ImageBitmap, ai: AiCache | null, framePatch: Partial<Frame> = {}) => {
    const st = get();
    const current = versions.get(shown);
    if (current) current.ai = aiOf(st);
    const id = nextVersion++;
    versions.set(id, { bitmap, ai });
    // drop the oldest edits (never the original) when there are too many
    const ids = [...versions.keys()].filter((v) => v !== 0 && v !== id && v !== shown).sort((a, b) => a - b);
    while (versions.size > KEEP_VERSIONS && ids.length) versions.delete(ids.shift()!);
    get().updateFrame({ ...framePatch, photo: id });
    syncPhoto();
  };

  /** Overlay art for the current face style, loaded on demand. */
  const artFor = (fx: FaceFx) => (fx.effect === "sticker" ? (fx.sticker === "mix" ? MIX : [fx.sticker]) : fx.effect === "eyewear" ? [`eye:${fx.eyewear}`] : []);

  return {
    source: null,
    loading: false,
    error: null,
    activeTool: "background",
    bgTab: "remove",
    facesTab: "blur",
    retouchTab: "erase",
    textId: null,
    retouchProgress: 0,
    platformId: platforms[0].id,
    frame: initialFrame,
    save: defaultSpec,
    past: [],
    future: [],
    compare: false,
    pointer: "move",
    brush: { mode: "keep", size: 40 },
    pfpRestore: null,
    mask: null,
    maskQuality: null,
    maskJob: null,
    subject: "auto",
    maskKind: null,
    maskSource: null,
    maskEmpty: false,
    faces: null,
    busy: { mask: false, faces: false, retouch: false },
    aiError: null,
    backdrops: {},
    art: new Map(),
    assetsVersion: 0,

    loadFile: async (file) => {
      if (get().source?.file === file) return;
      set({ loading: true, error: null });
      try {
        const [bitmap, metadata] = await Promise.all([decodeImage(file), readMetadata(file)]);
        versions.forEach((v) => v.bitmap.close());
        const isPng = file.type === "image/png";
        // A photo that's already cut out keeps its own edges: no AI needed.
        const { alphaMask } = await import("@social9/core/ml/matting");
        const own = alphaMask(bitmap);
        versions.clear();
        versions.set(0, { bitmap, ai: null });
        shown = 0;
        nextVersion = 1;
        set((s) => ({
          source: { file, bitmap, name: file.name.replace(/\.[^.]+$/, "") || "photo", width: bitmap.width, height: bitmap.height, metadata },
          loading: false,
          mask: own,
          maskQuality: own ? "fast" : null,
          maskKind: null,
          maskSource: own ? "alpha" : null,
          maskEmpty: false,
          faces: null,
          aiError: null,
          pointer: "move",
          frame: { ...s.frame, focusX: 0.5, focusY: 0.5, zoom: s.frame.pfp.enabled ? s.frame.zoom : 1, strokes: [], extraFaces: [], photo: 0, fx: { ...s.frame.fx, kept: [] } },
          textId: null,
          save: { ...s.save, format: isPng && s.save.format === "jpeg" ? "png" : s.save.format },
          past: [],
          future: [],
        }));
        // re-run the open tool's AI needs for the new photo
        get().selectTool(get().activeTool);
      } catch {
        set({ loading: false, error: "We couldn't open that photo. Try a JPG, PNG, WebP or HEIC." });
      }
    },

    open: (route) => {
      if (route.bgTab) set({ bgTab: route.bgTab });
      if (route.facesTab) set({ facesTab: route.facesTab });
      if (route.retouchTab) set({ retouchTab: route.retouchTab });
      if (route.fit && get().frame.mode !== "fit" && !get().frame.pfp.enabled) get().updateFrame({ mode: "fit", zoom: 1, focusX: 0.5, focusY: 0.5 });
      get().selectTool(route.rail);
      if (route.rail === "background" && route.bgTab && get().source) get().setBgTab(route.bgTab);
      if (route.rail === "faces" && route.facesTab && get().source) get().setFacesTab(route.facesTab);
    },

    // Rule A: opening a tool only shows it, apart from the one-time defaults below.
    selectTool: (id) => {
      set({ activeTool: id, pointer: "move" });
      const { source, frame } = get();
      if (!source) return;
      switch (id) {
        case "background":
          get().ensureMask();
          if (frame.bg.mode === "original") get().setBgTab(get().bgTab);
          break;
        case "faces":
          get().ensureFaces();
          if (frame.fx.effect === "none") get().setFacesTab(get().facesTab);
          break;
        case "profile":
          get().enterProfile();
          break;
        case "retouch":
          if (get().retouchTab === "erase") set({ pointer: "erase" });
          break;
        case "text":
          if (!frame.texts.length) get().addText();
          else if (!get().textId) set({ textId: frame.texts.at(-1)!.id });
          break;
      }
    },

    setRetouchTab: (tab) => set({ retouchTab: tab, pointer: tab === "erase" ? "erase" : "move" }),

    eraseArea: async (hole) => {
      const { source, busy } = get();
      if (!source || busy.retouch) return;
      set((s) => ({ busy: { ...s.busy, retouch: true }, aiError: null }));
      try {
        const { removeObject } = await import("@social9/core/ml/inpaint");
        const canvas = await removeObject(source.bitmap, hole);
        if (!canvas || get().source?.file !== source.file) return;
        // the picture changed, so the cut-out and faces are worked out again
        pushVersion(await createImageBitmap(canvas), null);
      } catch (e) {
        console.error("Object removal failed", e);
        set({ aiError: e instanceof Error ? e.message : "Object removal failed" });
      } finally {
        set((s) => ({ busy: { ...s.busy, retouch: false } }));
      }
    },

    upscalePhoto: async (factor) => {
      const { source, busy } = get();
      if (!source || busy.retouch) return;
      set((s) => ({ busy: { ...s.busy, retouch: true }, retouchProgress: 0, aiError: null }));
      try {
        const { upscale } = await import("@social9/core/ml/upscale");
        const canvas = await upscale(source.bitmap, factor, (p) => set({ retouchProgress: p }));
        if (get().source?.file !== source.file) return;
        const k = canvas.width / source.width;
        const st = get();
        // same picture, just bigger: keep the AI results and brush work, scaled
        const scaleFace = (f: Face): Face => ({ ...f, x: f.x * k, y: f.y * k, w: f.w * k, h: f.h * k, landmarks: f.landmarks.map((v) => v * k) });
        const ai: AiCache = { ...aiOf(st), faces: st.faces?.map(scaleFace) ?? null };
        pushVersion(await createImageBitmap(canvas), ai, {
          strokes: st.frame.strokes.map((t) => ({ ...t, size: t.size * k, points: t.points.map((v) => v * k) })),
          extraFaces: st.frame.extraFaces.map(scaleFace),
        });
      } catch (e) {
        console.error("Upscale failed", e);
        set({ aiError: e instanceof Error ? e.message : "Upscaling failed" });
      } finally {
        set((s) => ({ busy: { ...s.busy, retouch: false }, retouchProgress: 0 }));
      }
    },

    addText: () => {
      const t = newText(get().frame.texts.length);
      get().updateFrame({ texts: [...get().frame.texts, t] });
      set({ textId: t.id });
    },

    updateText: (id, patch, commit = true) => get().updateFrame({ texts: get().frame.texts.map((t) => (t.id === id ? { ...t, ...patch } : t)) }, commit),

    removeText: (id) => {
      const texts = get().frame.texts.filter((t) => t.id !== id);
      get().updateFrame({ texts });
      set({ textId: texts.at(-1)?.id ?? null });
    },

    selectText: (id) => set({ textId: id }),

    setBgTab: (tab) => {
      set({ bgTab: tab });
      const { frame, setBg } = get();
      get().ensureMask();
      if (tab === "remove" && frame.bg.mode !== "transparent") setBg({ mode: "transparent" });
      if (tab === "replace" && !["color", "gradient", "pattern", "image"].includes(frame.bg.mode)) setBg({ mode: "gradient" });
      if (tab === "blur" && frame.bg.mode !== "blur") setBg({ mode: "blur" });
    },

    setFacesTab: (tab) => {
      set({ facesTab: tab });
      get().ensureFaces();
      if (get().frame.fx.effect !== tab) get().setFx({ effect: tab });
    },

    // Rule C: profile mode is a frame mode; leaving it restores the previous framing.
    enterProfile: () => {
      const { frame } = get();
      get().ensureMask();
      get().ensureFaces().then(() => {
        if (get().frame.pfp.enabled) get().autoFrameFace();
      });
      if (frame.pfp.enabled) return;
      const restore: Restore = { presetId: frame.presetId, width: frame.width, height: frame.height, mode: frame.mode, focusX: frame.focusX, focusY: frame.focusY, zoom: frame.zoom };
      const preset = profilePresets.find((p) => p.id === frame.presetId) ?? profilePresets.find((p) => p.platform.id === get().platformId) ?? profilePresets[0];
      get().checkpoint();
      set((s) => ({
        pfpRestore: restore,
        platformId: preset.platform.id,
        frame: {
          ...s.frame,
          presetId: preset.id,
          width: preset.width,
          height: preset.height,
          mode: "crop",
          pfp: { ...s.frame.pfp, enabled: true },
          bg: s.frame.bg.mode === "original" ? { ...s.frame.bg, mode: "gradient" } : s.frame.bg,
        },
      }));
      keepAlphaFormat();
      get().autoFrameFace();
    },

    leaveProfile: () => {
      const { pfpRestore } = get();
      get().updateFrame({ ...(pfpRestore ?? { presetId: null, width: null, height: null, mode: "crop", focusX: 0.5, focusY: 0.5, zoom: 1 }), pfp: { ...get().frame.pfp, enabled: false } });
      set({ pfpRestore: null, activeTool: get().activeTool === "profile" ? "size" : get().activeTool });
    },

    setPlatform: (id) => set({ platformId: id }),

    checkpoint: () => set((s) => ({ past: [...s.past, s.frame].slice(-HISTORY_LIMIT), future: [] })),

    updateFrame: (patch, commit = true) => {
      set((s) => ({
        frame: { ...s.frame, ...patch },
        ...(commit ? { past: [...s.past, s.frame].slice(-HISTORY_LIMIT), future: [] } : {}),
      }));
      if (patch.fill || patch.mode || patch.bg || patch.pfp) keepAlphaFormat();
    },

    applyPreset: (presetId) => {
      const preset = platforms.flatMap((p) => p.presets).find((p) => p.id === presetId);
      const platform = platforms.find((p) => p.presets.some((pr) => pr.id === presetId));
      // profile mode only accepts square profile sizes (Rule C)
      if (get().frame.pfp.enabled && (!preset || preset.width !== preset.height)) return;
      get().updateFrame({ presetId: preset?.id ?? null, width: preset?.width ?? null, height: preset?.height ?? null, focusX: 0.5, focusY: 0.5, zoom: 1 });
      if (platform) set({ platformId: platform.id });
      if (get().frame.pfp.enabled) get().autoFrameFace();
    },

    undo: () => {
      set((s) => {
        const prev = s.past.at(-1);
        if (!prev) return s;
        return { frame: prev, past: s.past.slice(0, -1), future: [s.frame, ...s.future] };
      });
      keepAlphaFormat();
      syncPhoto();
    },

    redo: () => {
      set((s) => {
        const next = s.future[0];
        if (!next) return s;
        return { frame: next, past: [...s.past, s.frame], future: s.future.slice(1) };
      });
      keepAlphaFormat();
      syncPhoto();
    },

    setSave: (patch) => {
      if (patch.format) autoFrom = null; // your own choice always wins
      set((s) => ({ save: { ...s.save, ...patch } }));
    },

    setBg: (patch, commit = true) => get().updateFrame({ bg: { ...get().frame.bg, ...patch } }, commit),

    setFx: (patch, commit = true) => {
      const fx = { ...get().frame.fx, ...patch };
      get().updateFrame({ fx }, commit);
      get().ensureArt(artFor(fx));
    },

    setPfp: (patch) => get().updateFrame({ pfp: { ...get().frame.pfp, ...patch } }),

    toggleFace: (index) => {
      const kept = get().frame.fx.kept;
      get().setFx({ kept: kept.includes(index) ? kept.filter((k) => k !== index) : [...kept, index] });
    },

    addStroke: (stroke) => get().updateFrame({ strokes: [...get().frame.strokes, stroke] }),
    clearStrokes: () => get().updateFrame({ strokes: [] }),
    setPointer: (pointer) => set({ pointer }),
    setBrush: (patch) => set((s) => ({ brush: { ...s.brush, ...patch } })),

    ensureMask: async (quality = get().maskQuality ?? "fast") => {
      const { source, mask, maskQuality, maskSource, maskKind, busy, subject } = get();
      if (!source || busy.mask) return;
      // already-transparent photos keep their own edges unless you ask for a different subject type
      if (maskSource === "alpha" && subject === "auto") return;
      set((s) => ({ busy: { ...s.busy, mask: true }, maskJob: quality, aiError: null }));
      try {
        let kind: SubjectKind = subject === "auto" ? "person" : subject;
        if (subject === "auto") {
          await get().ensureFaces();
          // People score 0.84+ on face detection; pets and statues land near 0.6. Only a
          // confident face means "person" (face blurring still covers everything above 0.6).
          // MODNet is a single-portrait model: groups lose heads, so groups use the object model too.
          kind = get().faces?.filter((f) => f.score >= 0.8).length === 1 ? "person" : "object";
          // Tiny photos (under 320px) fall apart in the people model; the object model copes.
          if (Math.min(source.width, source.height) < 320) kind = "object";
        }
        if (mask && maskQuality === quality && maskKind === kind && maskSource === "ai") return;
        set({ maskKind: kind });
        const { segmentSubject, coverage } = await import("@social9/core/ml/matting");
        const m = await segmentSubject(source.bitmap, quality, kind);
        if (get().source === source) set({ mask: m, maskQuality: quality, maskSource: "ai", maskEmpty: coverage(m) < 0.01 });
      } catch (e) {
        console.error("Cut-out failed", e);
        set({ aiError: e instanceof Error ? e.message : "Background removal failed" });
      } finally {
        set((s) => ({ busy: { ...s.busy, mask: false }, maskJob: null }));
      }
    },

    setSubject: (subject) => {
      set({ subject });
      get().ensureMask(get().maskQuality ?? "fast");
    },

    ensureFaces: async () => {
      const { source, faces, busy } = get();
      if (!source || faces || busy.faces) return;
      set((s) => ({ busy: { ...s.busy, faces: true }, aiError: null }));
      try {
        const { detectFaces } = await import("@social9/core/ml/faces");
        const found = await detectFaces(source.bitmap);
        if (get().source === source) set({ faces: found });
      } catch (e) {
        console.error("Face detection failed", e);
        set({ aiError: e instanceof Error ? e.message : "Face detection failed" });
      } finally {
        set((s) => ({ busy: { ...s.busy, faces: false } }));
      }
    },

    autoFrameFace: () => {
      const { faces, source, frame } = get();
      if (!faces?.length || !source) return;
      const face = [...faces].sort((a, b) => b.w * b.h - a.w * a.h)[0];
      const outW = frame.width ?? source.width;
      const outH = frame.height ?? source.height;
      get().updateFrame({ ...faceFocus(face, source.width, source.height, outW, outH), mode: "crop" }, false);
    },

    loadBackdrop: async (id, file) => {
      if (get().backdrops[id] && !file) return;
      const blob = file ?? (await (await fetch(backdropUrl(id))).blob());
      const bmp = await createImageBitmap(blob);
      set((s) => ({ backdrops: { ...s.backdrops, [id]: bmp }, assetsVersion: s.assetsVersion + 1 }));
    },

    ensureArt: (ids) => {
      const missing = ids.filter((id) => !get().art.has(id));
      if (!missing.length) return;
      Promise.all(missing.map(async (id) => [id, await (id.startsWith("eye:") ? loadEyewearImage(id.slice(4)) : loadStickerImage(id))] as const))
        .then((entries) => set((s) => ({ art: new Map([...s.art, ...entries]), assetsVersion: s.assetsVersion + 1 })))
        .catch(() => {});
    },

    setCompare: (on) => set({ compare: on }),
  };
});

/** Detected faces plus the ones you added by hand, in one list (indices used by `kept`). */
export const allFaces = (faces: Face[] | null, frame: Frame): Face[] => [...(faces ?? []), ...frame.extraFaces];

/** Output size in pixels for the current frame. */
export function outputSize(frame: Frame, source: Source | null) {
  return {
    width: frame.width ?? source?.width ?? 0,
    height: frame.height ?? source?.height ?? 0,
  };
}
