import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ServiceWorker } from "@/components/site/ServiceWorker";
import { SmoothScroll } from "@/components/site/SmoothScroll";
import { INSTALL_CATCHER } from "@/lib/install-catcher";
import { CSP_META } from "@social9/core/security/csp";

// Fontshare fonts (ITF Free Font License), self-hosted.
const cabinet = localFont({
  src: "./fonts/CabinetGrotesk-Variable.woff2",
  variable: "--font-cabinet",
  weight: "100 900",
  display: "swap",
});

const satoshi = localFont({
  src: "./fonts/Satoshi-Variable.woff2",
  variable: "--font-satoshi",
  weight: "300 900",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://social9.s4meer.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Social9 | Free photo editor for social media",
    template: "%s | Social9",
  },
  description:
    "Social9 is a free photo editor for social media. Remove backgrounds, make profile pictures, blur faces and resize photos for Instagram, LinkedIn, X and more. It runs in your browser, so your photos never leave your device.",
  applicationName: "Social9",
  openGraph: {
    type: "website",
    siteName: "Social9",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Social9, a free photo editor for social media" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
};

export const viewport: Viewport = {
  themeColor: "#fbfaf8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: browser extensions (e.g. data-ytm-*) add attributes to <html> before React loads.
    // Only this element's own attributes are ignored; mismatches deeper in the tree still surface.
    <html lang="en" data-scroll-behavior="smooth" className={`${cabinet.variable} ${satoshi.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* The public policy from core/src/security/csp.ts: the browser blocks any connection
            to hosts not on the list. Production only (dev needs live-reload connections). */}
        {process.env.NODE_ENV === "production" && <meta httpEquiv="Content-Security-Policy" content={CSP_META} />}
        {/* catch the browser's install offer before the app hydrates */}
        <script dangerouslySetInnerHTML={{ __html: INSTALL_CATCHER }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <ServiceWorker />
        <SmoothScroll />
      </body>
    </html>
  );
}
