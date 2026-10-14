"use client";

import clsx from "clsx";
import { FaArrowUpFromBracket } from "react-icons/fa6";
import { Button } from "@/components/ui/Button";
import { SampleRow } from "@/components/home/UploadCard";
import { usePhotoPicker } from "@/components/home/usePhotoPicker";

/** Upload button + sample photos, used in bands and landing pages. */
export function HeroCtas({ tool, preset, light = false, className }: { tool?: string; preset?: string; light?: boolean; className?: string }) {
  const { open, trySample, busy, error, inputProps } = usePhotoPicker({ tool, preset, paste: false });
  return (
    <div className={clsx("flex flex-col items-center gap-5 sm:flex-row", className)}>
      <Button variant={light ? "light" : "brand"} size="lg" onClick={open} icon={<FaArrowUpFromBracket aria-hidden className="group-hover/btn:-translate-y-0.5" />}>
        Upload a photo
      </Button>
      <div className="flex items-center gap-3">
        <span className={clsx("text-sm font-semibold", light ? "text-white/85" : "text-ink-soft")}>or try</span>
        <SampleRow trySample={trySample} busy={busy} />
      </div>
      <input {...inputProps} />
      {error && (
        <p role="alert" className={clsx("text-sm font-medium", light ? "text-white" : "text-pink-deep")}>
          {error}
        </p>
      )}
    </div>
  );
}
