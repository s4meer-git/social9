"use client";

import { useSyncExternalStore } from "react";
import clsx from "clsx";
import { FORMATS, formatById, isAvailable, type FormatId } from "@social9/core/convert/encoders";
import type { ConvertSpec } from "@social9/core/convert/pipeline";
import { Field, RangeInput } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { ChoiceRow, MoreOptions } from "@/components/ui/MoreOptions";

/** Which formats this browser can write. Server render says "all", the client corrects it after hydration. */
const noop = () => () => {};
function useAvailable() {
  return useSyncExternalStore(
    noop,
    () => FORMATS.map((f) => (isAvailable(f.id) ? "1" : "0")).join(""),
    () => "1".repeat(FORMATS.length),
  );
}

const MAIN: FormatId[] = ["jpeg", "png", "webp", "pdf"];
const quickKb = [50, 100, 200, 500, 1024];
const kbLabel = (kb: number) => (kb >= 1024 ? `${+(kb / 1024).toFixed(1)} MB` : `${kb} KB`);
const input = "w-full min-w-0 rounded-xl bg-ink/5 px-3 py-2.5 text-sm font-semibold tabular-nums outline-none ring-violet focus:bg-white focus:ring-2";

type SizeChoice = "none" | "max" | "exact";

/**
 * Save settings, simple first: pick a format and (optionally) a file size.
 * Everything else lives under "More options". Shared by the editor and the converter.
 */
export function SaveControls({
  spec,
  onChange,
  transparent,
  children,
  advanced,
}: {
  spec: ConvertSpec;
  onChange: (patch: Partial<ConvertSpec>) => void;
  transparent?: boolean;
  /** extra main settings, shown before "More options" */
  children?: React.ReactNode;
  /** extra advanced settings, shown first inside "More options" */
  advanced?: React.ReactNode;
}) {
  const info = formatById(spec.format);
  const available = useAvailable();
  const ok = (id: FormatId) => available[FORMATS.findIndex((f) => f.id === id)] === "1";
  const sizeChoice: SizeChoice = spec.size === "range" ? "max" : spec.size;
  const isMain = MAIN.includes(spec.format);

  return (
    <div className="space-y-6">
      <Field label="Format">
        <ChoiceRow
          label="Format"
          value={spec.format}
          onChange={(format) => onChange({ format })}
          options={[
            ...MAIN.map((id) => ({ value: id, label: formatById(id).label, disabled: !ok(id) })),
            ...(!isMain ? [{ value: spec.format, label: info.label }] : []),
          ]}
        />
        <p className="text-xs text-ink-soft">{info.note}.</p>
        {transparent && !info.alpha && <p className="text-xs font-semibold text-pink-deep">{info.label} doesn&apos;t support transparency, so transparent areas will turn white. Choose PNG or WebP to keep them transparent.</p>}
      </Field>

      <Field label="File size">
        <ChoiceRow
          label="File size"
          value={sizeChoice}
          onChange={(size: SizeChoice) => onChange({ size })}
          options={[
            { value: "none", label: "Any size" },
            { value: "max", label: "Max size" },
            { value: "exact", label: "Exact size" },
          ]}
        />
        {spec.size === "none" && <p className="text-xs text-ink-soft">Best quality, no size limit.</p>}
        {spec.size !== "none" && (
          <div className="space-y-2.5">
            <label className="relative block">
              <span className="sr-only">{spec.size === "exact" ? "Exact size in KB" : "Maximum size in KB"}</span>
              <input inputMode="numeric" value={spec.kb} onChange={(e) => onChange({ kb: Math.max(1, Number(e.target.value) || 0) })} className={input} />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-soft">KB</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickKb.map((kb) => (
                <button key={kb} type="button" aria-pressed={spec.kb === kb} onClick={() => onChange({ kb })} className={clsx("rounded-full px-2.5 py-1 text-xs font-bold ring-1 transition", spec.kb === kb ? "bg-ink text-white ring-ink" : "ring-line hover:ring-ink/30")}>
                  {kbLabel(kb)}
                </button>
              ))}
            </div>
          </div>
        )}
      </Field>

      {children}

      <MoreOptions>
        {advanced}
        <Field label="Other formats">
          <div className="grid grid-cols-3 gap-1.5">
            {FORMATS.filter((f) => !MAIN.includes(f.id)).map((f) => (
              <button
                key={f.id}
                type="button"
                disabled={!ok(f.id)}
                aria-pressed={spec.format === f.id}
                title={ok(f.id) ? f.note : `${f.label} isn't supported by this browser`}
                onClick={() => onChange({ format: f.id })}
                className={clsx("rounded-xl py-2 text-[13px] font-bold ring-1 transition-all disabled:cursor-not-allowed disabled:opacity-35", spec.format === f.id ? "bg-ink text-white ring-ink" : "bg-white ring-line hover:ring-ink/25")}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Field>

        {info.lossy && (
          <Field label={spec.size === "none" ? "Quality" : "Start from quality"} hint={`${Math.round(spec.quality * 100)}%`}>
            <RangeInput label="Quality" min={0.1} max={1} step={0.01} value={spec.quality} onChange={(quality) => onChange({ quality })} />
          </Field>
        )}

        {spec.size !== "none" && (
          <>
            {spec.size !== "exact" && (
              <Field label="Minimum size" hint="for forms that require one">
                <label className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <input type="checkbox" checked={spec.size === "range"} onChange={(e) => onChange({ size: e.target.checked ? "range" : "max" })} className="h-4 w-4 accent-violet" />
                  Also keep it above
                  <span className="relative w-28">
                    <input aria-label="Minimum size in KB" inputMode="numeric" disabled={spec.size !== "range"} value={spec.minKb} onChange={(e) => onChange({ minKb: Math.max(1, Number(e.target.value) || 0) })} className={clsx(input, "py-1.5 disabled:opacity-50")} />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-soft">KB</span>
                  </span>
                </label>
              </Field>
            )}
            <label className="flex items-start gap-2.5 text-[13px] text-ink-soft">
              <input type="checkbox" checked={spec.allowShrink} onChange={(e) => onChange({ allowShrink: e.target.checked })} className="mt-0.5 h-4 w-4 accent-violet" />
              <span>If lowering quality isn&apos;t enough, make the photo smaller in pixels to fit.</span>
            </label>
          </>
        )}

        <Field label="Resolution" hint="DPI, for printing and forms">
          <div className="flex flex-wrap gap-1.5">
            {[72, 96, 150, 200, 300, 600].map((d) => (
              <button key={d} type="button" aria-pressed={spec.dpi === d} onClick={() => onChange({ dpi: d })} className={clsx("rounded-full px-3 py-1 text-xs font-bold ring-1 transition", spec.dpi === d ? "bg-ink text-white ring-ink" : "ring-line hover:ring-ink/30")}>
                {d}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Background color" hint="behind transparent areas">
          <div className="flex flex-wrap items-center gap-3">
            <input type="color" aria-label="Background color" value={spec.matte} onChange={(e) => onChange({ matte: e.target.value })} className="h-9 w-14 cursor-pointer rounded-lg" />
            {info.alpha && (
              <label className="flex items-center gap-2 text-[13px] font-semibold">
                <input type="checkbox" checked={spec.keepAlpha} onChange={(e) => onChange({ keepAlpha: e.target.checked })} className="h-4 w-4 accent-violet" />
                Keep transparent areas
              </label>
            )}
          </div>
        </Field>

        {spec.format === "pdf" && (
          <Field label="PDF page">
            <Segmented
              size="sm"
              label="PDF page"
              value={spec.pdfPage}
              onChange={(pdfPage) => onChange({ pdfPage })}
              options={[
                { value: "fit", label: "Photo size" },
                { value: "a4", label: "A4" },
                { value: "letter", label: "Letter" },
              ]}
            />
          </Field>
        )}
        <p className="text-xs text-ink-soft">1 KB = 1024 bytes. Location, date and camera details are always removed.</p>
      </MoreOptions>
    </div>
  );
}
