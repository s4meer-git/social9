import clsx from "clsx";
import { FaArrowRight, FaLinkedin, FaInstagram, FaXTwitter, FaWhatsapp } from "react-icons/fa6";
import { Container, SectionHeading } from "@/components/home/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { Aurora } from "@/components/fx/Aurora";
import { PhoneProfile } from "@/components/marketing/PhoneProfile";

const wall = [
  { src: "/demo/pfp-2.webp", ring: "holo", cls: "left-[2%] top-[4%] h-24 w-24", delay: "0s" },
  { src: "/demo/pfp-3.webp", ring: "bg-white/20", cls: "left-[8%] top-[44%] h-20 w-20", delay: "-2s" },
  { src: "/demo/pfp-5.webp", ring: "bg-lime", cls: "left-[0%] bottom-[4%] h-28 w-28", delay: "-4s" },
  { src: "/demo/pfp-4.webp", ring: "holo", cls: "right-[2%] top-[2%] h-28 w-28", delay: "-1s" },
  { src: "/demo/pfp-6.webp", ring: "bg-pink", cls: "right-[8%] top-[44%] h-20 w-20", delay: "-3s" },
  { src: "/demo/pfp-7.webp", ring: "bg-sky", cls: "right-[0%] bottom-[6%] h-24 w-24", delay: "-5s" },
];

const uses = [
  { icon: FaLinkedin, label: "LinkedIn", size: "400 × 400" },
  { icon: FaInstagram, label: "Instagram", size: "320 × 320" },
  { icon: FaXTwitter, label: "X", size: "400 × 400" },
  { icon: FaWhatsapp, label: "WhatsApp", size: "500 × 500" },
];


export function PfpSection() {
  return (
    <section className="cv-auto px-3 sm:px-4">
      <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[40px] bg-ink py-20 text-white lg:py-28">
        <Aurora className="opacity-35" />
        <Container className="relative grid items-center gap-16 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <SectionHeading
              align="left"
              dark
              dot="bg-pink"
              eyebrow="Profile picture maker"
              title={
                <>
                  One profile picture for <span className="brand-text">every platform</span>
                </>
              }
              text="Remove the background, add a gradient, center your face and add a ring. Each picture is sized correctly for its platform."
            />
            <Reveal delay={0.1}>
              <ul className="mt-9 grid grid-cols-2 gap-3 sm:max-w-md">
                {uses.map((u) => (
                  <li key={u.label} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] px-4 py-3 ring-1 ring-white/10 transition-colors hover:bg-white/10">
                    <u.icon aria-hidden className="text-xl" />
                    <span>
                      <span className="block text-sm font-bold">{u.label}</span>
                      <span className="block text-xs text-white/50">{u.size}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <ButtonLink href="/profile-picture-maker" variant="light" size="lg" className="mt-10" trailing={<FaArrowRight aria-hidden className="text-sm" />}>
                Make a profile picture
              </ButtonLink>
            </Reveal>
          </div>

          <Reveal className="relative mx-auto h-[680px] w-full max-w-[560px] lg:col-span-6" delay={0.15}>
            {wall.map((a) => (
              <span key={a.src} className={clsx("absolute hidden animate-float rounded-full p-[3px] shadow-[0_20px_40px_-12px_rgb(0_0_0/0.6)] sm:block", a.ring, a.cls)} style={{ animationDelay: a.delay }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img decoding="async" src={a.src} alt="" className="h-full w-full rounded-full object-cover ring-2 ring-ink" loading="lazy" />
              </span>
            ))}

            {/* phone */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <PhoneProfile />
            </div>
          </Reveal>
        </Container>
      </div>
    </section>
  );
}
