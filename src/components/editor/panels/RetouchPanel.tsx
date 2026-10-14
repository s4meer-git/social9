"use client";

import { FaExpand } from "react-icons/fa6";
import { useEditor } from "@/editor/store";
import type { RetouchTab } from "@/editor/tools";
import { upscalePlan, UPSCALE_MAX_SIDE } from "@social9/core/ml/upscale";
import { Field, RangeInput } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/Button";
import { PanelTabs } from "@/components/editor/PanelTabs";
import { WorkStatus } from "@/components/editor/WorkStatus";
import { Swap } from "@/components/motion/Swap";
import { useState } from "react";

const tabs: { value: RetouchTab; label: string }[] = [
  { value: "erase", label: "Erase" },
  { value: "upscale", label: "Upscale" },
];

export function RetouchPanel() {
  const tab = useEditor((s) => s.retouchTab);
  const { setRetouchTab } = useEditor.getState();
  return (
    <div className="space-y-6">
      <PanelTabs label="Retouch" value={tab} onChange={setRetouchTab} options={tabs} />
      <Swap id={tab}>{tab === "erase" ? <Erase /> : <Upscale />}</Swap>
    </div>
  );
}

function Erase() {
  const brush = useEditor((s) => s.brush);
  const busy = useEditor((s) => s.busy.retouch);
  const pointer = useEditor((s) => s.pointer);
  const { setBrush, setPointer } = useEditor.getState();
  return (
    <div className="space-y-5">
      <p className="text-[15px] leading-relaxed text-ink-soft">Brush over anything you want to remove. It disappears when you lift your finger or mouse.</p>
      {pointer !== "erase" && (
        <Button variant="secondary" size="sm" onClick={() => setPointer("erase")}>
          Start brushing
        </Button>
      )}
      <Field label="Brush size" hint={`${brush.size}px`}>
        <RangeInput label="Brush size" min={10} max={200} step={1} value={brush.size} onChange={(size) => setBrush({ size })} />
      </Field>
      <WorkStatus busy={busy} label="Removing it" model="inpaint" />
      <p className="text-[13px] leading-relaxed text-ink-soft">Cover the whole object, including its shadow. If you don&apos;t like the result, press Undo.</p>
    </div>
  );
}

function Upscale() {
  const source = useEditor((s) => s.source);
  const busy = useEditor((s) => s.busy.retouch);
  const progress = useEditor((s) => s.retouchProgress);
  const [factor, setFactor] = useState<"2" | "4">("2");
  if (!source) return null;
  const big = Math.max(source.width, source.height) >= UPSCALE_MAX_SIDE;
  const plan = upscalePlan(source.width, source.height, Number(factor));
  const two = upscalePlan(source.width, source.height, 2);
  const four = upscalePlan(source.width, source.height, 4);

  return (
    <div className="space-y-5">
      <p className="text-[15px] leading-relaxed text-ink-soft">Make your photo bigger and sharper. This works best on small or blurry photos.</p>
      <p className="text-sm font-semibold">
        Now: {source.width} × {source.height} pixels
      </p>
      {big ? (
        <p className="rounded-2xl bg-paper p-4 text-sm text-ink-soft ring-1 ring-line">This photo is already large, so it can&apos;t be made any bigger here.</p>
      ) : (
        <>
          <Segmented
            label="How much bigger"
            value={factor}
            onChange={setFactor}
            options={[
              { value: "2", label: `2× · ${two.width} × ${two.height}` },
              { value: "4", label: `4× · ${four.width} × ${four.height}`, disabled: four.width === two.width },
            ]}
          />
          {plan.limited && (
            <p className="text-xs text-ink-soft">
              On this device, the largest size is {plan.width} × {plan.height} pixels.
            </p>
          )}
          <Button variant="brand" size="sm" disabled={busy} onClick={() => useEditor.getState().upscalePhoto(Number(factor))} icon={<FaExpand aria-hidden />}>
            Upscale photo
          </Button>
        </>
      )}
      <WorkStatus busy={busy} label="Making it sharper" model="upscale" progress={progress} />
    </div>
  );
}
