"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { FaMinus, FaPlus, FaHand, FaExpand, FaSpinner } from "react-icons/fa6";
import { useEditor, outputSize, initialFrame } from "@/editor/store";
import { renderOutput, renderScene } from "@/editor/render";
import { coverRect, fitRect, panFit, panFocus, toSource } from "@social9/core/image/geometry";
import { headEllipse } from "@/lib/image/compose";
import { textBounds } from "@/lib/image/text";
import { Tooltip } from "@/components/ui/Tooltip";

/** Longest edge of the preview composite; export always renders full size. */
const SCENE_MAX = 2048;
const SCENE_MAX_ZOOMED = 4096;
const PREVIEW_MAX = 4096;
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 8;

/** `studio`: a compact preview for the standalone tool pages (no zoom bar, edge to edge). */
export function CanvasView({ variant = "editor" }: { variant?: "editor" | "studio" }) {
  const studio = variant === "studio";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  /** css px per output px; null = fit to the window */
  const [viewZoom, setViewZoom] = useState<number | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hand, setHand] = useState(false);
  const [space, setSpace] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [live, setLive] = useState<number[] | null>(null);
  const [dragKind, setDragKind] = useState<"move" | "pan" | "brush" | null>(null);
  const drag = useRef<{ x: number; y: number; moved: number; kind: "move" | "pan" | "brush" } | null>(null);
  /** touch points, for two-finger pinch-zoom on phones */
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; cx: number; cy: number; scale: number; panX: number; panY: number } | null>(null);
  // "add a face": placed on a clean tap, so starting a pinch doesn't drop a stray cover
  const faceTap = useRef<{ id: number; x: number; y: number } | null>(null);

  const source = useEditor((s) => s.source);
  const frame = useEditor((s) => s.frame);
  const mask = useEditor((s) => s.mask);
  const detected = useEditor((s) => s.faces);
  const backdrops = useEditor((s) => s.backdrops);
  const art = useEditor((s) => s.art);
  const compare = useEditor((s) => s.compare);
  const activeTool = useEditor((s) => s.activeTool);
  const pointer = useEditor((s) => s.pointer);
  const brush = useEditor((s) => s.brush);
  const assetsVersion = useEditor((s) => s.assetsVersion);

  const extraFaces = frame.extraFaces;
  const faces = useMemo(() => (detected || extraFaces.length ? [...(detected ?? []), ...extraFaces] : null), [detected, extraFaces]);
  const { width, height } = outputSize(frame, source);
  const fitScale = Math.min((box.w || 1) / (width || 1), (box.h || 1) / (height || 1));
  const scale = viewZoom ?? fitScale;
  const css = { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
  const zoomedIn = scale > fitScale * 1.02;
  const brushing = pointer === "brush" && !!mask && !compare;
  const retouchBusy = useEditor((s) => s.busy.retouch);
  // Retouch › Erase: paint over something; it's removed when you lift
  const erasing = pointer === "erase" && activeTool === "retouch" && !compare && !retouchBusy;
  const painting = brushing || erasing;
  /** the erase stroke stays on screen while the AI fills it in */
  const [held, setHeld] = useState<string | null>(null);
  const texts = useEditor((s) => s.frame.texts);
  const textId = useEditor((s) => s.textId);
  const showTexts = activeTool === "text" && !compare;
  const textDrag = useRef<{ id: string; x: number; y: number; tx: number; ty: number } | null>(null);
  const panning = hand || space;
  const showFaces = activeTool === "faces" && !!faces?.length && !compare;
  const addingFace = pointer === "addFace" && !compare;

  // The composite only changes when edits change, not while panning or zooming.
  const sceneCap = scale > fitScale * 1.5 ? SCENE_MAX_ZOOMED : SCENE_MAX;
  // Heavy effects render a beat later, so the button you pressed responds instantly.
  const dBg = useDeferredValue(frame.bg);
  const dFx = useDeferredValue(frame.fx);
  const dStrokes = useDeferredValue(frame.strokes);
  const pending = dBg !== frame.bg || dFx !== frame.fx || dStrokes !== frame.strokes;
  const scene = useMemo(() => {
    if (!source) return null;
    const k = Math.min(1, sceneCap / Math.max(source.width, source.height));
    const f = compare ? { ...frame, bg: initialFrame.bg, fx: initialFrame.fx, strokes: [] } : { ...frame, bg: dBg, fx: dFx, strokes: dStrokes };
    return renderScene({ source, frame: f, mask, faces: detected, backdrops, art }, k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, mask, detected, frame.extraFaces, dBg, dFx, dStrokes, backdrops, art, assetsVersion, compare, sceneCap]);

  useEffect(() => {
    if (!source || !scene || !canvasRef.current || !width || !height) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    // Render at screen resolution, even above the output size (a 320px avatar shown big stays
    // sharp on screen); the saved file is always exactly the output size.
    const outScale = Math.min(PREVIEW_MAX / Math.max(width, height), (css.width * dpr) / width);
    const f = compare ? { ...frame, pfp: initialFrame.pfp } : frame;
    renderOutput(scene, { source, frame: f, mask, faces: detected, backdrops, art }, outScale, canvasRef.current);
  }, [scene, source, frame, width, height, compare, mask, detected, backdrops, art, css.width]);

  // A new photo or a new size fades in instead of popping.
  useEffect(() => {
    canvasRef.current?.parentElement?.animate([{ opacity: 0, transform: "scale(0.985)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: "cubic-bezier(.21,.47,.32,.98)" });
  }, [source, width, height]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** Zoom to `next`, keeping the point at (cx, cy) (relative to the box center) still. */
  const zoomTo = useCallback(
    (next: number, cx = 0, cy = 0) => {
      const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
      const k = z / scale;
      setPan((p) => ({ x: cx - (cx - p.x) * k, y: cy - (cy - p.y) * k }));
      setViewZoom(z);
    },
    [scale],
  );
  const fit = useCallback(() => {
    setViewZoom(null);
    setPan({ x: 0, y: 0 });
  }, []);

  // Ctrl/⌘ + wheel or pinch zooms around the cursor; a plain wheel pans when zoomed in.
  useEffect(() => {
    const el = boxRef.current;
    if (!el || studio) return;
    const onWheel = (e: WheelEvent) => {
      const r = el.getBoundingClientRect();
      const cx = e.clientX - r.left - r.width / 2;
      const cy = e.clientY - r.top - r.height / 2;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoomTo(scale * Math.exp(-e.deltaY * 0.0025), cx, cy);
      } else if (zoomedIn) {
        e.preventDefault();
        setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [scale, zoomedIn, zoomTo, studio]);

  // Keyboard: hold Space to pan; + / − / 0 / 1 to zoom.
  useEffect(() => {
    if (studio) return; // a normal page: leave Space and +/- alone
    const typing = (e: KeyboardEvent) => !!(e.target as HTMLElement)?.closest("input, textarea, select, [contenteditable]");
    const down = (e: KeyboardEvent) => {
      if (typing(e) || e.metaKey || e.ctrlKey) return;
      if (e.code === "Space" && (e.target as HTMLElement)?.tagName !== "BUTTON") {
        e.preventDefault();
        setSpace(true);
      } else if (e.key === "+" || e.key === "=") zoomTo(scale * 1.25);
      else if (e.key === "-" || e.key === "_") zoomTo(scale / 1.25);
      else if (e.key === "0") fit();
      else if (e.key === "1") zoomTo(1);
    };
    const up = (e: KeyboardEvent) => e.code === "Space" && setSpace(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [scale, zoomTo, fit, studio]);

  // Fit again when the output size changes (new preset or photo).
  const sizeKey = `${width}x${height}`;
  const [lastKey, setLastKey] = useState(sizeKey);
  if (lastKey !== sizeKey) {
    setLastKey(sizeKey);
    setViewZoom(null);
    setPan({ x: 0, y: 0 });
  }

  /** Output point (0..width) → css px inside the canvas, for a source point. */
  const srcToCss = useCallback(
    (x: number, y: number) => {
      if (!source) return { x: 0, y: 0 };
      if (frame.mode === "crop") {
        const crop = coverRect(source.width, source.height, width, height, frame.focusX, frame.focusY, frame.zoom);
        return { x: ((x - crop.x) / crop.w) * css.width, y: ((y - crop.y) / crop.h) * css.height };
      }
      const fr = fitRect(source.width, source.height, width, height, frame.focusX, frame.focusY, frame.zoom);
      return { x: ((fr.x + (x / source.width) * fr.w) / width) * css.width, y: ((fr.y + (y / source.height) * fr.h) / height) * css.height };
    },
    [source, frame.mode, frame.focusX, frame.focusY, frame.zoom, width, height, css.width, css.height],
  );

  const faceRings = useMemo(() => {
    if (!showFaces || !faces) return [];
    return faces.map((f, i) => {
      const e = headEllipse(f);
      const a = srcToCss(e.cx - e.rx, e.cy - e.ry);
      const b = srcToCss(e.cx + e.rx, e.cy + e.ry);
      return { i, left: a.x, top: a.y, w: b.x - a.x, h: b.y - a.y };
    });
  }, [showFaces, faces, srcToCss]);

  if (!source) return null;

  /** screen point → source px */
  const toSrc = (clientX: number, clientY: number) => {
    const r = canvasRef.current!.getBoundingClientRect();
    const px = ((clientX - r.left) / r.width) * width;
    const py = ((clientY - r.top) / r.height) * height;
    return toSource(px, py, frame.mode, source.width, source.height, width, height, frame.focusX, frame.focusY, frame.zoom);
  };
  /** source px per css px, for the brush size */
  const srcPerCss = () => {
    const perOut =
      frame.mode === "crop"
        ? coverRect(source.width, source.height, width, height, frame.focusX, frame.focusY, frame.zoom).w / width
        : source.width / fitRect(source.width, source.height, width, height, frame.focusX, frame.focusY, frame.zoom).w;
    return perOut / scale;
  };

  const begin = (e: React.PointerEvent<HTMLDivElement>, kind: "move" | "pan" | "brush") => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // pointer already gone (lifted mid-event)
    }
    drag.current = { x: e.clientX, y: e.clientY, moved: 0, kind };
    setDragKind(kind);
  };

  const startPinch = () => {
    const [a, b] = [...touches.current.values()];
    const r = boxRef.current!.getBoundingClientRect();
    pinch.current = { dist: Math.hypot(b.x - a.x, b.y - a.y), cx: (a.x + b.x) / 2 - r.left - r.width / 2, cy: (a.y + b.y) / 2 - r.top - r.height / 2, scale, panX: pan.x, panY: pan.y };
    // a second finger turns whatever the first one started into a pinch
    drag.current = null;
    faceTap.current = null;
    setDragKind(null);
    setLive(null);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") {
      touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.current.size === 2) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // pointer already gone
        }
        return startPinch();
      }
    }
    if (e.button === 1 || (e.button === 0 && panning)) return begin(e, "pan");
    if (e.button !== 0) return;
    if (addingFace) {
      faceTap.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
      return;
    }
    if (painting) {
      const p = toSrc(e.clientX, e.clientY);
      setLive([p.x, p.y]);
      return begin(e, "brush");
    }
    useEditor.getState().checkpoint();
    begin(e, "move");
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = boxRef.current!.getBoundingClientRect();
    if (e.pointerType === "touch" && touches.current.has(e.pointerId)) {
      touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const pz = pinch.current;
      if (pz && touches.current.size >= 2) {
        const [a, b] = [...touches.current.values()];
        const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pz.scale * (Math.hypot(b.x - a.x, b.y - a.y) / pz.dist)));
        const cx = (a.x + b.x) / 2 - r.left - r.width / 2;
        const cy = (a.y + b.y) / 2 - r.top - r.height / 2;
        const k = z / pz.scale;
        setViewZoom(z);
        setPan({ x: cx - (pz.cx - pz.panX) * k, y: cy - (pz.cy - pz.panY) * k });
        return;
      }
    }
    if (painting) setCursor({ x: e.clientX - r.left, y: e.clientY - r.top });
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    drag.current = { ...d, x: e.clientX, y: e.clientY, moved: d.moved + Math.abs(dx) + Math.abs(dy) };
    if (d.kind === "pan") {
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    } else if (d.kind === "brush") {
      const p = toSrc(e.clientX, e.clientY);
      setLive((pts) => (pts ? [...pts, p.x, p.y] : [p.x, p.y]));
    } else {
      const canvas = canvasRef.current!;
      const { frame: f, source: s, updateFrame } = useEditor.getState();
      if (!s) return;
      const displayScale = canvas.getBoundingClientRect().width / canvas.width;
      if (f.mode === "fit") {
        const fr = fitRect(s.width, s.height, canvas.width, canvas.height, f.focusX, f.focusY, f.zoom);
        updateFrame(panFit(fr, canvas.width, canvas.height, f.focusX, f.focusY, dx / displayScale, dy / displayScale), false);
      } else {
        const crop = coverRect(s.width, s.height, canvas.width, canvas.height, f.focusX, f.focusY, f.zoom);
        updateFrame(panFocus(crop, s.width, s.height, canvas.width, canvas.height, f.focusX, f.focusY, dx, dy, displayScale), false);
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    touches.current.delete(e.pointerId);
    const ft = faceTap.current;
    faceTap.current = null;
    if (ft && ft.id === e.pointerId && !pinch.current && Math.hypot(e.clientX - ft.x, e.clientY - ft.y) < 10) {
      // drop a face cover centred where you tapped, sized to the photo
      const p = toSrc(e.clientX, e.clientY);
      const side = Math.min(source.width, source.height) * 0.14;
      const { frame: f, updateFrame, setPointer } = useEditor.getState();
      updateFrame({ extraFaces: [...f.extraFaces, { x: p.x - side / 2, y: p.y - side * 0.45, w: side, h: side, score: 1, landmarks: [] }] });
      setPointer("move");
      return;
    }
    if (pinch.current) {
      if (touches.current.size < 2) pinch.current = null;
      return;
    }
    const d = drag.current;
    drag.current = null;
    setDragKind(null);
    if (!d) return;
    if (d.kind === "brush") {
      const { brush: b, addStroke, eraseArea } = useEditor.getState();
      if (live?.length && erasing) {
        // paint the stroke at photo size and hand it to the eraser
        const hole = document.createElement("canvas");
        hole.width = source.width;
        hole.height = source.height;
        const h = hole.getContext("2d")!;
        h.strokeStyle = h.fillStyle = "#fff";
        h.lineCap = h.lineJoin = "round";
        h.lineWidth = b.size * srcPerCss();
        h.beginPath();
        h.moveTo(live[0], live[1]);
        for (let i = 2; i < live.length; i += 2) h.lineTo(live[i], live[i + 1]);
        if (live.length === 2) h.lineTo(live[0] + 0.01, live[1]);
        h.stroke();
        setHeld(livePath);
        eraseArea(hole).finally(() => setHeld(null));
      } else if (live?.length) addStroke({ mode: b.mode, size: b.size * srcPerCss(), points: live });
      setLive(null);
      return;
    }
    // a tap (not a drag) on a face toggles it in the Faces tool
    if (d.kind !== "move" || d.moved > 6 || !showFaces || !faces) return;
    const p = toSrc(e.clientX, e.clientY);
    const hit = faces.findIndex((f) => {
      const el = headEllipse(f);
      return ((p.x - el.cx) / el.rx) ** 2 + ((p.y - el.cy) / el.ry) ** 2 <= 1;
    });
    if (hit >= 0) useEditor.getState().toggleFace(hit);
  };

  // the stroke being drawn, shown on top of the canvas until it's committed
  let livePath = "";
  if (live) {
    const pts: string[] = [];
    for (let i = 0; i < live.length; i += 2) {
      const p = srcToCss(live[i], live[i + 1]);
      pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    livePath = pts.length === 1 ? `M${pts[0]} l0.01,0` : `M${pts.join(" L")}`;
  }

  const kept = frame.fx.kept;
  const circle = frame.pfp.enabled && frame.pfp.shape === "circle";
  const cursorClass = panning ? (dragKind === "pan" ? "cursor-grabbing" : "cursor-grab") : addingFace ? "cursor-crosshair" : painting ? "cursor-none" : dragKind === "move" ? "cursor-grabbing" : "cursor-grab";
  const strokeColor = erasing || held ? "rgb(109 74 255 / 0.5)" : brush.mode === "keep" ? "rgb(52 211 153 / 0.55)" : "rgb(255 79 163 / 0.55)";
  // captions, in screen pixels, for the selection outline and dragging
  const textBoxes = showTexts
    ? texts.map((t) => {
        const b = textBounds(t, width, height);
        const k = css.width / width;
        return { id: t.id, left: b.x * k, top: b.y * k, w: b.w * k, h: b.h * k };
      })
    : [];

  return (
    <>
      <div
        ref={boxRef}
        className={clsx("absolute touch-none select-none overflow-hidden", studio ? "inset-0" : "inset-x-4 bottom-20 top-4 sm:inset-x-8 sm:top-8", cursorClass)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={(e) => {
          touches.current.delete(e.pointerId);
          pinch.current = null;
          faceTap.current = null;
          drag.current = null;
          setDragKind(null);
          setLive(null);
        }}
        onPointerLeave={() => setCursor(null)}
      >
        <div
          className={clsx("absolute", !circle && "shadow-[0_20px_50px_-12px_rgb(15_14_23/0.35)]")}
          style={{
            ...css,
            left: (box.w - css.width) / 2 + pan.x,
            top: (box.h - css.height) / 2 + pan.y,
            backgroundImage: "conic-gradient(#e4e1ea 25%, #fff 0 50%, #e4e1ea 0 75%, #fff 0)",
            backgroundSize: "16px 16px",
            borderRadius: circle ? "9999px" : undefined,
          }}
        >
          <canvas ref={canvasRef} role="img" aria-label={`Preview, ${width} by ${height} pixels. Drag to reposition.`} style={css} className="block" />
          {(live || held) && (
            <svg className={clsx("pointer-events-none absolute inset-0", held && "animate-pulse")} width={css.width} height={css.height} aria-hidden>
              <path d={live ? livePath : held!} fill="none" stroke={strokeColor} strokeWidth={brush.size} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {textBoxes.map((b) => (
            <div
              key={b.id}
              role="button"
              tabIndex={0}
              aria-label="Text. Drag to move it."
              onPointerDown={(e) => {
                e.stopPropagation();
                const t = texts.find((x) => x.id === b.id)!;
                const { selectText, checkpoint } = useEditor.getState();
                selectText(b.id);
                checkpoint();
                textDrag.current = { id: b.id, x: e.clientX, y: e.clientY, tx: t.x, ty: t.y };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                const d = textDrag.current;
                if (!d) return;
                const nx = Math.min(1, Math.max(0, d.tx + (e.clientX - d.x) / css.width));
                const ny = Math.min(1, Math.max(0, d.ty + (e.clientY - d.y) / css.height));
                useEditor.getState().updateText(d.id, { x: nx, y: ny }, false);
              }}
              onPointerUp={() => (textDrag.current = null)}
              onPointerCancel={() => (textDrag.current = null)}
              className={clsx("absolute cursor-move touch-none rounded-lg border-2 transition-colors", b.id === textId ? "border-dashed border-white shadow-[0_0_0_1px_rgb(15_14_23/0.45)]" : "border-transparent hover:border-white/60")}
              style={{ left: b.left, top: b.top, width: b.w, height: b.h }}
            />
          ))}
          {faceRings.map((r) => (
            <button
              key={r.i}
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => useEditor.getState().toggleFace(r.i)}
              aria-pressed={!kept.includes(r.i)}
              aria-label={`Face ${r.i + 1}: ${kept.includes(r.i) ? "visible, select to hide" : "hidden, select to show"}`}
              className={clsx(
                "absolute rounded-full border-2 transition-colors focus-visible:outline-offset-2",
                kept.includes(r.i) ? "border-white bg-white/5 shadow-[0_0_0_2px_rgb(15_14_23/0.4)]" : "border-dashed border-pink/80 hover:border-pink",
              )}
              style={{ left: r.left, top: r.top, width: r.w, height: r.h, pointerEvents: panning ? "none" : "auto" }}
            >
              <span className={clsx("absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", kept.includes(r.i) ? "bg-white text-ink" : "bg-pink text-white")}>
                {kept.includes(r.i) ? "Visible" : r.i + 1}
              </span>
            </button>
          ))}
          {compare && <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">Original</span>}
        </div>
        {addingFace && (
          <span role="status" className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white shadow-float">
            Tap a face to cover it
          </span>
        )}
        <span
          aria-hidden={!pending}
          className={clsx("pointer-events-none absolute right-3 top-3 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-ink shadow-card transition-opacity duration-200", pending ? "opacity-100" : "opacity-0")}
        >
          <FaSpinner aria-hidden className="animate-spin text-violet" /> Updating
        </span>
        {painting && cursor && !panning && (
          <span
            aria-hidden
            className={clsx("pointer-events-none absolute rounded-full border-2 shadow-[0_0_0_1px_rgb(0_0_0/0.35)]", erasing ? "border-violet" : brush.mode === "keep" ? "border-emerald-400" : "border-pink")}
            style={{ left: cursor.x - brush.size / 2, top: cursor.y - brush.size / 2, width: brush.size, height: brush.size }}
          />
        )}
      </div>

      {/* zoom bar */}
      <div className={clsx("absolute inset-x-0 bottom-4 z-10 flex justify-center px-3", studio && "hidden")}>
        <div className="flex items-center gap-1 rounded-full bg-white/95 p-1 shadow-float ring-1 ring-line">
          <Tooltip label="Hand tool. Drag to move around the photo" kbd="Space" side="top">
            <button type="button" aria-pressed={hand} aria-label="Hand tool" onClick={() => setHand((h) => !h)} className={clsx("grid h-9 w-9 place-items-center rounded-full transition", hand ? "bg-ink text-white" : "text-ink/70 hover:bg-ink/5")}>
              <FaHand aria-hidden />
            </button>
          </Tooltip>
          <span className="mx-0.5 h-5 w-px bg-line" />
          <button type="button" aria-label="Zoom out" onClick={() => zoomTo(scale / 1.25)} className="grid h-9 w-9 place-items-center rounded-full text-ink/70 hover:bg-ink/5">
            <FaMinus aria-hidden className="text-xs" />
          </button>
          <input
            type="range"
            aria-label="Zoom"
            min={Math.log(MIN_ZOOM)}
            max={Math.log(MAX_ZOOM)}
            step={0.01}
            value={Math.log(scale)}
            onChange={(e) => zoomTo(Math.exp(Number(e.target.value)))}
            className="range w-24 sm:w-36"
          />
          <button type="button" aria-label="Zoom in" onClick={() => zoomTo(scale * 1.25)} className="grid h-9 w-9 place-items-center rounded-full text-ink/70 hover:bg-ink/5">
            <FaPlus aria-hidden className="text-xs" />
          </button>
          <Tooltip label="Actual pixels" kbd="1" side="top">
            <button type="button" onClick={() => zoomTo(1)} className="h-9 min-w-14 rounded-full px-2 text-[13px] font-bold tabular-nums text-ink/80 hover:bg-ink/5">
              {Math.round(scale * 100)}%
            </button>
          </Tooltip>
          <Tooltip label="Fit to screen" kbd="0" side="top">
            <button type="button" aria-label="Fit to screen" onClick={fit} className={clsx("grid h-9 w-9 place-items-center rounded-full transition", viewZoom === null ? "text-ink/35" : "text-ink/70 hover:bg-ink/5")}>
              <FaExpand aria-hidden className="text-sm" />
            </button>
          </Tooltip>
        </div>
      </div>
    </>
  );
}
