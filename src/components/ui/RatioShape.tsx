import clsx from "clsx";

/** Tiny outline whose shape is the aspect ratio, so size buttons are readable at a glance. */
export function RatioShape({ width, height, max = 18, className }: { width: number; height: number; max?: number; className?: string }) {
  const r = width / height;
  const w = r >= 1 ? max : Math.max(8, Math.round(max * r));
  const h = r >= 1 ? Math.max(6, Math.round(max / r)) : max;
  return <span aria-hidden className={clsx("inline-block shrink-0 rounded-[4px] border-2 border-current", className)} style={{ width: w, height: h }} />;
}
