"use client";

import { useEffect, useMemo, useState } from "react";
import { FaDownload, FaExpand, FaImage, FaSpinner } from "react-icons/fa6";
import { decodeImage } from "@social9/core/image/load";
import { upscale, upscalePlan, UPSCALE_MAX_SIDE } from "@social9/core/ml/upscale";
import { formatBytes } from "@social9/core/image/geometry";
import { setInPlaceHandler } from "@/lib/pending-image";
import { UploadCard } from "@/components/home/UploadCard";
import { Field } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/Button";
import { BeforeAfter } from "@/components/ui/BeforeAfter";
import { WorkStatus } from "@/components/editor/WorkStatus";
import { Confetti } from "@/components/fx/Confetti";

interface Result {
  url: string;
  bytes: number;
  width: number;
  height: number;
  ext: "jpg" | "png";
  /** close-ups of the same spot, before and after, for the slider */
  before: string;
  after: string;
}

/** Make a photo 2× or 4× bigger and sharper, on this device. */
export function UpscaleStudio() {
  const [photo, setPhoto] = useState<{ bitmap: ImageBitmap; name: string; png: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [factor, setFactor] = useState<"2" | "4">("2");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [fire, setFire] = useState(0);

  const open = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const bitmap = await decodeImage(file);
      setPhoto((old) => {
        old?.bitmap.close();
        return { bitmap, name: file.name.replace(/\.[^.]+$/, "") || "photo", png: file.type === "image/png" };
      });
      setResult((r) => {
        if (r) URL.revokeObjectURL(r.url);
        return null;
      });
    } catch {
      setError("We couldn't open that photo. Try a JPG, PNG, WebP or HEIC.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setInPlaceHandler((files) => open(files[0]));
    return () => setInPlaceHandler(null);
  }, []);

  const run = async () => {
    if (!photo) return;
    setBusy(true);
    setProgress(0);
    setError(null);
    try {
      const out = await upscale(photo.bitmap, Number(factor), setProgress);
      const ext = photo.png ? "png" : "jpg";
      const blob = await new Promise<Blob>((res, rej) => out.toBlob((b) => (b ? res(b) : rej(new Error("Encoding failed"))), photo.png ? "image/png" : "image/jpeg", 0.92));
      const k = out.width / photo.bitmap.width;
      // a close-up from the middle of the photo, at actual pixels
      const size = Math.min(520, out.width, out.height);
      const sx = (out.width - size) / 2;
      const sy = (out.height - size) / 2;
      const crop = (draw: (ctx: CanvasRenderingContext2D) => void) => {
        const c = document.createElement("canvas");
        c.width = c.height = size;
        const ctx = c.getContext("2d")!;
        ctx.imageSmoothingQuality = "high";
        draw(ctx);
        return c.toDataURL("image/jpeg", 0.9);
      };
      const before = crop((ctx) => ctx.drawImage(photo.bitmap, sx / k, sy / k, size / k, size / k, 0, 0, size, size));
      const after = crop((ctx) => ctx.drawImage(out, sx, sy, size, size, 0, 0, size, size));
      setResult((r) => {
        if (r) URL.revokeObjectURL(r.url);
        return { url: URL.createObjectURL(blob), bytes: blob.size, width: out.width, height: out.height, ext, before, after };
      });
    } catch (e) {
      console.error("Upscale failed", e);
      setError("Something went wrong. The first time needs an internet connection. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!photo) {
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

  const { width: W, height: H } = photo.bitmap;
  const big = Math.max(W, H) >= UPSCALE_MAX_SIDE;
  const two = upscalePlan(W, H, 2);
  const four = upscalePlan(W, H, 4);
  const plan = factor === "4" ? four : two;

  return (
    <div className="fade-up grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
      <div className="lg:sticky lg:top-24 lg:col-span-7">
        {result ? (
          <>
            <div className="mx-auto max-w-[520px]">
              <BeforeAfter before={result.before} after={result.after} ratio="1/1" alt="Close-up of your photo" labels={["Before", "Upscaled"]} className="shadow-float ring-1 ring-black/5" />
            </div>
            <p className="mt-3 text-center text-sm text-ink-soft">A close-up at actual size. Drag the slider to compare.</p>
          </>
        ) : (
          <div className="mx-auto grid max-w-[560px] place-items-center overflow-hidden rounded-[28px] bg-white p-3 shadow-float ring-1 ring-line">
            <PhotoPreview bitmap={photo.bitmap} />
          </div>
        )}
      </div>

      <div className="space-y-6 rounded-[32px] bg-white p-5 shadow-card ring-1 ring-line sm:p-6 lg:col-span-5">
        <p className="text-sm font-semibold">
          Your photo: {W} × {H} pixels
        </p>
        {big ? (
          <p className="rounded-2xl bg-paper p-4 text-sm text-ink-soft ring-1 ring-line">This photo is already large, so it can&apos;t be made any bigger here.</p>
        ) : (
          <>
            <Field label="How much bigger">
              <Segmented
                label="How much bigger"
                value={factor}
                onChange={(v) => {
                  setFactor(v);
                  setResult(null);
                }}
                options={[
                  { value: "2", label: `2× · ${two.width} × ${two.height}` },
                  { value: "4", label: `4× · ${four.width} × ${four.height}`, disabled: four.width === two.width },
                ]}
              />
            </Field>
            {plan.limited && (
              <p className="text-xs text-ink-soft">
                On this device, the largest size is {plan.width} × {plan.height} pixels.
              </p>
            )}
            {!result && (
              <Button variant="brand" size="md" disabled={busy} onClick={run} icon={busy ? <FaSpinner aria-hidden className="animate-spin" /> : <FaExpand aria-hidden />}>
                {busy ? "Working" : "Upscale photo"}
              </Button>
            )}
          </>
        )}
        <WorkStatus busy={busy} label="Making it sharper" model="upscale" progress={progress} />
        {error && (
          <p role="alert" className="text-sm font-semibold text-pink-deep">
            {error}
          </p>
        )}
        {result && (
          <div className="fade-up space-y-3 rounded-2xl bg-paper p-4 ring-1 ring-line">
            <p className="text-sm font-semibold">
              New size: {result.width} × {result.height} pixels · {formatBytes(result.bytes)}
            </p>
            <a
              href={result.url}
              download={`${photo.name}-${factor}x.${result.ext}`}
              onClick={() => setFire((n) => n + 1)}
              className="brand-gradient inline-flex h-12 items-center gap-2 rounded-full px-6 text-[16px] font-bold text-white shadow-pop transition hover:brightness-110"
            >
              <FaDownload aria-hidden /> Download
            </a>
          </div>
        )}
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
      <Confetti fire={fire} />
    </div>
  );
}

function PhotoPreview({ bitmap }: { bitmap: ImageBitmap }) {
  const src = useMemo(() => {
    const k = Math.min(1, 1100 / Math.max(bitmap.width, bitmap.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bitmap.width * k);
    c.height = Math.round(bitmap.height * k);
    c.getContext("2d")!.drawImage(bitmap, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.88);
  }, [bitmap]);
  // eslint-disable-next-line @next/next/no-img-element
  return <img decoding="async" src={src} alt="Your photo" className="max-h-[520px] w-auto rounded-2xl object-contain" />;
}
