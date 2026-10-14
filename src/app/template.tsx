import type { ReactNode } from "react";

/**
 * Re-mounts on every navigation, so each page fades in instead of hard-cutting.
 * Opacity only: a transform here would break sticky and fixed children.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-in flex min-h-full flex-col">{children}</div>;
}
