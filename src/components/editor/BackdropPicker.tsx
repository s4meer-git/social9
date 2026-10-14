"use client";

import { useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { FaPlus, FaUpload } from "react-icons/fa6";
import { useEditor } from "@/editor/store";
import { gradients, gradientCss, solidColors } from "@/lib/image/compose";
import { gradientLibrary, photoBackdrops, type Tone } from "@/lib/backgrounds";
import { patterns, patternThumb } from "@/lib/patterns";
import { Swatch } from "@/components/ui/Field";

type Kind = "gradients" | "colors" | "patterns" | "photos";

const scenes = [
  { id: "mountains", name: "Mountains" },
  { id: "valley", name: "Valley" },
  { id: "lake", name: "Lake" },
];

const PAGE = 40;

/** The short list shown first: "g:" gradient, "c:" color, "p:" pattern, "i:" photo. */
const POPULAR = [
  "g:violet-pink", "g:sunset", "g:ocean", "g:studio",
  "g:peach", "g:night", "c:#ffffff", "c:#0f0e17",
  "p:mesh-candy", "p:mesh-ocean", "p:bokeh-gold", "p:confetti-party",
  "i:pfp/studio-1", "i:pfp/bokeh-1", "i:pfp/office-1", "i:mountains",
];
const popularLabel = (k: string) => {
  const id = k.slice(2);
  if (k.startsWith("g:")) return `${gradients.find((g) => g.id === id)?.name ?? "Gradient"} gradient`;
  if (k.startsWith("c:")) return id === "#ffffff" ? "White" : id === "#0f0e17" ? "Black" : `Color ${id}`;
  if (k.startsWith("p:")) return patterns.find((p) => p.id === id)?.name ?? "Pattern";
  return id.startsWith("pfp/") ? `${id.slice(4).replace(/-\d+$/, "")} photo` : id;
};

/**
 * Every background in one place: 385 gradients, colors, 30 patterns and 32 photos.
 * Used by Background › Replace and by the profile picture maker.
 */
export function BackdropPicker({ round = false }: { round?: boolean }) {
  const bg = useEditor((s) => s.frame.bg);
  const { setBg, loadBackdrop } = useEditor.getState();
  const [kind, setKind] = useState<Kind>(bg.mode === "pattern" ? "patterns" : bg.mode === "image" ? "photos" : bg.mode === "color" ? "colors" : "gradients");
  const [tone, setTone] = useState<Tone | "all">("all");
  const [shown, setShown] = useState(PAGE);
  const [browse, setBrowse] = useState(false);
  const upload = useRef<HTMLInputElement>(null);
  const shape = round ? "rounded-full" : "";

  const library = useMemo(() => gradientLibrary.map((g, i) => ({ ...g, id: `ui:${i}` })).filter((g) => tone === "all" || g.tone === tone), [tone]);

  const uploadInput = (
    <input
      ref={upload}
      type="file"
      accept="image/*"
      className="sr-only"
      aria-label="Choose a background photo"
      onChange={async (e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        await loadBackdrop("upload", f);
        setBg({ mode: "image", image: "upload" });
      }}
    />
  );

  const pickPhoto = async (id: string) => {
    await loadBackdrop(id);
    setBg({ mode: "image", image: id });
  };

  if (!browse) {
    // simple first: a short, good-looking set; the full library is one tap away
    const isOn = (k: string) =>
      (k.startsWith("g:") && bg.mode === "gradient" && bg.gradient === k.slice(2)) ||
      (k.startsWith("c:") && bg.mode === "color" && bg.color === k.slice(2)) ||
      (k.startsWith("p:") && bg.mode === "pattern" && bg.pattern === k.slice(2)) ||
      (k.startsWith("i:") && bg.mode === "image" && bg.image === k.slice(2));
    return (
      <div className="fade-up space-y-3">
        <div className="grid grid-cols-4 gap-2">
          {POPULAR.map((k) => {
            const [type, id] = [k.slice(0, 1), k.slice(2)];
            const pick = () => (type === "g" ? setBg({ mode: "gradient", gradient: id }) : type === "c" ? setBg({ mode: "color", color: id }) : type === "p" ? setBg({ mode: "pattern", pattern: id }) : pickPhoto(id));
            return (
              <Swatch key={k} label={popularLabel(k)} selected={isOn(k)} onClick={pick} className={clsx("overflow-hidden", shape)} style={type === "g" ? { background: gradientCss(id) } : type === "c" ? { background: id } : undefined}>
                {type === "p" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img decoding="async" src={patternThumb(id)} alt="" className="h-full w-full object-cover" />
                )}
                {type === "i" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img decoding="async" src={`/backdrops/${id}-thumb.webp`} alt="" className="h-full w-full object-cover" />
                )}
              </Swatch>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setBrowse(true)} className="flex-1 rounded-full bg-ink/5 py-2.5 text-sm font-bold hover:bg-ink/10">
            Browse all 450+
          </button>
          <button type="button" onClick={() => upload.current?.click()} className="flex items-center gap-2 rounded-full bg-ink/5 px-4 py-2.5 text-sm font-bold hover:bg-ink/10">
            <FaUpload aria-hidden className="text-xs" /> Yours
          </button>
        </div>
        {uploadInput}
      </div>
    );
  }

  return (
    <div className="fade-up space-y-3">
      <button type="button" onClick={() => setBrowse(false)} className="text-sm font-bold text-ink-soft hover:text-ink">
        ← Back to popular
      </button>
      <div role="tablist" aria-label="Background type" className="flex gap-1 rounded-full bg-ink/5 p-1">
        {(["gradients", "colors", "patterns", "photos"] as Kind[]).map((k) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={kind === k}
            onClick={() => setKind(k)}
            className={clsx("flex-1 rounded-full py-1.5 text-[13px] font-bold capitalize transition", kind === k ? "bg-white text-ink shadow-card" : "text-ink/60 hover:text-ink")}
          >
            {k}
          </button>
        ))}
      </div>

      {kind === "gradients" && (
        <>
          <div className="flex gap-1.5">
            {(["all", "bright", "pastel", "dark"] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tone === t}
                onClick={() => {
                  setTone(t);
                  setShown(PAGE);
                }}
                className={clsx("rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 transition", tone === t ? "bg-ink text-white ring-ink" : "text-ink/70 ring-line hover:ring-ink/30")}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {tone === "all" &&
              gradients.map((g) => (
                <Swatch key={g.id} label={`${g.name} gradient`} selected={bg.mode === "gradient" && bg.gradient === g.id} onClick={() => setBg({ mode: "gradient", gradient: g.id })} className={shape} style={{ background: gradientCss(g.id) }} />
              ))}
            {library.slice(0, shown).map((g, i) => (
              <Swatch key={`${tone}-${g.id}`} className={clsx("fade-up", shape)} style={{ background: gradientCss(g.id), "--i": i % PAGE } as React.CSSProperties} label={`${g.name} gradient`} selected={bg.mode === "gradient" && bg.gradient === g.id} onClick={() => setBg({ mode: "gradient", gradient: g.id })} />
            ))}
          </div>
          {shown < library.length && (
            <button type="button" onClick={() => setShown((n) => n + PAGE * 2)} className="w-full rounded-full bg-ink/5 py-2 text-sm font-bold text-ink/80 hover:bg-ink/10">
              Show more ({library.length - shown} left)
            </button>
          )}
        </>
      )}

      {kind === "colors" && (
        <div className="grid grid-cols-6 gap-2">
          {solidColors.map((c) => (
            <Swatch key={c} label={`Color ${c}`} selected={bg.mode === "color" && bg.color === c} onClick={() => setBg({ mode: "color", color: c })} className="rounded-full" style={{ background: c }} />
          ))}
          <label
            title="Any color"
            className="relative grid aspect-square cursor-pointer place-items-center overflow-hidden rounded-full bg-[conic-gradient(#ff4fa3,#ffc93c,#d4ff4f,#38bdf8,#6d4aff,#ff4fa3)] text-white ring-1 ring-black/10 transition-all hover:-translate-y-0.5 has-focus-visible:ring-2 has-focus-visible:ring-violet"
          >
            <input type="color" aria-label="Pick any color" value={bg.color} onChange={(e) => setBg({ mode: "color", color: e.target.value })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
            <FaPlus aria-hidden className="text-xs drop-shadow" />
          </label>
        </div>
      )}

      {kind === "patterns" && (
        <div className="grid grid-cols-5 gap-2">
          {patterns.map((p, i) => (
            <Swatch key={p.id} label={p.name} selected={bg.mode === "pattern" && bg.pattern === p.id} onClick={() => setBg({ mode: "pattern", pattern: p.id })} className={clsx("fade-up overflow-hidden", shape)} style={{ "--i": i } as React.CSSProperties}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img decoding="async" src={patternThumb(p.id)} alt="" className="h-full w-full object-cover" />
            </Swatch>
          ))}
        </div>
      )}

      {kind === "photos" && (
        <div className="grid grid-cols-4 gap-2">
          <Swatch label="Use your own photo" selected={bg.mode === "image" && bg.image === "upload"} onClick={() => upload.current?.click()} className={clsx("grid place-items-center border-2 border-dashed border-line bg-white text-ink-soft ring-0", shape)}>
            <FaUpload aria-hidden />
          </Swatch>
          {[...scenes.map((s) => ({ id: s.id, name: s.name, thumb: `/backdrops/${s.id}-thumb.webp` })), ...photoBackdrops.map((p) => ({ id: `pfp/${p.id}`, name: `${p.group} photo`, thumb: `/backdrops/pfp/${p.id}-thumb.webp` }))].map((p, i) => (
            <Swatch key={p.id} label={p.name} selected={bg.mode === "image" && bg.image === p.id} onClick={() => pickPhoto(p.id)} className={clsx("fade-up overflow-hidden", shape)} style={{ "--i": i } as React.CSSProperties}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img decoding="async" src={p.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
            </Swatch>
          ))}
          {uploadInput}
        </div>
      )}
    </div>
  );
}
