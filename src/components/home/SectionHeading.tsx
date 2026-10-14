import clsx from "clsx";
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";

/** Shared page container so every section lines up on the same grid. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("mx-auto w-full max-w-[1240px] px-5 sm:px-8", className)}>{children}</div>;
}

export function Eyebrow({ children, dark = false, dot = "bg-violet" }: { children: ReactNode; dark?: boolean; dot?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold tracking-tight",
        dark ? "bg-white/10 text-white ring-1 ring-white/15" : "bg-white text-ink shadow-card ring-1 ring-line",
      )}
    >
      <span className={clsx("h-2 w-2 rounded-full shadow-[0_0_10px_currentColor]", dot)} />
      {children}
    </span>
  );
}

export function SectionHeading({
  title,
  text,
  align = "center",
  dark = false,
  children,
}: {
  /** short topic label, used for analytics and future nav; not rendered */
  eyebrow?: string;
  title: ReactNode;
  text?: ReactNode;
  align?: "center" | "left";
  dark?: boolean;
  dot?: string;
  children?: ReactNode;
}) {
  return (
    <Reveal className={clsx(align === "center" ? "mx-auto max-w-4xl text-center" : "max-w-2xl")}>
      <h2 className={clsx("font-display", dark ? "headline-dark" : "headline", " text-[44px] font-black leading-[0.95] tracking-[-0.028em] sm:text-[60px] lg:text-[68px]")}>{title}</h2>
      {text && <p className={clsx("mt-5 text-xl font-medium leading-relaxed sm:text-[22px]", align === "center" && "mx-auto max-w-2xl", dark ? "text-white/65" : "text-ink-soft")}>{text}</p>}
      {children}
    </Reveal>
  );
}
