"use client";

import clsx from "clsx";
import { FaCircle, FaSquare, FaCrosshairs, FaArrowRightFromBracket } from "react-icons/fa6";
import { useEditor, profilePresets } from "@/editor/store";
import { Field, RangeInput, Swatch } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { MoreOptions } from "@/components/ui/MoreOptions";
import { AiStatus } from "@/components/editor/AiStatus";
import { BackdropPicker } from "@/components/editor/BackdropPicker";

export const rings = [
  { id: "none", label: "No ring" },
  { id: "holo", label: "Rainbow ring" },
  { id: "#6d4aff", label: "Violet ring" },
  { id: "#ff4fa3", label: "Pink ring" },
  { id: "#22c55e", label: "Green ring (open to work)" },
  { id: "#0a66c2", label: "Blue ring" },
  { id: "#d4ff4f", label: "Lime ring" },
  { id: "#ffc93c", label: "Gold ring" },
  { id: "#ffffff", label: "White ring" },
  { id: "#0f0e17", label: "Black ring" },
];

/** Platform buttons for profile sizes (one per platform). */
export const pfpPlatforms = profilePresets.filter((p, i, a) => a.findIndex((x) => x.platform.id === p.platform.id) === i);

export function PfpPanel({ compact = false }: { compact?: boolean }) {
  const frame = useEditor((s) => s.frame);
  const faces = useEditor((s) => s.faces);
  const { setPfp, applyPreset, autoFrameFace, updateFrame, checkpoint, leaveProfile } = useEditor.getState();
  const { pfp } = frame;

  return (
    <div className="space-y-6">
      <AiStatus tasks={["mask", "faces"]} />

      <Field label="Platform">
        <div className="grid grid-cols-4 gap-2">
          {pfpPlatforms.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              aria-pressed={frame.presetId === preset.id}
              title={`${preset.platform.name} · ${preset.width}×${preset.height}`}
              className={clsx(
                "flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-bold ring-1 transition-all",
                frame.presetId === preset.id ? "bg-ink text-white ring-ink" : "bg-white ring-line hover:ring-ink/25",
              )}
            >
              <preset.platform.icon aria-hidden className="text-lg" />
              <span className="max-w-full truncate px-1">{preset.platform.name}</span>
              <span className={clsx("text-[10px] font-medium", frame.presetId === preset.id ? "text-white/60" : "text-ink-soft")}>{preset.width}px</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Background">
        <BackdropPicker round />
      </Field>

      <Field label="Ring">
        <div className="grid grid-cols-5 gap-2">
          {rings.map((r) => (
            <Swatch key={r.id} label={r.label} selected={pfp.ring === r.id} onClick={() => setPfp({ ring: r.id })} className={clsx("rounded-full", r.id === "holo" && "holo", r.id === "none" && "bg-white")} style={r.id.startsWith("#") ? { background: r.id } : undefined}>
              {r.id === "none" ? <span className="absolute inset-[30%] rounded-full border-2 border-ink/20" /> : <span className="absolute inset-[22%] rounded-full bg-white" />}
            </Swatch>
          ))}
        </div>
      </Field>

      <Field label="Face size" hint={`${frame.zoom.toFixed(1)}x`}>
        <RangeInput label="Face size" min={1} max={6} step={0.05} value={frame.zoom} onPointerDown={checkpoint} onChange={(zoom) => updateFrame({ zoom }, false)} />
      </Field>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            checkpoint();
            autoFrameFace();
          }}
          disabled={!faces?.length}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink/5 py-2.5 text-sm font-semibold hover:bg-ink/10 disabled:opacity-40"
        >
          <FaCrosshairs aria-hidden /> Re-center
        </button>
        {!compact && (
          <button type="button" onClick={leaveProfile} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink/5 py-2.5 text-sm font-semibold hover:bg-ink/10">
            <FaArrowRightFromBracket aria-hidden /> Leave profile mode
          </button>
        )}
      </div>
      {faces && faces.length === 0 && <p className="text-xs text-ink-soft">No face found. Drag the photo to position it yourself.</p>}

      <MoreOptions>
      <Field label="Shape">
          <Segmented
            label="Shape"
            value={pfp.shape}
            onChange={(shape) => setPfp({ shape })}
            options={[
              { value: "circle", label: <><FaCircle aria-hidden /> Circle</> },
              { value: "square", label: <><FaSquare aria-hidden /> Square</> },
            ]}
          />
        </Field>
      </MoreOptions>
    </div>
  );
}
