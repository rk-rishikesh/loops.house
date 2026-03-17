import { Footer } from "@/components/portalcomponents/Footer";
import { HeroSection } from "@/components/portalcomponents/HeroSection";
import { ResidencySection } from "@/components/portalcomponents/ResidencySection";
import { StatsSection } from "@/components/portalcomponents/StatsSection";

export default function LandingPage() {
  return (
    <main className="flex flex-col">
      <HeroSection />
      <ResidencySection />
      <StatsSection />
      <Footer />
    </main>
  );
}

