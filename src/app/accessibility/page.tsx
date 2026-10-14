import type { Metadata } from "next";
import { DocPage } from "@/components/site/DocPage";
import { SITE, mailto } from "@/lib/site";

export const metadata: Metadata = { title: "Accessibility", description: "How Social9 is designed to be accessible, following WCAG 2.2 level AA." };

export default function Accessibility() {
  return (
    <DocPage
      title="Accessibility"
      updated={SITE.policiesUpdated}
      intro={<>We want Social9 to work for everyone. We design and test it to meet <strong className="text-ink">WCAG 2.2 level AA</strong>.</>}
      sections={[
        { id: "what-we-do", title: "What we do", body: <ul><li>We check every page with automated accessibility tests before each release.</li><li>All controls work with a keyboard and show a visible focus outline.</li><li>Images have text descriptions, and interactive demos are labelled for screen readers.</li><li>Animations follow your device’s reduce motion setting.</li><li>Text has enough contrast to be easy to read.</li></ul> },
        { id: "known-limits", title: "Known limitations", body: <p>Some editing, such as dragging a photo into position, is easiest with a mouse or a finger. Each of these edits also has a control you can use with a keyboard, such as the zoom slider, the size presets and the list of faces.</p> },
        { id: "feedback", title: "Feedback", body: <p>If something is hard to use, please email <a href={mailto(SITE.supportEmail, "Accessibility feedback")}>{SITE.supportEmail}</a>. We treat accessibility problems as bugs and fix them.</p> },
      ]}
    />
  );
}
