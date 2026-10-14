"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { FaEye, FaEyeSlash, FaPlus } from "react-icons/fa6";
import { useEditor, allFaces } from "@/editor/store";
import type { FacesTab } from "@/editor/tools";
import { headEllipse } from "@/lib/image/compose";
import { stickerOptions, MIX } from "@/lib/stickers";
import { eyewear, eyewearUrl } from "@/lib/eyewear";
import { Field, RangeInput, Swatch } from "@/components/ui/Field";
import { AiStatus } from "@/components/editor/AiStatus";
import { PanelTabs } from "@/components/editor/PanelTabs";
import { Swap } from "@/components/motion/Swap";

/** Face crops for the list, cached per face so slider drags never re-encode them. */
const thumbCache = new WeakMap<object, string>();
function faceThumb(bitmap: ImageBitmap, f: ReturnType<typeof allFaces>[number]) {
  let url = thumbCache.get(f);
  if (!url) {
    const e = headEllipse(f);
    const size = Math.max(e.rx, e.ry) * 2;
    const c = document.createElement("canvas");
    c.width = c.height = 96;
    c.getContext("2d")!.drawImage(bitmap, e.cx - size / 2, e.cy - size / 2, size, size, 0, 0, 96, 96);
    url = c.toDataURL("image/jpeg", 0.8);
    thumbCache.set(f, url);
  }
  return url;
}

const tabs: { value: FacesTab; label: string }[] = [
  { value: "blur", label: "Blur" },
  { value: "pixelate", label: "Pixels" },
  { value: "eyewear", label: "Eyewear" },
  { value: "sticker", label: "Stickers" },
];

export function FacesPanel() {
  const tab = useEditor((s) => s.facesTab);
  const fx = useEditor((s) => s.frame.fx);
  const detected = useEditor((s) => s.faces);
  const extra = useEditor((s) => s.frame.extraFaces);
  const pointer = useEditor((s) => s.pointer);
  // depends on the face list only: not the whole frame, which changes on every slider step
  const faces = useMemo(() => (detected ? [...detected, ...extra] : null), [detected, extra]);
  const source = useEditor((s) => s.source);
  const { setFacesTab, setFx, toggleFace, checkpoint } = useEditor.getState();
  const [allStickers, setAllStickers] = useState(false);
  const [allEyewear, setAllEyewear] = useState(false);

  // Small round crops of each face for the list, made once per face.
  const thumbs = useMemo(() => (faces && source ? faces.map((f) => faceThumb(source.bitmap, f)) : []), [faces, source]);

  const hiddenCount = faces ? faces.length - fx.kept.filter((k) => k < faces.length).length : 0;
  const noFaces = faces !== null && faces.length === 0;
  const adding = pointer === "addFace";

  return (
    <div className="space-y-6">
      <PanelTabs label="Face style" value={tab} onChange={setFacesTab} options={tabs} />

      <AiStatus tasks={["faces"]} />

      {faces && (
        <p className={clsx("text-sm font-semibold", noFaces ? "text-ink-soft" : "text-ink")}>
          {noFaces ? "No faces found. If there's one the AI missed, add it below." : `${faces.length} ${faces.length === 1 ? "face" : "faces"} found · ${hiddenCount} covered. Tap a face to keep it visible.`}
        </p>
      )}

      <Swap id={tab} className="space-y-6">
      {faces && (
        <button
          type="button"
          aria-pressed={adding}
          onClick={() => useEditor.getState().setPointer(adding ? "move" : "addFace")}
          className={clsx("flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold transition", adding ? "bg-ink text-white" : "bg-ink/5 hover:bg-ink/10")}
        >
          <FaPlus aria-hidden className="text-xs" /> {adding ? "Tap the face on your photo" : "Add a face the AI missed"}
        </button>
      )}
      {extra.length > 0 && <p className="-mt-3 text-xs text-ink-soft">{extra.length} added by you. Undo removes the last one.</p>}

      {(tab === "blur" || tab === "pixelate") && (
        <Field label="Strength" hint={`${Math.round(fx.strength * 100)}%`}>
          <RangeInput label="Strength" min={0} max={1} step={0.01} value={fx.strength} onPointerDown={checkpoint} onChange={(strength) => setFx({ strength }, false)} />
          {tab === "pixelate" && fx.strength < 0.4 && <p className="text-xs text-ink-soft">Light pixelation can sometimes be reversed. Use a higher strength for faces that must stay hidden.</p>}
        </Field>
      )}

      {tab === "eyewear" && (
        <>
          <Field label="Style">
            <div className="grid grid-cols-3 gap-2">
              {(allEyewear ? eyewear : eyewear.slice(0, 9)).map((e, i) => (
                <button
                  key={e.id}
                  style={i >= 9 ? ({ "--i": i - 9 } as React.CSSProperties) : undefined}
                  type="button"
                  aria-pressed={fx.eyewear === e.id}
                  onClick={() => setFx({ effect: "eyewear", eyewear: e.id })}
                  className={clsx("flex flex-col items-center gap-1 rounded-2xl bg-[linear-gradient(180deg,#f4f2f7,#e9e6f0)] px-1.5 pb-1.5 pt-2.5 ring-1 transition-all hover:-translate-y-0.5", fx.eyewear === e.id ? "ring-2 ring-violet ring-offset-2" : "ring-line", i >= 9 && "fade-up")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img decoding="async" src={eyewearUrl(e)} alt="" className="h-7 w-full object-contain" />
                  <span className="text-[11px] font-bold leading-tight">{e.name}</span>
                </button>
              ))}
            </div>
            {!allEyewear && (
              <button type="button" onClick={() => setAllEyewear(true)} className="w-full rounded-full bg-ink/5 py-2 text-sm font-bold hover:bg-ink/10">
                See all {eyewear.length} styles
              </button>
            )}
          </Field>
          <Field label="Size" hint={`${Math.round(fx.eyewearSize * 100)}%`}>
            <RangeInput label="Eyewear size" min={0.6} max={1.8} step={0.01} value={fx.eyewearSize} onPointerDown={checkpoint} onChange={(eyewearSize) => setFx({ eyewearSize }, false)} />
          </Field>
        </>
      )}

      {tab === "sticker" && (
        <>
          <Field label="Sticker">
            <div className="grid grid-cols-5 gap-2">
              <Swatch label="Mix (a different sticker on each face)" selected={fx.sticker === "mix"} onClick={() => setFx({ effect: "sticker", sticker: "mix" })} className="grid grid-cols-2 gap-0.5 bg-paper p-1.5">
                {MIX.slice(0, 4).map((id) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img decoding="async" key={id} src={stickerOptions.find((s) => s.id === id)!.url} alt="" className="h-full w-full" />
                ))}
              </Swatch>
              {(allStickers ? stickerOptions : stickerOptions.slice(0, 14)).map((s, i) => (
                <Swatch key={s.id} label={s.name} selected={fx.sticker === s.id} onClick={() => setFx({ effect: "sticker", sticker: s.id })} className={clsx("bg-paper p-1", i >= 14 && "fade-up")} style={i >= 14 ? ({ "--i": i - 14 } as React.CSSProperties) : undefined}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img decoding="async" src={s.url} alt="" loading="lazy" className="h-full w-full object-contain" />
                </Swatch>
              ))}
            </div>
            {!allStickers && (
              <button type="button" onClick={() => setAllStickers(true)} className="w-full rounded-full bg-ink/5 py-2 text-sm font-bold hover:bg-ink/10">
                See all {stickerOptions.length} stickers
              </button>
            )}
          </Field>
          <Field label="Sticker size" hint={`${Math.round(fx.stickerSize * 100)}%`}>
            <RangeInput label="Sticker size" min={0.5} max={2} step={0.01} value={fx.stickerSize} onPointerDown={checkpoint} onChange={(stickerSize) => setFx({ stickerSize }, false)} />
          </Field>
        </>
      )}
      </Swap>

      {faces && faces.length > 0 && (
        <Field
          label="Faces"
          hint={
            <span className="flex gap-3">
              <button className="font-semibold text-ink hover:underline" onClick={() => setFx({ kept: [] })}>
                Cover all
              </button>
              <button className="font-semibold text-ink hover:underline" onClick={() => setFx({ kept: faces.map((_, i) => i) })}>
                Show all
              </button>
            </span>
          }
        >
          <ul className="grid grid-cols-5 gap-2">
            {faces.map((_, i) => {
              const visible = fx.kept.includes(i);
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => toggleFace(i)}
                    aria-pressed={!visible}
                    aria-label={`Face ${i + 1}, ${visible ? "visible" : "covered"}`}
                    className={clsx("relative block aspect-square w-full overflow-hidden rounded-full ring-2 transition", visible ? "ring-line" : "ring-pink")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img decoding="async" src={thumbs[i]} alt="" className={clsx("h-full w-full object-cover", !visible && "opacity-60 blur-[2px]")} />
                    <span className={clsx("absolute bottom-0.5 right-0.5 grid h-5 w-5 place-items-center rounded-full text-[10px]", visible ? "bg-white text-ink" : "bg-pink text-white")}>
                      {visible ? <FaEye aria-hidden /> : <FaEyeSlash aria-hidden />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Field>
      )}
    </div>
  );
}
