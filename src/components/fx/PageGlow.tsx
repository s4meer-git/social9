import clsx from "clsx";

/**
 * The soft brand glow behind a page's hero. It starts at the very top of the page, under the
 * (transparent) nav, so there's never a visible edge where the content begins. Plain radial
 * gradients, no blur filter: blur filters are slow in Safari.
 * Place it first inside a `relative` <main>.
 */
export function PageGlow({ center = false, className }: { center?: boolean; className?: string }) {
  return (
    <div aria-hidden className={clsx("pointer-events-none absolute inset-x-0 -top-[84px] h-[1100px] overflow-hidden", className)}>
      {center ? (
        <div className="absolute left-1/2 top-0 h-[880px] w-[880px] -translate-x-1/2 -translate-y-1/4 bg-[radial-gradient(closest-side,rgb(109_74_255/0.16),rgb(109_74_255/0.06)_45%,transparent)]" />
      ) : (
        <>
          <div className="absolute right-[-12%] top-[-260px] h-[900px] w-[900px] bg-[radial-gradient(closest-side,rgb(109_74_255/0.16),rgb(109_74_255/0.06)_45%,transparent)]" />
          <div className="absolute -left-[300px] top-[260px] h-[700px] w-[700px] bg-[radial-gradient(closest-side,rgb(255_79_163/0.12),rgb(255_79_163/0.04)_45%,transparent)]" />
        </>
      )}
    </div>
  );
}
