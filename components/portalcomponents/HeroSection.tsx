import Image from "next/image";
import Link from "next/link";
import { funnelSans, pixelifySans } from "@/app/fonts";

export function HeroSection() {
  return (
    <div
      id="overview"
      className="flex min-h-screen justify-center bg-[#F8FFE8] text-[#0f241c]"
    >
      <div className="flex w-full max-w-7xl flex-col px-4 md:px-8">
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
              className={`${funnelSans.className} text-xl font-bold tracking-tighter text-[#10271d]`}
            >
              Loops
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
        <div className="relative top-[15px] hidden flex-row items-start justify-between md:flex">
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
          <div className="flex flex-col items-end gap-8 md:-translate-x-24">
            <div className="flex flex-col items-center gap-4">
              <Image
                src="/assets/portal/peepingCat.svg"
                alt=""
                width={250}
                height={250}
                className="rounded-[32px] object-cover object-center"
              />
              <Link
                href="/login"
                className={`${funnelSans.className} inline-flex h-[44px] w-[220px] items-center justify-center rounded-full bg-[#10271d] text-sm font-medium text-[#f7f9e8] shadow-sm transition hover:bg-[#0b1b14]`}
              >
                <div className="flex flex-row items-center justify-between w-full px-1 pl-4">
                  <span className="uppercase text-xs tracking-wider pl-1">
                    Login to Loops
                  </span>
                  <Image
                    src="/assets/lightArrow.svg"
                    alt=""
                    width={35}
                    height={35}
                    className="shrink-0"
                  />
                </div>
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
                    className={`${funnelSans.className} inline-flex h-[44px] w-[220px] items-center justify-center rounded-full bg-[#10271d] text-sm font-medium text-[#f7f9e8] shadow-sm transition hover:bg-[#0b1b14]`}
                  >
                    <div className="flex flex-row items-center justify-between w-full px-1 pl-4">
                      <span className="uppercase text-xs tracking-wider">
                        Explore Hackathons
                      </span>
                      <Image
                        src="/assets/lightArrow.svg"
                        alt=""
                        width={35}
                        height={35}
                        className="shrink-0"
                      />
                    </div>
                  </Link>
                  <Link
                    href="/host/new"
                    className={`${funnelSans.className} inline-flex h-[44px] w-[220px] items-center justify-center rounded-full border border-[#10271d] text-sm font-medium text-[#10271d] transition hover:bg-[#10271d]`}
                  >
                    <div className="flex flex-row items-center justify-between w-full px-1 pl-4">
                      <span className="uppercase text-xs tracking-wider">
                        Host Hackathon
                      </span>
                      <Image
                        src="/assets/lightArrow.svg"
                        alt=""
                        width={35}
                        height={35}
                        className="shrink-0 transition-colors group-hover:invert"
                      />
                    </div>
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
