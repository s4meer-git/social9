import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { FaArrowRight, FaCheck, FaChevronRight, FaPlus } from "react-icons/fa6";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { DropOverlay } from "@/components/home/DropOverlay";
import { HeroCtas } from "@/components/home/HeroCtas";
import { PageGlow } from "@/components/fx/PageGlow";
import { Container, SectionHeading } from "@/components/home/SectionHeading";
import { ToolVisual } from "@/components/marketing/ToolVisual";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/fx/SpotlightCard";
import { Aurora } from "@/components/fx/Aurora";
import { categories, liveTools, toolBySlug } from "@/lib/tools";
import { GridStudio } from "@/components/studio/GridStudio";
import { UpscaleStudio } from "@/components/studio/UpscaleStudio";
import { PfpStudio } from "@/components/studio/PfpStudio";
import { ConvertStudio } from "@/components/studio/ConvertStudio";

export const dynamicParams = false;

export function generateStaticParams() {
  return liveTools.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tool = toolBySlug(slug);
  if (!tool) return {};
  return {
    title: `${tool.headline} for free`,
    description: `${tool.intro} It is free, needs no sign-up and works offline.`,
    alternates: { canonical: `/${tool.slug}` },
  };
}

const stepTwo: Record<string, string> = {
  "remove-bg": "The background is removed automatically. Switch to HD for finer hair.",
  "change-bg": "Choose a color, a gradient, a scenic photo or a photo of your own.",
  "blur-bg": "Use the slider to choose how much to blur the background.",
  pfp: "Choose a platform, a background and a ring. Your face is centered for you.",
  resize: "Choose a platform size, then drag the photo to choose what stays in the frame.",
  fit: "Choose a size, then fill the empty space with a blur or a color.",
  "blur-faces": "Faces are found automatically. Tap any face you want to keep visible.",
  "face-stickers": "Choose a sticker. Tap any face you want to keep visible.",
  "remove-exif": "See the GPS location, date and camera details stored in the file.",
  convert: "Choose a format, then set the pixel size, print size or file size you need.",
  compress: "Choose a maximum size, a range or an exact size in KB. You see the result straight away.",
  "object-remover": "Brush over what you want to remove. It is removed when you lift your finger.",
  upscale: "Choose 2× or 4×. The AI makes your photo bigger and sharper.",
  text: "Type your text, pick a style and drag it into place.",
  grid: "Choose how many rows you want and drag the photo to frame it.",
};

export default async function ToolPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const tool = toolBySlug(slug);
  if (!tool) notFound();
  const related = liveTools.filter((t) => t.id !== tool.id && (t.category === tool.category || ["pfp", "resize", "remove-bg"].includes(t.id))).slice(0, 4);
  const steps = [
    { title: "Add your photo", text: "Upload, drag in or paste a photo. iPhone HEIC photos work too." },
    { title: tool.name, text: stepTwo[tool.id] },
    { title: "Save", text: "Download it at the right size, or share it straight to your apps." },
  ];
  // These jobs are one-screen tools, so their pages host the tool itself (docs/editor-architecture.md §7).
  const studio =
    tool.id === "pfp" ? <PfpStudio /> : tool.id === "convert" ? <ConvertStudio /> : tool.id === "compress" ? <ConvertStudio initial={{ size: "max", kb: 200 }} /> : tool.id === "grid" ? <GridStudio /> : tool.id === "upscale" ? <UpscaleStudio /> : null;
  const faq = [...tool.faq, { q: "Do I need an account?", a: "No. Open the tool and start editing. You don't need to sign up." }];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: `Social9 ${tool.name}`,
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        description: tool.intro,
      },
      { "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    ],
  };

  return (
    <>
      <SiteNav />
      <DropOverlay tool={tool.id} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="relative overflow-x-clip">
        <PageGlow />
        {studio ? (
          <section className="relative">
            <Container className="relative pb-20 pt-8 lg:pb-24">
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
                <Link href="/" className="hover:text-ink">Home</Link>
                <FaChevronRight aria-hidden className="text-[10px]" />
                <Link href="/#tools" className="hover:text-ink">Tools</Link>
                <FaChevronRight aria-hidden className="text-[10px]" />
                <span className="text-ink">{tool.name}</span>
              </nav>
              <div className="mt-8 max-w-3xl">
                <h1 className="rise-solid headline font-display text-[40px] font-black leading-[0.95] tracking-[-0.03em] sm:text-[58px]">{tool.headline}</h1>
                <p className="rise mt-4 text-lg font-medium leading-relaxed text-ink-soft sm:text-xl">{tool.intro}</p>
              </div>
              <div className="mt-10">{studio}</div>
            </Container>
          </section>
        ) : (
          <>
        {/* hero */}
        <section className="relative">
          <Container className="relative pb-24 pt-8 lg:pb-28">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
              <Link href="/" className="hover:text-ink">Home</Link>
              <FaChevronRight aria-hidden className="text-[10px]" />
              <Link href="/#tools" className="hover:text-ink">Tools</Link>
              <FaChevronRight aria-hidden className="text-[10px]" />
              <span className="text-ink">{tool.name}</span>
            </nav>
            <div className="mt-10 grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
              <div className="rise lg:col-span-6">
                                <h1 className="rise-solid headline font-display text-[52px] font-black leading-[0.93] tracking-[-0.032em] sm:text-[76px]">{tool.headline}</h1>
                <p className="mt-6 max-w-xl text-xl font-medium leading-relaxed text-ink-soft sm:text-[22px]">{tool.intro}</p>
                <HeroCtas tool={tool.id} className="mt-9 sm:items-center" />
                <p className="mt-10 max-w-lg border-t border-line pt-6 text-base text-ink-soft">
                  It is free and private. <span className="font-bold text-ink">Nothing is uploaded</span>, and it also works offline.
                </p>
              </div>
              <Reveal className="lg:col-span-6" delay={0.12}>
                <ToolVisual tool={tool} />
              </Reveal>
            </div>
          </Container>
        </section>

          </>
        )}

        {/* how to */}
        <section className="border-y border-line bg-white py-24">
          <Container>
            <SectionHeading eyebrow="How it works" title={<>How to {tool.name.toLowerCase()} <span className="brand-text">in 3 steps</span></>} />
            <Stagger className="mt-14 grid gap-4 md:grid-cols-3">
              {steps.map((s, i) => (
                <StaggerItem key={s.title}>
                  <SpotlightCard className="h-full rounded-[28px] bg-paper p-7 shadow-card ring-1 ring-black/[0.04]">
                    <span className="font-display text-6xl font-extrabold tracking-tighter text-ink/10">0{i + 1}</span>
                    <h3 className="mt-4 font-display text-[26px] font-black tracking-[-0.02em]">{s.title}</h3>
                    <p className="mt-2 text-base leading-relaxed text-ink-soft sm:text-[17px]">{s.text}</p>
                  </SpotlightCard>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        {/* features */}
        <section className="py-24">
          <Container className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionHeading align="left" eyebrow="Why Social9" title={<>Why use <span className="brand-text">Social9</span></>} text="Every edit is made on your device, at full quality, and you don't need an account." />
            </div>
            <Stagger className="grid gap-3 lg:col-span-7">
              {tool.features.map((f) => (
                <StaggerItem key={f.title}>
                  <div className="flex gap-4 rounded-[24px] bg-white p-6 shadow-card ring-1 ring-black/[0.04] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-ink text-sm text-white">
                      <FaCheck aria-hidden />
                    </span>
                    <div>
                      <h3 className="font-display text-[22px] font-black tracking-[-0.02em]">{f.title}</h3>
                      <p className="mt-1 text-base leading-relaxed text-ink-soft sm:text-[17px]">{f.text}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        {/* related */}
        <section className="bg-white py-24">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading align="left" eyebrow="Related tools" title="Keep editing the same photo" />
              <Link href="/#tools" className="group inline-flex items-center gap-2 font-bold">
                All tools <FaArrowRight aria-hidden className="text-sm transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((t) => (
                <StaggerItem key={t.id}>
                  <Link href={`/${t.slug}`} className="group flex h-full items-start gap-4 rounded-[24px] bg-paper p-5 shadow-card ring-1 ring-black/[0.04] transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
                    <span className={clsx("grid h-11 w-11 shrink-0 place-items-center rounded-2xl", categories[t.category].soft, categories[t.category].text)}>
                      <t.icon aria-hidden />
                    </span>
                    <span>
                      <span className="block font-display text-xl font-black tracking-[-0.02em]">{t.name}</span>
                      <span className="mt-1 block text-[15px] text-ink-soft">{t.blurb}</span>
                    </span>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        {/* faq */}
        <section className="py-24">
          <Container className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionHeading align="left" eyebrow="FAQ" title={<>Frequently asked <span className="brand-text">questions</span></>} />
            </div>
            <Stagger className="space-y-3 lg:col-span-7" gap={0.05}>
              {faq.map((f) => (
                <StaggerItem key={f.q}>
                  <details className="group rounded-3xl bg-white px-6 py-5 shadow-card ring-1 ring-black/[0.04] transition-shadow open:shadow-card [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xl font-bold">
                      {f.q}
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink/5 transition-all duration-300 group-open:rotate-45 group-open:bg-ink group-open:text-white">
                        <FaPlus aria-hidden className="text-xs" />
                      </span>
                    </summary>
                    <p className="mt-3 text-[17px] leading-relaxed text-ink-soft">{f.a}</p>
                  </details>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        {/* cta */}
        <section className="px-3 pb-6 sm:px-4">
          <div className="grain relative mx-auto max-w-[1400px] overflow-hidden rounded-[40px] bg-ink px-6 py-20 text-center text-white">
            <Aurora className="opacity-50" />
            <Reveal className="relative">
              <h2 className="mx-auto max-w-3xl headline-dark font-display text-[44px] font-black leading-[0.95] tracking-[-0.03em] sm:text-[68px]">Try {tool.name.toLowerCase()} now.</h2>
              <div className="mt-10 flex justify-center">
                <HeroCtas tool={tool.id} light />
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
