"use client";

import { useEffect, useState } from "react";
import { FaTriangleExclamation, FaCircleCheck, FaLocationDot } from "react-icons/fa6";
import { useEditor, needsAlpha } from "@/editor/store";
import { exportImage } from "@/editor/export";
import { sceneFromState } from "@/editor/render";
import { formatBytes } from "@social9/core/image/geometry";
import { SaveControls } from "@/components/convert/SaveControls";
import { PrivacyPanel } from "@/components/editor/panels/PrivacyPanel";
import { MoreOptions } from "@/components/ui/MoreOptions";

const phrase: Record<string, string> = { "GPS location": "the exact GPS location where it was taken", "Date taken": "the date and time it was taken", "Camera serial": "your camera's serial number" };

/** ⑦ Save: format, quality and file size, with the real output size computed live. */
export function ExportPanel() {
  const save = useEditor((s) => s.save);
  const source = useEditor((s) => s.source);
  const frame = useEditor((s) => s.frame);
  const mask = useEditor((s) => s.mask);
  const faces = useEditor((s) => s.faces);
  const art = useEditor((s) => s.art);
  const setSave = useEditor((s) => s.setSave);
  const [estimate, setEstimate] = useState<{ bytes: number; hit: boolean; quality: number | null; w: number; h: number; notes: string[] } | null>(null);
  const [working, setWorking] = useState(false);
  const sensitive = source?.metadata.filter((m) => m.sensitive) ?? [];

  // Debounced real encode, so the number shown is the number you get.
  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setWorking(true);
      try {
        const r = await exportImage(sceneFromState(useEditor.getState() as never), save);
        if (!cancelled) setEstimate({ bytes: r.blob.size, hit: r.hitTarget, quality: r.quality, w: r.width, h: r.height, notes: r.notes });
      } finally {
        if (!cancelled) setWorking(false);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [source, frame, save, mask, faces, art]);

  return (
    <div className="space-y-6">
      <SaveControls spec={save} onChange={setSave} transparent={needsAlpha(frame)} />

      <div className="rounded-3xl bg-ink p-5 text-white" aria-live="polite">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Your file</p>
        <p className="mt-1 font-display text-4xl font-black tabular-nums tracking-[-0.02em]">{estimate ? formatBytes(estimate.bytes) : "…"}</p>
        {estimate && (
          <p className="mt-1 text-sm text-white/60">
            {estimate.w} × {estimate.h} px{estimate.quality != null && save.size !== "none" ? ` · ${Math.round(estimate.quality * 100)}% quality` : ""}
            {working && " · updating"}
          </p>
        )}
        {estimate && save.size !== "none" && (
          <p className={`mt-3 flex items-start gap-2 text-sm font-semibold ${estimate.hit ? "text-lime" : "text-pink"}`}>
            {estimate.hit ? <FaCircleCheck aria-hidden className="mt-0.5 shrink-0" /> : <FaTriangleExclamation aria-hidden className="mt-0.5 shrink-0" />}
            {estimate.hit ? "Size goal met" : estimate.notes.at(-1)}
          </p>
        )}
        {estimate?.notes
          .filter((n) => estimate.hit || n !== estimate.notes.at(-1))
          .map((n) => (
            <p key={n} className="mt-1.5 text-[13px] text-white/60">
              {n}
            </p>
          ))}
      </div>

      {sensitive.length > 0 && (
        <p className="flex items-start gap-2.5 rounded-2xl bg-ink/5 p-3.5 text-sm">
          <FaLocationDot aria-hidden className="mt-0.5 shrink-0 text-pink-deep" />
          <span>
            <span className="font-bold">This photo carries {sensitive.map((m) => phrase[m.label] ?? m.label.toLowerCase()).join(" and ")}.</span> <span className="text-ink-soft">It&apos;s removed from the file you save.</span>
          </span>
        </p>
      )}

      <MoreOptions label="See what's removed from the file">
        <PrivacyPanel />
      </MoreOptions>
    </div>
  );
}
