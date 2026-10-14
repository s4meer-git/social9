"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { FaChevronDown, FaArrowRight, FaChrome, FaEdge, FaSafari, FaFirefoxBrowser } from "react-icons/fa6";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { ToolsMenu } from "@/components/site/ToolsMenu";
import { useInstall, promptInstall, detectBrowser, type BrowserKind } from "@/lib/install";
import { toolGroups } from "@/lib/tools";
import { platforms } from "@/lib/platforms";

type Menu = "tools" | "platforms" | null;

/** Browsers that can install Social9 as an app, shown as an overlapping stack. */
const installBrowsers = [
  { icon: FaChrome, name: "Chrome", color: "text-[#1a73e8]" },
  { icon: FaEdge, name: "Edge", color: "text-[#0c8fd8]" },
  { icon: FaSafari, name: "Safari", color: "text-[#1d9bf0]" },
  { icon: FaFirefoxBrowser, name: "Firefox", color: "text-[#ff7139]" },
];

/** What to do when the browser hasn't offered its own install dialog. */
const installSteps: Record<BrowserKind, string> = {
  chromium: "Click the install icon at the right end of the address bar, or open the browser menu (⋮) and choose “Install Social9”.",
  "safari-mac": "In Safari's menu bar, choose File, then “Add to Dock”.",
  "safari-ios": "Tap the Share button, then “Add to Home Screen”.",
  firefox: "Firefox can't install web apps on desktop yet. Open Social9 in Chrome, Edge or Safari to install it, or bookmark it here.",
  other: "Open your browser's menu and look for “Install” or “Add to Home Screen”.",
};

const sections = [
  { id: "tools", label: "Tools", menu: "tools" as const },
  { id: "platforms", label: "Platforms", menu: "platforms" as const },
  { id: "privacy", label: "Privacy" },
  { id: "faq", label: "FAQ" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState<Menu>(null);
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const install = useInstall();
  const [installHelp, setInstallHelp] = useState<BrowserKind | null>(null);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(null), setMobile(false), setInstallHelp(null));
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && (setOpen(null), setInstallHelp(null));
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);

  // Highlight the section currently in view (home page).
  useEffect(() => {
    if (pathname !== "/") return;
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    // Track which sections sit in the middle band; with none there (e.g. on the hero), show no dot.
    const inBand = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) inBand.set(e.target.id, e.intersectionRatio);
          else inBand.delete(e.target.id);
        }
        const top = [...inBand].sort((a, b) => b[1] - a[1])[0];
        setActive(top ? top[0] : null);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  useEffect(() => {
    document.documentElement.style.overflow = mobile ? "hidden" : "";
  }, [mobile]);

  const solid = scrolled || open || mobile;

  return (
    <header ref={ref} className="sticky top-0 z-50 px-3 pt-3 sm:px-4" onMouseLeave={() => setOpen(null)}>
      <div className="relative mx-auto max-w-[1200px] px-2">
        {/* the floating pill: only this layer animates (opacity + transform), so nothing reflows */}
        <span
          aria-hidden
          className={clsx(
            "pointer-events-none absolute inset-0 rounded-[26px] bg-white/80 shadow-[0_10px_40px_-12px_rgb(15_14_23/0.25)] ring-1 ring-black/5 backdrop-blur-xl backdrop-saturate-150 transition-[opacity,transform] duration-500 ease-[cubic-bezier(.21,.47,.32,.98)] will-change-transform",
            solid ? "scale-100 opacity-100" : "scale-x-[1.03] scale-y-[1.08] opacity-0",
          )}
        />
        {/* reading progress */}
        <motion.span aria-hidden style={{ scaleX: progress }} className={clsx("absolute inset-x-6 bottom-0 h-[2px] origin-left rounded-full brand-gradient transition-opacity duration-300", scrolled ? "opacity-100" : "opacity-0")} />

        <nav className="relative flex h-[60px] items-center gap-2 px-2 sm:px-3" aria-label="Main">
          <Logo />
          <ul className="relative ml-6 hidden items-center lg:flex" onMouseLeave={() => setHover(null)}>
            {sections.map((s) => {
              const isOpen = s.menu && open === s.menu;
              const isActive = active === s.id && pathname === "/";
              const cls = clsx(
                "relative z-10 flex items-center gap-1.5 rounded-full px-4 py-2 text-[15px] font-bold transition-colors",
                isOpen || isActive ? "text-ink" : "text-ink/70 hover:text-ink",
              );
              return (
                <li key={s.id} className="relative" onMouseEnter={() => setHover(s.id)}>
                  {hover === s.id && <motion.span layoutId="nav-hover" className="absolute inset-0 rounded-full bg-ink/[0.06]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                  {s.menu ? (
                    <button
                      type="button"
                      aria-expanded={!!isOpen}
                      className={cls}
                      onMouseEnter={() => setOpen(s.menu!)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpen((o) => (o === s.menu ? null : s.menu!));
                      }}
                    >
                      {s.label}
                      <FaChevronDown aria-hidden className={clsx("text-[10px] transition-transform duration-300", isOpen && "rotate-180")} />
                    </button>
                  ) : (
                    <Link href={`/#${s.id}`} onMouseEnter={() => setOpen(null)} className={cls}>
                      {s.label}
                    </Link>
                  )}
                  {isActive && <motion.span layoutId="nav-active" className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-pink" />}
                </li>
              );
            })}
          </ul>
          <div className="ml-auto flex items-center gap-2">
            {!install.installed && (
              <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    if (install.prompt) promptInstall(install.prompt);
                    else setInstallHelp((h) => (h ? null : detectBrowser()));
                  }}
                  aria-expanded={install.prompt ? undefined : !!installHelp}
                className="group/install hidden h-10 items-center gap-2.5 rounded-full pl-2 pr-4 text-sm font-bold text-ink/80 transition hover:bg-ink/5 hover:text-ink md:flex"
              >
                {/* browser logos: half-hidden behind each other, fanned out on hover */}
                <span aria-hidden className="flex items-center">
                  {installBrowsers.map((b, i) => (
                    <span
                      key={b.name}
                      style={{ zIndex: installBrowsers.length - i, transitionDelay: `${i * 30}ms` }}
                      className={clsx(
                        "grid h-[26px] w-[26px] place-items-center rounded-full bg-white text-[17px] shadow-[0_2px_6px_-1px_rgb(15_14_23/0.25)] ring-2 ring-white transition-[margin,transform] duration-300 ease-[cubic-bezier(.21,.47,.32,.98)] group-hover/install:-translate-y-0.5",
                        i > 0 && "-ml-[13px] group-hover/install:ml-1",
                        b.color,
                      )}
                    >
                      <b.icon />
                    </span>
                  ))}
                </span>
                Install app
              </button>
                <AnimatePresence>
                  {installHelp && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      role="dialog"
                      aria-label="Install Social9"
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-[calc(100%+12px)] w-80 origin-top-right rounded-3xl bg-white p-5 text-left shadow-float ring-1 ring-line"
                    >
                      <p className="font-display text-lg font-black tracking-[-0.01em]">Install Social9</p>
                      <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{installSteps[installHelp]}</p>
                      <p className="mt-3 text-[13px] text-ink-soft">It opens in its own window and also works offline.</p>
                      <Link href="/support#install" onClick={() => setInstallHelp(null)} className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-bold text-violet-deep hover:underline">
                        Step-by-step guide <FaArrowRight aria-hidden className="text-[11px]" />
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <ButtonLink href="/editor" variant="brand" size="sm" className="hidden sm:inline-flex" trailing={<FaArrowRight aria-hidden className="text-xs" />}>
              Open editor
            </ButtonLink>
            <button
              className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-ink/5 lg:hidden"
              aria-label={mobile ? "Close menu" : "Open menu"}
              aria-expanded={mobile}
              onClick={() => setMobile((m) => !m)}
            >
              <span className={clsx("absolute h-[2px] w-5 rounded bg-ink transition-transform duration-300", mobile ? "rotate-45" : "-translate-y-[5px]")} />
              <span className={clsx("absolute h-[2px] w-5 rounded bg-ink transition-transform duration-300", mobile ? "-rotate-45" : "translate-y-[5px]")} />
            </button>
          </div>
        </nav>

        {/* desktop mega menus */}
        <AnimatePresence>
          {open && (
            <motion.div
              key={open}
              className="absolute inset-x-0 top-full hidden pt-3 lg:block"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              <div className="rounded-[28px] bg-white p-6 shadow-float ring-1 ring-black/5">
                {open === "tools" ? <ToolsMenu onNavigate={() => setOpen(null)} /> : <PlatformsMenu onNavigate={() => setOpen(null)} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* mobile sheet */}
      <AnimatePresence>
        {mobile && (
          <motion.div
            className="fixed inset-x-3 top-[84px] bottom-3 z-40 overflow-y-auto rounded-[28px] bg-white p-5 shadow-float ring-1 ring-black/5 lg:hidden"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            {toolGroups.map(({ cat, items }, gi) => (
              <div key={cat.id} className={gi ? "mt-5" : ""}>
                <p className="px-2 text-[13px] font-bold uppercase tracking-wider text-ink-soft">{cat.name}</p>
                <motion.ul className="mt-1.5 grid grid-cols-2 gap-1" initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.03, delayChildren: gi * 0.04 } } }}>
                  {items.map((t) => (
                    <motion.li key={t.id} variants={{ h: { opacity: 0, y: 8 }, s: { opacity: 1, y: 0 } }}>
                      <Link href={`/${t.slug}`} onClick={() => setMobile(false)} className="flex items-center gap-2.5 rounded-2xl p-2 text-[15px] font-bold leading-tight active:bg-paper">
                        <span className={clsx("grid h-9 w-9 shrink-0 place-items-center rounded-xl", cat.soft, cat.text)}>
                          <t.icon aria-hidden />
                        </span>
                        {t.name}
                      </Link>
                    </motion.li>
                  ))}
                </motion.ul>
              </div>
            ))}
            <p className="mt-6 px-2 text-[13px] font-bold uppercase tracking-wider text-ink-soft">Platforms</p>
            <ul className="mt-2 grid grid-cols-4 gap-2">
              {platforms.map((p) => (
                <li key={p.id}>
                  <Link href={`/platforms/${p.id}`} onClick={() => setMobile(false)} className="flex flex-col items-center gap-1 rounded-2xl p-2 text-xs font-bold active:bg-paper">
                    <p.icon aria-hidden className="text-xl" />
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
            <ButtonLink href="/editor" variant="brand" className="mt-6 w-full" onClick={() => setMobile(false)}>
              Open editor
            </ButtonLink>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function PlatformsMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <ul className="grid grid-cols-4 gap-2">
      {platforms.map((p) => (
        <li key={p.id}>
          <Link href={`/platforms/${p.id}`} onClick={onNavigate} className="group flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-paper">
            <span className={clsx("grid h-12 w-12 place-items-center rounded-2xl text-xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110", p.tint)}>
              <p.icon aria-hidden />
            </span>
            <span>
              <span className="block text-[15px] font-bold">{p.name}</span>
              <span className="block text-[13px] text-ink-soft">{p.presets.length} sizes</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
