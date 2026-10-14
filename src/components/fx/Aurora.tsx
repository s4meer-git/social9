import clsx from "clsx";

/**
 * Slow-moving aurora of brand colours for dark/gradient bands.
 * Pattern from Aceternity "Aurora Background"; CSS-only re-implementation.
 */
export function Aurora({ className }: { className?: string }) {
  return (
    <div aria-hidden className={clsx("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute -inset-[20%] animate-[aurora_18s_ease-in-out_infinite_alternate] opacity-70 [background:radial-gradient(40%_50%_at_20%_30%,#6d4aff_0%,transparent_100%),radial-gradient(35%_45%_at_80%_20%,#ff4fa3_0%,transparent_100%),radial-gradient(40%_50%_at_60%_80%,#38bdf8_0%,transparent_100%),radial-gradient(30%_40%_at_10%_90%,#ff8a3d_0%,transparent_100%)]" />
    </div>
  );
}
