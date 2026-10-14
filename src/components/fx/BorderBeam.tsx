import clsx from "clsx";

/**
 * A short streak of light that travels around an element's border.
 * Pattern from Magic UI "Border Beam" (MIT); re-implemented with a conic
 * gradient + mask so it needs no JS. Place inside a `relative` rounded parent.
 */
export function BorderBeam({ className, duration = 6, width = 2, from = "#6d4aff", to = "#ff4fa3" }: { className?: string; duration?: number; width?: number; from?: string; to?: string }) {
  return (
    <span
      aria-hidden
      className={clsx("pointer-events-none absolute inset-0 rounded-[inherit]", className)}
      style={{
        padding: width,
        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
      }}
    >
      <span
        className="absolute inset-[-100%] animate-[beam-spin_var(--beam-d)_linear_infinite]"
        style={{
          ["--beam-d" as string]: `${duration}s`,
          background: `conic-gradient(from 0deg, transparent 0 70%, ${from} 82%, ${to} 92%, transparent 100%)`,
        }}
      />
    </span>
  );
}
