import { PageGlow } from "@/components/fx/PageGlow";
import Link from "next/link";
import type { ReactNode } from "react";
import { FaChevronRight } from "react-icons/fa6";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Container } from "@/components/home/SectionHeading";

export interface DocSection {
  id: string;
  title: string;
  body: ReactNode;
}

/** Shared layout for policy and help pages: title block, sticky contents, readable prose. */
export function DocPage({ title, intro, updated, sections, aside }: { title: string; intro: ReactNode; updated?: string; sections: DocSection[]; aside?: ReactNode }) {
  return (
    <>
      <SiteNav />
      <main className="relative overflow-x-clip">
        <PageGlow />
        <Container className="relative pb-24 pt-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
            <Link href="/" className="hover:text-ink">Home</Link>
            <FaChevronRight aria-hidden className="text-[10px]" />
            <span className="text-ink">{title}</span>
          </nav>
          <header className="mt-10 max-w-3xl">
            <h1 className="headline font-display text-[48px] font-black leading-[0.95] tracking-[-0.03em] sm:text-[68px]">{title}</h1>
            <div className="mt-5 text-xl font-medium leading-relaxed text-ink-soft">{intro}</div>
            {updated && <p className="mt-4 text-sm font-semibold text-ink-soft">Last updated {updated}</p>}
          </header>

          <div className="mt-14 grid gap-12 lg:grid-cols-12">
            <aside className="lg:col-span-3">
              <div className="sticky top-28 space-y-6">
                <nav aria-label="On this page" className="rounded-[24px] bg-white p-5 shadow-card ring-1 ring-black/[0.04]">
                  <p className="text-[13px] font-bold uppercase tracking-wider text-ink-soft">On this page</p>
                  <ol className="mt-3 space-y-1.5">
                    {sections.map((s, i) => (
                      <li key={s.id}>
                        <a href={`#${s.id}`} className="group flex gap-2 rounded-lg py-1 text-[15px] font-semibold text-ink/75 transition-colors hover:text-violet">
                          <span className="tabular-nums text-ink-soft group-hover:text-violet">{String(i + 1).padStart(2, "0")}</span>
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
                {aside}
              </div>
            </aside>
            <article className="space-y-6 lg:col-span-9">
              {sections.map((s, i) => (
                <section key={s.id} id={s.id} className="scroll-mt-28 rounded-[28px] bg-white p-7 shadow-card ring-1 ring-black/[0.04] sm:p-9">
                  <h2 className="flex items-baseline gap-3 font-display text-[28px] font-black tracking-[-0.02em] sm:text-[32px]">
                    <span className="text-lg tabular-nums text-ink-soft">{String(i + 1).padStart(2, "0")}</span>
                    {s.title}
                  </h2>
                  <div className="prose-s9 mt-4">{s.body}</div>
                </section>
              ))}
            </article>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
