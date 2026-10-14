"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  FaArrowRight,
  FaArrowUpFromBracket,
  FaArrowRotateLeft,
  FaArrowRotateRight,
  FaDownload,
  FaFileZipper,
  FaLock,
  FaLockOpen,
  FaPlus,
  FaSliders,
  FaSpinner,
  FaXmark,
  FaTriangleExclamation,
  FaCircleCheck,
  FaArrowsLeftRight,
  FaArrowsUpDown,
} from "react-icons/fa6";
import { decodeImage } from "@social9/core/image/load";
import { convert, defaultSpec, outputName, recipes, targetSize, type ConvertSpec } from "@social9/core/convert/pipeline";
import { formatById } from "@social9/core/convert/encoders";
import { zip } from "@social9/core/convert/zip";
import { formatBytes } from "@social9/core/image/geometry";
import { isAcceptedImage, setInPlaceHandler, setPendingImage } from "@/lib/pending-image";
import { SaveControls } from "@/components/convert/SaveControls";
import { Field, RangeInput } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { ChoiceRow } from "@/components/ui/MoreOptions";
import { Button } from "@/components/ui/Button";
import { Confetti } from "@/components/fx/Confetti";
import { AnimatePresence, motion } from "motion/react";

const thanks = [
  { q: "The best camera is the one that's with you.", by: "Chase Jarvis" },
  { q: "You don't take a photograph, you make it.", by: "Ansel Adams" },
  { q: "When words become unclear, I shall focus with photographs.", by: "Ansel Adams" },
];

interface Item {
  id: string;
  file: File;
  bitmap: ImageBitmap;
  thumb: string;
  status: "idle" | "working" | "done" | "error";
  /** `key` is the settings it was made with, so a result from older settings is never downloaded */
  result?: { bytes: Uint8Array; url: string; w: number; h: number; hit: boolean; notes: string[]; quality: number | null; key: string; format: ConvertSpec["format"] };
}

/** Let an <img> finish with the old file first; Safari logs errors for URLs revoked mid-load. */
const revokeLater = (url: string) => setTimeout(() => URL.revokeObjectURL(url), 5000);

const PREVIEWABLE = new Set(["jpeg", "png", "webp", "avif", "gif", "bmp", "ico", "svg"]);
const input = "w-full min-w-0 rounded-xl bg-ink/5 px-3 py-2.5 text-sm font-semibold tabular-nums outline-none ring-violet focus:bg-white focus:ring-2";
/** The quick picks shown up front; the rest of the recipes stay out of the way. */
const QUICK = ["exam-photo", "passport", "exact-50", "signature", "ig-post", "pdf-a4"];

async function thumbOf(bmp: ImageBitmap) {
  const c = document.createElement("canvas");
  const k = 160 / Math.max(bmp.width, bmp.height);
  c.width = Math.max(1, Math.round(bmp.width * k));
  c.height = Math.max(1, Math.round(bmp.height * k));
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/png"); // PNG keeps see-through photos see-through
}

/** Convert, resize and compress one photo or a whole batch, simple first. */
export function ConvertStudio({ initial }: { initial?: Partial<ConvertSpec> }) {
  const router = useRouter();
  const [spec, setSpec] = useState<ConvertSpec>({ ...defaultSpec, ...initial });
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [adding, setAdding] = useState(0);
  const [fire, setFire] = useState(0);
  const [toast, setToast] = useState<{ text: string; q: (typeof thanks)[number] } | null>(null);
  const celebrate = (text: string) => {
    setFire((n) => n + 1);
    setToast({ text, q: thanks[Math.floor(Math.random() * thanks.length)] });
  };
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  const fileRef = useRef<HTMLInputElement>(null);
  const gen = useRef(0);

  const patch = (p: Partial<ConvertSpec>) => {
    setRecipe(null);
    setSpec((s) => ({ ...s, ...p }));
  };

  const add = useCallback(async (files: File[]) => {
    const ok = files.filter(isAcceptedImage);
    if (!ok.length) return setError("These files don't look like photos. Try JPG, PNG, WebP or HEIC.");
    setError(null);
    setAdding((n) => n + ok.length);
    for (const file of ok) {
      try {
        const bitmap = await decodeImage(file);
        const item: Item = { id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`, file, bitmap, thumb: await thumbOf(bitmap), status: "idle" };
        setItems((list) => [...list, item]);
        setSelected((s) => s ?? item.id);
      } catch {
        setError(`Couldn't open ${file.name}.`);
      } finally {
        setAdding((n) => n - 1);
      }
    }
  }, []);

  // Uploads anywhere on this page (buttons, drop, paste) land here.
  useEffect(() => {
    setInPlaceHandler((files) => add(files));
    return () => setInPlaceHandler(null);
  }, [add]);

  // Re-convert everything (debounced) whenever the settings or the list change.
  const ids = items.map((i) => i.id).join("|");
  useEffect(() => {
    if (!ids) return;
    const my = ++gen.current;
    const t = setTimeout(async () => {
      for (const it of items) {
        if (gen.current !== my) return;
        setItems((all) => all.map((x) => (x.id === it.id ? { ...x, status: "working" } : x)));
        try {
          const r = await convert(it.bitmap, spec);
          const key = JSON.stringify(spec);
          if (gen.current !== my) return;
          const url = URL.createObjectURL(new Blob([r.bytes as BlobPart], { type: formatById(spec.format).mime }));
          setItems((all) =>
            all.map((x) => {
              if (x.id !== it.id) return x;
              if (x.result) revokeLater(x.result.url);
              return { ...x, status: "done", result: { bytes: r.bytes, url, w: r.width, h: r.height, hit: r.hit, notes: r.notes, quality: r.quality, key, format: spec.format } };
            }),
          );
        } catch {
          setItems((all) => all.map((x) => (x.id === it.id ? { ...x, status: "error" } : x)));
        }
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, spec]);

  const current = items.find((i) => i.id === selected) ?? items[0];
  const info = formatById(spec.format);
  const specKey = useMemo(() => JSON.stringify(spec), [spec]);
  const fresh = (it: Item) => it.status === "done" && it.result?.key === specKey;
  const allDone = items.length > 0 && items.every(fresh);
  const totals = useMemo(() => ({ before: items.reduce((n, i) => n + i.file.size, 0), after: items.reduce((n, i) => n + (i.result?.bytes.length ?? 0), 0) }), [items]);

  const download = (it: Item) => {
    if (!it.result || !fresh(it)) return;
    const a = document.createElement("a");
    a.href = it.result.url;
    a.download = outputName(it.file.name, spec.format);
    a.click();
    celebrate(`${outputName(it.file.name, spec.format)} saved`);
  };
  const downloadAll = () => {
    const bytes = zip(items.filter((i) => i.result).map((i) => ({ name: outputName(i.file.name, spec.format), bytes: i.result!.bytes })));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/zip" }));
    a.download = `social9-${info.ext}-${items.length}.zip`;
    a.click();
    celebrate(`${items.length} photos saved as a ZIP`);
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  const remove = (id: string) => {
    setItems((all) => {
      const gone = all.find((x) => x.id === id);
      if (gone?.result) revokeLater(gone.result.url);
      gone?.bitmap.close();
      return all.filter((x) => x.id !== id);
    });
    if (selected === id) setSelected(null);
  };
  const editMore = (it: Item) => {
    setPendingImage(it.file);
    router.push("/editor?tool=resize");
  };

  const drop = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      add(Array.from(e.dataTransfer.files));
    },
  };

  const turned = spec.rotate % 180 !== 0;
  const target = current ? targetSize(turned ? current.bitmap.height : current.bitmap.width, turned ? current.bitmap.width : current.bitmap.height, spec) : null;

  return (
    <div className="grid gap-5 lg:grid-cols-12 lg:items-start lg:gap-8">
      {/* files + result */}
      <div className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:col-span-7">
        {items.length === 0 && adding > 0 ? (
          <div className="flex min-h-65 flex-col items-center justify-center gap-3 rounded-[32px] bg-white p-6 text-center shadow-card ring-1 ring-line sm:min-h-85">
            <FaSpinner aria-hidden className="animate-spin text-2xl text-violet" />
            <p className="font-bold">Reading {adding} {adding === 1 ? "photo" : "photos"}…</p>
            <p className="text-sm text-ink-soft">Large photos and iPhone HEIC photos can take a few seconds.</p>
          </div>
        ) : items.length === 0 ? (
          <div {...drop} className={clsx("flex min-h-65 flex-col items-center justify-center gap-4 rounded-[32px] border-2 border-dashed p-6 text-center transition-colors sm:min-h-85 sm:p-8", dragging ? "border-violet bg-violet-soft" : "border-line bg-white")}>
            <Button variant="brand" size="lg" onClick={() => fileRef.current?.click()} icon={<FaArrowUpFromBracket aria-hidden />}>
              Choose photos
            </Button>
            <p className="text-[15px] text-ink-soft">or drop them here. Add one photo or many, in any format.</p>
            {error && (
              <p role="alert" className="text-sm font-semibold text-pink-deep">
                {error}
              </p>
            )}
          </div>
        ) : (
          current && (
            <div key={current.id} className="fade-up overflow-hidden rounded-[28px] bg-white shadow-card ring-1 ring-line sm:rounded-4xl">
              <div className="checker grid h-65 place-items-center overflow-hidden p-4 sm:h-95">
                {current.result && PREVIEWABLE.has(current.result.format) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img decoding="async" src={current.result.url} alt={`Converted ${current.file.name}`} className="h-full w-full min-h-0 object-contain drop-shadow-[0_8px_20px_rgb(15_14_23/0.18)]" />
                ) : (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img decoding="async" src={current.thumb} alt={current.file.name} className="max-h-55 rounded-xl object-contain shadow-card sm:max-h-75" />
                    {current.result && <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">{info.label}</span>}
                  </div>
                )}
              </div>
              <div className="space-y-3 border-t border-line p-4 sm:p-5">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="font-display text-[22px] font-black text-ink/40 tabular-nums">{formatBytes(current.file.size)}</span>
                  <FaArrowRight aria-hidden className="text-sm text-ink/30" />
                  {!fresh(current) || !current.result ? (
                    <FaSpinner aria-hidden className="animate-spin text-violet" />
                  ) : (
                    <span className="font-display text-[26px] font-black tabular-nums tracking-[-0.01em]">{formatBytes(current.result.bytes.length)}</span>
                  )}
                  {current.result && (
                    <span className="text-sm font-semibold text-ink-soft">
                      {info.label} · {current.result.w} × {current.result.h} px
                    </span>
                  )}
                </div>
                {current.result && spec.size !== "none" && (
                  <p className={clsx("flex items-center gap-1.5 text-sm font-bold", current.result.hit ? "text-emerald-700" : "text-pink-deep")}>
                    {current.result.hit ? <FaCircleCheck aria-hidden /> : <FaTriangleExclamation aria-hidden />}
                    {current.result.hit ? (spec.size === "exact" ? `Exactly ${spec.kb} KB` : "Fits your size limit") : current.result.notes.at(-1)}
                  </p>
                )}
                {current.result?.hit && current.result.notes.length > 0 && <p className="text-[13px] text-ink-soft">{current.result.notes[0]}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button variant="brand" size="sm" disabled={!fresh(current)} onClick={() => download(current)} icon={<FaDownload aria-hidden />}>
                    Download
                  </Button>
                  {items.length > 1 && (
                    <Button variant="secondary" size="sm" disabled={!allDone} onClick={downloadAll} icon={<FaFileZipper aria-hidden />}>
                      All {items.length} as ZIP
                    </Button>
                  )}
                  <button type="button" onClick={() => editMore(current)} className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-bold text-ink/70 hover:bg-ink/5 hover:text-ink">
                    <FaSliders aria-hidden className="text-xs" /> Edit more
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        {items.length > 0 && (
          <div {...drop} className={clsx("rounded-3xl bg-white p-2 ring-1 transition-colors", dragging ? "ring-2 ring-violet" : "ring-line")}>
            <ul className="flex gap-2 overflow-x-auto p-1">
              {items.map((it) => (
                <li key={it.id} className="fade-up relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelected(it.id)}
                    aria-pressed={current?.id === it.id}
                    aria-label={`${it.file.name}: ${it.result ? formatBytes(it.result.bytes.length) : "converting"}`}
                    className={clsx("block overflow-hidden rounded-2xl ring-2 transition", current?.id === it.id ? "ring-violet" : "ring-transparent hover:ring-line")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img decoding="async" src={it.thumb} alt="" className="h-16 w-16 object-cover" />
                    <span className="block bg-paper px-1 py-0.5 text-center text-[10px] font-bold tabular-nums">{fresh(it) && it.result ? formatBytes(it.result.bytes.length) : it.status === "error" ? "failed" : "…"}</span>
                  </button>
                  <button type="button" aria-label={`Remove ${it.file.name}`} onClick={() => remove(it.id)} className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-ink text-[9px] text-white shadow">
                    <FaXmark aria-hidden />
                  </button>
                </li>
              ))}
              <li className="shrink-0">
                <button type="button" onClick={() => fileRef.current?.click()} aria-label="Add photos" className="grid h-21 w-16 place-items-center rounded-2xl border-2 border-dashed border-line text-ink/50 hover:border-ink/30 hover:text-ink">
                  <FaPlus aria-hidden />
                </button>
              </li>
            </ul>
            <p className="px-2 pb-1 pt-1 text-xs text-ink-soft">
              {adding > 0 && <span className="font-bold text-violet-deep">Adding {adding}… </span>}
              {items.length} {items.length === 1 ? "photo" : "photos"} · {formatBytes(totals.before)} → {formatBytes(totals.after)}
            </p>
          </div>
        )}
        {error && items.length > 0 && (
          <p role="alert" className="text-sm font-semibold text-pink-deep">
            {error}
          </p>
        )}
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,.heic,.heif"
          className="sr-only"
          aria-label="Choose photos"
          onChange={(e) => {
            add(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {/* settings: simple first */}
      <div className="min-w-0 space-y-6 rounded-[28px] bg-white p-5 shadow-card ring-1 ring-line sm:rounded-4xl sm:p-6 lg:col-span-5">
        <Field label="Common tasks">
          <div className="flex flex-wrap gap-2">
            {recipes
              .filter((r) => QUICK.includes(r.id))
              .map((r) => (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={recipe === r.id}
                  title={r.hint}
                  onClick={() => {
                    setSpec({ ...defaultSpec, ...r.spec });
                    setRecipe(r.id);
                  }}
                  className={clsx("shrink-0 rounded-full px-3.5 py-2 text-[13px] font-bold ring-1 transition", recipe === r.id ? "bg-ink text-white ring-ink" : "bg-white ring-line hover:ring-ink/30")}
                >
                  {r.name}
                </button>
              ))}
          </div>
          {recipe && <p className="text-xs text-ink-soft">{recipes.find((r) => r.id === recipe)?.hint}</p>}
        </Field>

        <SaveControls spec={spec} onChange={patch} advanced={<AdvancedSize spec={spec} onChange={patch} />}>
          <PixelSize spec={spec} onChange={patch} target={target} />
        </SaveControls>
      </div>

      <Confetti fire={fire} />
      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed inset-x-3 bottom-5 z-50 mx-auto max-w-md rounded-3xl bg-ink p-5 text-white shadow-float"
          >
            <p className="font-display text-[22px] font-black leading-none">
              Thank you<span className="text-lime">!</span>
            </p>
            <p className="mt-1.5 text-sm text-white/70">{toast.text}. Location and camera details removed.</p>
            <p className="mt-3 border-t border-white/10 pt-3 text-[15px] font-semibold leading-snug">&ldquo;{toast.q.q}&rdquo; <span className="font-normal text-white/55">{toast.q.by}</span></p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Main pixel-size choice: keep it, or type a width (and height). */
function PixelSize({ spec, onChange, target }: { spec: ConvertSpec; onChange: (p: Partial<ConvertSpec>) => void; target: { w: number; h: number } | null }) {
  const num = (v: string) => Math.max(0, Number(v) || 0);
  const choice = spec.dims === "original" ? "original" : "resize";
  return (
    <Field label="Pixel size" hint={target ? `${target.w} × ${target.h} px` : undefined}>
      <ChoiceRow
        label="Pixel size"
        value={choice}
        onChange={(v) => onChange({ dims: v === "original" ? "original" : spec.dims === "original" ? "exact" : spec.dims })}
        options={[
          { value: "original", label: "Same" },
          { value: "resize", label: "Resize" },
        ]}
      />
      {spec.dims === "exact" && (
        <div className="flex items-center gap-2">
          <label className="relative flex-1">
            <span className="sr-only">Width in pixels</span>
            <input inputMode="numeric" value={spec.width} onChange={(e) => onChange({ width: num(e.target.value) })} className={input} />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-soft">W</span>
          </label>
          <button
            type="button"
            aria-pressed={spec.lock}
            title={spec.lock ? "Height follows the photo's shape" : "Width and height set freely"}
            aria-label="Keep proportions"
            onClick={() => onChange({ lock: !spec.lock })}
            className={clsx("grid h-10 w-10 shrink-0 place-items-center rounded-full transition", spec.lock ? "bg-ink text-white" : "bg-ink/5 text-ink/60")}
          >
            {spec.lock ? <FaLock aria-hidden className="text-xs" /> : <FaLockOpen aria-hidden className="text-xs" />}
          </button>
          <label className="relative flex-1">
            <span className="sr-only">Height in pixels</span>
            <input inputMode="numeric" value={spec.lock ? (target?.h ?? spec.height) : spec.height} disabled={spec.lock} onChange={(e) => onChange({ height: num(e.target.value) })} className={clsx(input, "disabled:opacity-60")} />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-soft">H</span>
          </label>
        </div>
      )}
      {spec.dims !== "original" && spec.dims !== "exact" && <p className="text-xs text-ink-soft">Set in More options ({spec.dims === "print" ? "print size" : spec.dims === "percent" ? "percent" : "longest side"}).</p>}
    </Field>
  );
}

/** Rarely needed size and look settings, shown inside "More options". */
function AdvancedSize({ spec, onChange }: { spec: ConvertSpec; onChange: (p: Partial<ConvertSpec>) => void }) {
  const num = (v: string) => Math.max(0, Number(v) || 0);
  const boxed = (spec.dims === "exact" && !spec.lock) || spec.dims === "print";
  return (
    <>
      <Field label="More ways to set the size">
        <Segmented
          size="sm"
          label="More ways to set the size"
          value={spec.dims}
          onChange={(dims) => onChange({ dims })}
          options={[
            { value: "exact", label: "Pixels" },
            { value: "print", label: "Print" },
            { value: "percent", label: "%" },
            { value: "longest", label: "Longest side" },
          ]}
        />
        {spec.dims === "print" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input aria-label="Print width" inputMode="decimal" value={spec.printW} onChange={(e) => onChange({ printW: num(e.target.value) })} className={input} />
              <span className="text-ink-soft">×</span>
              <input aria-label="Print height" inputMode="decimal" value={spec.printH} onChange={(e) => onChange({ printH: num(e.target.value) })} className={input} />
              <select aria-label="Unit" value={spec.unit} onChange={(e) => onChange({ unit: e.target.value as ConvertSpec["unit"] })} className="rounded-xl bg-ink/5 px-2 py-2.5 text-sm font-bold">
                <option value="cm">cm</option>
                <option value="mm">mm</option>
                <option value="in">in</option>
              </select>
            </div>
            <p className="text-xs text-ink-soft">At {spec.dpi} DPI (change it under Resolution below).</p>
          </div>
        )}
        {spec.dims === "percent" && (
          <>
            <RangeInput label="Scale percent" min={5} max={200} step={1} value={spec.percent} onChange={(percent) => onChange({ percent })} />
            <p className="text-xs text-ink-soft">{spec.percent}% of the original</p>
          </>
        )}
        {spec.dims === "longest" && (
          <label className="relative block">
            <span className="sr-only">Longest side in pixels</span>
            <input inputMode="numeric" value={spec.width} onChange={(e) => onChange({ width: num(e.target.value) })} className={input} />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-soft">px max</span>
          </label>
        )}
        {boxed && (
          <Segmented
            size="sm"
            label="If the shape is different"
            value={spec.fit}
            onChange={(fit) => onChange({ fit })}
            options={[
              { value: "cover", label: "Crop" },
              { value: "contain", label: "Fit inside" },
              { value: "stretch", label: "Stretch" },
            ]}
          />
        )}
      </Field>

      <Field label="Turn and flip">
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "Rotate left", icon: FaArrowRotateLeft, on: undefined, act: () => onChange({ rotate: ((spec.rotate + 270) % 360) as ConvertSpec["rotate"] }) },
            { label: "Rotate right", icon: FaArrowRotateRight, on: undefined, act: () => onChange({ rotate: ((spec.rotate + 90) % 360) as ConvertSpec["rotate"] }) },
            { label: "Flip horizontally", icon: FaArrowsLeftRight, on: spec.flipH, act: () => onChange({ flipH: !spec.flipH }) },
            { label: "Flip vertically", icon: FaArrowsUpDown, on: spec.flipV, act: () => onChange({ flipV: !spec.flipV }) },
          ].map((b) => (
            <button key={b.label} type="button" title={b.label} aria-label={b.label} aria-pressed={b.on} onClick={b.act} className={clsx("grid h-10 w-10 place-items-center rounded-full ring-1 transition", b.on ? "bg-ink text-white ring-ink" : "ring-line hover:ring-ink/30")}>
              <b.icon aria-hidden />
            </button>
          ))}
          <button type="button" aria-pressed={spec.grayscale} onClick={() => onChange({ grayscale: !spec.grayscale })} className={clsx("rounded-full px-3.5 text-sm font-bold ring-1 transition", spec.grayscale ? "bg-ink text-white ring-ink" : "ring-line hover:ring-ink/30")}>
            Black & white
          </button>
        </div>
        {spec.rotate !== 0 && <p className="text-xs text-ink-soft">Turned {spec.rotate}°</p>}
      </Field>
    </>
  );
}
