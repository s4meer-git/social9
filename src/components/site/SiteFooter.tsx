import Link from "next/link";
import clsx from "clsx";
import { FaArrowRight, FaEnvelope, FaUniversalAccess, FaCookieBite, FaShieldHalved, FaHeadset, FaArrowUpRightFromSquare } from "react-icons/fa6";
import { SiUnsplash, SiOnnx, SiHuggingface, SiOpencv, SiNextdotjs, SiWebassembly, SiWebgpu } from "react-icons/si";
import { Logo } from "@/components/brand/Logo";
import { Tooltip } from "@/components/ui/Tooltip";
import { toolGroups } from "@/lib/tools";
import { platforms } from "@/lib/platforms";
import { SITE, mailto } from "@/lib/site";

const brandHover: Record<string, string> = {
  instagram: "hover:bg-[radial-gradient(circle_at_30%_110%,#feda75,#fa7e1e_35%,#d62976_60%,#962fbf_85%)]",
  linkedin: "hover:bg-[#0a66c2]",
  x: "hover:bg-ink",
  facebook: "hover:bg-[#1877f2]",
  youtube: "hover:bg-[#ff0000]",
  tiktok: "hover:bg-ink",
  pinterest: "hover:bg-[#e60023]",
  whatsapp: "hover:bg-[#25d366]",
};

/** EU-style ring of stars, line-art for the GDPR mark. */
function StarsRing() {
  return (
    <svg viewBox="0 0 40 40" className="h-6 w-6" aria-hidden fill="currentColor">
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <circle key={i} cx={20 + Math.cos(a) * 14} cy={20 + Math.sin(a) * 14} r="2.6" />;
      })}
    </svg>
  );
}

/** 24-spoke wheel, line-art for India's DPDP Act. */
function Wheel() {
  return (
    <svg viewBox="0 0 40 40" className="h-6 w-6" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="20" cy="20" r="16" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI;
        return <line key={i} x1={20 - Math.cos(a) * 16} y1={20 - Math.sin(a) * 16} x2={20 + Math.cos(a) * 16} y2={20 + Math.sin(a) * 16} strokeWidth="1.2" />;
      })}
      <circle cx="20" cy="20" r="3" fill="currentColor" />
    </svg>
  );
}

const badges = [
  { title: "GDPR", sub: "No personal data collected", art: <StarsRing /> },
  { title: "CCPA / CPRA", sub: "We never sell or share data", art: <span className="font-display text-[15px] font-black tracking-tight">CA</span> },
  { title: "DPDP Act 2023", sub: "India’s data protection law", art: <Wheel /> },
  { title: "WCAG 2.2 AA", sub: "Designed for everyone", art: <FaUniversalAccess aria-hidden className="text-[22px]" /> },
  {
    title: "No tracking cookies",
    sub: "No ads, no profiling",
    art: (
      <span className="relative grid place-items-center">
        <FaCookieBite aria-hidden className="text-[20px]" />
        <span className="absolute h-[2px] w-7 rotate-45 rounded bg-current ring-2 ring-white" />
      </span>
    ),
  },
  { title: "On-device AI", sub: "Photos are never uploaded", art: <FaShieldHalved aria-hidden className="text-[20px]" /> },
];

const tech = [
  { icon: SiHuggingface, label: "Hugging Face", role: "Where the open AI models come from", href: "https://huggingface.co" },
  { icon: SiOnnx, label: "ONNX Runtime", role: "Runs the AI in your browser", href: "https://onnxruntime.ai" },
  { icon: SiOpencv, label: "OpenCV", role: "Face detection model", href: "https://opencv.org" },
  { icon: SiWebgpu, label: "WebGPU", role: "Uses your graphics chip", href: "https://www.w3.org/TR/webgpu/" },
  { icon: SiWebassembly, label: "WebAssembly", role: "Lets the AI run fast in any browser", href: "https://webassembly.org" },
  { icon: SiNextdotjs, label: "Next.js", role: "The app itself", href: "https://nextjs.org" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-auto overflow-hidden bg-white pt-20">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        {/* top: support band */}
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/support" className="group flex items-center gap-5 rounded-[28px] bg-paper p-6 ring-1 ring-black/[0.04] transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-violet text-2xl text-white shadow-pop transition-transform group-hover:-rotate-6">
              <FaHeadset aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block font-display text-[22px] font-black tracking-[-0.02em]">Need a hand?</span>
              <span className="block text-[15px] text-ink-soft">Guides, troubleshooting and a real person to talk to.</span>
            </span>
            <FaArrowRight aria-hidden className="transition-transform group-hover:translate-x-1" />
          </Link>
          <a href={mailto(SITE.supportEmail, "Social9 support")} className="group flex items-center gap-5 rounded-[28px] bg-ink p-6 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-float">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl text-lime transition-transform group-hover:-rotate-6">
              <FaEnvelope aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block font-display text-[22px] font-black tracking-[-0.02em]">Email support</span>
              <span className="block text-[15px] text-white/65">{SITE.supportEmail} · replies within one working day</span>
            </span>
            <FaArrowRight aria-hidden className="transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {/* link columns */}
        <div className="mt-16 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Logo />
            <p className="mt-5 max-w-xs text-base leading-relaxed text-ink-soft">A free photo editor for social media. It runs in your browser, so your photos never leave your device.</p>
            <Link href="/editor" className="group mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[15px] font-bold text-white shadow-pop transition-transform hover:-translate-y-0.5">
              Start editing <FaArrowRight aria-hidden className="text-xs transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          {/* tools, grouped exactly like the menu and the editor */}
          <div className="lg:col-span-6">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-ink-soft">Tools</h2>
            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3">
              {toolGroups.map(({ cat, items }) => (
                <div key={cat.id}>
                  <p className="text-[13px] font-bold text-ink">{cat.name}</p>
                  <ul className="mt-2.5 space-y-2.5 text-[15px] font-semibold">
                    {items.map((t) => (
                      <li key={t.id}>
                        <Link href={`/${t.slug}`} className="group relative text-ink/70 transition-colors hover:text-ink">
                          {t.name}
                          <span className="absolute -bottom-0.5 left-0 h-[2px] w-0 rounded-full bg-violet transition-all duration-300 group-hover:w-full" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:col-span-3">
            <FooterList title="Platforms" items={platforms.map((p) => ({ href: `/platforms/${p.id}`, label: p.name }))} />
            <div className="space-y-10">
              <FooterList
                title="Support"
                items={[
                  { href: "/support", label: "Help center" },
                  { href: "/how-it-works", label: "How it works" },
                  { href: SITE.github, label: "Source code (GitHub)" },
                  { href: "/support#troubleshooting", label: "Troubleshooting" },
                  { href: "/support#install", label: "Install the app" },
                  { href: mailto(SITE.supportEmail, "Bug report"), label: "Report a bug" },
                ]}
              />
              <FooterList
                title="Legal"
                items={[
                  { href: "/privacy-policy", label: "Privacy policy" },
                  { href: "/terms", label: "Terms of service" },
                  { href: "/cookies", label: "Cookie policy" },
                  { href: "/accessibility", label: "Accessibility" },
                  { href: "/licenses", label: "Licenses & credits" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* works with */}
        <div className="mt-16 rounded-[28px] bg-paper p-6 ring-1 ring-black/[0.04] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="font-display text-[22px] font-black tracking-[-0.02em]">Sizes for every platform</p>
              <p className="text-[15px] text-ink-soft">Exact, up-to-date sizes for {platforms.length} platforms.</p>
            </div>
            <ul className="flex flex-wrap gap-2.5">
              {platforms.map((p) => (
                <li key={p.id}>
                  <Tooltip label={`${p.name} sizes`}>
                    <Link href={`/platforms/${p.id}`} aria-label={`${p.name} sizes`} className={clsx("grid h-12 w-12 place-items-center rounded-2xl bg-white text-xl text-ink/45 ring-1 ring-line transition-all duration-300 hover:-translate-y-1 hover:-rotate-6 hover:text-white hover:shadow-card hover:ring-transparent", brandHover[p.id])}>
                      <p.icon aria-hidden />
                    </Link>
                  </Tooltip>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* open source: the tech that makes on-device AI possible */}
        <div className="mt-6 grid gap-8 rounded-[32px] bg-paper p-6 ring-1 ring-black/[0.04] sm:p-8 lg:grid-cols-12 lg:gap-10 lg:p-10">
          <div className="lg:col-span-4">
            <p className="font-display text-[30px] font-black leading-[1.05] tracking-[-0.025em]">Powered by open source</p>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">
              Social9 is built on open-source software. The AI models and the program that runs them are free and open, and they run on your device.
            </p>
            <p className="mt-4 text-[14px] text-ink-soft">
              <span className="font-bold text-ink">AI models:</span> MODNet, ISNet and YuNet.
            </p>
            <Link href="/licenses" className="group mt-5 inline-flex items-center gap-2 text-[15px] font-bold text-ink">
              Licenses & credits <FaArrowRight aria-hidden className="text-xs transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-8">
            {tech.map((t) => (
              <li key={t.label}>
                <a
                  href={t.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex h-full flex-col gap-4 rounded-[22px] bg-white p-5 ring-1 ring-black/[0.05] transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
                >
                  <t.icon aria-hidden className="text-[30px] text-ink/40 transition-colors duration-300 group-hover:text-ink" />
                  <span>
                    <span className="flex items-center gap-1.5 font-display text-[17px] font-black tracking-[-0.01em]">
                      {t.label}
                      <FaArrowUpRightFromSquare aria-hidden className="text-[10px] text-ink-soft opacity-0 transition-opacity group-hover:opacity-100" />
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-ink-soft">{t.role}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* privacy & standards: quiet, monochrome */}
        <div className="mt-6 overflow-hidden rounded-[28px] ring-1 ring-line">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line px-6 py-4">
            <p className="text-[13px] font-bold uppercase tracking-wider text-ink-soft">Privacy & standards</p>
            <p className="text-[13px] text-ink-soft">
              How Social9 is built and run, not third-party certifications.{" "}
              <Link href="/privacy-policy" className="font-bold text-ink underline decoration-ink/25 underline-offset-[5px] decoration-[1.5px] hover:decoration-ink">
                Privacy policy
              </Link>
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-px bg-line md:grid-cols-3 lg:grid-cols-6">
            {badges.map((b) => (
              <li key={b.title} className="flex flex-col gap-3 bg-white p-5">
                <span className="grid h-11 w-11 place-items-center rounded-full text-ink/65 ring-1 ring-line">{b.art}</span>
                <span>
                  <span className="block text-[14px] font-black leading-tight text-ink/80">{b.title}</span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-soft">{b.sub}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* thanks, Unsplash */}
        <div className="mt-6 flex items-center gap-4 rounded-[24px] bg-paper p-5 ring-1 ring-black/[0.04]">
          <a href="https://unsplash.com/?utm_source=social9&utm_medium=referral" target="_blank" rel="noreferrer" aria-label="Unsplash" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink text-xl text-white transition-transform hover:-rotate-6">
            <SiUnsplash aria-hidden />
          </a>
          <p className="flex-1 text-[15px] leading-snug">
            <span className="font-black">Thank you, Unsplash.</span> <span className="text-ink-soft">All the photos on this site come from the Unsplash community of photographers.</span>{" "}
            <Link href="/licenses#photos" className="inline-flex items-center gap-1 font-bold text-violet-deep hover:underline">
              See credits <FaArrowUpRightFromSquare aria-hidden className="text-[11px]" />
            </Link>
          </p>
        </div>

        {/* bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 text-[14px] text-ink-soft lg:flex-row lg:items-center lg:justify-between">
          <p>
            © {year} {SITE.name}. All rights reserved. Made with care in India.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 font-semibold">
            {[
              ["/privacy-policy", "Privacy"],
              ["/terms", "Terms"],
              ["/cookies", "Cookies"],
              ["/accessibility", "Accessibility"],
              ["/licenses", "Licenses"],
              ["/support", "Support"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="hover:text-ink">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-4 max-w-4xl text-[12px] leading-relaxed text-ink-soft">
          Instagram, Facebook, WhatsApp, LinkedIn, X, YouTube, TikTok and Pinterest are trademarks of their respective owners. Social9 is an independent tool and is not affiliated with, sponsored or endorsed by any of them.
        </p>
      </div>

      {/* giant wordmark */}
      <p aria-hidden className="pointer-events-none mt-[calc(2.5rem-0.18em)] select-none bg-[linear-gradient(180deg,rgb(109_74_255/0.16),rgb(255_79_163/0.03))] bg-clip-text pt-[0.18em] text-center font-display text-[24vw] font-black leading-[0.72] tracking-[-0.05em] text-transparent">
        social9
      </p>
    </footer>
  );
}

function FooterList({ title, items, cols = false, className }: { title: string; items: { href: string; label: string }[]; cols?: boolean; className?: string }) {
  return (
    <div className={className}>
      <h2 className="text-[13px] font-bold uppercase tracking-wider text-ink-soft">{title}</h2>
      <ul className={clsx("mt-5 grid gap-x-6 gap-y-3 text-[15px] font-semibold", cols && "grid-cols-2")}>
        {items.map((i) => (
          <li key={i.label}>
            <Link href={i.href} className="group relative text-ink/75 transition-colors hover:text-ink">
              {i.label}
              <span className="absolute -bottom-0.5 left-0 h-[2px] w-0 rounded-full bg-violet transition-all duration-300 group-hover:w-full" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
