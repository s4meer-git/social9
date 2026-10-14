"use client";

import { useSyncExternalStore } from "react";
import clsx from "clsx";
import { FaSpinner } from "react-icons/fa6";
import { getModelStatus, subscribeModelStatus, type ModelId } from "@social9/core/ml/models";

/**
 * A small progress card for the Retouch tools. While the AI model is being set up (first
 * use only) it says so in plain words; then it shows the job's own progress.
 */
export function WorkStatus({ busy, label, model, progress }: { busy: boolean; label: string; model: ModelId; progress?: number | null }) {
  const status = useSyncExternalStore(subscribeModelStatus, getModelStatus, getModelStatus)[model];
  const settingUp = busy && (status.state === "downloading" || status.state === "starting");
  const p = settingUp && status.state === "downloading" ? status.loaded / Math.max(1, status.total) : (progress ?? null);
  return (
    <div className={clsx("grid transition-[grid-template-rows,opacity] duration-300 ease-out", busy ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")} aria-live="polite">
      <div className="overflow-hidden">
        <div className="rounded-2xl bg-paper p-4 ring-1 ring-line">
          <p className="flex items-center gap-2 text-sm font-bold">
            <FaSpinner aria-hidden className="animate-spin text-violet" />
            {settingUp ? "Getting the AI ready. This only happens the first time." : label}
            {p !== null && <span className="ml-auto tabular-nums text-ink-soft">{Math.round(p * 100)}%</span>}
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10">
            <div className={clsx("h-full rounded-full brand-gradient transition-[width] duration-300", p === null && "w-1/3 animate-pulse")} style={p !== null ? { width: `${Math.max(4, p * 100)}%` } : undefined} />
          </div>
        </div>
      </div>
    </div>
  );
}
