import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Hero } from "@/components/home/Hero";
import { PlatformMarquee } from "@/components/home/PlatformMarquee";
import { Showcase } from "@/components/home/Showcase";
import { PfpSection } from "@/components/home/PfpSection";
import { DropOverlay } from "@/components/home/DropOverlay";
import { ReelSection } from "@/components/home/ReelSection";
import { Moments } from "@/components/home/Moments";
import { HowItWorks, ResultsWall, ToolsSection, PrivacySection, FaqSection, FinalCta } from "@/components/home/Sections";

export default function Home() {
  return (
    <>
      <SiteNav />
      <DropOverlay />
      <main>
        <Hero />
        <PlatformMarquee />
        <ReelSection />
        <Showcase />
        <Moments />
        <HowItWorks />
        <PfpSection />
        <ToolsSection />
        <ResultsWall />
        <PrivacySection />
        <FaqSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
