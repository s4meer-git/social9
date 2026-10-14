"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { FaSpinner, FaSliders, FaImage } from "react-icons/fa6";
import { useEditor, outputSize } from "@/editor/store";
import { setInPlaceHandler } from "@/lib/pending-image";
import { CanvasView } from "@/components/editor/CanvasView";
import { ExportButton } from "@/components/editor/ExportDialog";
import { PfpPanel } from "@/components/editor/panels/PfpPanel";
import { UploadCard } from "@/components/home/UploadCard";

/**
 * The profile picture maker as its own page: upload, style, download, all in one screen.
 * It shares the editor's store, so "More edits" opens the editor with everything kept.
 */
export function PfpStudio() {
  const source = useEditor((s) => s.source);
  const loading = useEditor((s) => s.loading);
  const frame = useEditor((s) => s.frame);
  const replace = useRef<HTMLInputElement>(null);

  // This page always works in profile mode, and uploads land here instead of the editor.
  useEffect(() => {
    useEditor.getState().selectTool("profile");
    setInPlaceHandler((files) => useEditor.getState().loadFile(files[0]));
    return () => setInPlaceHandler(null);
  }, []);

  const out = outputSize(frame, source);

  if (!source) {
    return (
      <div className="mx-auto max-w-xl">
        {loading ? (
          <p className="mx-auto flex w-fit items-center gap-3 rounded-full bg-white px-5 py-3 font-semibold shadow-card">
            <FaSpinner aria-hidden className="animate-spin text-violet" /> Opening your photo
          </p>
        ) : (
          <UploadCard onFile={(f) => useEditor.getState().loadFile(f)} />
        )}
      </div>
    );
  }

  return (
    <div className="fade-up grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
      {/* the preview stays in view while the settings scroll with the page */}
      <div className="lg:sticky lg:top-24 lg:col-span-7">
        <div className="relative mx-auto aspect-square w-full max-w-[560px] overflow-hidden rounded-[36px] bg-[radial-gradient(rgb(15_14_23/0.08)_1px,transparent_1.2px)] bg-size-[18px_18px] p-6 ring-1 ring-line sm:p-10">
          <div className="relative h-full w-full">
            <CanvasView variant="studio" />
          </div>
        </div>
        <p className="mt-3 text-center text-sm text-ink-soft">Drag the photo to position your face. {out.width} × {out.height} px</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          <ExportButton label="Download" size="md" />
          <Link href="/editor?tool=pfp" className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-bold shadow-card ring-1 ring-line transition hover:-translate-y-0.5">
            <FaSliders aria-hidden className="text-sm" /> More edits
          </Link>
          <button type="button" onClick={() => replace.current?.click()} className="inline-flex h-12 items-center gap-2 rounded-full px-4 text-[15px] font-bold text-ink/75 hover:bg-ink/5 hover:text-ink">
            <FaImage aria-hidden className="text-sm" /> New photo
          </button>
          <input
            ref={replace}
            type="file"
            accept="image/*,.heic,.heif"
            className="sr-only"
            aria-label="Choose a different photo"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) useEditor.getState().loadFile(f);
            }}
          />
        </div>
      </div>
      <div className="rounded-[32px] bg-white p-5 shadow-card ring-1 ring-line sm:p-6 lg:col-span-5">
        <PfpPanel compact />
      </div>
    </div>
  );
}
