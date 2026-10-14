"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  FaLock,
  FaChevronDown,
  FaRegSquarePlus,
  FaBars,
  FaUserPlus,
  FaTableCells,
  FaRegCirclePlay,
  FaRegIdBadge,
  FaHouse,
  FaMagnifyingGlass,
  FaWifi,
  FaLink,
} from "react-icons/fa6";

const highlights = [
  { img: "/mock/hl-diwali.webp", label: "Diwali" },
  { img: "/mock/hl-holi.webp", label: "Holi" },
  { img: "/mock/hl-goa.webp", label: "Goa" },
  { img: "/mock/hl-bruno.webp", label: "Bruno" },
  { img: "/mock/hl-college.webp", label: "College" },
];

/** iPhone status bar glyphs, drawn so they match iOS closely. */
function StatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pt-[15px] text-[13px] font-semibold text-ink">
      <span className="w-[62px] pl-2 tracking-tight">9:41</span>
      <span className="flex w-[62px] items-center justify-end gap-1">
        <svg width="15" height="11" viewBox="0 0 17 11" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={i * 4.5} y={8 - i * 2.4} width="3" height={3 + i * 2.4} rx="0.8" fill="#0f0e17" />
          ))}
        </svg>
        <FaWifi aria-hidden className="text-[11px]" />
        <span className="relative flex h-[11px] w-[21px] items-center rounded-[3.5px] border border-ink/40 p-[1.5px]">
          <span className="h-full w-[78%] rounded-[2px] bg-ink" />
          <span className="absolute -right-[3px] h-[4px] w-[1.5px] rounded-r bg-ink/40" />
        </span>
      </span>
    </div>
  );
}

/**
 * An iPhone 16 Pro showing an Instagram-style profile whose new profile
 * picture was made with Social9. Generic UI (no third-party logos).
 */
export function PhoneProfile() {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto w-[300px]">
      {/* side buttons */}
      <span className="absolute -left-[3px] top-[118px] h-[30px] w-[3px] rounded-l bg-[#2a2a30]" />
      <span className="absolute -left-[3px] top-[162px] h-[54px] w-[3px] rounded-l bg-[#2a2a30]" />
      <span className="absolute -left-[3px] top-[226px] h-[54px] w-[3px] rounded-l bg-[#2a2a30]" />
      <span className="absolute -right-[3px] top-[180px] h-[82px] w-[3px] rounded-r bg-[#2a2a30]" />

      {/* titanium frame */}
      <div className="rounded-[58px] bg-[linear-gradient(150deg,#77757d,#2b2a31_22%,#4a4950_55%,#1e1d23_80%,#6b6970)] p-[3px] shadow-[0_50px_100px_-30px_rgb(0_0_0/0.75),0_20px_40px_-20px_rgb(0_0_0/0.5)]">
        <div className="rounded-[55px] bg-black p-[9px]">
          <div className="relative h-[612px] overflow-hidden rounded-[46px] bg-white [clip-path:inset(0_round_46px)]">
            {/* dynamic island */}
            <div className="absolute left-1/2 top-[11px] z-30 h-[26px] w-[84px] -translate-x-1/2 rounded-full bg-black" />

            {/* notification that slides from the island */}
            <motion.div
              className="absolute inset-x-2.5 top-2 z-40 flex items-center gap-2.5 rounded-[18px] bg-[#f5f5f7]/95 p-2.5 shadow-[0_8px_24px_-6px_rgb(0_0_0/0.3)] ring-1 ring-black/5"
              initial={reduce ? false : { y: -90, opacity: 0, scale: 0.9 }}
              whileInView={{ y: [-90, 32, 32, -90], opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 0.95] }}
              viewport={{ once: false, margin: "-80px" }}
              transition={{ duration: 4.2, times: [0, 0.12, 0.85, 1], delay: 1, repeat: Infinity, repeatDelay: 3 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img decoding="async" src="/icon-192.png" alt="" className="h-8 w-8 rounded-[9px]" />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="flex justify-between text-[11px] font-bold text-ink">
                  Social9 <span className="font-medium text-ink/50">now</span>
                </p>
                <p className="truncate text-[11px] text-ink/75">New profile photo set. Looking sharp!</p>
              </div>
            </motion.div>

            <StatusBar />

            {/* app header */}
            <div className="mt-3 flex items-center justify-between px-4">
              <span className="flex items-center gap-1.5 text-[17px] font-bold tracking-tight text-ink">
                <FaLock aria-hidden className="text-[11px]" /> aarav.clicks <FaChevronDown aria-hidden className="text-[10px]" />
              </span>
              <span className="flex items-center gap-4 text-[19px] text-ink">
                <FaRegSquarePlus aria-hidden />
                <FaBars aria-hidden />
              </span>
            </div>

            {/* profile row */}
            <div className="mt-4 flex items-center gap-3 px-4">
              <div className="relative shrink-0">
                <span className="block rounded-full bg-[conic-gradient(from_200deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5,#feda75)] p-[2.5px]">
                  <span className="block rounded-full bg-white p-[2.5px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img decoding="async" src="/mock/aarav.webp" alt="Aarav's new profile picture, made with Social9" className="h-[76px] w-[76px] rounded-full object-cover" />
                  </span>
                </span>
              </div>
              <div className="grid flex-1 grid-cols-3 text-center leading-tight text-ink">
                {[
                  ["248", "posts"],
                  ["12.4K", "followers"],
                  ["389", "following"],
                ].map(([n, l]) => (
                  <span key={l}>
                    <span className="block text-[14px] font-bold">{n}</span>
                    <span className="text-[11px]">{l}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* bio */}
            <div className="mt-3 px-4 text-[12.5px] leading-snug text-ink">
              <p className="font-bold">Aarav Sharma</p>
              <p className="text-ink/55">Photographer</p>
              <p>Delhi · festivals, food & my dog Bruno</p>
              <p className="flex items-center gap-1 font-semibold text-[#00376b]">
                <FaLink aria-hidden className="text-[10px]" /> social9.s4meer.com
              </p>
            </div>

            {/* buttons */}
            <div className="mt-3 flex gap-1.5 px-4 text-[12.5px] font-semibold text-ink">
              <span className="grid h-[30px] flex-1 place-items-center rounded-lg bg-[#efefef]">Edit profile</span>
              <span className="grid h-[30px] flex-1 place-items-center rounded-lg bg-[#efefef]">Share profile</span>
              <span className="grid h-[30px] w-[34px] place-items-center rounded-lg bg-[#efefef]">
                <FaUserPlus aria-hidden className="text-[12px]" />
              </span>
            </div>

            {/* highlights */}
            <div className="mt-4 flex gap-3.5 overflow-hidden px-4">
              {highlights.map((h) => (
                <span key={h.label} className="flex w-[54px] shrink-0 flex-col items-center gap-1">
                  <span className="rounded-full p-[2px] ring-1 ring-[#dbdbdb]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img decoding="async" src={h.img} alt="" className="h-[50px] w-[50px] rounded-full object-cover" loading="lazy" />
                  </span>
                  <span className="text-[11px] text-ink">{h.label}</span>
                </span>
              ))}
            </div>

            {/* tabs */}
            <div className="mt-3 grid grid-cols-3 border-b border-[#dbdbdb] text-[17px] text-ink">
              <span className="grid place-items-center border-b border-ink py-2">
                <FaTableCells aria-hidden />
              </span>
              <span className="grid place-items-center py-2 text-ink/45">
                <FaRegCirclePlay aria-hidden />
              </span>
              <span className="grid place-items-center py-2 text-ink/45">
                <FaRegIdBadge aria-hidden />
              </span>
            </div>

            {/* posts */}
            <div className="grid grid-cols-3 gap-[1.5px]">
              {Array.from({ length: 9 }, (_, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img decoding="async" key={i} src={`/mock/post-${i + 1}.webp`} alt="" className="aspect-[3/4] w-full object-cover" loading="lazy" />
              ))}
            </div>

            {/* bottom nav */}
            <div className="absolute inset-x-0 bottom-0 z-20 border-t border-[#efefef] bg-white pb-[18px] pt-2.5">
              <div className="flex items-center justify-around text-[20px] text-ink">
                <FaHouse aria-hidden />
                <FaMagnifyingGlass aria-hidden />
                <FaRegSquarePlus aria-hidden />
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#0f0e17" strokeWidth="2" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <path d="M3 8.5h18M8.5 3l3 5.5M14.5 3l3 5.5" />
                  <path d="M10 12.2v5l4.2-2.5z" fill="#0f0e17" stroke="none" />
                </svg>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img decoding="async" src="/mock/aarav.webp" alt="" className="h-[24px] w-[24px] rounded-full object-cover ring-[1.5px] ring-ink ring-offset-1" />
              </div>
              <div className="mx-auto mt-3 h-[4px] w-[110px] rounded-full bg-ink" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
