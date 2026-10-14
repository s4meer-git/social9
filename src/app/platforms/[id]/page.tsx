import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { FaArrowRight, FaChevronRight } from "react-icons/fa6";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { DropOverlay } from "@/components/home/DropOverlay";
import { HeroCtas } from "@/components/home/HeroCtas";
import { PageGlow } from "@/components/fx/PageGlow";
import { Container, SectionHeading } from "@/components/home/SectionHeading";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/fx/SpotlightCard";
import { platforms, platformById } from "@/lib/platforms";
import { categories, toolById } from "@/lib/tools";
import { ratioLabel } from "@social9/core/image/geometry";

export const dynamicParams = false;

export function generateStaticParams() {
  return platforms.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/platforms/[id]">): Promise<Metadata> {
  const { id } = await params;
  const p = platformById(id);
  if (!p) return {};
  return {
    title: `${p.name} image sizes and photo tools`,
    description: `All ${p.name} photo sizes in one place (${p.presets.map((x) => `${x.name} ${x.width}×${x.height}`).join(", ")}). Resize photos, remove backgrounds and make profile pictures for free.`,
    alternates: { canonical: `/platforms/${p.id}` },
  };
}

/** Sample photo used in each size card; tall frames use the full-body shot. */
const sampleFor = (w: number, h: number, i: number, id = "") => {
  if (/profile|dp/.test(id)) return ["/demo/pfp-9.webp", "/demo/pfp-1.webp", "/demo/pfp-2.webp"][i % 3];
  if (h / w > 1.4) return "/demo/resize-source.webp";
  if (w / h > 1.6) return "/demo/fit-demo.webp";
  return ["/demo/hero-after.webp", "/demo/pfp-9.webp", "/demo/swap-after.webp", "/demo/pfp-4.webp", "/demo/blurbg-after.webp"][i % 5];
};

export default async function PlatformPage({ params }: PageProps<"/platforms/[id]">) {
  const { id } = await params;
  const platform = platformById(id);
  if (!platform) notFound();
  const pinnedIds = [...new Set([...platform.pinnedTools, "pfp", "remove-bg", "resize", "compress"])];
  const pinned = pinnedIds.map(toolById).filter((t) => t && t.tier === "live").slice(0, 4);
  const fan = [...platform.presets].sort((a, b) => b.height / b.width - a.height / a.width).slice(0, 3);
  const others = platforms.filter((p) => p.id !== platform.id);

  return (
    <>
      <SiteNav />
      <DropOverlay preset={platform.presets[0].id} />
      <main className="relative overflow-x-clip">
        <PageGlow />
        <section className="relative">
          <Container className="relative pb-20 pt-8">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
              <Link href="/" className="hover:text-ink">Home</Link>
              <FaChevronRight aria-hidden className="text-[10px]" />
              <span>Platforms</span>
              <FaChevronRight aria-hidden className="text-[10px]" />
              <span className="text-ink">{platform.name}</span>
            </nav>
            <div className="mt-10 grid items-center gap-14 lg:grid-cols-12">
            <div className="rise lg:col-span-7">
              <span className={clsx("grid h-16 w-16 place-items-center rounded-3xl text-3xl shadow-card ring-1 ring-line", platform.tint)}>
                <platform.icon aria-hidden />
              </span>
              <h1 className="mt-7 headline font-display text-[52px] font-black leading-[0.93] tracking-[-0.032em] sm:text-[76px]">
                {platform.name} photos in <span className="brand-text">the right size</span>
              </h1>
              <p className="mt-6 max-w-xl text-xl font-medium leading-relaxed text-ink-soft sm:text-[22px]">{platform.tagline} Choose a size below, or drop a photo here to start.</p>
              <HeroCtas preset={platform.presets[0].id} className="mt-9 sm:items-center" />
            </div>
            <Reveal className="relative hidden h-[420px] lg:col-span-5 lg:block" delay={0.12}>
              {fan.map((p, i) => {
                const r = p.width / p.height;
                const box = [250, 215, 185][i];
                const w = r >= 1 ? box : box * r;
                const h = r >= 1 ? box / r : box;
                return (
                  <div
                    key={p.id}
                    className="absolute overflow-hidden rounded-[24px] bg-white p-2 shadow-float ring-1 ring-line transition-transform duration-500 hover:z-10 hover:scale-105"
                    style={{
                      width: w,
                      height: h,
                      left: ["46%", "4%", "26%"][i],
                      top: ["2%", "16%", "50%"][i],
                      rotate: `${[6, -7, 2][i]}deg`,
                      zIndex: [1, 2, 3][i],
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img decoding="async" src={sampleFor(p.width, p.height, i, p.id)} alt="" className="h-full w-full rounded-[18px] object-cover object-[50%_30%]" />
                    <span className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                      <platform.icon aria-hidden /> {p.name}
                    </span>
                  </div>
                );
              })}
            </Reveal>
            </div>

            {/* sizes */}
            <Stagger className={clsx("mt-16 grid grid-cols-2 gap-4 md:grid-cols-3", ["", "", "lg:grid-cols-2", "lg:grid-cols-3", "lg:grid-cols-4", "lg:grid-cols-5"][platform.presets.length])} gap={0.06}>
              {platform.presets.map((p, i) => (
                <StaggerItem key={p.id}>
                  <Link href={`/editor?tool=resize&preset=${p.id}`} className="group block h-full">
                    <SpotlightCard className="flex h-full flex-col rounded-[28px] bg-white p-3 shadow-card ring-1 ring-black/[0.04] transition-transform duration-500 group-hover:-translate-y-1">
                      <div className="h-52 rounded-[20px] bg-canvas bg-[radial-gradient(rgb(15_14_23/0.1)_1px,transparent_1.2px)] bg-size-[14px_14px] p-4">
                        {/* the frame is a size container, so the preview fits both its width and height at the real ratio */}
                        <div className="grid h-full w-full place-items-center [container-type:size]">
                        <div className="relative overflow-hidden rounded-lg shadow-float transition-transform duration-500 group-hover:scale-[1.04]" style={{ width: `min(100cqw, ${(p.width / p.height).toFixed(4)} * 100cqh)`, aspectRatio: `${p.width}/${p.height}` }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img decoding="async" src={sampleFor(p.width, p.height, i, p.id)} alt="" loading="lazy" className="h-full w-full object-cover object-[50%_30%]" />
                        </div>
                        </div>
                      </div>
                      <div className="flex flex-1 items-end justify-between gap-2 px-2 pb-1 pt-4">
                        <div>
                          <p className="font-display text-xl font-black leading-tight tracking-[-0.02em]">{p.name}</p>
                          <p className="text-sm font-semibold text-ink-soft">
                            {p.width} × {p.height} · {ratioLabel(p.width, p.height)}
                          </p>
                        </div>
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/5 transition-all duration-300 group-hover:bg-ink group-hover:text-white">
                          <FaArrowRight aria-hidden className="text-xs" />
                        </span>
                      </div>
                    </SpotlightCard>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>

            <Reveal className="mt-10 max-w-3xl">
              <p className="font-display text-2xl font-black leading-snug tracking-[-0.02em] sm:text-[28px]">
                <span className="brand-text">Tip:</span> {platform.tip}
              </p>
            </Reveal>
          </Container>
        </section>

        <section className="border-y border-line bg-white py-24">
          <Container>
            <SectionHeading align="left" eyebrow={`Best for ${platform.name}`} title={<>Popular tools for <span className="brand-text">{platform.name}</span></>} />
            <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {pinned.map((t) => (
                <StaggerItem key={t!.id}>
                  <Link href={`/${t!.slug}`} className="group flex h-full flex-col rounded-[28px] bg-paper p-6 shadow-card ring-1 ring-black/[0.04] transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
                    <span className={clsx("grid h-12 w-12 place-items-center rounded-2xl text-lg", categories[t!.category].soft, categories[t!.category].text)}>
                      {(() => {
                        const Icon = t!.icon;
                        return <Icon aria-hidden />;
                      })()}
                    </span>
                    <h3 className="mt-5 font-display text-[22px] font-black tracking-[-0.02em]">{t!.name}</h3>
                    <p className="mt-1.5 flex-1 text-base leading-relaxed text-ink-soft sm:text-[17px]">{t!.blurb}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-violet">
                      Open <FaArrowRight aria-hidden className="text-xs transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>

        <section className="py-24">
          <Container>
            <SectionHeading align="left" eyebrow="Other platforms" title="Sizes for other platforms" />
            <Stagger className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7" gap={0.04}>
              {others.map((p) => (
                <StaggerItem key={p.id}>
                  <Link href={`/platforms/${p.id}`} className="group flex flex-col items-center gap-3 rounded-[24px] bg-white p-5 shadow-card ring-1 ring-black/[0.04] transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
                    <span className={clsx("grid h-12 w-12 place-items-center rounded-2xl text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6", p.tint)}>
                      <p.icon aria-hidden />
                    </span>
                    <span className="text-sm font-bold">{p.name}</span>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
