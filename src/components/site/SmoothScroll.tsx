"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/**
 * Buttery momentum scrolling for the marketing pages (Lenis, MIT).
 * Skipped in the editor (it never scrolls) and for reduced-motion users.
 * Also makes in-page anchor links glide instead of jump.
 */
export function SmoothScroll() {
  const pathname = usePathname();
  const first = useRef(true);

  // From the second page on, pages fade in (see .page-in); the first load paints instantly.
  useEffect(() => {
    if (first.current) first.current = false;
    else document.documentElement.dataset.nav = "1";
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith("/editor") || pathname.startsWith("/reel")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // allowNestedScroll: panels, menus and lists that scroll on their own keep their wheel/touch scrolling
    const lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), wheelMultiplier: 0.95, touchMultiplier: 1.4, allowNestedScroll: true });
    let raf = requestAnimationFrame(function loop(time) {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    });

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[href*='#']") as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href);
      if (url.pathname !== window.location.pathname || !url.hash) return;
      const target = document.querySelector(url.hash);
      if (!target) return;
      e.preventDefault();
      // Sections below the fold size themselves as they come into view (content-visibility),
      // so the target can move mid-glide: correct the landing once or twice.
      // Lenis already honours the section's scroll-margin; add our own gap only when it has none.
      const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      const offset = margin ? 0 : -80;
      const want = margin || 80;
      const land = (tries: number) =>
        lenis.scrollTo(target as HTMLElement, {
          offset,
          duration: tries === 0 ? 1.15 : 0.5,
          onComplete: () => {
            const off = (target as HTMLElement).getBoundingClientRect().top - want;
            if (Math.abs(off) > 4 && tries < 2) land(tries + 1);
          },
        });
      land(0);
      history.replaceState(null, "", url.hash);
    };
    document.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      lenis.destroy();
    };
  }, [pathname]);

  return null;
}
