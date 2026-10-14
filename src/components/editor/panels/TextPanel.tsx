"use client";

import clsx from "clsx";
import { FaPlus, FaTrash } from "react-icons/fa6";
import { useEditor } from "@/editor/store";
import { TEXT_COLORS, TEXT_FONTS, TEXT_STYLES, type TextItem } from "@/lib/image/text";
import { Field, RangeInput, Swatch } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { MoreOptions } from "@/components/ui/MoreOptions";

const fontClass: Record<TextItem["font"], string> = {
  display: "font-display font-black",
  sans: "font-sans font-bold",
  serif: "font-serif font-bold",
  mono: "font-mono font-bold",
};

export function TextPanel() {
  const texts = useEditor((s) => s.frame.texts);
  const textId = useEditor((s) => s.textId);
  const { addText, updateText, removeText, selectText, checkpoint } = useEditor.getState();
  const t = texts.find((x) => x.id === textId) ?? texts.at(-1);

  return (
    <div className="space-y-6">
      {texts.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {texts.map((x, i) => (
            <button
              key={x.id}
              type="button"
              aria-pressed={x.id === t?.id}
              onClick={() => selectText(x.id)}
              className={clsx("max-w-40 truncate rounded-full px-3.5 py-1.5 text-sm font-semibold transition", x.id === t?.id ? "bg-ink text-white" : "bg-ink/5 hover:bg-ink/10")}
            >
              {x.text.trim() || `Text ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {t ? (
        <>
          <Field label="Your text">
            <textarea
              aria-label="Your text"
              value={t.text}
              rows={2}
              onFocus={checkpoint}
              onChange={(e) => updateText(t.id, { text: e.target.value }, false)}
              className="w-full resize-none rounded-2xl bg-ink/5 px-4 py-3 text-[15px] font-semibold outline-none ring-violet focus:bg-white focus:ring-2"
            />
          </Field>

          <Field label="Style">
            <div className="grid grid-cols-5 gap-2">
              {TEXT_STYLES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  aria-pressed={t.style === st.id}
                  aria-label={st.name}
                  title={st.name}
                  onClick={() => updateText(t.id, { ...st.patch, style: st.id })}
                  className={clsx(
                    "grid aspect-square place-items-center rounded-2xl bg-[linear-gradient(135deg,#7c6cf0,#e46fae)] text-lg ring-1 ring-black/10 transition-all hover:-translate-y-0.5 active:scale-95",
                    t.style === st.id && "ring-2 ring-violet ring-offset-2",
                  )}
                >
                  <span
                    className={clsx(fontClass[st.patch.font ?? "display"], "rounded-md px-1.5 leading-tight", st.patch.uppercase && "uppercase")}
                    style={{
                      color: st.patch.color,
                      background: st.patch.box ?? undefined,
                      textShadow: st.patch.outline ? "0 0 2px #0f0e17, 0 0 2px #0f0e17" : st.patch.shadow ? "0 2px 6px rgb(0 0 0 / 0.4)" : undefined,
                    }}
                  >
                    Aa
                  </span>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Color">
            <div className="grid grid-cols-8 gap-2">
              {TEXT_COLORS.map((c) => (
                <Swatch key={c} label={`Text color ${c}`} selected={t.color === c} onClick={() => updateText(t.id, { color: c })} className="rounded-full" style={{ background: c }} />
              ))}
            </div>
          </Field>

          <Field label="Size" hint={`${Math.round(t.size * 100)}%`}>
            <RangeInput label="Text size" min={0.03} max={0.25} step={0.005} value={t.size} onPointerDown={checkpoint} onChange={(size) => updateText(t.id, { size }, false)} />
          </Field>

          <p className="text-[13px] text-ink-soft">Drag the text on your photo to move it.</p>

          <MoreOptions>
            <Field label="Font">
              <Segmented label="Font" value={t.font} onChange={(font) => updateText(t.id, { font })} options={TEXT_FONTS.map((f) => ({ value: f.id, label: f.name }))} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["outline", "Outline"],
                  ["shadow", "Shadow"],
                  ["uppercase", "Capitals"],
                ] as const
              ).map(([key, name]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={t[key]}
                  onClick={() => updateText(t.id, { [key]: !t[key] })}
                  className={clsx("rounded-full px-4 py-2 text-sm font-bold ring-1 transition", t[key] ? "bg-ink text-white ring-ink" : "ring-line hover:ring-ink/30")}
                >
                  {name}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={!!t.box}
                onClick={() => updateText(t.id, { box: t.box ? null : "rgba(15,14,23,0.78)" })}
                className={clsx("rounded-full px-4 py-2 text-sm font-bold ring-1 transition", t.box ? "bg-ink text-white ring-ink" : "ring-line hover:ring-ink/30")}
              >
                Background box
              </button>
            </div>
            <button type="button" onClick={() => removeText(t.id)} className="flex items-center gap-2 text-sm font-bold text-pink-deep hover:underline">
              <FaTrash aria-hidden className="text-xs" /> Delete this text
            </button>
          </MoreOptions>
        </>
      ) : (
        <p className="text-[15px] text-ink-soft">Add a caption to your photo.</p>
      )}

      <button type="button" onClick={addText} className="flex w-full items-center justify-center gap-2 rounded-full bg-ink/5 py-2.5 text-sm font-bold hover:bg-ink/10">
        <FaPlus aria-hidden className="text-xs" /> Add {texts.length ? "another" : "a"} text
      </button>
    </div>
  );
}
