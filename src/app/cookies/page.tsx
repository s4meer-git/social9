import type { Metadata } from "next";
import { DocPage } from "@/components/site/DocPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Cookie policy", description: "Social9 uses no tracking or advertising cookies." };

export default function Cookies() {
  return (
    <DocPage
      title="Cookie policy"
      updated={SITE.policiesUpdated}
      intro={<><strong className="text-ink">Social9 doesn’t use tracking or advertising cookies.</strong> That is why you won’t see a cookie banner here.</>}
      sections={[
        { id: "cookies", title: "Cookies", body: <p>We don’t set cookies for analytics, advertising or profiling, and we don’t embed third-party trackers.</p> },
        { id: "local-storage", title: "Local storage we do use", body: <ul><li><strong>Cache Storage:</strong> stores the app’s files and the AI models, so the tools load quickly and work offline.</li><li><strong>Service worker:</strong> loads those saved files when you are offline.</li></ul> },
        { id: "control", title: "Your control", body: <p>You can delete everything Social9 has stored by clearing this site’s data in your browser settings. The app will download what it needs again the next time you use it.</p> },
      ]}
    />
  );
}
