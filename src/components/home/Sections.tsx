import Link from "next/link";
import clsx from "clsx";
import { FaArrowRight, FaArrowUpFromBracket, FaSliders, FaPaperPlane, FaInstagram, FaLinkedin, FaWhatsapp, FaGithub } from "react-icons/fa6";
import { Container, SectionHeading } from "@/components/home/SectionHeading";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/fx/SpotlightCard";
import { NumberTicker } from "@/components/fx/NumberTicker";
import { Marquee } from "@/components/fx/Marquee";
import { Aurora } from "@/components/fx/Aurora";
import { PrivacyDiagram } from "@/components/home/PrivacyDiagram";
import { FaqList } from "@/components/home/FaqList";
import { HeroCtas } from "@/components/home/HeroCtas";
import { categories, tools, liveTools } from "@/lib/tools";
import { platforms } from "@/lib/platforms";

/* ───────────── How it works + real numbers ───────────── */

const steps = [
  { icon: FaArrowUpFromBracket, title: "Add a photo", text: "Use any photo from your phone or computer, including iPhone HEIC photos.", img: "/demo/swap-before.webp" },
  { icon: FaSliders, title: "Edit it", text: "Change the background, make a profile picture, hide faces and pick the right size.", img: "/demo/swap-after.webp" },
  { icon: FaPaperPlane, title: "Post it", text: "Save it at the right size, or share it straight to your apps.", img: "/demo/pfp-6.webp" },
];

export function HowItWorks() {
  const totalSizes = platforms.reduce((n, p) => n + p.presets.length, 0);
  const stats = [
    { value: liveTools.length, label: "free tools" },
    { value: platforms.length, label: "platforms" },
    { value: totalSizes, label: "exact sizes" },
    { value: 0, label: "photos uploaded", suffix: "" },
  ];
  return (
    <section className="cv-auto py-24 lg:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <SectionHeading
              align="left"
              eyebrow="How it works"
              dot="bg-sky"
              title={
                <>
                  From your camera roll to your feed in <span className="brand-text">three steps.</span>
                </>
              }
            />
          </div>
          <Reveal className="lg:col-span-5" delay={0.1}>
            <ul className="grid grid-cols-4 gap-2 rounded-[28px] bg-white p-2 shadow-card ring-1 ring-line">
              {stats.map((s) => (
                <li key={s.label} className="rounded-2xl bg-paper px-3 py-4 text-center">
                  <NumberTicker value={s.value} className="block font-display text-3xl font-extrabold tracking-tight" />
                  <span className="mt-0.5 block text-[11px] font-bold uppercase leading-tight tracking-wider text-ink-soft">{s.label}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Stagger className="mt-14 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <StaggerItem key={s.title}>
              <SpotlightCard className="h-full rounded-[32px] bg-white shadow-card ring-1 ring-black/[0.04]">
                <div className="relative h-56 overflow-hidden rounded-t-[32px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img decoding="async" src={s.img} alt="" loading="lazy" className="h-full w-full object-cover object-[50%_25%] transition-transform duration-700 group-hover/spot:scale-105" />
                  <span className="absolute left-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white font-display text-xl font-black shadow-card">{i + 1}</span>
                </div>
                <div className="p-7">
                  <s.icon aria-hidden className="text-xl text-violet" />
                  <h3 className="mt-4 font-display text-[26px] font-black tracking-[-0.02em]">{s.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-ink-soft sm:text-[17px]">{s.text}</p>
                </div>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}

/* ───────────── Wall of results ───────────── */

const wallTop = ["/demo/pfp-1.webp", "/demo/hero-after.webp", "/demo/pfp-3.webp", "/demo/swap-after.webp", "/demo/pfp-5.webp", "/demo/blurbg-after.webp", "/demo/pfp-7.webp"];
const wallBottom = ["/demo/group-stickers.webp", "/demo/pfp-2.webp", "/demo/cutout-after.webp", "/demo/pfp-4.webp", "/demo/group-pixel.webp", "/demo/pfp-6.webp", "/demo/pfp-8.webp"];

export function ResultsWall() {
  return (
    <section aria-label="Made with Social9" className="cv-auto overflow-hidden py-6">
      <div className="space-y-5">
        <Marquee speed={55}>
          {wallTop.map((src) => (
            <WallTile key={src} src={src} />
          ))}
        </Marquee>
        <Marquee speed={65} reverse>
          {wallBottom.map((src) => (
            <WallTile key={src} src={src} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}

function WallTile({ src }: { src: string }) {
  const wide = src.includes("group");
  return (
    <div className={clsx("relative h-56 shrink-0 overflow-hidden rounded-[28px] ring-1 ring-black/5 transition-transform duration-500 hover:-rotate-2 hover:scale-[1.03]", wide ? "w-84" : src.includes("pfp") ? "w-56" : "w-44", src.includes("cutout") && "checker")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img decoding="async" src={src} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
    </div>
  );
}

/* ───────────── All tools ───────────── */

const toolBadge: Record<string, string> = {
  "remove-exif": "GPS removed",
  convert: "HEIC → JPG",
  compress: "4.2 MB → 380 KB",
  fit: "16:9 · blurred fill",
  resize: "9:16 Story",
  "object-remover": "Person removed",
  upscale: "Up to 4× bigger",
  grid: "3 × 3 grid",
};

/** Where each card's picture is cropped, when the top isn't the interesting part. */
const thumbPosition: Record<string, string> = { "object-remover": "object-[50%_72%]", text: "object-bottom", grid: "object-center" };

const toolThumb: Record<string, string> = {
  "remove-bg": "/demo/cutout-after.webp",
  "change-bg": "/demo/swap-after.webp",
  "blur-bg": "/demo/blurbg-after.webp",
  pfp: "/demo/pfp-4.webp",
  resize: "/demo/resize-source.webp",
  fit: "/demo/fit-demo.webp",
  "blur-faces": "/demo/group-blur.webp",
  "face-stickers": "/demo/group-stickers.webp",
  "remove-exif": "/reel/resize.webp",
  convert: "/demo/pfp-2.webp",
  compress: "/demo/pfp-8.webp",
  "object-remover": "/demo/erase-after.webp",
  upscale: "/demo/upscale-after.webp",
  text: "/demo/text-after.webp",
  grid: "/backdrops/mountains.jpg",
};

export function ToolsSection() {
  const soon = tools.filter((t) => t.tier === "soon");
  return (
    <section id="tools" className="cv-auto scroll-mt-20 bg-white py-24 lg:py-28">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeading
            align="left"
            eyebrow="Every tool"
            dot="bg-tangerine"
            title={
              <>
                Use one tool, <span className="brand-text">or use them all.</span>
              </>
            }
          />
          <Reveal delay={0.1}>
            <Link href="/editor" className="group inline-flex items-center gap-2 font-bold">
              Open the editor
              <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-white transition-transform duration-300 group-hover:translate-x-1">
                <FaArrowRight aria-hidden className="text-xs" />
              </span>
            </Link>
          </Reveal>
        </div>

        <Stagger className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" gap={0.05}>
          {liveTools.map((t) => {
            const cat = categories[t.category];
            return (
              <StaggerItem key={t.id}>
                <SpotlightCard className="h-full rounded-[28px] bg-paper shadow-card ring-1 ring-black/[0.04] transition-transform duration-500 hover:-translate-y-1">
                  <Link href={`/${t.slug}`} className="block h-full p-2">
                    <div className={clsx("relative aspect-[4/3] overflow-hidden rounded-[22px]", t.id === "remove-bg" ? "checker" : cat.soft)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img decoding="async" src={toolThumb[t.id]} alt="" loading="lazy" className={clsx("h-full w-full object-cover transition-transform duration-700 ease-out group-hover/spot:scale-[1.06]", thumbPosition[t.id] ?? "object-top")} />
                      <span className={clsx("absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-xl bg-white/90 shadow-card", cat.text)}>
                        <t.icon aria-hidden />
                      </span>
                      {toolBadge[t.id] && <span className="absolute bottom-3 left-3 hidden rounded-full sm:inline bg-black/60 px-2.5 py-1 text-xs font-bold text-white">{toolBadge[t.id]}</span>}
                    </div>
                    <div className="flex items-start justify-between gap-3 px-2 pb-2 pt-3 sm:px-3 sm:pb-3 sm:pt-4">
                      <div>
                        <h3 className="font-display text-base font-black leading-tight tracking-[-0.02em] sm:text-xl">{t.name}</h3>
                        <p className="mt-1 hidden text-sm leading-relaxed text-ink-soft sm:block">{t.blurb}</p>
                      </div>
                      <FaArrowRight aria-hidden className="mt-1.5 shrink-0 -translate-x-1 text-sm opacity-0 transition-all duration-300 group-hover/spot:translate-x-0 group-hover/spot:opacity-100" />
                    </div>
                  </Link>
                </SpotlightCard>
              </StaggerItem>
            );
          })}
          {soon.length > 0 && (
          <StaggerItem className="col-span-2 lg:col-span-1">
            <div className="flex h-full flex-col rounded-[28px] border-2 border-dashed border-line p-6">
              <p className="font-display text-[22px] font-black tracking-[-0.02em]">Coming soon</p>
              <ul className="mt-5 flex-1 space-y-3">
                {soon.map((t) => (
                  <li key={t.id} className="flex items-center gap-3">
                    <span className={clsx("grid h-9 w-9 place-items-center rounded-xl", categories[t.category].soft, categories[t.category].text)}>
                      <t.icon aria-hidden />
                    </span>
                    <span className="font-bold">{t.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </StaggerItem>
          )}
        </Stagger>
      </Container>
    </section>
  );
}

/* ───────────── Privacy promise ───────────── */

const promises = [
  { lead: "No uploads.", text: "Your photos are edited on your own phone or computer. They are never sent to us or anyone else." },
  { lead: "No account.", text: "There is nothing to sign up for, so we hold no personal details that could leak." },
  { lead: "No hidden location.", text: "Photos often contain the place where they were taken. We remove it when you save." },
  { lead: "Nothing is kept.", text: "When you close the tab, your photos are gone. We never keep a copy." },
];

export function PrivacySection() {
  return (
    <section id="privacy" className="cv-auto scroll-mt-20 px-3 py-6 sm:px-4">
      <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[40px] bg-ink px-6 py-20 text-white sm:px-12 lg:py-28">
        <Aurora className="opacity-30" />
        <Container className="relative grid gap-14 px-0! xl:grid-cols-12 xl:items-center">
          <div className="max-w-2xl xl:col-span-5">
            <SectionHeading
              align="left"
              dark
              title={
                <>
                  Your photos stay <span className="text-lime">yours.</span>
                </>
              }
              text="Most photo websites upload your pictures to their servers. Social9 doesn't. Your photos stay on your device, so no one else sees them, including us."
            />
            <dl className="mt-10 divide-y divide-white/10 border-y border-white/10">
              {promises.map((p) => (
                <div key={p.lead} className="py-4">
                  <dt className="inline font-display text-lg font-black text-white">{p.lead} </dt>
                  <dd className="inline text-[17px] text-white/60">{p.text}</dd>
                </div>
              ))}
            </dl>
            <Link href="/how-it-works" className="group mt-8 inline-flex items-center gap-3 rounded-full bg-white/10 py-2 pl-2 pr-5 font-bold text-white ring-1 ring-white/15 transition hover:bg-white/15">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink">
                <FaGithub aria-hidden />
              </span>
              See how it works, and check the code
              <FaArrowRight aria-hidden className="text-sm transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <Reveal className="xl:col-span-7" delay={0.1}>
            <PrivacyDiagram />
          </Reveal>
        </Container>
      </div>
    </section>
  );
}

/* ───────────── FAQ ───────────── */

const faqs = [
  { q: "Is Social9 free?", a: "Yes. Every tool is free. There is no sign-up, no credits and no watermark." },
  { q: "Do you upload or store my photos?", a: "No. The AI runs in your browser, on your own device. Your photos are never sent to a server, and nothing is kept after you close the tab." },
  { q: "Why is the first edit slower?", a: "The first time you use an AI tool, such as background removal, your browser downloads it. It is then saved on your device, so next time it starts straight away and also works offline." },
  { q: "Which photo formats can I use?", a: "You can open JPG, PNG, WebP, AVIF and iPhone HEIC photos. You can save as JPG, PNG, WebP, PDF, AVIF, GIF, BMP, TIFF, ICO or SVG, and choose an exact file size in KB." },
  { q: "Does it work on my phone?", a: "Yes. Social9 works in modern mobile browsers. After saving, you can share your photo straight to Instagram, WhatsApp and other apps." },
  { q: "Can I install it like an app?", a: "Yes. On your phone, use Add to Home Screen. On a computer, use the install button in your browser's address bar." },
];

export function FaqSection() {
  return (
    <section id="faq" className="cv-auto scroll-mt-20 py-24 lg:py-28">
      <Container className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading
            align="left"
            eyebrow="FAQ"
            title={
              <>
                Frequently asked <span className="brand-text">questions</span>
              </>
            }
            text="Answers to common questions about Social9."
          />
          <Reveal delay={0.1} className="mt-10 hidden rounded-[28px] bg-white p-6 shadow-card ring-1 ring-line lg:block">
            <div className="flex -space-x-3">
              {[3, 1, 6, 4].map((n) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img decoding="async" key={n} src={`/demo/pfp-${n}.webp`} alt="" className="h-12 w-12 rounded-full object-cover ring-4 ring-white" />
              ))}
            </div>
            <p className="mt-4 font-display text-[22px] font-black tracking-tight">Still have questions?</p>
            <p className="mt-1 text-[15px] text-ink-soft">The quickest way to find out is to try it with one of our sample photos.</p>
            <Link href="/editor" className="group mt-5 inline-flex items-center gap-2 font-bold text-violet">
              Open the editor <FaArrowRight aria-hidden className="text-sm transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
        <Reveal className="lg:col-span-7" delay={0.05}>
          <FaqList items={faqs} />
        </Reveal>
      </Container>
    </section>
  );
}

/* ───────────── Final call to action ───────────── */

export function FinalCta() {
  const faces = ["/demo/pfp-3.webp", "/demo/pfp-5.webp", "/demo/pfp-1.webp", "/demo/pfp-6.webp", "/demo/pfp-4.webp", "/demo/pfp-2.webp", "/demo/pfp-7.webp"];
  return (
    <section className="cv-auto px-3 pb-6 sm:px-4">
      <div className="grain relative mx-auto max-w-[1400px] overflow-hidden rounded-[40px] bg-[linear-gradient(120deg,#6d4aff,#ff4fa3_65%,#ff8a3d)] px-6 py-24 text-center text-white sm:px-10">
        <Aurora className="opacity-50 mix-blend-soft-light" />
        <Reveal className="relative">
          <div className="mx-auto flex w-fit -space-x-4">
            {faces.map((f, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                decoding="async"
                key={f}
                src={f}
                alt=""
                className="h-16 w-16 rounded-full object-cover ring-4 ring-white/30 transition-transform duration-300 hover:z-10 hover:-translate-y-2 hover:scale-110 sm:h-20 sm:w-20"
                style={{ transform: `translateY(${[6, -4, 2, -8, 2, -4, 6][i]}px)` }}
              />
            ))}
          </div>
          <h2 className="mx-auto mt-10 max-w-3xl headline-dark font-display text-[48px] font-black leading-[0.93] tracking-[-0.032em] sm:text-[80px]">Ready to edit your photo?</h2>
          <p className="mx-auto mt-5 max-w-lg text-lg text-white/85">Add a photo and get it ready for any platform in under a minute. It is free and private, and you don&apos;t need to sign up.</p>
          <div className="mt-10 flex justify-center">
            <HeroCtas light />
          </div>
          <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-white/80">
            <li className="flex items-center gap-2"><FaInstagram aria-hidden /> Instagram</li>
            <li className="flex items-center gap-2"><FaLinkedin aria-hidden /> LinkedIn</li>
            <li className="flex items-center gap-2"><FaWhatsapp aria-hidden /> WhatsApp</li>
            <li>and {platforms.length - 3} more</li>
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
