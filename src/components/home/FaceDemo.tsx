"use client";

import { useState } from "react";
import clsx from "clsx";
import { FaDroplet, FaBorderAll, FaFaceSmile, FaEye } from "react-icons/fa6";
import { stickers, stickerUrl } from "@/lib/stickers";
import faces from "../../../public/demo/group-faces.json";

type Mode = "original" | "blur" | "pixel" | "stickers";

const modes: { id: Mode; label: string; icon: typeof FaDroplet }[] = [
  { id: "original", label: "Original", icon: FaEye },
  { id: "blur", label: "Blur", icon: FaDroplet },
  { id: "pixel", label: "Pixelate", icon: FaBorderAll },
  { id: "stickers", label: "Stickers", icon: FaFaceSmile },
];

const faceStickers = ["cool", "flower", "cat"];

/** Interactive group-photo demo: switch styles and tap a face to keep it visible. */
export function FaceDemo({ initial = "stickers", className }: { initial?: Mode; className?: string }) {
  const [mode, setMode] = useState<Mode>(initial);
  const [kept, setKept] = useState<Set<number>>(new Set());
  const src = mode === "blur" ? "/demo/group-blur.webp" : mode === "pixel" ? "/demo/group-pixel.webp" : "/demo/group-before.webp";

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-[32px] shadow-float ring-1 ring-black/5" style={{ aspectRatio: `${faces.w}/${faces.h}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img decoding="async" src={src} alt="Three friends laughing in a tulip field" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        {/* kept faces show the original pixels through */}
        {(mode === "blur" || mode === "pixel") &&
          faces.faces.map(([x, y, w, h], i) =>
            kept.has(i) ? (
              <div
                key={i}
                className="absolute overflow-hidden rounded-full"
                style={{ left: `${(x - w * 0.18) * 100}%`, top: `${(y - h * 0.18) * 100}%`, width: `${w * 1.36 * 100}%`, height: `${h * 1.36 * 100}%` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  decoding="async"
                  src="/demo/group-before.webp"
                  alt=""
                  className="absolute max-w-none"
                  style={{ width: `${100 / (w * 1.36)}%`, left: `${(-(x - w * 0.18) / (w * 1.36)) * 100}%`, top: `${(-(y - h * 0.18) / (h * 1.36)) * 100}%` }}
                />
              </div>
            ) : null,
          )}
        {mode === "stickers" &&
          faces.faces.map(([x, y, w, h], i) =>
            kept.has(i) ? null : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                decoding="async"
                key={i}
                src={stickerUrl(stickers.find((s) => s.id === faceStickers[i % faceStickers.length])!)}
                alt=""
                className="absolute drop-shadow-[0_6px_10px_rgb(0_0_0/0.3)] transition-transform duration-300"
                style={{
                  left: `${(x + w / 2) * 100}%`,
                  top: `${(y + h / 2) * 100}%`,
                  width: `${w * 1.9 * 100}%`,
                  transform: `translate(-50%,-50%) rotate(${[-8, 6, -4][i % 3]}deg)`,
                }}
              />
            ),
          )}
        {/* tap targets */}
        {mode !== "original" &&
          faces.faces.map(([x, y, w, h], i) => (
            <button
              key={i}
              type="button"
              onClick={() =>
                setKept((k) => {
                  const n = new Set(k);
                  if (n.has(i)) n.delete(i);
                  else n.add(i);
                  return n;
                })
              }
              aria-pressed={!kept.has(i)}
              aria-label={`Face ${i + 1}: ${kept.has(i) ? "visible, tap to hide" : "hidden, tap to show"}`}
              className={clsx(
                "absolute rounded-full border-2 border-dashed transition-colors",
                kept.has(i) ? "border-white/90 hover:bg-white/10" : "border-transparent hover:border-white/70",
              )}
              style={{ left: `${(x - w * 0.15) * 100}%`, top: `${(y - h * 0.15) * 100}%`, width: `${w * 1.3 * 100}%`, height: `${h * 1.3 * 100}%` }}
            />
          ))}
        <span className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white">
          {mode === "original" ? "3 faces found" : `${3 - kept.size} hidden · Tap a face to show or hide it`}
        </span>
      </div>

      <div role="radiogroup" aria-label="Privacy style" className="mx-auto mt-6 flex w-fit gap-1 rounded-full bg-white p-1.5 shadow-card ring-1 ring-line">
        {modes.map((m) => (
          <button
            key={m.id}
            role="radio"
            aria-checked={mode === m.id}
            aria-label={m.label}
            onClick={() => setMode(m.id)}
            className={clsx("flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors", mode === m.id ? "bg-pink text-white" : "text-ink/70 hover:bg-ink/5")}
          >
            <m.icon aria-hidden /> <span className="hidden sm:inline">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
