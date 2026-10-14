"use client";

import { FaLocationDot, FaCamera, FaCalendar, FaBarcode, FaCode } from "react-icons/fa6";
import { useEditor } from "@/editor/store";

const icons: Record<string, typeof FaCamera> = {
  "GPS location": FaLocationDot,
  "Date taken": FaCalendar,
  Camera: FaCamera,
  Lens: FaCamera,
  Software: FaCode,
  "Camera serial": FaBarcode,
};

/** What hidden data the original file carried. None of it is ever written to the saved file. */
export function PrivacyPanel() {
  const source = useEditor((s) => s.source);
  if (!source) return null;
  const items = source.metadata;

  return (
    <section aria-labelledby="hidden-data" className="rounded-3xl ring-1 ring-line">
      <div className="border-b border-line px-4 py-3">
        <h3 id="hidden-data" className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">
          Hidden data
        </h3>
      </div>
      <div className="p-4">
        {items.length === 0 ? (
          <p className="text-sm text-ink-soft">This photo has no location or camera details. Saved files never include them.</p>
        ) : (
          <>
            <p className="text-sm text-ink-soft">The original file contains details that anyone could read. Your saved file won&apos;t include any of them.</p>
            <ul className="mt-3 divide-y divide-line">
              {items.map((m) => {
                const Icon = icons[m.label] ?? FaCode;
                return (
                  <li key={m.label} className="flex items-start gap-3 py-2.5">
                    <Icon aria-hidden className={`mt-0.5 shrink-0 text-sm ${m.sensitive ? "text-pink-deep" : "text-ink/40"}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-ink-soft">{m.label}</span>
                      <span className="block wrap-break-word text-sm font-semibold line-through decoration-ink/30">{m.value}</span>
                    </span>
                    <span className="text-xs font-bold text-emerald-700">Removed</span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
