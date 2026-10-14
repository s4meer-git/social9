import type { Metadata } from "next";
import { Suspense } from "react";
import { EditorShell } from "@/components/editor/EditorShell";
import { railTools } from "@/editor/tools";

export const metadata: Metadata = {
  title: "Editor",
};

/** Server-rendered outline of the editor, shown until the app hydrates (fast first paint). */
function EditorSkeleton() {
  return (
    <div className="flex h-dvh flex-col bg-canvas">
      <div className="h-14 shrink-0 border-b border-line bg-white" />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <ul className="order-last flex shrink-0 justify-around gap-1 border-t border-line bg-white p-2 md:order-first md:w-23 md:flex-col md:justify-start md:border-r md:border-t-0">
          {railTools.map((t) => (
            <li key={t.id} className="flex w-17 flex-col items-center gap-1 py-2 text-[11.5px] font-bold text-ink/65 md:w-19">
              <span className="grid h-8 w-8 place-items-center text-[16px]">
                <t.icon aria-hidden />
              </span>
              {t.short}
            </li>
          ))}
        </ul>
        {/* mirrors the editor's empty state, so hydration paints nothing larger (keeps LCP at first paint) */}
        <div className="grid flex-1 place-items-center p-4">
          <div className="w-full max-w-lg text-center">
            <p className="mx-auto mb-3 h-6" />
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Edit your photo</h1>
            <p className="mx-auto mt-2 max-w-sm text-ink-soft">Drop a photo here to start. It stays on your device.</p>
            <div className="mt-6 h-[236px] rounded-[28px] bg-white shadow-float ring-1 ring-line" />
            <p className="mt-6 text-[15px] text-ink-soft">iPhone HEIC photos work too. Nothing is uploaded, and it also works offline.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <EditorShell />
    </Suspense>
  );
}
