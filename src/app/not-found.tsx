import { PageGlow } from "@/components/fx/PageGlow";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ButtonLink } from "@/components/ui/Button";
import { liveTools } from "@/lib/tools";

export default function NotFound() {
  return (
    <>
      <SiteNav />
      <main className="relative overflow-x-clip">
        <PageGlow center />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-5 pb-24 pt-20 text-center">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img decoding="async" src="/demo/cutout-after.webp" alt="" loading="lazy" className="checker h-56 w-48 rounded-[32px] object-cover object-top shadow-float ring-1 ring-line" />
            <span className="absolute -right-6 -top-4 rotate-6 rounded-full bg-ink px-4 py-2 font-display text-xl font-black text-white shadow-pop">404</span>
          </div>
          <h1 className="mt-10 font-display text-[44px] font-extrabold leading-[0.95] tracking-[-0.04em] sm:text-6xl">
            Page <span className="brand-text">not found</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-ink-soft">We couldn’t find the page you were looking for. Try one of these instead.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/" variant="brand" size="lg">Back home</ButtonLink>
            <ButtonLink href="/editor" variant="secondary" size="lg" trailing={<FaArrowRight aria-hidden className="text-sm" />}>
              Open editor
            </ButtonLink>
          </div>
          <ul className="mt-12 flex flex-wrap justify-center gap-2">
            {liveTools.slice(0, 6).map((t) => (
              <li key={t.id}>
                <Link href={`/${t.slug}`} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-card">
                  <t.icon aria-hidden /> {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
