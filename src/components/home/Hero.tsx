"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { FaArrowUpFromBracket, FaArrowRight } from "react-icons/fa6";
import { Button, ButtonLink } from "@/components/ui/Button";
import { BeforeAfter } from "@/components/ui/BeforeAfter";
import { Container } from "@/components/home/SectionHeading";
import { SampleRow } from "@/components/home/UploadCard";
import { usePhotoPicker } from "@/components/home/usePhotoPicker";
import { doodlePattern } from "@/lib/doodles";
import { FlipWords } from "@/components/fx/FlipWords";
import { TiltCard } from "@/components/fx/TiltCard";
import { PlatformFlow } from "@/components/home/PlatformFlow";

const avatars = ["/demo/pfp-1.webp", "/demo/pfp-6.webp", "/demo/pfp-4.webp", "/demo/pfp-5.webp"];

export function Hero() {
  const { open, trySample, busy, error, inputProps } = usePhotoPicker();
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const yPhoto = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);
  const yCardA = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60]);
  const yCardB = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 150]);

  return (
    <section ref={sectionRef} className="relative -mt-[72px] overflow-hidden pt-[72px]">
      {/* backdrop: soft brand glows over a faint grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,#000_35%,transparent_85%)]"
        style={{ backgroundImage: doodlePattern(), backgroundSize: "440px 440px", backgroundPosition: "center top" }}
      />
      {/* platform names drifting along a looping curve, barely there */}
      <PlatformFlow decorative fontSize={26} zoom={1.3} maxScale={1.7} minScale={0.95} focus={0.5} speed={55} tone="text-ink/[0.09]" className="pointer-events-none absolute inset-x-0 top-[46%] -translate-y-1/2 overflow-hidden" />
      <div aria-hidden className="pointer-events-none absolute -top-80 right-[calc(-8%-130px)] h-[900px] w-[900px] bg-[radial-gradient(closest-side,rgb(109_74_255/0.22),rgb(109_74_255/0.08)_45%,transparent)]" />
      <div aria-hidden className="pointer-events-none absolute -left-[290px] top-[94px] h-[720px] w-[720px] bg-[radial-gradient(closest-side,rgb(255_79_163/0.18),rgb(255_79_163/0.06)_45%,transparent)]" />

      <Container className="relative grid items-center gap-16 pb-24 pt-10 sm:pt-14 lg:grid-cols-12 lg:gap-8 lg:pb-32 lg:pt-16">
        <div className="lg:col-span-6">

          <h1 className="rise-solid headline font-display text-[56px] font-black leading-[0.92] tracking-[-0.035em] sm:text-[80px] xl:text-[96px]">
            Make every photo
            <br />
            <FlipWords
              words={["post-ready.", "feed-ready.", "story-ready.", "profile-ready.", "reel-ready."]}
              colors={["text-violet", "text-pink", "text-sky-500", "text-tangerine", "text-violet"]}
            />
          </h1>

          <p style={{ animationDelay: "0.16s" }} className="rise mt-7 max-w-[36rem] text-xl font-medium leading-relaxed text-ink-soft sm:text-[22px]">
            Remove backgrounds, make profile pictures, blur faces and resize photos for any platform. It is free and works in your browser.
          </p>

          <div style={{ animationDelay: "0.24s" }} className="rise mt-9 flex flex-wrap items-center gap-3">
            <Button variant="brand" size="lg" onClick={open} icon={<FaArrowUpFromBracket aria-hidden className="group-hover/btn:-translate-y-0.5" />}>
              Upload a photo
            </Button>
            <ButtonLink href="/editor" variant="secondary" size="lg" trailing={<FaArrowRight aria-hidden className="text-sm" />}>
              Open editor
            </ButtonLink>
            <input {...inputProps} />
          </div>

          <div style={{ animationDelay: "0.32s" }} className="rise mt-8 flex flex-wrap items-center gap-4">
            <SampleRow trySample={trySample} busy={busy} size="h-12 w-12" />
            <p className="text-sm leading-snug text-ink-soft">
              <span className="font-bold text-ink">No photo?</span> Try a sample,
              <br />
              or drop a photo anywhere on this page.
            </p>
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm font-medium text-pink-deep">
              {error}
            </p>
          )}

          <p style={{ animationDelay: "0.4s" }} className="rise mt-10 max-w-lg border-t border-line pt-6 text-base text-ink-soft">
            It is free, with no sign-up and no watermark. <span className="font-bold text-ink">Your photos never leave your device</span>, and it also works offline.
          </p>
        </div>

        {/* result collage */}
        <div className="relative lg:col-span-6">
          <div className="relative mx-auto w-full max-w-[460px]">
            <div className="pop" style={{ animationDelay: "0.15s" }}>
              <motion.div style={{ y: yPhoto }}>
              <TiltCard max={5} className="rounded-[36px]">
              <BeforeAfter
                before="/demo/hero-before.webp"
                after="/demo/hero-after.webp"
                alt="Woman hugging her golden retriever, background replaced with a warm gradient"
                className="shadow-[0_40px_80px_-24px_rgb(109_74_255/0.45)] ring-1 ring-black/5"
                rounded="rounded-[36px]"
                priority
              />
              </TiltCard>
              </motion.div>
            </div>

            {/* profile picture card */}
            <div style={{ animationDelay: "0.55s" }} className="pop absolute -left-6 top-14 hidden sm:block lg:-left-24">
              <motion.div style={{ y: yCardA }}>
              <div className="w-60 animate-float rounded-3xl bg-white/95 p-4 shadow-float ring-1 ring-line">
                <div className="flex items-center gap-3">
                  <span className="holo rounded-full p-[3px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img decoding="async" src="/mock/aarav.webp" alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-white" />
                  </span>
                  <div>
                    <p className="font-display text-base font-black leading-tight">New profile picture</p>
                    <p className="text-xs font-semibold text-ink-soft">Instagram · 320 × 320</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex -space-x-2.5">
                    {avatars.map((a) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img decoding="async" key={a} src={a} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-white" />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-ink-soft">+8 styles</span>
                </div>
              </div>
              </motion.div>
            </div>

            {/* faces card */}
            <div style={{ animationDelay: "0.75s" }} className="pop absolute -bottom-12 -right-4 hidden sm:block lg:-right-16">
              <motion.div style={{ y: yCardB }}>
              <div className="w-64 rotate-2 animate-float rounded-3xl bg-white p-2 shadow-float ring-1 ring-line [animation-delay:-3.5s]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img decoding="async" src="/demo/group-stickers.webp" alt="Group photo with stickers over faces" className="aspect-[3/2] w-full rounded-2xl object-cover" />
                <div className="flex items-center justify-between px-2 pb-1 pt-2.5">
                  <span className="text-sm font-bold">3 faces covered</span>
                  <span className="text-xs font-semibold text-ink-soft">Ready to post</span>
                </div>
              </div>
              </motion.div>
            </div>

            {/* size chip */}
            <div style={{ animationDelay: "0.95s" }} className="pop absolute -left-4 bottom-24 hidden sm:block lg:-left-14">
              <div className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-white shadow-float">
                <span className="h-4 w-[13px] rounded-[3px] border-2 border-white" aria-hidden />
                Instagram · 1080 × 1350
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
