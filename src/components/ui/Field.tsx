import clsx from "clsx";
import type { ReactNode } from "react";

/** Label + control stack used in tool panels. */
export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={clsx("space-y-2.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">{label}</span>
        {hint && <span className="text-xs font-medium text-ink-soft">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function RangeInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
  onPointerDown,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  onPointerDown?: () => void;
}) {
  return (
    <input
      type="range"
      aria-label={label}
      className="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onPointerDown={onPointerDown}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

/** Square swatch tile used by background, color and sticker pickers. */
export function Swatch({
  selected,
  onClick,
  label,
  children,
  className,
  style,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      title={label}
      style={style}
      className={clsx(
        "relative aspect-square overflow-hidden rounded-2xl ring-1 ring-black/10 transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-95",
        selected && "ring-2 ring-violet ring-offset-2",
        className,
      )}
    >
      {children}
    </button>
  );
}
