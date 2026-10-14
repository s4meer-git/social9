"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { FaFileZipper, FaImage, FaSpinner } from "react-icons/fa6";
import { decodeImage } from "@social9/core/image/load";
import { GRID_SHAPES, planGrid, tileName, type GridShape } from "@social9/core/image/grid";
import { zip } from "@social9/core/convert/zip";
import { setInPlaceHandler } from "@/lib/pending-image";
import { UploadCard } from "@/components/home/UploadCard";
import { Field, RangeInput } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/Button";
import { MoreOptions } from "@/components/ui/MoreOptions";
import { Confetti } from "@/components/fx/Confetti";

const shapes: { value: GridShape; label: string }[] = [
  { value: "3:4", label: "3:4" },
  { value: "4:5", label: "4:5" },
  { value: "1:1", label: "Square" },
];

/** Rows that keep most of the photo for this tile shape. */
const bestRows = (w: number, h: number, shape: GridShape) => {
  const t = GRID_SHAPES[shape];
  return Math.min(5, Math.max(1, Math.round(((3 * t.width) / t.height) * (h / w))));
};

/** Split one photo into a 3-column Instagram grid, numbered in the order to post. */
export function GridStudio() {
  const [photo, setPhoto] = useState<{ bitmap: ImageBitmap; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState(3);
  const [shape, setShape] = useState<GridShape>("3:4");
  const [focus, setFocus] = useState({ x: 0.5, y: 0.5 });
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [fire, setFire] = useState(0);
  const [saved, setSaved] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number; fx: number; fy: number } | null>(null);

  const open = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const bitmap = await decodeImage(file);
      setPhoto((old) => {
        old?.bitmap.close();
        return { bitmap, name: file.name.replace(/\.[^.]+$/, "") || "photo" };
      });
      setRows(bestRows(bitmap.width, bitmap.height, shape));
      setFocus({ x: 0.5, y: 0.5 });
      setZoom(1);
      setSaved(false);
    } catch {
      setError("We couldn't open that photo. Try a JPG, PNG, WebP or HEIC.");
    } finally {
      setLoading(false);
    }
  };

  // uploads anywhere on this page land here
  useEffect(() => {
    setInPlaceHandler((files) => open(files[0]));
    return () => setInPlaceHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plan = useMemo(() => (photo ? planGrid(photo.bitmap.width, photo.bitmap.height, rows, shape, focus.x, focus.y, zoom) : null), [photo, rows, shape, focus, zoom]);

  // draw the cropped grid area once; the tile lines and numbers are HTML on top
  useEffect(() => {
    const c = preview.current;
    if (!c || !photo || !plan) return;
    const w = 900;
    const h = Math.round((w * plan.crop.h) / plan.crop.w);
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(photo.bitmap, plan.crop.x, plan.crop.y, plan.crop.w, plan.crop.h, 0, 0, w, h);
  }, [photo, plan]);

  const download = async () => {
    if (!photo || !plan) return;
    setSaving(true);
    try {
      const c = document.createElement("canvas");
      c.width = plan.tileWidth;
      c.height = plan.tileHeight;
      const ctx = c.getContext("2d")!;
      ctx.imageSmoothingQuality = "high";
      const files = [];
      for (const t of plan.tiles) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(photo.bitmap, t.src.x, t.src.y, t.src.w, t.src.h, 0, 0, c.width, c.height);
        const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Encoding failed"))), "image/jpeg", 0.92));
        files.push({ name: tileName(photo.name, t.order, plan.tiles.length), bytes: new Uint8Array(await blob.arrayBuffer()) });
      }
      files.sort((a, b) => a.name.localeCompare(b.name));
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([zip(files) as BlobPart], { type: "application/zip" }));
      a.download = `${photo.name}-instagram-grid.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      setFire((n) => n + 1);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (!photo || !plan) {
    return (
      <div className="mx-auto max-w-xl">
        {loading ? (
          <p className="mx-auto flex w-fit items-center gap-3 rounded-full bg-white px-5 py-3 font-semibold shadow-card">
            <FaSpinner aria-hidden className="animate-spin text-violet" /> Opening your photo
          </p>
        ) : (
          <UploadCard onFile={open} />
        )}
        {error && (
          <p role="alert" className="mt-3 text-center text-sm font-semibold text-pink-deep">
            {error}
          </p>
        )}
      </div>
    );
  }

  const total = plan.tiles.length;
  return (
    <div className="fade-up grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
      <div className="lg:sticky lg:top-24 lg:col-span-7">
        <div
          className="relative mx-auto w-full max-w-[560px] cursor-grab touch-none select-none overflow-hidden rounded-2xl bg-white shadow-float ring-1 ring-line active:cursor-grabbing"
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, y: e.clientY, fx: focus.x, fy: focus.y };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            const r = e.currentTarget.getBoundingClientRect();
            // dragging moves the photo under the grid, so the focus moves the other way
            const room = { x: photo.bitmap.width - plan.crop.w, y: photo.bitmap.height - plan.crop.h };
            const k = plan.crop.w / r.width;
            setFocus({
              x: room.x > 0 ? Math.min(1, Math.max(0, d.fx - ((e.clientX - d.x) * k) / room.x)) : 0.5,
              y: room.y > 0 ? Math.min(1, Math.max(0, d.fy - ((e.clientY - d.y) * k) / room.y)) : 0.5,
            });
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          <canvas ref={preview} role="img" aria-label={`Your photo split into ${total} tiles`} className="block h-auto w-full" />
          {/* white lines where Instagram puts its gaps, and the posting order */}
          <div className="pointer-events-none absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${plan.cols}, 1fr)`, gridTemplateRows: `repeat(${plan.rows}, 1fr)` }}>
            {plan.tiles.map((t) => (
              <div key={`${t.row}-${t.col}`} className="relative border-[1.5px] border-white">
                <span className={clsx("absolute left-2 top-2 grid h-7 min-w-7 place-items-center rounded-full px-1.5 text-xs font-black shadow-card", t.order === 1 ? "bg-ink text-white" : "bg-white/90 text-ink")}>{t.order}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-center text-sm text-ink-soft">Drag the photo to choose what goes in the grid.</p>
      </div>

      <div className="space-y-6 rounded-[32px] bg-white p-5 shadow-card ring-1 ring-line sm:p-6 lg:col-span-5">
        <Field label="Rows" hint={`${total} posts`}>
          <Segmented label="Rows" value={String(rows)} onChange={(v) => setRows(Number(v))} options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))} />
        </Field>
        <Field label="Tile shape" hint={`${plan.tileWidth} × ${plan.tileHeight} px`}>
          <Segmented label="Tile shape" value={shape} onChange={setShape} options={shapes} />
        </Field>
        <p className="text-[13px] leading-relaxed text-ink-soft">3:4 matches how Instagram shows posts on your profile, so the tiles line up best.</p>

        <MoreOptions>
          <Field label="Zoom" hint={`${zoom.toFixed(1)}×`}>
            <RangeInput label="Zoom" min={1} max={3} step={0.05} value={zoom} onChange={setZoom} />
          </Field>
        </MoreOptions>

        <div className="rounded-2xl bg-paper p-4 text-[14px] leading-relaxed ring-1 ring-line">
          <p className="font-bold">How to post</p>
          <p className="mt-1 text-ink-soft">
            Post the tiles in order, starting with number 1 and ending with number {total}. The files in the ZIP are named in this order. Number 1 ends up at the bottom right of your grid.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="brand" size="md" onClick={download} disabled={saving} icon={saving ? <FaSpinner aria-hidden className="animate-spin" /> : <FaFileZipper aria-hidden />}>
            {saving ? "Preparing" : `Download ${total} tiles`}
          </Button>
          <label className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full px-4 text-[15px] font-bold text-ink/75 hover:bg-ink/5 hover:text-ink">
            <FaImage aria-hidden className="text-sm" /> New photo
            <input
              type="file"
              accept="image/*,.heic,.heif"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) open(f);
              }}
            />
          </label>
        </div>
        {saved && <p className="fade-up text-sm font-semibold text-emerald-700">Saved. Thank you for using Social9!</p>}
      </div>
      <Confetti fire={fire} />
    </div>
  );
}
