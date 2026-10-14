"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { FaScissors, FaUserSecret, FaCropSimple, FaUserTie, FaArrowPointer, FaInstagram, FaYoutube, FaTiktok, FaLinkedin, FaPlay, FaPause } from "react-icons/fa6";
import { stickers, stickerUrl } from "@/lib/stickers";
import reel from "../../../public/reel/reel.json";

const SCENE_MS = 6500;
const ease = [0.65, 0, 0.35, 1] as const;

type Face = number[];

const scenes = [
  { id: "cutout", label: "Remove background", icon: FaScissors, tint: "bg-violet" },
  { id: "faces", label: "Hide faces", icon: FaUserSecret, tint: "bg-pink" },
  { id: "resize", label: "Resize", icon: FaCropSimple, tint: "bg-sky" },
  { id: "pfp", label: "Profile picture", icon: FaUserTie, tint: "bg-tangerine" },
] as const;

/* ───────────── scenes (each one loops its own timeline) ───────────── */

function Cursor({ x, y, delay, click = true }: { x: string[]; y: string[]; delay?: number; click?: boolean }) {
  return (
    <motion.div className="pointer-events-none absolute z-30" initial={{ left: x[0], top: y[0], opacity: 0 }} animate={{ left: x, top: y, opacity: [0, 1, 1, 0] }} transition={{ duration: 2.2, delay, ease, times: [0, 0.2, 0.85, 1] }}>
      <FaArrowPointer className="text-2xl text-white drop-shadow-[0_2px_6px_rgb(0_0_0/0.5)]" />
      {click && <motion.span className="absolute -left-3 -top-3 h-8 w-8 rounded-full border-2 border-white" initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.6], opacity: [0.9, 0] }} transition={{ delay: (delay ?? 0) + 1.5, duration: 0.5 }} />}
    </motion.div>
  );
}

export function CutoutScene() {
  return (
    <div className="absolute inset-0">
      {/* new background fades in after the cut */}
      <div className="checker absolute inset-0" />
      <motion.div className="absolute inset-0 bg-[linear-gradient(130deg,#6d4aff,#ff4fa3_60%,#ffb347)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.6, duration: 0.9 }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img decoding="async" src="/reel/cutout-subject.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
      {/* original photo wiped away by the scan line */}
      {/* (a sliding window, not an animated clip-path: transforms stay smooth in Safari) */}
      <motion.div className="absolute inset-0 overflow-hidden" initial={{ x: "0%" }} animate={{ x: "100%" }} transition={{ delay: 1.6, duration: 1.6, ease }}>
        <motion.div className="absolute inset-0" initial={{ x: "0%" }} animate={{ x: "-100%" }} transition={{ delay: 1.6, duration: 1.6, ease }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img decoding="async" src="/reel/cutout-before.webp" alt="Creator in a purple studio" className="h-full w-full object-cover" />
        </motion.div>
      </motion.div>
      <motion.div className="pointer-events-none absolute inset-0" initial={{ x: "0%", opacity: 0 }} animate={{ x: ["0%", "100%"], opacity: [0, 1, 1, 0] }} transition={{ delay: 1.6, duration: 1.6, ease, times: [0, 0.05, 0.95, 1] }}>
        <span className="absolute inset-y-0 left-0 w-1 bg-white shadow-[0_0_30px_8px_rgb(255_255_255/0.8),0_0_80px_20px_rgb(109_74_255/0.6)]" />
      </motion.div>
      <Cursor x={["70%", "78%"]} y={["80%", "87%"]} />
      <motion.div className="absolute bottom-5 right-5 z-20 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-ink shadow-float" initial={{ scale: 1 }} animate={{ scale: [1, 0.92, 1] }} transition={{ delay: 1.45, duration: 0.3 }}>
        <FaScissors aria-hidden /> Remove background
      </motion.div>
      <motion.div className="absolute left-5 top-8 z-20 rounded-full bg-black/60 px-3.5 py-2 text-xs font-bold text-white" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3.4 }}>
        Done in seconds, on your device
      </motion.div>
    </div>
  );
}

export function FacesScene({ faces, w, h }: { faces: Face[]; w: number; h: number }) {
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  return (
    <div className="absolute inset-0 grid place-items-center overflow-hidden bg-ink">
      {/* blurred fill keeps any frame shape full while the photo keeps its true ratio */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img decoding="async" src="/reel/faces-before.webp" alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl" />
      <div className="relative max-h-full w-full" style={{ aspectRatio: `${w}/${h}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img decoding="async" src="/reel/faces-before.webp" alt="Family hugging at a Diwali gathering" className="absolute inset-0 h-full w-full object-cover" />
        <motion.img src="/reel/faces-blur.webp" alt="" className="absolute inset-0 h-full w-full object-cover" initial={{ opacity: 0 }} animate={{ opacity: [0, 1] }} transition={{ delay: 4.6, duration: 0.6 }} />
        {faces.map(([x, y, fw, fh], i) => (
          <div key={i} className="absolute" style={{ left: pct(x - fw * 0.15, w), top: pct(y - fh * 0.12, h), width: pct(fw * 1.3, w), height: pct(fh * 1.3, h) }}>
            <motion.div className="absolute inset-0 rounded-full border-2 border-dashed border-white" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: [0.4, 1.08, 1], opacity: [0, 1, 1, 0] }} transition={{ delay: 0.5 + i * 0.18, duration: 1.6, times: [0, 0.25, 0.4, 1] }} />
            <motion.span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-pink px-2 py-0.5 text-[11px] font-bold text-white" initial={{ opacity: 0, y: 6 }} animate={{ opacity: [0, 1, 1, 0], y: 0 }} transition={{ delay: 0.7 + i * 0.18, duration: 1.4 }}>
              Face {i + 1}
            </motion.span>
            { }
            <motion.img
              src={stickerUrl(stickers[[1, 2, 3][i % 3]])}
              alt=""
              className="absolute left-1/2 top-1/2 w-[125%] max-w-none drop-shadow-[0_8px_14px_rgb(0_0_0/0.35)]"
              initial={{ x: "-50%", y: "-160%", opacity: 0, rotate: -20, scale: 0.6 }}
              animate={{ y: ["-160%", "-50%", "-50%", "-50%"], opacity: [0, 1, 1, 0], rotate: [-20, [-6, 5, -3][i % 3], [-6, 5, -3][i % 3], 0], scale: [0.6, 1, 1, 0.8] }}
              transition={{ delay: 2.1 + i * 0.15, duration: 2.5, times: [0, 0.16, 0.85, 1], ease: "easeOut" }}
            />
          </div>
        ))}
      </div>
      <motion.div className="absolute left-5 top-8 z-20 rounded-full bg-black/60 px-3.5 py-2 text-xs font-bold text-white" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0, 0] }} transition={{ delay: 0.6, duration: 4, times: [0, 0.1, 0.9, 0.95, 1] }}>
        {faces.length} faces found
      </motion.div>
      <motion.div className="absolute left-5 top-8 z-20 rounded-full bg-pink px-3.5 py-2 text-xs font-bold text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.8 }}>
        Choose stickers or blur
      </motion.div>
    </div>
  );
}

const ratios = [
  { label: "Story", icon: FaTiktok, r: 9 / 16 },
  { label: "Portrait", icon: FaInstagram, r: 4 / 5 },
  { label: "Thumbnail", icon: FaYoutube, r: 16 / 9 },
  { label: "Post", icon: FaLinkedin, r: 1 },
];

export function ResizeScene() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % ratios.length), 1500);
    return () => clearInterval(t);
  }, []);
  const r = ratios[i];
  const H = 82; // % of stage height for tall frames
  return (
    <div className="absolute inset-0 grid place-items-center bg-[#16151f] bg-[radial-gradient(rgb(255_255_255/0.08)_1px,transparent_1.2px)] bg-size-[18px_18px]">
      <motion.div
        className="relative overflow-hidden rounded-2xl shadow-[0_30px_60px_-15px_rgb(0_0_0/0.7)] ring-1 ring-white/10"
        animate={r.r >= 1 ? { height: `${H / r.r / 1.15}%`, aspectRatio: r.r } : { height: `${H}%`, aspectRatio: r.r }}
        transition={{ type: "spring", stiffness: 140, damping: 18 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img decoding="async" src="/reel/resize.webp" alt="Couple with sparklers at Diwali" className="h-full w-full object-cover object-[60%_40%]" />
      </motion.div>
      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/45 p-1.5">
        {ratios.map((x, k) => (
          <span key={x.label} className={clsx("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors duration-300", k === i ? "bg-white text-ink" : "text-white/70")}>
            <x.icon aria-hidden /> {x.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function PfpScene() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#16151f] [container-type:size]">
      { }
      <motion.img src="/reel/pfp-before.webp" alt="Portrait in golden light" className="absolute inset-0 h-full w-full object-cover" initial={{ opacity: 1 }} animate={{ opacity: [1, 1, 0] }} transition={{ duration: 2.2, times: [0, 0.6, 1] }} />
      <motion.div className="absolute inset-0 grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 0.8 }}>
        <motion.div className="relative aspect-square w-[min(74cqh,82cqw)]" initial={{ scale: 1.6 }} animate={{ scale: 1 }} transition={{ delay: 1.3, duration: 1.4, ease }}>
          <motion.div
            className="absolute inset-0 overflow-hidden rounded-full"
            initial={{ background: "linear-gradient(135deg,#ffe27a,#ff9f43)" }}
            animate={{ background: ["linear-gradient(135deg,#ffe27a,#ff9f43)", "linear-gradient(135deg,#6d4aff,#ff4fa3)", "linear-gradient(135deg,#38bdf8,#6d4aff)"] }}
            transition={{ delay: 3, duration: 2.4, times: [0, 0.5, 1] }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img decoding="async" src="/reel/pfp-subject.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
          </motion.div>
          <svg viewBox="0 0 100 100" className="absolute -inset-[4%] h-[108%] w-[108%] -rotate-90">
            <defs>
              <linearGradient id="reel-ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ff4fa3" />
                <stop offset="0.5" stopColor="#ffc93c" />
                <stop offset="1" stopColor="#6d4aff" />
              </linearGradient>
            </defs>
            <motion.circle cx="50" cy="50" r="48" fill="none" stroke="url(#reel-ring)" strokeWidth="3.2" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 2.6, duration: 1.2, ease }} />
          </svg>
        </motion.div>
      </motion.div>
      <motion.div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-ink shadow-float" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3.9 }}>
        <FaLinkedin aria-hidden className="text-[#0a66c2]" /> 400 × 400 · ready
      </motion.div>
    </div>
  );
}

/* ───────────── player ───────────── */

export function ExplainerReel() {
  const [active, setActive] = useState(0);
  const [loop, setLoop] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20%" });
  const reduce = useReducedMotion();
  const playing = inView && !paused && !reduce;

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      setActive((a) => (a + 1) % scenes.length);
      setLoop((l) => l + 1);
    }, SCENE_MS);
    return () => clearTimeout(t);
  }, [active, playing, loop]);

  const pick = (i: number) => {
    setActive(i);
    setLoop((l) => l + 1);
  };

  return (
    <div ref={ref} className="grid gap-4 lg:grid-cols-12 lg:items-stretch">
      <div className="relative lg:col-span-8">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[32px] bg-ink shadow-[0_40px_90px_-30px_rgb(15_14_23/0.6)] ring-1 ring-black/10">
          <AnimatePresence mode="wait">
            <motion.div key={`${active}-${loop}`} className="absolute inset-0" initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
              {active === 0 && <CutoutScene />}
              {active === 1 && <FacesScene faces={reel.faces} w={reel.w} h={reel.h} />}
              {active === 2 && <ResizeScene />}
              {active === 3 && <PfpScene />}
            </motion.div>
          </AnimatePresence>

          {/* story-style progress */}
          <div className="absolute inset-x-5 top-3 z-40 flex gap-1.5">
            {scenes.map((s, i) => (
              <span key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
                {i < active && <span className="block h-full w-full bg-white" />}
                {i === active && (
                  <motion.span
                    key={loop}
                    className="block h-full bg-white"
                    initial={{ width: "0%" }}
                    animate={{ width: playing ? "100%" : undefined }}
                    transition={{ duration: SCENE_MS / 1000, ease: "linear" }}
                  />
                )}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Play" : "Pause"}
            className="absolute bottom-5 left-5 z-40 grid h-10 w-10 place-items-center rounded-full bg-black/40 text-sm text-white transition hover:bg-black/60"
          >
            {paused ? <FaPlay aria-hidden /> : <FaPause aria-hidden />}
          </button>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-2 lg:col-span-4 lg:grid-cols-1 lg:grid-rows-4">
        {scenes.map((s, i) => {
          const on = i === active;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => pick(i)}
                aria-pressed={on}
                className={clsx(
                  "group relative flex h-full w-full items-center gap-4 overflow-hidden rounded-[24px] p-3 text-left ring-1 transition-all duration-300 lg:p-5",
                  on ? "bg-white shadow-card ring-line" : "ring-transparent hover:bg-white/70 hover:ring-line",
                )}
              >
                <span className={clsx("grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white transition-transform duration-300 group-hover:scale-105", s.tint, !on && "opacity-50")}>
                  <s.icon aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className={clsx("block font-display text-xl font-black tracking-[-0.02em]", !on && "text-ink/50")}>{s.label}</span>
                  <span className={clsx("hidden text-sm text-ink-soft lg:block", !on && "opacity-60")}>
                    {["Remove the background and add a new one.", "Find faces and cover them.", "Resize one photo for every platform.", "Center your face and add a ring."][i]}
                  </span>
                </span>
                {on && (
                  <motion.span
                    key={loop}
                    aria-hidden
                    className={clsx("absolute bottom-0 left-0 h-[3px]", s.tint)}
                    initial={{ width: "0%" }}
                    animate={{ width: playing ? "100%" : undefined }}
                    transition={{ duration: SCENE_MS / 1000, ease: "linear" }}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
