import {
  AboutSection,
  BuildPurposeSection,
  FaqSection,
  FooterSection,
  HeroSection,
  HowItWorksSection,
  NavBar,
  PartnersSection,
  ResidencySection,
} from "@/components/landing";

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FFE8" }}>
      <NavBar />
      <div className="flex flex-col gap-[20px] px-[19px] pb-[20px]">
        <HeroSection />
        <div id="about">
          <AboutSection />
        </div>
        <BuildPurposeSection />
        <HowItWorksSection />
        <ResidencySection />

        <PartnersSection />
        <div id="faq">
          <FaqSection />
        </div>
        <FooterSection />
      </div>
    </div>
  );
}
