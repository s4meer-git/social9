"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { FaArrowRight } from "react-icons/fa6";
import { categories, liveTools } from "@/lib/tools";

/** The scene each tool shows in the preview panel. `before` wipes into `img` when the tool is shown. */
const scenes: Record<string, { img: string; before?: string; checker?: boolean; round?: boolean; chip?: string }> = {
  "remove-bg": { img: "/demo/cutout-after.webp", before: "/demo/cutout-before.webp", checker: true },
  "change-bg": { img: "/demo/swap-after.webp", before: "/demo/swap-before.webp" },
  "blur-bg": { img: "/demo/blurbg-after.webp", before: "/demo/blurbg-before.webp" },
  pfp: { img: "/demo/pfp-1.webp", round: true },
  resize: { img: "/demo/resize-source.webp", chip: "Instagram · 1080 × 1350" },
  fit: { img: "/demo/fit-demo.webp" },
  "blur-faces": { img: "/demo/group-blur.webp", before: "/demo/group-before.webp" },
  "face-stickers": { img: "/demo/group-stickers.webp", before: "/demo/group-before.webp" },
  "remove-exif": { img: "/demo/moment-pets.webp", chip: "Location removed" },
  convert: { img: "/demo/moment-diwali.webp", chip: "HEIC → JPG" },
  compress: { img: "/demo/moment-holi.webp", chip: "4.2 MB → 380 KB" },
  "object-remover": { img: "/demo/erase-after.webp", before: "/demo/erase-before.webp" },
  upscale: { img: "/demo/upscale-after.webp", before: "/demo/upscale-before.webp" },
  text: { img: "/demo/text-after.webp", before: "/demo/text-before.webp" },
  grid: { img: "/backdrops/mountains.jpg", chip: "9 posts · 3 × 3" },
};

const STEP = 2800;
// Same grouping as everywhere else, in four columns.
const columns = [["background", "enhance"], ["profile", "create"], ["privacy", "resize"], ["utility"]] as const;
const groups = columns.flat().map((c) => ({ cat: categories[c], items: liveTools.filter((t) => t.category === c) }));
// Carousel order: list order, but it opens on "Change background" and saves "Remove background" for last.
const listed = groups.flatMap((g) => g.items);
const order = [...listed.filter((t) => t.id !== "remove-bg"), ...listed.filter((t) => t.id === "remove-bg")];

/**
 * Tools mega menu. The panel on the right cycles through every tool like a story carousel;
 * hovering (or focusing) a tool jumps the panel to that tool's scene and pauses the cycle.
 */
export function ToolsMenu({ onNavigate }: { onNavigate: () => void }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [auto, setAuto] = useState(0);

  useEffect(() => {
    if (hovered) return;
    const id = setInterval(() => setAuto((i) => (i + 1) % order.length), STEP);
    return () => clearInterval(id);
  }, [hovered]);

  const activeId = hovered ?? order[auto].id;
  const active = order.find((t) => t.id === activeId)!;
  const activeCat = categories[active.category];

  return (
    <div className="grid grid-cols-[repeat(4,minmax(0,1fr))_280px] gap-5">
      {columns.map((col) => (
        <div key={col.join("-")} className="space-y-6">
          {col.map((c) => {
            const { cat, items } = groups.find((g) => g.cat.id === c)!;
            return (
              <div key={c}>
                <p className="px-2 text-[13px] font-bold uppercase tracking-wider text-ink-soft">{cat.name}</p>
                <ul className="mt-2 space-y-0.5">
                  {items.map((t) => {
                    const on = t.id === activeId;
                    return (
                      <li key={t.id}>
                        <Link
                          href={`/${t.slug}`}
                          onClick={onNavigate}
                          onMouseEnter={() => setHovered(t.id)}
                          onMouseLeave={() => {
                            setHovered(null);
                            setAuto(order.findIndex((o) => o.id === t.id));
                          }}
                          onFocus={() => setHovered(t.id)}
                          onBlur={() => setHovered(null)}
                          className={clsx("group flex items-start gap-3 rounded-2xl p-2 transition-colors duration-300", on ? (hovered ? "bg-paper" : "bg-paper/70") : "hover:bg-paper")}
                        >
                          <span
                            className={clsx(
                              "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-transform duration-300",
                              on && "-rotate-6 scale-110",
                              cat.soft,
                              cat.text,
                            )}
                          >
                            <t.icon aria-hidden />
                          </span>
                          <span>
                            <span className="block text-[15px] font-bold">{t.name}</span>
                            <span className="block text-[13px] leading-snug text-ink-soft">{t.blurb}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      ))}

      {/* preview: a story-style carousel of every tool */}
      <Link href={`/${active.slug}`} onClick={onNavigate} className="group relative min-h-[380px] overflow-hidden rounded-3xl bg-ink text-white" aria-label={`Open ${active.name}`}>
        {order.map((t) => {
          const s = scenes[t.id];
          const on = t.id === activeId;
          return (
            <div key={t.id} aria-hidden className={clsx("absolute inset-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(.21,.47,.32,.98)]", on ? "scale-100 opacity-100" : "scale-[1.06] opacity-0")}>
              {s.round ? (
                <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_35%,#3b2a7a,#0f0e17_70%)] pb-24">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img decoding="async" loading="lazy" src={s.img} alt="" className={clsx("h-44 w-44 rounded-full object-cover ring-4 ring-white/15 transition-transform duration-700", on ? "scale-100" : "scale-90")} />
                </div>
              ) : (
                <>
                  {s.before && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img decoding="async" loading="lazy" src={s.before} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  )}
                  {/* the "after" wipes in from the left: a sliding window (transforms, smooth in Safari) */}
                  <div
                    className="absolute inset-0 overflow-hidden transition-transform duration-[900ms] ease-[cubic-bezier(.65,0,.35,1)]"
                    style={{ transform: !s.before || on ? "translateX(0)" : "translateX(-100%)", transitionDelay: on ? "250ms" : "0ms" }}
                  >
                    <div
                      className={clsx("absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(.65,0,.35,1)]", s.checker && "checker")}
                      style={{ transform: !s.before || on ? "translateX(0)" : "translateX(100%)", transitionDelay: on ? "250ms" : "0ms" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img decoding="async" loading="lazy" src={s.img} alt="" className="h-full w-full object-cover" />
                    </div>
                  </div>
                  {s.chip && (
                    <span className="absolute left-1/2 top-[38%] -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-3.5 py-1.5 text-[13px] font-bold">{s.chip}</span>
                  )}
                </>
              )}
            </div>
          );
        })}

        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,rgb(15_14_23/0.92),rgb(15_14_23/0.6)_55%,transparent)] p-5 pt-16">
          <p className={clsx("text-[12px] font-bold uppercase tracking-wider", "text-white/60")}>{activeCat.name}</p>
          <p className="mt-1 font-display text-[24px] font-black leading-[1.05] tracking-[-0.02em]">{active.name}</p>
          <p className="mt-1.5 text-[14px] leading-snug text-white/75">{active.blurb}</p>
          <span className="mt-3 inline-flex items-center gap-2 text-[14px] font-bold">
            Open tool <FaArrowRight aria-hidden className="text-xs transition-transform group-hover:translate-x-1" />
          </span>
        </div>

        {/* story progress */}
        <div aria-hidden className="absolute inset-x-4 top-4 flex gap-1">
          {order.map((t, i) => {
            const idx = order.findIndex((o) => o.id === activeId);
            return (
              <span key={t.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
                <span
                  key={i === idx ? `on-${activeId}-${hovered ? "h" : auto}` : "off"}
                  className={clsx("block h-full rounded-full bg-white", i < idx ? "w-full" : i > idx ? "w-0" : hovered ? "w-full" : "w-0 animate-[story-fill_linear_forwards]")}
                  style={i === idx && !hovered ? { animationDuration: `${STEP}ms` } : undefined}
                />
              </span>
            );
          })}
        </div>
      </Link>
    </div>
  );
}
