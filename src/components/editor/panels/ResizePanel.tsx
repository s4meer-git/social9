"use client";

import { useState } from "react";
import clsx from "clsx";
import { FaCrop, FaExpand, FaDroplet, FaPalette, FaHandPointer, FaChessBoard, FaUserTie } from "react-icons/fa6";
import { useEditor, outputSize, profilePresets } from "@/editor/store";
import { platforms } from "@/lib/platforms";
import { ratioLabel } from "@social9/core/image/geometry";
import { solidColors } from "@/lib/image/compose";
import { Field, RangeInput, Swatch } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { MoreOptions } from "@/components/ui/MoreOptions";
import { RatioShape } from "@/components/ui/RatioShape";

/** ⑤ Frame: platform sizes, custom size, and how the photo fills the frame. */
export function ResizePanel() {
  const frame = useEditor((s) => s.frame);
  const source = useEditor((s) => s.source);
  const platformId = useEditor((s) => s.platformId);
  const { setPlatform, applyPreset, updateFrame, checkpoint, leaveProfile } = useEditor.getState();
  const platform = platforms.find((p) => p.id === platformId) ?? platforms[0];
  const out = outputSize(frame, source);
  const profile = frame.pfp.enabled;

  return (
    <div className="space-y-6">
      {profile && (
        <div className="rounded-3xl bg-violet-soft p-4">
          <p className="flex items-center gap-2 font-bold text-violet-deep">
            <FaUserTie aria-hidden /> Profile picture mode is on
          </p>
          <p className="mt-1 text-[13px] text-ink-soft">Profile pictures only use square sizes. To choose another size, leave profile mode.</p>
          <button type="button" onClick={leaveProfile} className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-bold ring-1 ring-line hover:ring-ink/30">
            Leave profile mode
          </button>
        </div>
      )}

      <Field label="Platform">
        <div className="grid grid-cols-8 gap-1">
          {platforms.map((p) => {
            const active = p.id === platformId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatform(p.id)}
                aria-pressed={active}
                aria-label={p.name}
                title={p.name}
                className={clsx("grid aspect-square place-items-center rounded-xl text-lg transition-all", active ? "bg-ink text-white" : "text-ink/70 hover:bg-ink/5 hover:text-ink")}
              >
                <p.icon aria-hidden />
              </button>
            );
          })}
        </div>
      </Field>

      <Field label={`${platform.name} sizes`}>
        <div className="grid grid-cols-2 gap-2">
          {(profile ? profilePresets.filter((p) => p.platform.id === platform.id) : platform.presets).map((p) => (
            <PresetButton key={p.id} active={frame.presetId === p.id} onClick={() => applyPreset(p.id)} name={p.name} width={p.width} height={p.height} />
          ))}
          {!profile && <PresetButton active={frame.presetId === null && frame.width === null} onClick={() => applyPreset(null)} name="Original" width={source?.width ?? 1} height={source?.height ?? 1} />}
        </div>
        <p className="text-xs text-ink-soft">{platform.tip}</p>
      </Field>

      {!profile && (
        <Field label="How to fit">
          <Segmented
            label="How to fit"
            value={frame.mode}
            onChange={(mode) => updateFrame({ mode, zoom: 1, focusX: 0.5, focusY: 0.5 })}
            options={[
              { value: "crop", label: <><FaCrop aria-hidden /> Fill frame</> },
              { value: "fit", label: <><FaExpand aria-hidden /> Whole photo</> },
            ]}
          />
        </Field>
      )}

      {frame.mode === "crop" ? (
        <Field label="Zoom" hint={`${frame.zoom.toFixed(1)}x`}>
          <RangeInput label="Zoom" min={1} max={profile ? 6 : 4} step={0.05} value={frame.zoom} onPointerDown={checkpoint} onChange={(zoom) => updateFrame({ zoom }, false)} />
        </Field>
      ) : (
        <>
          <Field label="Photo size" hint={`${Math.round(frame.zoom * 100)}%`}>
            <RangeInput label="Photo size" min={0.3} max={1} step={0.01} value={frame.zoom} onPointerDown={checkpoint} onChange={(zoom) => updateFrame({ zoom }, false)} />
          </Field>
          <Field label="Fill the empty space">
            <Segmented
              label="Fill the empty space"
              value={frame.fill}
              onChange={(fill) => updateFrame({ fill })}
              options={[
                { value: "blur", label: <><FaDroplet aria-hidden /> Blurred</> },
                { value: "color", label: <><FaPalette aria-hidden /> Color</> },
                { value: "transparent", label: <><FaChessBoard aria-hidden /> Transparent</> },
              ]}
            />
            {frame.fill === "color" && (
              <div className="grid grid-cols-6 gap-2 pt-1">
                {solidColors.map((c) => (
                  <Swatch key={c} label={`Fill color ${c}`} selected={frame.fillColor === c} onClick={() => updateFrame({ fillColor: c })} className="rounded-full" style={{ background: c }} />
                ))}
              </div>
            )}
            {frame.fill === "transparent" && <p className="text-xs text-ink-soft">The empty space stays transparent, so your photo is saved as PNG or WebP.</p>}
          </Field>
        </>
      )}

      <p className="flex items-center gap-2.5 text-sm font-medium text-ink-soft">
        <FaHandPointer aria-hidden className="shrink-0 text-ink" />
        {frame.mode === "crop" ? "Drag the photo to choose what stays in frame." : "Drag the photo to place it anywhere in the frame."}
      </p>

      {!profile && (
        <MoreOptions label="Custom size">
          <CustomSize key={`${out.width}x${out.height}`} width={out.width} height={out.height} />
        </MoreOptions>
      )}
    </div>
  );
}

function PresetButton({ active, onClick, name, width, height }: { active: boolean; onClick: () => void; name: string; width: number; height: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx("flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left ring-1 transition-all", active ? "bg-ink text-white ring-ink" : "bg-white ring-line hover:ring-ink/25")}
    >
      <RatioShape width={width} height={height} max={20} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{name}</span>
        <span className={clsx("block text-xs", active ? "text-white/60" : "text-ink-soft")}>
          {ratioLabel(width, height)} · {width}×{height}
        </span>
      </span>
    </button>
  );
}

/** Custom W×H inputs. Keyed by the current size so it resets when a preset is picked. */
function CustomSize({ width, height }: { width: number; height: number }) {
  const [w, setW] = useState(String(width || ""));
  const [h, setH] = useState(String(height || ""));
  const apply = () => {
    const nw = Math.round(Number(w));
    const nh = Math.round(Number(h));
    if (nw >= 16 && nh >= 16 && nw <= 8000 && nh <= 8000 && (nw !== width || nh !== height)) {
      useEditor.getState().updateFrame({ presetId: null, width: nw, height: nh, focusX: 0.5, focusY: 0.5, zoom: 1 });
    }
  };
  const input = "w-full min-w-0 rounded-xl bg-ink/5 px-3 py-2.5 text-sm font-semibold outline-none ring-violet focus:bg-white focus:ring-2";
  return (
    <Field label="Custom size" hint="pixels">
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
        // apply when you leave the pair, not when you move from width to height
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) apply();
        }}
      >
        <input aria-label="Width" inputMode="numeric" value={w} onChange={(e) => setW(e.target.value)} className={input} />
        <span className="text-ink-soft">×</span>
        <input aria-label="Height" inputMode="numeric" value={h} onChange={(e) => setH(e.target.value)} className={input} />
      </form>
    </Field>
  );
}
