import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";
import { Container, SectionHeading } from "@/components/home/SectionHeading";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";

const moments = [
  { img: "/demo/moment-diwali.webp", title: "Diwali", line: "Hide the people who didn't want to be in the photo.", tools: ["Face stickers", "Story 9:16"], href: "/face-stickers" },
  { img: "/demo/moment-pets.webp", title: "Pets", line: "Cut out you and your dog, then add a new background.", tools: ["Remove background", "New background"], href: "/remove-background" },
  { img: "/demo/moment-grad.webp", title: "Graduation", line: "Resize your graduation photo for every platform.", tools: ["Resize", "Compress"], href: "/resize-image" },
  { img: "/demo/moment-work.webp", title: "Job search", line: "Make a professional profile picture for LinkedIn.", tools: ["Profile picture", "Blur background"], href: "/profile-picture-maker" },
];

/** Use cases told through real moments: tall photo cards that reveal the tools on hover. */
export function Moments() {
  return (
    <section className="cv-auto py-24 lg:py-28">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            align="left"
            eyebrow="Made for every moment"
            dot="bg-tangerine"
            title={
              <>
                Photos for <span className="brand-text">every occasion</span>
              </>
            }
          />
          <p className="max-w-sm text-lg font-medium text-ink-soft">Festivals, pets, graduations and job applications. Pick an occasion to get started.</p>
        </div>

        <Stagger className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4" gap={0.08}>
          {moments.map((m, i) => (
            <StaggerItem key={m.title} className={i % 2 === 1 ? "lg:translate-y-10" : ""}>
              <Link href={m.href} className="group relative block aspect-[3/4] overflow-hidden rounded-[32px] shadow-card ring-1 ring-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img decoding="async" src={m.img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.21,.47,.32,.98)] group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                  <h3 className="headline-dark font-display text-2xl font-black tracking-[-0.02em] sm:text-[30px]">{m.title}</h3>
                  <p className="mt-1.5 text-[15px] font-medium leading-snug text-white/85 sm:text-base">{m.line}</p>
                  <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.21,.47,.32,.98)] group-hover:grid-rows-[1fr]">
                    <div className="overflow-hidden">
                      <ul className="flex flex-wrap gap-1.5 pt-4">
                        {m.tools.map((t) => (
                          <li key={t} className="rounded-full bg-black/35 px-3 py-1 text-xs font-bold">
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <span className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-ink shadow-pop transition-all duration-500 group-hover:-rotate-45 group-hover:bg-white">
                  <FaArrowRight aria-hidden className="text-sm" />
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
