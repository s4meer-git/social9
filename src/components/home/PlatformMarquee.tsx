import Link from "next/link";
import clsx from "clsx";
import { platforms } from "@/lib/platforms";
import { Marquee } from "@/components/fx/Marquee";
import { Reveal } from "@/components/motion/Reveal";

const brand: Record<string, string> = {
  instagram: "bg-[radial-gradient(circle_at_30%_110%,#feda75,#fa7e1e_35%,#d62976_60%,#962fbf_85%)] text-white",
  linkedin: "bg-[#0a66c2] text-white",
  x: "bg-ink text-white",
  facebook: "bg-[#1877f2] text-white",
  youtube: "bg-[#ff0000] text-white",
  tiktok: "bg-ink text-white",
  pinterest: "bg-[#e60023] text-white",
  whatsapp: "bg-[#25d366] text-white",
};

function PlatformCard({ p }: { p: (typeof platforms)[number] }) {
  return (
    <Link
      href={`/platforms/${p.id}`}
      className="group flex shrink-0 items-center gap-3 rounded-2xl bg-white py-2.5 pl-2.5 pr-5 shadow-card ring-1 ring-black/[0.04] transition-all duration-300 hover:-translate-y-1 hover:shadow-float"
    >
      <span className={clsx("grid h-11 w-11 place-items-center rounded-xl text-xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110", brand[p.id])}>
        <p.icon aria-hidden />
      </span>
      <span>
        <span className="block font-display text-lg font-black leading-tight tracking-[-0.01em]">{p.name}</span>
        <span className="block text-[13px] font-semibold text-ink-soft">{p.presets.length} exact sizes</span>
      </span>
    </Link>
  );
}

export function PlatformMarquee() {
  const half = Math.ceil(platforms.length / 2);
  return (
    <section id="platforms" aria-label="Supported platforms" className="scroll-mt-24 overflow-hidden border-y border-line bg-[linear-gradient(180deg,#ffffff,#fbfaf8)] py-16">
      <Reveal className="mx-auto max-w-3xl px-5 text-center">
        <h2 className="headline font-display text-[32px] font-black leading-[1.02] tracking-[-0.025em] sm:text-[44px]">
          The right size for <span className="brand-text">every platform</span> you post on.
        </h2>
        <p className="mt-3 text-lg font-medium text-ink-soft">
          {platforms.length} platforms, {platforms.reduce((n, p) => n + p.presets.length, 0)} official sizes, kept up to date.
        </p>
      </Reveal>
      <div className="mt-10 space-y-4">
        <Marquee speed={38} className="py-2">
          {[...platforms.slice(0, half), ...platforms.slice(0, half)].map((p, i) => (
            <PlatformCard key={`${p.id}-${i}`} p={p} />
          ))}
        </Marquee>
        <Marquee speed={44} reverse className="py-2">
          {[...platforms.slice(half), ...platforms.slice(half)].map((p, i) => (
            <PlatformCard key={`${p.id}-${i}`} p={p} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}
