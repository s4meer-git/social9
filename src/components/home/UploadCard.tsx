"use client";

import { useState } from "react";
import clsx from "clsx";
import { FaArrowUpFromBracket, FaSpinner } from "react-icons/fa6";
import { samples, usePhotoPicker, type PickerOptions } from "@/components/home/usePhotoPicker";

export { samples };

/** Upload box: click, drop or paste a photo, or start from a sample. */
export function UploadCard({ className, compact = false, ...opts }: PickerOptions & { className?: string; compact?: boolean }) {
  const { open, go, trySample, busy, error, inputProps } = usePhotoPicker(opts);
  const [dragging, setDragging] = useState(false);

  return (
    <div className={clsx("rounded-[28px] bg-white p-2 shadow-float ring-1 ring-line", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
          go(e.dataTransfer.files[0]);
        }}
        className={clsx(
          "flex flex-col items-center justify-center gap-3 rounded-[22px] border-2 border-dashed text-center transition-colors",
          compact ? "px-5 py-6" : "px-6 py-9",
          dragging ? "border-violet bg-violet-soft" : "border-line bg-paper/60",
        )}
      >
        <button
          type="button"
          onClick={open}
          className="shine brand-gradient group/btn inline-flex h-13 items-center gap-2.5 rounded-full px-7 text-base font-bold text-white shadow-pop transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <FaArrowUpFromBracket aria-hidden className="transition-transform group-hover/btn:-translate-y-0.5" />
          Upload a photo
        </button>
        <p className="text-sm text-ink-soft">{dragging ? "Drop it anywhere in this box" : "or drop a file here, or paste one with Ctrl + V"}</p>
        <input {...inputProps} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 pb-2 pt-3">
        <p className="text-sm font-medium text-ink-soft">No photo? Try a sample:</p>
        <SampleRow trySample={trySample} busy={busy} />
      </div>
      {error && (
        <p role="alert" className="px-3 pb-3 text-sm font-medium text-pink-deep">
          {error}
        </p>
      )}
    </div>
  );
}

export function SampleRow({ trySample, busy, size = "h-11 w-11" }: { trySample: (id: string) => void; busy: string | null; size?: string }) {
  return (
    <ul className="flex gap-2">
      {samples.map((s) => (
        <li key={s.id}>
          <button
            type="button"
            onClick={() => trySample(s.id)}
            aria-label={`Try with the ${s.label.toLowerCase()} sample`}
            title={s.label}
            className={clsx("relative block overflow-hidden rounded-xl ring-2 ring-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:rotate-[-4deg] hover:shadow-float", size)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img decoding="async" src={`/samples/${s.id}-thumb.webp`} alt="" className="h-full w-full object-cover" />
            {busy === s.id && (
              <span className="absolute inset-0 grid place-items-center bg-white/70">
                <FaSpinner aria-hidden className="animate-spin" />
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
