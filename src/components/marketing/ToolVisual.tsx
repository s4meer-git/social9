import { FaArrowRight, FaLocationDot, FaCamera, FaCalendar, FaShieldHalved } from "react-icons/fa6";
import { BeforeAfter } from "@/components/ui/BeforeAfter";
import { PencilStrike } from "@/components/fx/PencilStrike";
import { FaceDemo } from "@/components/home/FaceDemo";
import { ResizeDemo } from "@/components/home/ResizeDemo";
import type { Tool } from "@/lib/tools";

/** The hero visual for a tool's landing page. */
export function ToolVisual({ tool }: { tool: Tool }) {
  if (tool.id === "blur-faces") return <FaceDemo initial="blur" />;
  if (tool.id === "face-stickers") return <FaceDemo initial="stickers" />;
  if (tool.id === "resize" || tool.id === "fit") return <ResizeDemo compact />;
  if (tool.id === "remove-exif") return <ExifVisual />;
  if (tool.id === "convert") return <ConvertVisual />;
  if (tool.id === "compress") return <CompressVisual />;
  const d = tool.demo!;
  return (
    <div className={d.ratio === "3/2" ? "" : "mx-auto max-w-md"}>
      <BeforeAfter before={d.before} after={d.after} checker={d.checker} ratio={d.ratio} alt={tool.name} className="shadow-float ring-1 ring-black/5" priority />
    </div>
  );
}

function PhotoCard({ src, children, className = "" }: { src: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[28px] bg-white p-2 shadow-float ring-1 ring-line ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img decoding="async" src={src} alt="" className="aspect-[4/5] w-full rounded-[22px] object-cover" />
      {children}
    </div>
  );
}

function ExifVisual() {
  const rows = [
    { icon: FaLocationDot, label: "GPS location", value: "40.7484, -73.9857" },
    { icon: FaCalendar, label: "Date taken", value: "12 Aug, 18:42" },
    { icon: FaCamera, label: "Camera", value: "iPhone 16 Pro" },
  ];
  return (
    <div className="relative mx-auto max-w-md">
      <PhotoCard src="/demo/swap-before.webp" />
      <div className="absolute -bottom-6 -left-4 w-72 rounded-3xl bg-white p-4 shadow-float ring-1 ring-line sm:-left-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Hidden in this photo</p>
        <ul className="mt-3 space-y-2">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center gap-3 rounded-2xl bg-pink-soft p-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-pink text-sm text-white">
                <r.icon aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">{r.label}</span>
                <span className="block text-sm font-semibold">
                  <PencilStrike delay={0.4 + rows.indexOf(r) * 2.4} seed={21 + rows.indexOf(r) * 4}>
                    {r.value}
                  </PencilStrike>
                </span>
              </span>

            </li>
          ))}
        </ul>
      </div>
      <div className="absolute -right-3 top-8 flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-float">
        <FaShieldHalved aria-hidden className="text-lime" /> Clean copy
      </div>
    </div>
  );
}

function ConvertVisual() {
  return (
    <div className="mx-auto flex max-w-lg items-center gap-4">
      <div className="flex-1">
        <PhotoCard src="/demo/pfp-7.webp">
          <span className="absolute bottom-5 left-5 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">IMG_2041.HEIC</span>
        </PhotoCard>
      </div>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-white shadow-pop">
        <FaArrowRight aria-hidden />
      </span>
      <div className="flex-1 space-y-2">
        {["JPG", "PNG", "WebP"].map((f, i) => (
          <div key={f} className={`flex items-center justify-between rounded-2xl px-4 py-3 shadow-card ring-1 ring-line ${i === 0 ? "bg-ink text-white ring-ink" : "bg-white"}`}>
            <span className="font-display text-lg font-bold">{f}</span>
            <span className={`text-xs ${i === 0 ? "text-white/60" : "text-ink-soft"}`}>{["Works everywhere", "Keeps transparency", "Smallest files"][i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompressVisual() {
  return (
    <div className="relative mx-auto max-w-md">
      <PhotoCard src="/demo/pfp-8.webp" />
      <div className="absolute -bottom-8 left-1/2 w-[88%] -translate-x-1/2 rounded-3xl bg-white p-5 shadow-float ring-1 ring-line">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Before</p>
            <p className="font-display text-2xl font-bold text-ink/50">
              <PencilStrike delay={0.4} seed={5}>
                4.2 MB
              </PencilStrike>
            </p>
          </div>
          <FaArrowRight aria-hidden className="mb-2 text-ink-soft" />
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet">After</p>
            <p className="font-display text-3xl font-bold brand-text">380 KB</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink/5">
          <div className="h-full w-[9%] rounded-full brand-gradient" />
        </div>
        <p className="mt-2 text-xs text-ink-soft">Under 500 KB · 91% smaller</p>
      </div>
    </div>
  );
}
