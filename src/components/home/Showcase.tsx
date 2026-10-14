"use client";

import { useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { FaArrowRight, FaCheck } from "react-icons/fa6";
import { BeforeAfter } from "@/components/ui/BeforeAfter";
import { ButtonLink } from "@/components/ui/Button";
import { categories, toolById } from "@/lib/tools";
import { Container, SectionHeading } from "@/components/home/SectionHeading";
import { ScrollScale } from "@/components/motion/ScrollScale";

const tabs = ["remove-bg", "change-bg", "pfp", "blur-faces", "blur-bg"] as const;
const ease = [0.21, 0.47, 0.32, 0.98] as const;

export function Showcase() {
  const [active, setActive] = useState<(typeof tabs)[number]>("remove-bg");
  const tool = toolById(active)!;
  const cat = categories[tool.category];
  const demo = tool.demo!;

  return (
    <section className="py-24 lg:py-28">
      <Container>
        <SectionHeading
          eyebrow="Real results"
          title={
            <>
              One photo, <span className="brand-text">many looks</span>
            </>
          }
          text="Drag the slider to compare. Every result here was made with Social9."
        />

        <div role="tablist" aria-label="Tools" className="mx-auto mt-12 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-white p-1.5 shadow-card ring-1 ring-line">
          {tabs.map((id) => {
            const t = toolById(id)!;
            const on = id === active;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={on}
                aria-controls="showcase-panel"
                onClick={() => setActive(id)}
                className={clsx("relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors", on ? "text-white" : "text-ink/65 hover:text-ink")}
              >
                {on && <motion.span layoutId="showcase-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <t.icon aria-hidden className="relative" />
                <span className="relative">{t.name}</span>
              </button>
            );
          })}
        </div>

        <ScrollScale from={0.94}>
        <div id="showcase-panel" role="tabpanel" className="mt-14 rounded-[40px] bg-white p-4 shadow-card ring-1 ring-line sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease }}
              className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12"
            >
              <div className="lg:col-span-7">
                <div className={clsx("mx-auto w-full", demo.ratio === "3/2" ? "max-w-[640px]" : "max-w-[420px]")}>
                  <BeforeAfter before={demo.before} after={demo.after} checker={demo.checker} ratio={demo.ratio} alt={tool.name} className="ring-1 ring-black/5" />
                </div>
              </div>
              <div className="px-2 pb-4 lg:col-span-5 lg:px-0 lg:pb-0">
                <span className={clsx("inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold", cat.soft, cat.text)}>
                  <tool.icon aria-hidden /> {cat.name}
                </span>
                <h3 className="mt-5 headline font-display text-[40px] font-black leading-[0.97] tracking-[-0.025em] sm:text-[52px]">{tool.headline}</h3>
                <p className="mt-5 text-xl font-medium leading-relaxed text-ink-soft">{tool.intro}</p>
                <ul className="mt-7 space-y-3.5">
                  {tool.features.map((f, i) => (
                    <motion.li key={f.title} className="flex gap-3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.07, duration: 0.4, ease }}>
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-[11px] text-white">
                        <FaCheck aria-hidden />
                      </span>
                      <span className="text-base leading-relaxed sm:text-[17px]">
                        <span className="font-bold">{f.title}.</span> <span className="text-ink-soft">{f.text}</span>
                      </span>
                    </motion.li>
                  ))}
                </ul>
                <ButtonLink href={`/${tool.slug}`} className="mt-9" trailing={<FaArrowRight aria-hidden className="text-sm" />}>
                  Try {tool.name.toLowerCase()}
                </ButtonLink>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        </ScrollScale>
      </Container>
    </section>
  );
}
