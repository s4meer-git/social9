import type { Metadata } from "next";
import { SiUnsplash } from "react-icons/si";
import { DocPage } from "@/components/site/DocPage";
import { photoCredits } from "@/lib/credits";
import { photoBackdrops } from "@/lib/backgrounds";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Licenses & credits", description: "The open-source software, AI models, fonts and photos used in Social9." };

export default function Licenses() {
  return (
    <DocPage
      title="Licenses & credits"
      updated={SITE.policiesUpdated}
      intro={<>Social9 is built with the help of many photographers, designers and open-source projects. Thank you to all of them.</>}
      sections={[
        {
          id: "photos",
          title: "Photos",
          body: (
            <>
              <p className="flex items-center gap-2">
                <SiUnsplash aria-hidden className="text-xl text-ink" />
                <span>
                  Thank you to <a href="https://unsplash.com" target="_blank" rel="noreferrer">Unsplash</a> and its photographers. Every demo photo on this site comes from Unsplash and is used under the <a href="https://unsplash.com/license" target="_blank" rel="noreferrer">Unsplash License</a>.
                </span>
              </p>
              <ul className="grid gap-x-6 sm:grid-cols-2">
                {photoCredits.map((c) => (
                  <li key={c.url}>
                    <a href={c.url} target="_blank" rel="noreferrer">{c.label}</a>
                  </li>
                ))}
              </ul>
              <p>Background photos in the editor and the profile picture maker:</p>
              <ul className="grid gap-x-6 sm:grid-cols-2">
                {photoBackdrops.map((b, i) => (
                  <li key={b.id}>
                    <a href={b.credit} target="_blank" rel="noreferrer">{b.group} {photoBackdrops.slice(0, i).filter((x) => x.group === b.group).length + 1}</a>
                  </li>
                ))}
              </ul>
            </>
          ),
        },
        {
          id: "models",
          title: "AI models",
          body: (
            <ul>
              <li><strong>YuNet</strong> for finding faces, OpenCV Zoo, MIT License</li>
              <li><strong>MODNet</strong> for cutting out people (Xenova/modnet), Apache License 2.0</li>
              <li><strong>ISNet</strong> for cutting out objects, pets and groups (Ko033/isnet-general-use-onnx), Apache License 2.0</li>
              <li><strong>Real-ESRGAN</strong> for upscaling (xinntao/Real-ESRGAN, general x4v3), BSD 3-Clause License</li>
              <li><strong>MI-GAN</strong> for removing objects (Picsart AI Research, andraniksargsyan/migan), MIT License</li>
            </ul>
          ),
        },
        {
          id: "art",
          title: "Stickers and backgrounds",
          body: (
            <ul>
              <li><strong>3D stickers</strong>: <a href="https://github.com/microsoft/fluentui-emoji" target="_blank" rel="noreferrer">Microsoft Fluent Emoji</a>, MIT License. Social9 added the white sticker edge.</li>
              <li><strong>Gradients</strong>: <a href="https://github.com/ghosh/uiGradients" target="_blank" rel="noreferrer">uiGradients</a> by Indrashish Ghosh, MIT License</li>
              <li><strong>Drawn stickers, glasses and patterns</strong>: made by Social9</li>
            </ul>
          ),
        },
        {
          id: "software",
          title: "Open-source software",
          body: (
            <ul>
              <li><strong>Social9 Core</strong>, the code that processes your photos, is open source under the Apache License 2.0 (<a href={SITE.github} target="_blank" rel="noreferrer">GitHub</a>)</li>
              <li><strong>ONNX Runtime Web</strong>, MIT License</li>
              <li><strong>Next.js</strong> and <strong>React</strong>, MIT License</li>
              <li><strong>Motion</strong>, <strong>Zustand</strong>, <strong>Lenis</strong>, <strong>heic2any</strong>, <strong>exifr</strong>, MIT License</li>
              <li><strong>Tailwind CSS</strong>, MIT License</li>
              <li><strong>react-icons</strong> (MIT) with Font Awesome Free icons (CC BY 4.0) and Simple Icons (CC0)</li>
            </ul>
          ),
        },
        {
          id: "fonts",
          title: "Fonts",
          body: <p><strong>Cabinet Grotesk</strong> and <strong>Satoshi</strong> by Indian Type Foundry, via Fontshare, used under the ITF Free Font License.</p>,
        },
        {
          id: "trademarks",
          title: "Trademarks",
          body: <p>Instagram, Facebook and WhatsApp are trademarks of Meta Platforms, Inc. LinkedIn is a trademark of LinkedIn Corporation. X is a trademark of X Corp. YouTube is a trademark of Google LLC. TikTok is a trademark of ByteDance Ltd. Pinterest is a trademark of Pinterest, Inc. Social9 is independent and not affiliated with, sponsored or endorsed by any of them.</p>,
        },
      ]}
    />
  );
}
