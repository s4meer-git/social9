import clsx from "clsx";
import type { ReactNode } from "react";

interface Option<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  size = "md",
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-full bg-ink/5 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          className={clsx(
            "flex flex-1 items-center justify-center gap-1.5 rounded-full font-semibold transition-all disabled:opacity-40",
            size === "sm" ? "px-2.5 py-1.5 text-[13px]" : "px-3 py-2 text-sm",
            o.value === value ? "bg-white text-ink shadow-card" : "text-ink/60 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
