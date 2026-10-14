"use client";

import clsx from "clsx";
import { FaBolt, FaGem, FaPaintbrush, FaEraser, FaRotateLeft, FaArrowPointer } from "react-icons/fa6";
import { useEditor } from "@/editor/store";
import type { BgTab } from "@/editor/tools";
import type { BlurType } from "@/lib/image/compose";
import { Field, RangeInput } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { AiStatus } from "@/components/editor/AiStatus";
import { BackdropPicker } from "@/components/editor/BackdropPicker";
import { PanelTabs } from "@/components/editor/PanelTabs";
import { MoreOptions } from "@/components/ui/MoreOptions";
import { Swap } from "@/components/motion/Swap";

const blurTypes: { id: BlurType; name: string; hint: string; art: string }[] = [
  { id: "gaussian", name: "Soft", hint: "An even blur everywhere", art: "radial-gradient(circle at 50% 45%, #c7d2fe, #a5b4fc 40%, #818cf8)" },
  { id: "lens", name: "Lens", hint: "A soft glow, like a camera lens", art: "radial-gradient(circle at 30% 30%, #fde68a 0 12%, transparent 13%), radial-gradient(circle at 70% 60%, #fbcfe8 0 14%, transparent 15%), linear-gradient(135deg, #1e1b4b, #4c1d95)" },
  { id: "radial", name: "Radial", hint: "A sharp center with soft edges", art: "radial-gradient(circle, #f5f3ff 0 25%, #a78bfa 70%)" },
  { id: "motion", name: "Motion", hint: "Streaks in one direction", art: "repeating-linear-gradient(90deg, #bae6fd 0 6px, #7dd3fc 6px 9px, #e0f2fe 9px 14px)" },
  { id: "zoom", name: "Zoom", hint: "Streaks out from the center", art: "repeating-conic-gradient(from 0deg, #fecdd3 0 6deg, #fda4af 6deg 12deg)" },
  { id: "tilt", name: "Tilt-shift", hint: "A sharp band that looks like a miniature", art: "linear-gradient(180deg, #a7f3d0, #ecfdf5 40% 60%, #a7f3d0)" },
];

const tabs: { value: BgTab; label: string }[] = [
  { value: "remove", label: "Remove" },
  { value: "replace", label: "Replace" },
  { value: "blur", label: "Blur" },
];

export function BackgroundPanel() {
  const tab = useEditor((s) => s.bgTab);
  const bg = useEditor((s) => s.frame.bg);
  const mask = useEditor((s) => s.mask);
  const maskQuality = useEditor((s) => s.maskQuality);
  const busy = useEditor((s) => s.busy.mask);
  const maskSource = useEditor((s) => s.maskSource);
  const maskEmpty = useEditor((s) => s.maskEmpty);
  const subject = useEditor((s) => s.subject);
  const maskKind = useEditor((s) => s.maskKind);
  const { setBgTab, ensureMask, setBg, checkpoint, setSubject } = useEditor.getState();

  return (
    <div className="space-y-6">
      <PanelTabs label="Background" value={tab} onChange={setBgTab} options={tabs} />

      <AiStatus tasks={["mask"]} doneLabel={maskQuality === "hd" ? "HD cut-out ready" : "Cut-out ready"} />

      {maskSource === "alpha" && subject === "auto" && <p className="text-sm text-ink-soft">This photo already has a transparent background, so we kept it as it is.</p>}

      {maskEmpty && !busy && (
        <p role="status" className="rounded-2xl bg-ink/5 p-3.5 text-sm text-ink-soft">
          <span className="font-bold text-ink">No clear subject found.</span> {maskKind === "person" ? "Try Object under More options," : "Try Person under More options,"} or use the brush below to paint over what you want to keep.
        </p>
      )}

      <Swap id={tab} className="space-y-6">
      {tab === "remove" && maskSource !== "alpha" && (
        <Field label="Cut-out quality">
          <Segmented
            label="Cut-out quality"
            value={maskQuality ?? "fast"}
            onChange={(q) => ensureMask(q)}
            options={[
              { value: "fast", label: <><FaBolt aria-hidden /> Fast</>, disabled: busy },
              { value: "hd", label: <><FaGem aria-hidden /> HD</>, disabled: busy },
            ]}
          />
          <p className="text-xs text-ink-soft">HD looks at your photo in more detail, for finer hair and cleaner edges.</p>
        </Field>
      )}

      {tab === "replace" && (
        <Field label="New background">
          <BackdropPicker />
        </Field>
      )}

      {tab === "blur" && (
        <>
          <Field label="Blur style">
            <div className="grid grid-cols-3 gap-2">
              {blurTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={bg.blurType === t.id}
                  title={t.hint}
                  onClick={() => setBg({ mode: "blur", blurType: t.id })}
                  className={clsx("overflow-hidden rounded-2xl text-left ring-1 transition-all hover:-translate-y-0.5", bg.blurType === t.id ? "ring-2 ring-violet ring-offset-2" : "ring-line")}
                >
                  <span className="block h-11 blur-[1.5px]" style={{ background: t.art }} />
                  <span className="block bg-white px-2 py-1.5 text-xs font-bold">{t.name}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-soft">{blurTypes.find((t) => t.id === bg.blurType)?.hint}</p>
          </Field>
          <Field label="Amount" hint={`${Math.round(bg.blur * 100)}%`}>
            <RangeInput label="Blur amount" min={0} max={1} step={0.01} value={bg.blur} onPointerDown={checkpoint} onChange={(blur) => setBg({ blur, mode: "blur" }, false)} />
          </Field>
          {bg.blurType === "motion" && (
            <Field label="Direction" hint={`${Math.round(bg.blurAngle)}°`}>
              <RangeInput label="Motion direction" min={0} max={180} step={1} value={bg.blurAngle} onPointerDown={checkpoint} onChange={(blurAngle) => setBg({ blurAngle }, false)} />
            </Field>
          )}
          {bg.blurType === "tilt" && (
            <Field label="Sharp band position" hint={`${Math.round(bg.focus * 100)}%`}>
              <RangeInput label="Sharp band position" min={0} max={1} step={0.01} value={bg.focus} onPointerDown={checkpoint} onChange={(focus) => setBg({ focus }, false)} />
            </Field>
          )}
        </>
      )}
      </Swap>

      {mask && <RefineBrush />}

      <MoreOptions>
        <Field label="What's in your photo">
          <Segmented
            size="sm"
            label="What's in your photo"
            value={subject}
            onChange={(v) => setSubject(v)}
            options={[
              { value: "auto", label: "Auto", disabled: busy },
              { value: "person", label: "Person", disabled: busy },
              { value: "object", label: "Object", disabled: busy },
            ]}
          />
          <p className="text-xs text-ink-soft">Auto uses the people model when it finds a face. For products, pets and other things, it uses the object model.</p>
        </Field>
      </MoreOptions>
    </div>
  );
}

/** Brush to fix the cut-out: paint parts back in (Keep) or take them out (Erase). */
function RefineBrush() {
  const pointer = useEditor((s) => s.pointer);
  const brush = useEditor((s) => s.brush);
  const strokes = useEditor((s) => s.frame.strokes.length);
  const { setPointer, setBrush, clearStrokes, updateFrame } = useEditor.getState();
  const on = pointer === "brush";

  return (
    <div className="rounded-3xl bg-paper p-4 ring-1 ring-line">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-[17px] font-black tracking-[-0.01em]">Fix the edges</p>
          <p className="text-[13px] leading-snug text-ink-soft">If the cut-out missed something or kept too much, paint over it.</p>
        </div>
        <button
          type="button"
          aria-pressed={on}
          onClick={() => setPointer(on ? "move" : "brush")}
          className={clsx("flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold transition", on ? "bg-ink text-white" : "bg-white ring-1 ring-line hover:ring-ink/30")}
        >
          {on ? <FaArrowPointer aria-hidden /> : <FaPaintbrush aria-hidden />}
          {on ? "Done" : "Brush"}
        </button>
      </div>
      {on && (
        <div className="mt-4 space-y-4">
          <Segmented
            label="Brush"
            value={brush.mode}
            onChange={(mode) => setBrush({ mode })}
            options={[
              { value: "keep", label: <><FaPaintbrush aria-hidden className="text-emerald-600" /> Keep</> },
              { value: "erase", label: <><FaEraser aria-hidden className="text-pink-deep" /> Erase</> },
            ]}
          />
          <Field label="Brush size" hint={`${brush.size}px`}>
            <RangeInput label="Brush size" min={6} max={160} step={1} value={brush.size} onChange={(size) => setBrush({ size })} />
          </Field>
          <p className="text-xs leading-relaxed text-ink-soft">
            <span className="font-bold text-emerald-700">Keep</span> brings back parts that were cut away. <span className="font-bold text-pink-deep">Erase</span> removes leftovers. Zoom in for fine detail.
          </p>
        </div>
      )}
      {strokes > 0 && (
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => updateFrame({ strokes: useEditor.getState().frame.strokes.slice(0, -1) })} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white py-2 text-sm font-semibold ring-1 ring-line hover:ring-ink/30">
            <FaRotateLeft aria-hidden className="text-xs" /> Undo stroke
          </button>
          <button type="button" onClick={clearStrokes} className="flex-1 rounded-full bg-white py-2 text-sm font-semibold ring-1 ring-line hover:ring-ink/30">
            Reset {strokes} {strokes === 1 ? "fix" : "fixes"}
          </button>
        </div>
      )}
    </div>
  );
}
