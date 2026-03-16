import { Footer } from "./sections/Footer";
import { HeroSection } from "./sections/HeroSection";
import { ResidencySection } from "./sections/ResidencySection";
import { StatsSection } from "./sections/StatsSection";

export default function AppSitePage() {
  return (
    <main className="flex flex-col">
      <HeroSection />
      <ResidencySection />
      <StatsSection />
      <Footer />
    </main>
  );
}

