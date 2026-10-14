"use client";

import { useState } from "react";
import clsx from "clsx";
import { FaInstagram, FaYoutube, FaTiktok, FaLinkedin, FaPinterest } from "react-icons/fa6";

const frames = [
  { id: "1:1", label: "Post", icon: FaInstagram, w: 1, h: 1 },
  { id: "4:5", label: "Portrait", icon: FaInstagram, w: 4, h: 5 },
  { id: "9:16", label: "Story", icon: FaTiktok, w: 9, h: 16 },
  { id: "2:3", label: "Pin", icon: FaPinterest, w: 2, h: 3 },
  { id: "16:9", label: "Thumbnail", icon: FaYoutube, w: 16, h: 9 },
  { id: "1.91:1", label: "Link post", icon: FaLinkedin, w: 1.91, h: 1 },
];

/** One photo shown in every platform ratio. Landscape frames use the blurred "fit" fill. */
export function ResizeDemo({ compact = false }: { compact?: boolean }) {
  const [active, setActive] = useState(compact ? "4:5" : "9:16");
  const f = frames.find((x) => x.id === active)!;
  const landscape = f.w / f.h > 1;

  return (
    <div className={clsx("grid items-center gap-6", !compact && "gap-10 lg:grid-cols-[1fr_1.1fr]")}>
      <ul className={clsx("grid gap-3", compact ? "order-last grid-cols-3" : "grid-cols-2 sm:grid-cols-3")}>
        {frames.map((x) => {
          const on = x.id === active;
          const r = x.w / x.h;
          return (
            <li key={x.id}>
              <button
                type="button"
                onClick={() => setActive(x.id)}
                aria-pressed={on}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all",
                  on ? "bg-ink text-white shadow-pop" : "bg-white ring-1 ring-line hover:ring-ink/20",
                )}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center">
                  <span className={clsx("block rounded-[5px] border-2", on ? "border-white" : "border-ink")} style={{ width: r >= 1 ? 32 : 32 * r, height: r >= 1 ? 32 / r : 32 }} />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    <x.icon aria-hidden /> {x.label}
                  </span>
                  <span className={clsx("text-xs", on ? "text-white/60" : "text-ink-soft")}>{x.id}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div
        className={clsx(
          "grid place-items-center rounded-4xl bg-canvas bg-[radial-gradient(rgb(15_14_23/0.12)_1px,transparent_1.2px)] bg-size-[18px_18px] p-6",
          compact ? "h-[440px]" : "h-[520px]",
        )}
      >
        <div
          className="relative overflow-hidden rounded-xl shadow-float transition-[width,height] duration-500 ease-[cubic-bezier(.3,1.3,.5,1)]"
          style={landscape ? { width: "min(100%, 520px)", aspectRatio: `${f.w}/${f.h}` } : { height: "100%", aspectRatio: `${f.w}/${f.h}` }}
        >
          {landscape && (
            // eslint-disable-next-line @next/next/no-img-element
            <img decoding="async" src="/demo/resize-source.webp" alt="" className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl" />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            decoding="async"
            src="/demo/resize-source.webp"
            alt="Woman in a denim jacket against a blue wall, framed for the selected ratio"
            className={clsx("absolute inset-0 h-full w-full", landscape ? "object-contain" : "object-cover object-[50%_30%]")}
            loading="lazy"
          />
          <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white">
            {landscape ? "Fit with blur" : "Smart crop"} · {f.id}
          </span>
        </div>
      </div>
    </div>
  );
}
