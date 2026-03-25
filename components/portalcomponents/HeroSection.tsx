import Image from "next/image";
import Link from "next/link";
import { funnelSans, pixelifySans } from "@/app/fonts";
import AnimatedButton from "@/components/buttons/animatedButton";
import AnimatedHeroCat from "@/components/portalcomponents/AnimatedHeroCat";

export function HeroSection() {
  return (
    <div
      id="overview"
      className="flex min-h-screen justify-center bg-[#F8FFE8] text-[#0f241c]"
    >
      <div className="flex w-full max-w-7xl flex-col">
        {/* Navbar */}
        <header className="flex mt-2 mb-2 h-[80px] w-full items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="Loops Logo"
              width={28}
              height={28}
              className="h-7 w-7"
            />
            <span
              className={`${pixelifySans.className} uppercase text-xl font-bold tracking-tighter text-[#10271d]`}
            >
              Loops House
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/hackathons"
              className={`${funnelSans.className} text-sm font-medium uppercase tracking-wide text-[#10271d] transition-opacity hover:opacity-70`}
            >
              Explore Hackathons
            </Link>
            <Link
              href="/projects"
              className={`${funnelSans.className} text-sm font-medium uppercase tracking-wide text-[#10271d] transition-opacity hover:opacity-70`}
            >
              Project Gallery
            </Link>
          </nav>

          {/* Simple Mobile Toggle Placeholder (could be a burger icon) */}
          <Link
            href="/login"
            className={`${funnelSans.className} flex h-8 items-center rounded-full border border-[#10271d] px-4 text-[10px] font-bold uppercase tracking-widest text-[#10271d] md:hidden`}
          >
            Login
          </Link>
        </header>

        {/* Desktop layout */}
        <div className="relative top-[10px] hidden flex-row items-start justify-between md:flex">
          {/* Left Side */}
          <div className="flex flex-col gap-48">
            <div className="flex flex-col gap-20 -left-2 relative top-16">
              <span
                className={`block text-[#10271d] ${pixelifySans.className} font-bold tracking-[-0.04em] text-[220px] leading-[84px]`}
              >
                Build
              </span>
              <span
                className={`block text-[#b5c1b4] ${pixelifySans.className} font-bold tracking-[-0.04em] text-[220px] leading-[84px]`}
              >
                Ship
              </span>
            </div>
          </div>
          {/* Right Side */}
          <div className="flex flex-col items-end gap-12 ">
            <div className="flex flex-col items-center gap-10">
              <div className="flex items-end justify-center w-[342px] h-[193px] bg-[#3C574B] overflow-hidden rounded-[25px]">
                <AnimatedHeroCat
                  src="/assets/portal/peepingCat.png"
                  alt=""
                  width={305}
                  height={193}
                  className="rounded-[64px] object-contain object-center"
                />
                <Image
                  src="/assets/portal/catHands.png"
                  alt=""
                  width={209}
                  height={133}
                  className="absolute top-40 ml-3 mt-1"
                />
              </div>
              <Link href="/login" className="inline-flex self-end">
                <AnimatedButton
                  text="Login to Loops"
                  leftPadding={20}
                  rightPadding={5}
                  gap={20}
                  height={44}
                />
              </Link>
            </div>

            <div className="flex max-w-[530px] flex-col items-end gap-8 text-right">
              <div>
                Experience the AI-native hackathon infrastructure that supports
                developers, organizers, and evaluators.
              </div>

              <div className="flex flex-row items-end gap-12">
                {/* Vertical buttons to the left of Launch */}
                <div className="flex flex-col gap-3">
                  <Link
                    href="/hackathons"
                    className="inline-flex h-[44px] w-[220px] items-center justify-center"
                  >
                    <AnimatedButton
                      text="View Hackathons"
                      leftPadding={20}
                      rightPadding={2}
                      gap={30}
                      height={44}
                      fullWidth
                    />
                  </Link>
                  <Link
                    href="/host/new"
                    className="inline-flex h-[44px] w-[220px] items-center justify-center"
                  >
                    <AnimatedButton
                      text="Host Hackathons"
                      leftPadding={20}
                      rightPadding={2}
                      gap={26}
                      height={44}
                      invertedColors
                      fullWidth
                    />
                  </Link>
                </div>

                <div
                  className={`${pixelifySans.className} text-[220px] font-bold leading-[152.2px] tracking-[-0.04em] text-[#10271d]`}
                >
                  Launch
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
