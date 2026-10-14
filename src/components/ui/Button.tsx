import Link from "next/link";
import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "brand" | "secondary" | "ghost" | "light";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "shine bg-ink text-white shadow-pop hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-10px_rgb(15_14_23/0.55)]",
  brand: "shine brand-gradient text-white shadow-[0_12px_28px_-8px_rgb(109_74_255/0.55),inset_0_1px_0_rgb(255_255_255/0.25)] hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-10px_rgb(255_79_163/0.6),inset_0_1px_0_rgb(255_255_255/0.25)]",
  secondary: "bg-white text-ink ring-1 ring-line shadow-card hover:-translate-y-0.5 hover:ring-ink/20 hover:shadow-float",
  ghost: "text-ink hover:bg-ink/5",
  light: "shine bg-white text-ink shadow-pop hover:-translate-y-0.5",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-[15px]",
  md: "h-12 px-6 text-base",
  lg: "h-15 px-8 text-[17px]",
};

const base =
  "group/btn inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-bold tracking-[-0.01em] transition-all duration-300 ease-[cubic-bezier(.21,.47,.32,.98)] active:translate-y-0 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none [&_svg]:transition-transform [&_svg]:duration-300";

interface Common {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  /** icon after the label; nudges right on hover */
  trailing?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function buttonClass({ variant = "primary", size = "md", className }: { variant?: Variant; size?: Size; className?: string } = {}) {
  return clsx(base, variants[variant], sizes[size], className);
}

const Trailing = ({ children }: { children: ReactNode }) => <span className="transition-transform duration-300 group-hover/btn:translate-x-1">{children}</span>;

export function Button({ variant, size, icon, trailing, className, children, ...rest }: Common & Omit<ComponentProps<"button">, "children" | "className">) {
  return (
    <button className={buttonClass({ variant, size, className })} {...rest}>
      {icon}
      {children}
      {trailing && <Trailing>{trailing}</Trailing>}
    </button>
  );
}

export function ButtonLink({ variant, size, icon, trailing, className, children, ...rest }: Common & Omit<ComponentProps<typeof Link>, "children" | "className">) {
  return (
    <Link className={buttonClass({ variant, size, className })} {...rest}>
      {icon}
      {children}
      {trailing && <Trailing>{trailing}</Trailing>}
    </Link>
  );
}
