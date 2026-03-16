import { Footer } from "./portalcomponents/Footer";
import { HeroSection } from "./portalcomponents/HeroSection";
import { ResidencySection } from "./portalcomponents/ResidencySection";
import { StatsSection } from "./portalcomponents/StatsSection";

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

