"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import clsx from "clsx";
import {
  FaChrome,
  FaSafari,
  FaEdge,
  FaFirefoxBrowser,
  FaCloud,
  FaXmark,
  FaInstagram,
  FaLinkedin,
  FaXTwitter,
  FaWhatsapp,
  FaYoutube,
  FaScissors,
  FaPalette,
  FaCircleUser,
} from "react-icons/fa6";
import { SiHuggingface } from "react-icons/si";

/**
 * How a photo moves through Social9, told as a short film for people who don't care how
 * it works. Your photo flies into your own browser, the smart tools fly in after it, the
 * edit plays out right there (cut out → new backdrop → profile circle), and the finished
 * picture flies off to wherever you post. A pulse that heads for our servers bounces off
 * the cross. Everything stays grey; only light and the photo move.
 *
 * The desktop stage is laid out on a 560-unit square and sized with container units. One
 * rAF loop drives every moving part, desktop and phone alike (tagged `data-pd`), using
 * transforms and opacity only so Safari stays smooth, and only while it's on screen.
 */

const u = (v: number) => `${(v / 5.6).toFixed(3)}cqw`;
const box = (x: number, y: number, w: number, h: number): CSSProperties => ({ left: u(x), top: u(y), width: u(w), height: u(h) });

const browsers = [
  { icon: FaChrome, name: "Chrome" },
  { icon: FaSafari, name: "Safari" },
  { icon: FaEdge, name: "Edge" },
  { icon: FaFirefoxBrowser, name: "Firefox" },
];
const feeds = [FaInstagram, FaLinkedin, FaXTwitter, FaWhatsapp, FaYoutube];
const tools = [
  { icon: FaScissors, label: "Cut out" },
  { icon: FaPalette, label: "Background" },
  { icon: FaCircleUser, label: "Profile" },
];

const ROUTES = {
  photo: "M126 112 C126 160, 190 150, 190 196",
  tools: "M434 112 C434 160, 370 150, 370 196",
  post: "M370 364 C370 410, 434 404, 434 452",
  servers: "M190 364 C190 410, 126 404, 126 452",
};
type Route = keyof typeof ROUTES;

const statuses = ["Opening your photo", "Loading the AI tools", "Removing the background", "Adding a new background", "Making it a profile picture", "Done. Nothing was uploaded."];
const statusWindows: [number, number][] = [
  [0, 0.15],
  [0.15, 0.24],
  [0.24, 0.45],
  [0.45, 0.59],
  [0.59, 0.71],
  [0.71, 1.01],
];
/** when each tool chip lands, and when its step runs */
const toolArrive = [0.21, 0.24, 0.27];
const toolActive: [number, number][] = [
  [0.24, 0.45],
  [0.45, 0.59],
  [0.59, 0.71],
];

const BEFORE = "/demo/cutout-before.webp";
const AFTER = "/demo/cutout-after.webp";
const BACKDROP = "radial-gradient(circle at 50% 32%, #9a98a6, #4a4956 55%, #2c2b36)";
const CHECKER: CSSProperties = { backgroundColor: "#2a2935", backgroundImage: "repeating-conic-gradient(rgb(255 255 255 / 0.16) 0 25%, transparent 0 50%)", backgroundSize: "10px 10px" };

/** one loop, in seconds */
const LOOP = 12;
/** where the loop rests for reduced motion and while off screen: everything finished */
const REST = 0.93;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
/** 0 → 1 → 0 across [a, b] */
const bump = (t: number, a: number, b: number) => Math.sin(Math.PI * seg(t, a, b));
/** visible across [a, b] with short fades at both ends */
const span = (t: number, a: number, b: number, f = 0.02) => Math.min(seg(t, a, a + f), 1 - seg(t, b - f, b));

function Node({ style, children, className, glow }: { style: CSSProperties; children: ReactNode; className?: string; glow?: string }) {
  return (
    <div style={style} className={clsx("absolute flex items-center rounded-[3.5cqw] bg-white/[0.045] ring-1 ring-white/10", className)}>
      {/* lights up when something leaves or arrives */}
      {glow && <span data-pd={glow} className="pointer-events-none absolute inset-0 rounded-[inherit] bg-white/[0.05] opacity-0 ring-1 ring-white/45" />}
      {children}
    </div>
  );
}

function Label({ title, text }: { title: string; text: ReactNode }) {
  return (
    <div className="relative min-w-0">
      <p className="font-display font-black leading-tight tracking-[-0.01em] text-white/85" style={{ fontSize: u(17) }}>
        {title}
      </p>
      <p className="leading-snug text-white/45" style={{ fontSize: u(14), marginTop: u(2) }}>
        {text}
      </p>
    </div>
  );
}

/** The finished profile picture: cut-out on the studio backdrop, in a circle. */
function Avatar({ className }: { className?: string }) {
  return (
    <span className={clsx("block overflow-hidden rounded-full ring-1 ring-white/60", className)} style={{ background: BACKDROP }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img decoding="async" src={AFTER} alt="" className="h-full w-full object-cover object-top grayscale" />
    </span>
  );
}

/** The photo being edited. Same markup on desktop and phone; sized by its parent. */
function Stage({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div data-pd="stage" className={clsx("relative shrink-0", className)} style={style}>
      <div className="absolute inset-0 overflow-hidden rounded-[14%/11%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img decoding="async" src={BEFORE} alt="" className="absolute inset-0 h-full w-full object-cover grayscale" style={{ opacity: 0.8 }} />
        {/* ① the cut-out sweeps in over the see-through checkerboard */}
        <div data-pd="after" className="absolute inset-0 overflow-hidden">
          <div data-pd="after-in" className="absolute inset-0" style={CHECKER}>
            {/* ② a studio backdrop fades in behind it */}
            <div data-pd="backdrop" className="absolute inset-0" style={{ background: BACKDROP }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img decoding="async" src={AFTER} alt="" className="relative h-full w-full object-cover grayscale" />
          </div>
        </div>
        <div data-pd="sweep" className="absolute inset-0 opacity-0">
          <span className="absolute inset-y-0 left-0 w-px bg-white shadow-[0_0_10px_2px_rgb(255_255_255/0.55)]" />
        </div>
      </div>
      {/* ③ cropped to a circle: the corners fade into the window (drawn past the edges so no sliver shows) */}
      <div data-pd="circle" className="pointer-events-none absolute -inset-[3px] bg-[radial-gradient(circle_closest-side,transparent_95%,#1d1c27_99%)]" />
      <div data-pd="frame" className="pointer-events-none absolute inset-0 rounded-[14%/11%] ring-1 ring-white/15" style={{ opacity: 0 }} />
      <div data-pd="ring" className="pointer-events-none absolute inset-x-0 top-[10%] aspect-square rounded-full ring-2 ring-white/75" />
    </div>
  );
}

function Toolbar({ size }: { size: "desktop" | "phone" }) {
  return (
    <div className="flex flex-wrap" style={{ gap: size === "desktop" ? u(5) : 5 }}>
      {tools.map((t, i) => (
        <span
          key={t.label}
          data-pd={`tool-${i}`}
          className="relative inline-flex items-center rounded-full bg-white/[0.07] text-white/80"
          style={size === "desktop" ? { gap: u(4), paddingInline: u(7), height: u(20), fontSize: u(10) } : { gap: 4, paddingInline: 8, height: 22, fontSize: 11 }}
        >
          <span data-pd={`tool-on-${i}`} className="absolute inset-0 rounded-full bg-white/[0.12] ring-1 ring-white/60" style={{ opacity: 0 }} />
          <t.icon aria-hidden className="relative shrink-0" />
          <span className="relative font-semibold">{t.label}</span>
        </span>
      ))}
    </div>
  );
}

function Status({ size }: { size: "desktop" | "phone" }) {
  const d = size === "desktop";
  return (
    <>
      <div className="relative" style={{ height: d ? u(16) : 18, marginTop: d ? u(8) : 8, fontSize: d ? u(11.5) : 12.5 }}>
        {statuses.map((s, i) => (
          <span key={s} data-pd={`status-${i}`} className="absolute inset-0 whitespace-nowrap text-white/55" style={{ opacity: i === statuses.length - 1 ? 1 : 0 }}>
            {s}
          </span>
        ))}
      </div>
      <div className="overflow-hidden rounded-full bg-white/10" style={{ height: 4, marginTop: d ? u(5) : 6 }}>
        <span data-pd="bar" className="block h-full origin-left rounded-full bg-white/65" />
      </div>
    </>
  );
}

export function PrivacyDiagram() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const fig = root.current;
    if (!fig) return;
    const map = fig.querySelector<HTMLElement>("[data-pd-map]");
    // every moving part is tagged data-pd="name"; the desktop map and the phone list share names
    const $: Record<string, (HTMLElement | SVGElement)[]> = {};
    fig.querySelectorAll<HTMLElement | SVGElement>("[data-pd]").forEach((n) => ($[n.dataset.pd!] ??= []).push(n));
    const css = (k: string, v: Partial<CSSStyleDeclaration>) => $[k]?.forEach((n) => Object.assign(n.style, v));
    const paths = Object.fromEntries(
      (Object.keys(ROUTES) as Route[]).map((r) => {
        const p = $[`path-${r}`][0] as SVGPathElement;
        return [r, { p, len: p.getTotalLength() }];
      }),
    ) as Record<Route, { p: SVGPathElement; len: number }>;

    // px per stage unit, for the HTML chips that fly along the SVG routes
    let k = 1;
    const ro = new ResizeObserver(() => {
      k = (map?.clientWidth ?? 560) / 560;
    });
    if (map) ro.observe(map);

    const trail = (r: Route, at: number, alpha: number) =>
      $[`trail-${r}`]?.forEach((n) => {
        n.setAttribute("stroke-dashoffset", String(40 - at * paths[r].len));
        n.style.opacity = String(alpha);
      });
    const fly = (key: string, r: Route, at: number, alpha: number, scale = 1) => {
      const pt = paths[r].p.getPointAtLength(at * paths[r].len);
      css(key, { transform: `translate(${(pt.x * k).toFixed(1)}px, ${(pt.y * k).toFixed(1)}px) translate(-50%, -50%) scale(${scale.toFixed(3)})`, opacity: String(alpha) });
    };

    const apply = (t: number) => {
      const reset = 1 - seg(t, 0.95, 1);

      // ① your photo flies into your browser
      const a1 = ease(seg(t, 0.02, 0.13));
      fly("fly-photo", "photo", a1, span(t, 0.02, 0.14, 0.015), 1 - 0.3 * a1);
      trail("photo", a1, span(t, 0.02, 0.14, 0.015));
      css("glow-photo", { opacity: String(bump(t, 0, 0.07)) });

      // ② the smart tools follow it in, one by one, and land in the toolbar
      tools.forEach((_, i) => {
        const s = 0.11 + i * 0.03;
        fly(`fly-tool-${i}`, "tools", ease(seg(t, s, s + 0.1)), span(t, s, s + 0.105, 0.015));
        css(`tool-${i}`, { opacity: String(0.3 + 0.7 * seg(t, toolArrive[i] - 0.01, toolArrive[i] + 0.01) * reset) });
        css(`tool-on-${i}`, { opacity: String(span(t, ...toolActive[i])) });
      });
      trail("tools", ease(seg(t, 0.11, 0.27)), span(t, 0.11, 0.28, 0.015));
      css("glow-tools", { opacity: String(bump(t, 0.09, 0.2)) });
      css("glow-browser", { opacity: String(Math.max(bump(t, 0.11, 0.17), bump(t, 0.2, 0.29)) * 0.7) });

      // ③ the edit, right there: cut out → new backdrop → profile circle
      const shown = t < 0.95 ? ease(seg(t, 0.11, 0.16)) : reset;
      css("stage", { opacity: String(shown), transform: `scale(${(0.9 + 0.1 * shown).toFixed(3)})` });
      const p = ease(seg(t, 0.25, 0.43));
      css("after", { transform: `translateX(${(p - 1) * 100}%)` });
      css("after-in", { transform: `translateX(${(1 - p) * 100}%)` });
      css("sweep", { transform: `translateX(${p * 100}%)`, opacity: String(p > 0 && p < 1 ? 1 : 0) });
      css("backdrop", { opacity: String(ease(seg(t, 0.46, 0.56))) });
      const c = ease(seg(t, 0.6, 0.68));
      css("circle", { opacity: String(c) });
      css("frame", { opacity: String(1 - c) });
      css("ring", { opacity: String(c), transform: `scale(${(0.82 + 0.18 * c).toFixed(3)})` });
      css("bar", { transform: `scaleX(${t < 0.24 ? 0 : ease(seg(t, 0.24, 0.7)).toFixed(3)})`, opacity: String(reset) });
      statusWindows.forEach(([a, b], i) => css(`status-${i}`, { opacity: String(i === 0 ? Math.max(span(t, a, b), seg(t, 0.99, 1)) : span(t, a, b)) }));

      // ④ the finished picture flies off to wherever you post
      const a3 = ease(seg(t, 0.72, 0.83));
      fly("fly-result", "post", a3, span(t, 0.72, 0.84, 0.015), 0.75 + 0.25 * a3);
      trail("post", a3, span(t, 0.72, 0.84, 0.015));
      css("glow-post", { opacity: String(bump(t, 0.82, 0.92)) });
      const landed = seg(t, 0.82, 0.85) * reset;
      css("post-avatar", { opacity: String(landed), transform: `scale(${(0.5 + 0.5 * ease(landed)).toFixed(3)})` });
      feeds.forEach((_, i) => css(`feed-${i}`, { opacity: String(0.3 + 0.65 * seg(t, 0.85 + i * 0.02, 0.87 + i * 0.02) * reset) }));

      // …and the route to our servers is stopped at the cross
      const out = seg(t, 0.74, 0.8);
      const back = seg(t, 0.8, 0.86);
      const sp = 0.4 * ease(out) - 0.15 * ease(back);
      const sAlpha = out > 0 ? 1 - back : 0;
      const pt = paths.servers.p.getPointAtLength(sp * paths.servers.len);
      $["dot-servers"]?.forEach((n) => {
        n.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
        n.style.opacity = String(sAlpha);
      });
      trail("servers", sp, sAlpha);
      const hit = bump(t, 0.78, 0.86);
      css("block", { transform: `scale(${(1 + 0.2 * hit).toFixed(3)})` });
      css("block-ring", { opacity: String(hit) });
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    apply(REST);
    if (reduce) return () => ro.disconnect();

    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      apply((((now - start) / 1000) % LOOP) / LOOP);
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) {
        start = 0;
        raf = requestAnimationFrame(tick);
      } else apply(REST);
    });
    io.observe(fig);
    return () => {
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const chip = "pointer-events-none absolute left-0 top-0 will-change-transform";

  return (
    <figure ref={root} aria-label="Your photo is edited in your own browser. The AI tools are downloaded to your device, and you choose where to post the finished photo. Social9's servers never receive it.">
      {/* desktop / tablet: the map */}
      <div data-pd-map className="@container relative mx-auto hidden aspect-square w-full max-w-[600px] sm:block" aria-hidden>
        {/* soft light behind the browser */}
        <div className="absolute inset-[8%] bg-[radial-gradient(closest-side,rgb(255_255_255/0.07),transparent)]" />
        <svg viewBox="0 0 560 560" className="absolute inset-0 h-full w-full overflow-visible" fill="none" strokeLinecap="round">
          <g stroke="rgb(255 255 255 / 0.22)" strokeWidth="1.6" strokeDasharray="5 9">
            {(["photo", "tools", "post"] as const).map((r) => (
              <path key={r} data-pd={`path-${r}`} d={ROUTES[r]} />
            ))}
          </g>
          {/* the route that never happens */}
          <path data-pd="path-servers" d={ROUTES.servers} stroke="rgb(255 255 255 / 0.1)" strokeWidth="1.6" strokeDasharray="2 7" />
          {(Object.keys(ROUTES) as Route[]).map((r) => (
            <path key={r} data-pd={`trail-${r}`} d={ROUTES[r]} stroke="rgb(255 255 255 / 0.5)" strokeWidth="2.2" strokeDasharray="40 2000" strokeDashoffset="40" style={{ opacity: 0 }} />
          ))}
          <g data-pd="dot-servers" style={{ opacity: 0 }}>
            <circle r="11" fill="rgb(255 255 255 / 0.08)" />
            <circle r="6" fill="rgb(255 255 255 / 0.16)" />
            <circle r="3.2" fill="white" />
          </g>
        </svg>
        <span data-pd="block" className="absolute grid place-items-center rounded-full bg-ink text-white/60 ring-1 ring-white/20" style={{ ...box(143, 393, 30, 30), fontSize: u(13) }}>
          <span data-pd="block-ring" className="absolute -inset-[0.9cqw] rounded-full ring-1 ring-white/40" style={{ opacity: 0 }} />
          <FaXmark />
        </span>

        <Node style={box(6, 28, 240, 84)} className="gap-[2.5cqw] px-[2.6cqw]" glow="glow-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img decoding="async" src={BEFORE} alt="" className="relative shrink-0 object-cover object-top grayscale" style={{ width: u(52), height: u(52), borderRadius: u(14), opacity: 0.85 }} />
          <Label title="Your photo" text="Never leaves your device" />
        </Node>

        <Node style={box(314, 28, 240, 84)} className="gap-[2.5cqw] px-[2.6cqw]" glow="glow-tools">
          <span className="relative grid shrink-0 place-items-center bg-white/[0.06] text-white/70" style={{ width: u(52), height: u(52), borderRadius: u(14), fontSize: u(24) }}>
            <SiHuggingface />
          </span>
          <Label title="AI tools" text="Downloaded once to your device" />
        </Node>

        {/* the browser, where everything happens */}
        <div style={box(70, 196, 420, 168)} className="absolute overflow-hidden rounded-[4cqw] bg-[#1d1c27] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.8)] ring-1 ring-white/15">
          <span data-pd="glow-browser" className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 ring-1 ring-white/40" />
          <div className="relative flex items-center border-b border-white/10" style={{ height: u(34), gap: u(6), paddingInline: u(14) }}>
            {[0, 1, 2].map((i) => (
              <span key={i} className="rounded-full bg-white/20" style={{ width: u(8), height: u(8) }} />
            ))}
            <span className="absolute left-1/2 -translate-x-1/2 rounded-full bg-white/[0.06] text-white/45" style={{ fontSize: u(11.5), paddingInline: u(18), paddingBlock: u(3) }}>
              Your browser
            </span>
            <span className="ml-auto flex items-center text-white/35" style={{ gap: u(7), fontSize: u(12) }}>
              {browsers.map((b) => (
                <b.icon key={b.name} title={b.name} />
              ))}
            </span>
          </div>
          <div className="relative flex items-center" style={{ height: u(134), paddingInline: u(22), gap: u(20) }}>
            <Stage style={{ width: u(86), height: u(108) }} />
            <div className="min-w-0 flex-1">
              <p className="font-display font-black leading-[1.05] tracking-[-0.01em] text-white/85" style={{ fontSize: u(19), marginBottom: u(8) }}>
                Every edit
                <br />
                happens here
              </p>
              <Toolbar size="desktop" />
              <Status size="desktop" />
            </div>
          </div>
        </div>

        <Node style={box(6, 452, 240, 84)} className="gap-[2.5cqw] px-[2.6cqw] opacity-60">
          <span className="relative grid shrink-0 place-items-center bg-white/[0.04] text-white/40" style={{ width: u(52), height: u(52), borderRadius: u(14), fontSize: u(24) }}>
            <FaCloud />
            <span className="absolute h-[2px] rotate-[-35deg] rounded-full bg-white/50" style={{ width: u(40) }} />
          </span>
          <Label
            title="Our servers"
            text={
              <>
                Photos received: <span className="font-display font-black text-white/80">0</span>
              </>
            }
          />
        </Node>

        <Node style={box(314, 452, 240, 84)} className="flex-col items-start justify-center px-[2.8cqw]" glow="glow-post">
          <div className="relative flex items-center text-white" style={{ gap: u(10), fontSize: u(17), marginBottom: u(6) }}>
            {/* dashed slot, filled when the finished picture lands */}
            <span className="relative block rounded-full border border-dashed border-white/25" style={{ width: u(24), height: u(24), marginRight: u(2) }}>
              <span data-pd="post-avatar" className="absolute -inset-px block">
                <Avatar className="h-full w-full" />
              </span>
            </span>
            {feeds.map((F, i) => (
              <span key={i} data-pd={`feed-${i}`} style={{ opacity: 0.95 }}>
                <F />
              </span>
            ))}
          </div>
          <Label title="Ready to post" text="You choose where it goes" />
        </Node>

        {/* what travels: the photo, the tools, the finished picture */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img decoding="async" data-pd="fly-photo" src={BEFORE} alt="" className={clsx(chip, "object-cover object-top grayscale ring-2 ring-white/80 shadow-[0_10px_24px_-6px_rgb(0_0_0/0.7)]")} style={{ width: u(40), height: u(40), borderRadius: u(11), opacity: 0 }} />
        {tools.map((t, i) => (
          <span key={t.label} data-pd={`fly-tool-${i}`} className={clsx(chip, "grid place-items-center rounded-full bg-[#2c2b37] text-white ring-1 ring-white/50 shadow-[0_8px_20px_-6px_rgb(0_0_0/0.7)]")} style={{ width: u(28), height: u(28), fontSize: u(12), opacity: 0 }}>
            <t.icon />
          </span>
        ))}
        <span data-pd="fly-result" className={clsx(chip, "rounded-full shadow-[0_10px_24px_-6px_rgb(0_0_0/0.7)]")} style={{ width: u(40), height: u(40), opacity: 0 }}>
          <Avatar className="h-full w-full ring-2 ring-white/80" />
        </span>
      </div>

      {/* phones: the same story top to bottom, with the edit playing in the browser card */}
      <div className="space-y-3 sm:hidden" aria-hidden>
        <ol className="relative space-y-3">
          <span className="absolute bottom-10 left-[39px] top-10 border-l border-dashed border-white/20" />
          <li className="relative flex items-center gap-4 rounded-2xl bg-white/[0.045] p-3 ring-1 ring-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img decoding="async" src={BEFORE} alt="" className="h-[52px] w-[52px] shrink-0 rounded-[14px] object-cover object-top grayscale" />
            <div>
              <p className="font-display text-[17px] font-black text-white/85">Your photo</p>
              <p className="text-sm text-white/45">Never leaves your device</p>
            </div>
          </li>
          <li className="relative flex items-center gap-4 rounded-2xl bg-white/[0.045] p-3 ring-1 ring-white/10">
            <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[14px] bg-ink text-2xl text-white/65 ring-1 ring-white/10">
              <SiHuggingface />
            </span>
            <div>
              <p className="font-display text-[17px] font-black text-white/85">AI tools download once</p>
              <p className="text-sm text-white/45">Open-source models, saved on your device</p>
            </div>
          </li>
          <li className="relative overflow-hidden rounded-2xl bg-[#1d1c27] ring-1 ring-white/15">
            <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/20" />
              ))}
              <span className="ml-2 text-xs text-white/45">Your browser</span>
              <span className="ml-auto flex gap-2 text-xs text-white/35">
                {browsers.map((b) => (
                  <b.icon key={b.name} />
                ))}
              </span>
            </div>
            <div className="flex items-center gap-4 p-3">
              <Stage className="h-[120px] w-[96px]" />
              <div className="min-w-0 flex-1">
                <p className="mb-2 font-display text-[17px] font-black leading-tight text-white/85">Every edit happens here</p>
                <Toolbar size="phone" />
                <Status size="phone" />
              </div>
            </div>
          </li>
          <li className="relative flex items-center gap-4 rounded-2xl bg-white/[0.045] p-3 ring-1 ring-white/10">
            <span className="relative block h-[52px] w-[52px] shrink-0 rounded-full border border-dashed border-white/25">
              <span data-pd="post-avatar" className="absolute -inset-px block">
                <Avatar className="h-full w-full" />
              </span>
            </span>
            <div>
              <p className="font-display text-[17px] font-black text-white/85">Ready to post</p>
              <span className="mt-1 flex gap-3 text-base text-white">
                {feeds.map((F, i) => (
                  <span key={i} data-pd={`feed-${i}`} style={{ opacity: 0.95 }}>
                    <F />
                  </span>
                ))}
              </span>
            </div>
          </li>
        </ol>
        <div className="flex items-center gap-4 rounded-2xl border border-dashed border-white/15 p-3 opacity-60">
          <span className="relative grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[14px] text-2xl text-white/40">
            <FaCloud />
            <span className="absolute h-[2px] w-10 rotate-[-35deg] rounded-full bg-white/50" />
          </span>
          <div>
            <p className="font-display text-[17px] font-black text-white/85">Our servers</p>
            <p className="text-sm text-white/45">
              Photos received: <span className="font-display font-black text-white/80">0</span>
            </p>
          </div>
        </div>
      </div>
    </figure>
  );
}
