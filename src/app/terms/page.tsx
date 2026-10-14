import Link from "next/link";
import type { Metadata } from "next";
import { DocPage } from "@/components/site/DocPage";
import { SITE, mailto } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of service", description: "The terms for using Social9, the free photo editor that runs in your browser." };

export default function Terms() {
  return (
    <DocPage
      title="Terms of service"
      updated={SITE.policiesUpdated}
      intro={<>These are the terms for using Social9, written in plain language. By using the site, you agree to them.</>}
      sections={[
        { id: "service", title: "The service", body: <p>Social9 is a free photo editing tool that runs in your browser. We may add, change or remove features at any time. We try to keep it available at all times, but we cannot promise it will never be interrupted or have errors.</p> },
        { id: "content", title: "Your content", body: <><p>You keep all rights to the photos you edit. Your photos are processed on your device, so we never receive or store them.</p><p>You must have the right to edit and share the photos you use. Please respect other people’s privacy and their rights to their own image.</p></> },
        { id: "acceptable-use", title: "Acceptable use", body: <ul><li>Don’t use Social9 to create content that is illegal or harassing, or that pretends to be someone else or misleads people.</li><li>Don’t try to disrupt or overload the service.</li><li>The face tools are there to protect people’s privacy. Don’t use them to mislead others.</li></ul> },
        { id: "ip", title: "Our materials", body: <><p>The Social9 name, logo and design belong to us. The code that processes your photos is open source under the Apache 2.0 license. The rest of the code belongs to us. Demo photos are used under the Unsplash License, and fonts and AI models are used under their own licenses. These are listed on the <Link href="/licenses">licenses page</Link>.</p><p>Platform names and logos are trademarks of their owners. Social9 is not affiliated with or endorsed by them.</p></> },
        { id: "warranty", title: "No warranty", body: <p>Social9 is provided “as is”. AI results, such as cut-outs and face detection, are not always perfect, so please check your photo before you post it. As far as the law allows, we are not liable for indirect or consequential losses from using the service.</p> },
        { id: "contact", title: "Contact", body: <p>If you have questions about these terms, email <a href={mailto(SITE.legalEmail)}>{SITE.legalEmail}</a>.</p> },
      ]}
    />
  );
}
