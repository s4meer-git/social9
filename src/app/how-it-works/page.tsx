import { PageGlow } from "@/components/fx/PageGlow";
import Link from "next/link";
import type { Metadata } from "next";
import { FaArrowRight, FaChevronRight, FaGithub, FaImage, FaMicrochip, FaFloppyDisk, FaPlaneUp, FaMagnifyingGlass, FaCode, FaCheck, FaXmark, FaCloudArrowDown, FaLock } from "react-icons/fa6";
import { SiHuggingface, SiJsdelivr } from "react-icons/si";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Container, SectionHeading } from "@/components/home/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { Aurora } from "@/components/fx/Aurora";
import { PrivacyDiagram } from "@/components/home/PrivacyDiagram";
import { FaqList } from "@/components/home/FaqList";
import { MoreOptions } from "@/components/ui/MoreOptions";
import { LogoMark } from "@/components/brand/Logo";
import { MODELS } from "@social9/core/ml/models";
import { SITE, mailto } from "@/lib/site";

export const metadata: Metadata = {
  title: "How it works",
  description: "How Social9 edits your photos on your own device, what your browser downloads, and how you can check it yourself. The code that handles your photos is open source.",
};

/** Download sizes in decimal MB, as the browser's network panel shows them. */
const mb = (bytes: number) => (bytes < 1e6 ? `${Math.round(bytes / 1e3)} KB` : `${(bytes / 1e6).toFixed(1)} MB`);

/** A link to a file in the public engine repository. */
const code = (path: string) => `${SITE.github}/blob/main/core/${path}`;

const steps = [
  {
    icon: FaImage,
    title: "You open a photo",
    text: "Your browser reads the photo from your phone or computer. It is not uploaded anywhere. Social9 has no upload feature at all.",
    details: [
      <>The browser decodes the photo itself, including iPhone HEIC photos.</>,
      <>We read the location, date and camera details only to show you what will be removed when you save.</>,
      <>
        Source code: <a href={code("src/image/load.ts")}>src/image/load.ts</a>
      </>,
    ],
  },
  {
    icon: FaCloudArrowDown,
    title: "The AI tools download once",
    text: "The first time you remove a background or blur faces, your browser downloads the AI model it needs. The model stays on your device, so next time it starts straight away, even offline.",
    details: [
      ...Object.values(MODELS).map((m) => (
        <>
          {m.label[0].toUpperCase() + m.label.slice(1)}: {mb(m.bytes)} ({m.license} license)
        </>
      )),
      <>Before a model runs, the app checks its SHA-256 hash against the one published in our code. If the file has changed, the app won&apos;t use it.</>,
      <>
        Source code: <a href={code("src/ml/models.ts")}>src/ml/models.ts</a>
      </>,
    ],
  },
  {
    icon: FaMicrochip,
    title: "Your edits run on your device",
    text: "Background removal, face blur, stickers and resizing all run on your phone or computer. When your device has a capable graphics chip, the AI uses it to work faster.",
    details: [
      <>The AI runs with ONNX Runtime Web, using WebGPU or WebAssembly.</>,
      <>MODNet cuts out people, ISNet cuts out objects, pets and groups, and YuNet finds faces. Real-ESRGAN makes photos bigger and sharper, and MI-GAN removes objects.</>,
      <>
        Source code: <a href={code("src/ml/matting.ts")}>src/ml/matting.ts</a> and <a href={code("src/ml/faces.ts")}>src/ml/faces.ts</a>
      </>,
    ],
  },
  {
    icon: FaFloppyDisk,
    title: "You save a new file",
    text: "When you save, your browser creates a new image file from the edited picture. Nothing is copied over from the original file, so the hidden location and camera details are left out.",
    details: [
      <>JPG, PNG, WebP and AVIF files are created by your browser. GIF, BMP, TIFF, ICO, PDF and SVG files are created by our open-source code.</>,
      <>To hit an exact file size, such as 50 KB for a form, the app adjusts the quality and then adds a few empty bytes that image viewers ignore.</>,
      <>
        Source code: <a href={code("src/convert/encoders.ts")}>src/convert/encoders.ts</a>
      </>,
    ],
  },
];

const hosts = [
  { icon: LogoMark, name: "Social9", what: "The app itself and three small AI models" },
  { icon: SiJsdelivr, name: "jsDelivr", what: "The open-source program that runs the AI models" },
  { icon: SiHuggingface, name: "Hugging Face", what: "Two open-source AI models, for cutting out and removing objects" },
];

const checks = [
  {
    icon: FaPlaneUp,
    title: "Turn off your internet",
    text: "Use each tool once so the AI models are saved. Then turn on airplane mode and edit a photo. Everything still works, which shows nothing needs to be sent.",
  },
  {
    icon: FaMagnifyingGlass,
    title: "Watch the network",
    text: "Open your browser's developer tools and go to the Network tab. Edit and save a photo. You will only see files being downloaded, never your photo being sent.",
  },
  {
    icon: FaLock,
    title: "Check the security policy",
    text: "Each page tells your browser which websites it is allowed to connect to. Your browser blocks every other website. You can read this list in your browser's developer tools.",
  },
];

const open = [
  "Downloading the AI models, checking them and running them",
  "Opening photos and reading their hidden details",
  "Creating saved files and removing hidden details",
  "The security policy used on every page",
  "Tests, and a script that checks every AI model",
];
const website = ["The website and editor interface", "Illustrations and marketing pages", "Backgrounds, stickers and patterns"];

const faqs = [
  {
    q: "Where can I read Social9's code?",
    a: "The full website and editor are available in our public GitHub repository. The core folder contains the photo-processing engine and security policy. The same policy applies to every part of the website.",
  },
  {
    q: "How do I know the website uses this code?",
    a: "You can check three things on the live website today. The AI models must match the hashes in our code. The AI program must match its published hash. And the security policy your browser receives must match the one in our code. We can't yet prove that the rest of the website's code matches byte for byte. We are working on it.",
  },
  {
    q: "Do you use analytics or cookies?",
    a: "No. We don't use analytics, ads or tracking cookies. The security policy would also stop a tracking script from sending data.",
  },
  {
    q: "What happens to my photo when I close the tab?",
    a: "It's gone. Your photo was only ever in your browser's memory. The AI models stay on your device so your next edit starts faster. You can delete them at any time in your browser's site settings.",
  },
  {
    q: "I found a problem. Who should I tell?",
    a: <>Please email <a href={mailto(SITE.supportEmail)} className="underline underline-offset-4">{SITE.supportEmail}</a>. The security policy in our code repository explains how we handle reports.</>,
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <SiteNav />
      <main className="relative overflow-x-clip">
        <PageGlow />

        {/* hero */}
        <Container className="relative pb-16 pt-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
            <Link href="/" className="hover:text-ink">
              Home
            </Link>
            <FaChevronRight aria-hidden className="text-[10px]" />
            <span className="text-ink">How it works</span>
          </nav>
          <header className="mt-10 max-w-3xl">
            <h1 className="headline rise-solid font-display text-[48px] font-black leading-[0.95] tracking-[-0.03em] sm:text-[72px]">
              Your photo never leaves your device.
            </h1>
            <p className="rise mt-6 text-xl font-medium leading-relaxed text-ink-soft sm:text-[22px]">
              This page explains what happens to your photo in Social9 and how you can check it yourself. The code that handles your photos is open source.
            </p>
            <div className="rise mt-8 flex flex-wrap items-center gap-3">
              <a href={SITE.github} className="group inline-flex h-13 items-center gap-3 rounded-full bg-ink pl-2 pr-6 text-[16px] font-bold text-white shadow-pop transition hover:-translate-y-0.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg text-ink">
                  <FaGithub aria-hidden />
                </span>
                View the code on GitHub
                <FaArrowRight aria-hidden className="text-sm transition-transform group-hover:translate-x-1" />
              </a>
              <a href="#check" className="inline-flex h-13 items-center rounded-full bg-white px-6 text-[16px] font-bold shadow-card ring-1 ring-line transition hover:-translate-y-0.5">
                Check it yourself
              </a>
            </div>
            <p className="rise mt-4 text-sm font-semibold text-ink-soft">Apache-2.0 license · Includes tests · Every AI model is verified</p>
          </header>
        </Container>

        {/* the journey */}
        <section className="px-3 sm:px-4">
          <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[40px] bg-ink px-6 py-16 text-white sm:px-12 lg:py-24">
            <Aurora className="opacity-30" />
            <Container className="relative grid gap-12 px-0! xl:grid-cols-12 xl:items-center">
              <div className="xl:col-span-5">
                <SectionHeading align="left" dark title="Where your photo goes" text="Your photo goes from your device into your browser. When you are done, you save it or share it wherever you like. It is never sent to our servers." />
              </div>
              <Reveal className="xl:col-span-7" delay={0.1}>
                <PrivacyDiagram />
              </Reveal>
            </Container>
          </div>
        </section>

        {/* four steps */}
        <Container className="py-24">
          <SectionHeading title="Four steps, all on your device" text="Each step is explained in simple terms. Open the technical details if you want to know more." />
          <ol className="mt-14 grid items-start gap-5 md:grid-cols-2">
            {steps.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 0.06} className="rounded-[32px] bg-white p-7 shadow-card ring-1 ring-black/[0.04]">
                <div className="flex items-center gap-4">
                  <span className="grid h-13 w-13 shrink-0 place-items-center rounded-2xl bg-ink text-xl text-white">
                    <s.icon aria-hidden />
                  </span>
                  <span className="font-display text-[15px] font-black text-ink-soft">Step {i + 1}</span>
                </div>
                <h3 className="mt-5 font-display text-[26px] font-black leading-tight tracking-[-0.02em]">{s.title}</h3>
                <p className="mt-3 text-[17px] leading-relaxed text-ink-soft">{s.text}</p>
                <MoreOptions label="Technical details" openLabel="Hide details" className="mt-5">
                  <ul className="space-y-2 border-l-2 border-line pl-4 text-[15px] leading-relaxed text-ink-soft [&_a]:font-bold [&_a]:text-violet-deep [&_a]:underline [&_a]:decoration-violet/30 [&_a]:underline-offset-[5px] [&_a]:decoration-[1.5px] [&_code]:rounded [&_code]:bg-ink/5 [&_code]:px-1 [&_code]:text-[13.5px]">
                    {s.details.map((d, k) => (
                      <li key={k}>{d}</li>
                    ))}
                  </ul>
                </MoreOptions>
              </Reveal>
            ))}
          </ol>
        </Container>

        {/* what the browser downloads */}
        <section className="bg-white py-24">
          <Container className="grid gap-12 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <SectionHeading align="left" title="What your browser downloads" text="Social9 downloads files from three places. None of them receive your photos." />
            </div>
            <div className="space-y-3 lg:col-span-7">
              {hosts.map((h, i) => (
                <Reveal key={h.name} delay={i * 0.06} className="flex items-center gap-4 rounded-[24px] bg-paper p-5 ring-1 ring-black/[0.04]">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-2xl text-ink/80 shadow-card">
                    <h.icon aria-hidden className="h-7 w-7" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-[17px] font-black">{h.name}</span>
                    <span className="block text-[15px] text-ink-soft">{h.what}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-ink-soft">
                    <FaXmark aria-hidden /> No photos sent
                  </span>
                </Reveal>
              ))}
              <Reveal delay={0.2} className="flex items-start gap-4 rounded-[24px] bg-ink p-5 text-white">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-xl">
                  <FaLock aria-hidden />
                </span>
                <span>
                  <span className="block text-[17px] font-black">Your browser enforces this list</span>
                  <span className="block text-[15px] text-white/65">Each page gives your browser this list. If the page tried to connect to any other website, your browser would block it.</span>
                </span>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* check it yourself */}
        <Container className="py-24">
          <div id="check" className="scroll-mt-28" />
          <SectionHeading title="Check it yourself" text="Here are three ways to confirm that your photos stay on your device. The first one takes a minute." />
          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {checks.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.06} className="rounded-[32px] bg-white p-7 shadow-card ring-1 ring-black/[0.04]">
                <span className="grid h-13 w-13 place-items-center rounded-2xl bg-paper text-xl ring-1 ring-black/[0.05]">
                  <c.icon aria-hidden />
                </span>
                <h3 className="mt-5 font-display text-[24px] font-black leading-tight tracking-[-0.02em]">{c.title}</h3>
                <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">{c.text}</p>
              </Reveal>
            ))}
          </div>

          {/* the code */}
          <Reveal delay={0.1} className="mt-5 overflow-hidden rounded-[32px] bg-ink text-white">
            <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-3xl text-ink">
                  <FaGithub aria-hidden />
                </span>
                <h3 className="mt-6 font-display text-[34px] font-black leading-none tracking-[-0.02em] sm:text-[44px]">Read the code that handles your photos</h3>
                <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-white/65">
                  The code that handles your photos is public on GitHub. It covers the AI, opening and saving photos, removing hidden details and the security policy. You can run the tests and check every AI model with one command.
                </p>
                <a href={SITE.github} className="group mt-7 inline-flex h-13 items-center gap-3 rounded-full bg-white pl-5 pr-6 text-[16px] font-bold text-ink transition hover:-translate-y-0.5">
                  <FaGithub aria-hidden className="text-lg" /> View on GitHub
                  <FaArrowRight aria-hidden className="text-sm transition-transform group-hover:translate-x-1" />
                </a>
              </div>
              <div className="lg:col-span-5">
                <div className="rounded-[24px] bg-white/[0.06] p-5 ring-1 ring-white/10">
                  <p className="flex items-center gap-2 text-sm font-bold text-white/60">
                    <FaCode aria-hidden /> Try it yourself
                  </p>
                  <pre className="mt-3 overflow-x-auto text-[13.5px] leading-relaxed text-white/85">
                    <code>{`cd core
npm install
npm test
npm run verify-models`}</code>
                  </pre>
                  <p className="mt-3 text-[13px] text-white/50">The last command downloads every AI model and checks that it matches the published hash.</p>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>

        {/* public repository contents */}
        <section className="bg-white py-24">
          <Container>
            <SectionHeading title="Read the source" text="The photo-processing engine, website and editor are in our public repository. The same security policy applies to the whole site." />
            <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-2">
              <Reveal className="rounded-[32px] bg-paper p-7 ring-1 ring-black/[0.04]">
                <h3 className="font-display text-[24px] font-black">Photo-processing engine</h3>
                <ul className="mt-5 space-y-3">
                  {open.map((t) => (
                    <li key={t} className="flex items-start gap-3 text-[16px]">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-[11px] text-white">
                        <FaCheck aria-hidden />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={0.06} className="rounded-[32px] bg-paper p-7 ring-1 ring-black/[0.04]">
                <h3 className="font-display text-[24px] font-black">Website and editor</h3>
                <ul className="mt-5 space-y-3">
                  {website.map((t) => (
                    <li key={t} className="flex items-start gap-3 text-[16px] text-ink-soft">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink/10 text-[11px] text-ink/60">
                        <FaCode aria-hidden />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-[15px] leading-relaxed text-ink-soft">The security policy covers this code too, so it can&apos;t send your photos anywhere.</p>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* questions */}
        <Container className="py-24">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionHeading align="left" title="Questions" text="Answers to the questions people ask us most about privacy." />
            </div>
            <div className="lg:col-span-7">
              <FaqList items={faqs} />
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
