import { Container, SectionHeading } from "@/components/home/SectionHeading";
import { ExplainerReel } from "@/components/home/ExplainerReel";
import { ScrollScale } from "@/components/motion/ScrollScale";

export function ReelSection() {
  return (
    <section className="py-24 lg:py-28">
      <Container>
        <SectionHeading
          eyebrow="See it in motion"
          dot="bg-pink"
          title={
            <>
              Edits that take <span className="brand-text">seconds</span>
            </>
          }
          text="Remove backgrounds, hide faces, resize and make profile pictures. Each edit takes seconds and happens on your device."
        />
        <ScrollScale className="mt-14">
          <ExplainerReel />
        </ScrollScale>
      </Container>
    </section>
  );
}
