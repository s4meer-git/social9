"use client";

import { useEffect, useRef, useState } from "react";
import { FaDownload, FaShareNodes, FaXmark, FaShieldHalved, FaTriangleExclamation, FaSpinner, FaFileZipper, FaCropSimple, FaPen } from "react-icons/fa6";
import { Button } from "@/components/ui/Button";
import { Confetti } from "@/components/fx/Confetti";
import { useEditor, profilePresets } from "@/editor/store";
import { exportImage, fullScene, type ExportResult } from "@/editor/export";
import { sceneFromState } from "@/editor/render";
import { formatBytes, ratioLabel } from "@social9/core/image/geometry";
import { formatById } from "@social9/core/convert/encoders";
import { zip } from "@social9/core/convert/zip";

/** Shown with the finished photo. Real, attributed photography quotes. */
const quotes = [
  { q: "You don't take a photograph, you make it.", by: "Ansel Adams" },
  { q: "The best camera is the one that's with you.", by: "Chase Jarvis" },
  { q: "What I like about photographs is that they capture a moment that's gone forever.", by: "Karl Lagerfeld" },
  { q: "When words become unclear, I shall focus with photographs.", by: "Ansel Adams" },
  { q: "Photography is a way of feeling, of touching, of loving.", by: "Aaron Siskind" },
  { q: "There are no rules for good photographs, there are only good photographs.", by: "Ansel Adams" },
];

/** One per platform, for "download for every platform" in profile mode. */
const everyProfile = profilePresets.filter((p, i, a) => a.findIndex((x) => x.platform.id === p.platform.id) === i);

/** The save button + "Thank you" dialog. `label`/`size` let the profile picture page reuse it. */
export function ExportButton({ label = "Export", size = "sm" }: { label?: string; size?: "sm" | "md" }) {
  const source = useEditor((s) => s.source);
  const profileMode = useEditor((s) => s.frame.pfp.enabled);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [fire, setFire] = useState(0);
  const [quote, setQuote] = useState(quotes[0]);
  const [result, setResult] = useState<(ExportResult & { url: string; preview: string }) | null>(null);

  useEffect(
    () => () => {
      if (result) URL.revokeObjectURL(result.url);
    },
    [result],
  );

  const run = async () => {
    const state = useEditor.getState();
    if (!state.source) return;
    setBusy(true);
    try {
      const r = await exportImage(sceneFromState(state as never), state.save);
      const url = URL.createObjectURL(r.blob);
      // browsers can't show PDF/TIFF in an <img>: preview the canvas instead
      const preview = r.format === "pdf" || r.format === "tiff" ? ((document.querySelector("main canvas[role=img]") as HTMLCanvasElement | null)?.toDataURL("image/png") ?? url) : url;
      setResult({ ...r, url, preview });
      setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
      dialogRef.current?.showModal();
      setFire((n) => n + 1);
    } finally {
      setBusy(false);
    }
  };

  /** The same profile picture at every platform's exact profile size, in one ZIP. */
  const downloadEveryPlatform = async () => {
    const state = useEditor.getState();
    if (!state.source) return;
    setZipping(true);
    try {
      const base = sceneFromState(state as never);
      const scene = fullScene(base);
      const files = [];
      for (const p of everyProfile) {
        const r = await exportImage({ ...base, frame: { ...base.frame, presetId: p.id, width: p.width, height: p.height } }, state.save, scene);
        files.push({ name: `${state.source.name}-${p.platform.name.toLowerCase().replace(/\W+/g, "")}-${p.width}.${formatById(r.format).ext}`, bytes: new Uint8Array(await r.blob.arrayBuffer()) });
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([zip(files) as BlobPart], { type: "application/zip" }));
      a.download = `${state.source.name}-profile-pictures.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } finally {
      setZipping(false);
    }
  };

  const close = () => dialogRef.current?.close();
  const file = result ? new File([result.blob], result.filename, { type: result.blob.type }) : null;
  const canShare = !!file && typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [file] });

  return (
    <>
      <Button variant="brand" size={size} className={size === "sm" ? "h-10 px-5" : undefined} disabled={!source || busy} onClick={run} icon={busy ? <FaSpinner aria-hidden className="animate-spin" /> : <FaDownload aria-hidden />}>
        {busy ? "Preparing" : label}
      </Button>
      <Confetti fire={fire} />

      <dialog
        ref={dialogRef}
        aria-labelledby="export-title"
        className="m-auto max-h-[94dvh] w-[min(94vw,500px)] overflow-y-auto rounded-4xl bg-white p-0 outline-none text-ink shadow-float backdrop:bg-ink/55 backdrop:backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        {result && (
          <div className="p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="export-title" className="headline font-display text-[34px] font-black leading-none tracking-[-0.03em]">
                  Thank you<span className="brand-text">!</span>
                </h2>
                <p className="mt-2 text-[15px] text-ink-soft">Your photo is ready to post.</p>
              </div>
              <button type="button" aria-label="Close" onClick={close} className="-mr-2 -mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-ink/5">
                <FaXmark aria-hidden />
              </button>
            </div>

            <figure className="mt-5 rounded-3xl bg-paper px-5 py-4">
              <blockquote className="font-display text-[19px] font-black leading-snug tracking-[-0.01em]">&ldquo;{quote.q}&rdquo;</blockquote>
              <figcaption className="mt-1.5 text-sm font-semibold text-ink-soft">{quote.by}</figcaption>
            </figure>

            <div className="checker mt-5 grid max-h-64 place-items-center overflow-hidden rounded-2xl p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img decoding="async" src={result.preview} alt="Your finished photo" className="max-h-56 max-w-full object-contain shadow-card" />
            </div>
            <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-soft">
              <span className="font-semibold text-ink">
                {formatById(result.format).label} · {result.width} × {result.height} ({ratioLabel(result.width, result.height)}) · {formatBytes(result.blob.size)}
              </span>
              <span className="flex items-center gap-1.5">
                <FaShieldHalved aria-hidden className="text-violet" /> Location and camera details removed
              </span>
            </p>
            {!result.hitTarget && (
              <p className="mt-2 flex items-start gap-2 text-sm font-medium text-pink-deep">
                <FaTriangleExclamation aria-hidden className="mt-0.5 shrink-0" /> {result.notes.at(-1) ?? "We couldn't reach your file size goal."}
              </p>
            )}

            <div className="mt-5 flex gap-2.5">
              <a href={result.url} download={result.filename} className="brand-gradient inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-full text-[17px] font-bold text-white shadow-pop transition hover:brightness-110 active:scale-[0.98]">
                <FaDownload aria-hidden /> Download
              </a>
              {canShare && (
                <Button variant="secondary" className="h-13" icon={<FaShareNodes aria-hidden />} onClick={() => navigator.share({ files: [file!] }).catch(() => {})}>
                  Share
                </Button>
              )}
            </div>

            <div className="mt-6 border-t border-line pt-5">
              <p className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">What next?</p>
              {profileMode ? (
                <button
                  type="button"
                  onClick={downloadEveryPlatform}
                  disabled={zipping}
                  className="mt-3 flex w-full items-center gap-4 rounded-2xl bg-ink/5 p-4 text-left transition hover:bg-ink/10 disabled:opacity-60"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-lg shadow-card">{zipping ? <FaSpinner aria-hidden className="animate-spin text-violet" /> : <FaFileZipper aria-hidden />}</span>
                  <span>
                    <span className="block font-bold">Download for every platform</span>
                    <span className="block text-[13px] text-ink-soft">
                      This look at the exact profile size for {everyProfile.length} platforms, in one ZIP.
                    </span>
                  </span>
                </button>
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      useEditor.getState().selectTool("size");
                      close();
                    }}
                    className="flex items-center gap-3 rounded-2xl bg-ink/5 p-3.5 text-left transition hover:bg-ink/10"
                  >
                    <FaCropSimple aria-hidden className="shrink-0 text-lg" />
                    <span>
                      <span className="block text-sm font-bold">Resize for another platform</span>
                      <span className="block text-xs text-ink-soft">Same edits, new size</span>
                    </span>
                  </button>
                  <button type="button" onClick={close} className="flex items-center gap-3 rounded-2xl bg-ink/5 p-3.5 text-left transition hover:bg-ink/10">
                    <FaPen aria-hidden className="shrink-0" />
                    <span>
                      <span className="block text-sm font-bold">Keep editing</span>
                      <span className="block text-xs text-ink-soft">Back to your photo</span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
