import Link from "next/link";
import clsx from "clsx";

/** The mark: a rounded tile with a cut-out "9", the brand gradient behind it. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={clsx("shrink-0", className)} aria-hidden="true">
      <defs>
        <linearGradient id="s9-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6d4aff" />
          <stop offset="0.65" stopColor="#ff4fa3" />
          <stop offset="1" stopColor="#ff8a3d" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="10" fill="url(#s9-mark)" />
      <circle cx="16" cy="13" r="5.2" fill="none" stroke="#fff" strokeWidth="3.2" />
      <path d="M21.1 13.5 C21 20 18.5 24 12.5 24.5" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={clsx("flex items-center gap-2", className)} aria-label="Social9 home">
      <LogoMark className="h-9 w-9 drop-shadow-[0_6px_14px_rgb(255_79_163/0.35)]" />
      <span className="font-display text-[24px] font-black tracking-tight">social9</span>
    </Link>
  );
}
