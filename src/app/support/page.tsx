import Link from "next/link";
import type { Metadata } from "next";
import { FaEnvelope, FaBug, FaLightbulb as FaIdea } from "react-icons/fa6";
import { DocPage } from "@/components/site/DocPage";
import { SITE, mailto } from "@/lib/site";

export const metadata: Metadata = { title: "Help & support", description: "Help with Social9, including troubleshooting, installing the app, using it offline and contacting support." };

export default function SupportPage() {
  return (
    <DocPage
      title="Help & support"
      intro={<>A real person reads every message. Most questions are answered below. If yours isn’t, email us and we usually reply within one working day.</>}
      aside={
        <div className="space-y-2">
          {[
            { icon: FaEnvelope, label: "Email support", href: mailto(SITE.supportEmail, "Social9 support"), sub: SITE.supportEmail },
            { icon: FaBug, label: "Report a bug", href: mailto(SITE.supportEmail, "Bug report"), sub: "Tell us your browser and device" },
            { icon: FaIdea, label: "Suggest a tool", href: mailto(SITE.supportEmail, "Tool idea"), sub: "We read every suggestion" },
          ].map((c) => (
            <a key={c.label} href={c.href} className="group flex items-center gap-3 rounded-[20px] bg-ink p-4 text-white shadow-pop transition-transform hover:-translate-y-0.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 transition-transform group-hover:-rotate-6">
                <c.icon aria-hidden />
              </span>
              <span>
                <span className="block font-bold">{c.label}</span>
                <span className="block text-[13px] text-white/60">{c.sub}</span>
              </span>
            </a>
          ))}
        </div>
      }
      sections={[
        {
          id: "getting-started",
          title: "Getting started",
          body: (
            <>
              <p>Open the <Link href="/editor">editor</Link> and add a photo. The editor has five tools: <strong>Background</strong>, <strong>Faces</strong>, <strong>Profile</strong>, <strong>Size</strong> and <strong>Save</strong>. You can use them in any order on the same photo and save once at the end.</p>
              <p>If you only need a profile picture or want to convert a file, the <Link href="/profile-picture-maker">profile picture maker</Link> and the <Link href="/convert-image">image converter</Link> also have their own pages.</p>
              <ul>
                <li><strong>Photos you can open:</strong> JPG, PNG, WebP, AVIF and iPhone HEIC.</li>
                <li><strong>Formats you can save:</strong> JPG, PNG, WebP and PDF. AVIF, GIF, BMP, TIFF, ICO and SVG are under More options. You can also set a maximum or exact file size in KB.</li>
                <li><strong>Undo and redo:</strong> press Ctrl + Z (Cmd + Z on a Mac) to undo, and Ctrl + Shift + Z to redo.</li>
                <li><strong>Compare with the original:</strong> hold the <kbd>{"\\"}</kbd> key or the Compare button.</li>
                <li><strong>Zoom and move around:</strong> use Ctrl + scroll or pinch to zoom. Hold Space and drag to move around the photo.</li>
              </ul>
            </>
          ),
        },
        {
          id: "ai-tools",
          title: "AI tools and downloads",
          body: (
            <>
              <p>Background removal, face detection, upscaling and object removal run on your device. The first time you use them, Social9 downloads the AI model it needs and saves it in your browser. After that, it starts straight away and works offline.</p>
              <ul>
                <li><strong>Face detection:</strong> 0.2 MB.</li>
                <li><strong>Cutting out one person:</strong> about 7 MB.</li>
                <li><strong>Cutting out groups, pets and objects:</strong> about 46 MB. This is only downloaded the first time you need it.</li>
                <li><strong>Upscaling:</strong> about 5 MB.</li>
                <li><strong>Removing objects:</strong> about 28 MB.</li>
              </ul>
              <p>Social9 chooses the right model for your photo. You can also choose Person or Object yourself under More options in the Background tool. If your photo already has a transparent background, Social9 uses it as it is.</p>
              <p><strong>HD cut-outs</strong> look at your photo in more detail, which helps with fine hair. They take a few seconds longer.</p>
            </>
          ),
        },
        {
          id: "offline",
          title: "Using Social9 offline",
          body: (
            <>
              <p>After your first visit, the app and any AI models you have used are saved in your browser. If you open Social9 again without an internet connection, everything you used before still works.</p>
              <p>If you clear your browser data, the saved models are deleted. They will download again the next time you use them.</p>
            </>
          ),
        },
        {
          id: "install",
          title: "Install as an app",
          body: (
            <ul>
              <li><strong>iPhone and iPad (Safari):</strong> tap Share, then Add to Home Screen.</li>
              <li><strong>Android (Chrome):</strong> tap the menu, then Install app.</li>
              <li><strong>Computer (Chrome or Edge):</strong> click the install icon in the address bar, or Install app at the top of the Social9 page.</li>
            </ul>
          ),
        },
        {
          id: "troubleshooting",
          title: "Troubleshooting",
          body: (
            <>
              <h3>The AI model won’t download</h3>
              <p>Check your internet connection and try again. Some school and office networks block large downloads. If that happens, try a different network once. After the first download, it works offline.</p>
              <h3>A face wasn’t found</h3>
              <p>Very small, turned-away or partly hidden faces can be missed. In the Faces tool, tap <strong>Add a face the AI missed</strong>, then tap the face on your photo to cover it.</p>
              <h3>The cut-out edges look rough</h3>
              <p>In the Background tool, switch to <strong>HD</strong>. If part of the background is still there, open More options and try <strong>Object</strong>, or use the <strong>Brush</strong> to fix the edges by hand.</p>
              <h3>My iPhone photo won’t open</h3>
              <p>Large HEIC photos can take a few seconds to open. If it still doesn’t work, change your iPhone’s camera format to Most Compatible (Settings, Camera, Formats) so new photos are saved as JPG.</p>
            </>
          ),
        },
        {
          id: "contact",
          title: "Contact us",
          body: (
            <>
              <p>Email <a href={mailto(SITE.supportEmail, "Social9 support")}>{SITE.supportEmail}</a> and tell us your browser, your device and what you were trying to do. <strong>Please don’t attach private photos.</strong> A description or a screenshot of the problem is enough.</p>
              <p>For privacy questions, email <a href={mailto(SITE.privacyEmail)}>{SITE.privacyEmail}</a>. For legal notices, email <a href={mailto(SITE.legalEmail)}>{SITE.legalEmail}</a>.</p>
            </>
          ),
        },
      ]}
    />
  );
}
