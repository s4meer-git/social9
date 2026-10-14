import type { Metadata } from "next";
import { Suspense } from "react";
import { ReelStage } from "./ReelStage";

export const metadata: Metadata = { title: "Reel", robots: { index: false, follow: false } };

/** Full-frame explainer scenes for recording social clips (see scripts/record-reel.mjs). */
export default function ReelPage() {
  return (
    <Suspense>
      <ReelStage />
    </Suspense>
  );
}
