import Link from "next/link";
import type { Metadata } from "next";
import { DocPage } from "@/components/site/DocPage";
import { SITE, mailto } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy policy", description: "Social9 processes your photos on your own device. We do not upload, store or sell your photos or personal data." };

export default function PrivacyPolicy() {
  return (
    <DocPage
      title="Privacy policy"
      updated={SITE.policiesUpdated}
      intro={<><strong className="text-ink">Your photos never leave your device.</strong> Social9 has no accounts, no upload servers and no tracking cookies. The details are below.</>}
      sections={[
        { id: "photos", title: "Your photos", body: <><p>Every tool runs in your web browser. Photos you open in Social9 are processed on your device and are never sent to us or anyone else. When you close the tab, they are gone, unless you saved a copy.</p><p>Photos you save from Social9 do not include location (GPS), date or camera details. This is because your device creates a new image file when you save.</p><p>You can read how this works, and check it yourself, on our <Link href="/how-it-works">How it works</Link> page.</p></> },
        { id: "data", title: "Data we collect", body: <><p>We do not collect personal data. There are no accounts, sign-ups or forms that store information on our servers.</p><p>Like any website, our hosting provider may keep technical logs for a short time, such as IP addresses and the pages requested. These logs help keep the service running and secure. They are not used to identify you, and they are deleted automatically.</p></> },
        { id: "storage", title: "Storage on your device", body: <><p>To make Social9 fast and usable offline, your browser stores the app’s files and the AI models you have used. This data stays on your device and contains no photos. You can delete it at any time by clearing this site’s data in your browser settings.</p></> },
        { id: "third-parties", title: "Third-party services", body: <><p>The program that runs the AI models is downloaded from jsDelivr, and two AI models are downloaded from Hugging Face. These are ordinary downloads of public files. They contain no photos or personal information.</p></> },
        { id: "rights", title: "Your rights (GDPR, UK GDPR, CCPA, DPDP Act)", body: <><p>We do not hold personal data about you, so there is nothing for us to access, correct, delete or sell. We never sell or share personal information. If you have a question about your rights, email <a href={mailto(SITE.privacyEmail)}>{SITE.privacyEmail}</a>.</p></> },
        { id: "children", title: "Children", body: <p>Social9 is for a general audience. It does not knowingly collect information from anyone, including children.</p> },
        { id: "changes", title: "Changes to this policy", body: <p>If anything in this policy changes, we will update this page and the date at the top before the change takes effect.</p> },
      ]}
    />
  );
}
