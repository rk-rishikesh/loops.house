import { AiEngineSection } from "@/components/portalcomponents/AiEngineSection";
import { BuildWithPurposeSection } from "@/components/portalcomponents/BuildWithPurposeSection";
import { Footer } from "@/components/portalcomponents/Footer";
import { HeroSection } from "@/components/portalcomponents/HeroSection";
import { PartnersSection } from "@/components/portalcomponents/PartnersSection";
import { ResidencySection } from "@/components/portalcomponents/ResidencySection";
// import { StatsSection } from "@/components/portalcomponents/StatsSection";

export default function LandingPage() {
  return (
    <main className="flex flex-col">
      <HeroSection />
      <PartnersSection />
      <BuildWithPurposeSection />
      <ResidencySection />
      <AiEngineSection />
      <Footer />
    </main>
  );
}
