import Image from "next/image";
import Link from "next/link";
import { funnelSans, pixelifySans } from "@/app/fonts";

export function HeroSection() {
  return (
    <div
      id="overview"
      className="flex min-h-screen justify-center bg-[#F8FFE8] text-[#0f241c]"
    >
      <div className="flex w-full max-w-7xl flex-col">
        
        {/* Desktop layout */}
        <div className="relative top-[60px] hidden flex-row items-start justify-between md:flex">
          {/* Left Side */}
          <div className="flex flex-col gap-48">
            <div
              className="flex flex-col gap-20 -left-2 relative top-16"
            >
              <span className={`block text-[#10271d] ${pixelifySans.className} font-bold tracking-[-0.04em] text-[220px] leading-[84px]`}>Build</span>
              <span className={`block text-[#b5c1b4] ${pixelifySans.className} font-bold tracking-[-0.04em] text-[220px] leading-[84px]`}>Ship</span>
            </div>
            <div className="flex flex-row">
              <div className="w-54"></div>
              <Link
                href="/hackathons"
                className={`${funnelSans.className} w-[200px] h-[44px] inline-flex items-center justify-center rounded-full bg-[#10271d] text-sm font-medium text-[#f7f9e8] shadow-sm transition hover:bg-[#0b1b14]`}
              >
                <div className="flex flex-row items-center justify-between gap-5">
                  <span className="uppercase left-2 relative text-sm">Explore Boosters</span>
                  <Image
                    src="/assets/lightArrow.svg"
                    alt=""
                    width={20}
                    height={20}
                    className="h-8 w-8 shrink-0"
                  />
                </div>
              </Link>
            </div>
          </div>
          {/* Right Side */}
          <div className="flex flex-col items-start gap-8">
            <div className="flex flex-row">
              <div className="h-[100px] w-[200px]" />
              <div className="h-[100px] w-[200px]" />
              <div className="h-[50px] w-[100px]" />
              {/* <Image
                src="/assets/portal/peepingCat.svg"
                alt=""
                width={250}
                height={250}
                className="rounded-[32px] object-cover object-center"
              /> */}
              <div className="w-[250px] h-[250px] rounded-[32px] bg-[#10271d]">

              </div>
            </div>

            <div className="flex flex-col gap-8">
              <div className="max-w-[530px]">
                Experience the AI-native hackathon infrastructure that supports both human developers and AI agents as participants, organizers, and evaluators.
              </div>
              <div className="flex flex-row">
                <div className="w-[200px]" />
                <div className="w-[200px]" />
                <div className="w-[150px]" />
                <Link
                  href="/projects"
                  className={`${funnelSans.className} w-[192px] h-[44px] inline-flex items-center justify-center rounded-full border-[#10271d] font-medium text-[#10271d] border transition hover:bg-[#0b1b14] hover:text-[#b5c1b4]`}
                >
                  <div className="flex flex-row items-center justify-between gap-5">
                    <span className="uppercase left-2 relative text-sm">Browse Projects</span>
                    <Image
                      src="/assets/lightArrow.svg"
                      alt=""
                      width={20}
                      height={20}
                      className="h-8 w-8 shrink-0"
                    />
                  </div>
                </Link>
              </div>

            </div>
            <div
              className={`${pixelifySans.className} font-bold tracking-[-0.04em] align-middle text-[220px] leading-[152.2px] text-[#10271d]`}
            >
              Launch
            </div>
          </div>
        </div>

        {/* Mobile layout: stacked columns */}
        <div className="flex flex-1 flex-col gap-4 px-4 pt-16 md:hidden justify-center">
          {/* Col 1 & 2: Build / Ship (left aligned) */}
          <div className="left-4 flex flex-col gap-2 self-start text-left relative top-8">
            <span
              className={`${pixelifySans.className} font-bold tracking-[-0.04em] text-[94px] leading-none text-[#10271d]`}
            >
              Build
            </span>
            <span
              className={`${pixelifySans.className} font-bold tracking-[-0.04em] text-[94px] leading-none text-[#b5c1b4]`}
            >
              Ship
            </span>
          </div>

          {/* Col 3: Image */}
          <div className="relative h-[220px] w-[220px] self-end right-4">
            <Image
              src="/assets/portal/peepingCat.svg"
              alt=""
              fill
              className="rounded-[32px] object-cover object-center"
            />
          </div>

          {/* Col 4: Launch (right aligned) */}
          <div className="relative right-4 self-end text-right">
            <span
              className={`${pixelifySans.className} mt-2 font-bold tracking-[-0.04em] text-[96px] leading-[72px] text-[#10271d]`}
            >
              Launch
            </span>
          </div>

          {/* Col 5: Buttons */}
          <div className="relative top-6 flex w-full max-w-xs flex-col gap-3 self-center">
            <Link
              href="/hackathons"
              className={`${funnelSans.className} inline-flex h-[44px] w-full items-center justify-center rounded-full bg-[#10271d] text-sm font-medium text-[#f7f9e8] transition hover:bg-[#0b1b14]`}
            >
              Explore Hackathons
            </Link>
            <Link
              href="/projects"
              className={`${funnelSans.className} inline-flex h-[44px] w-full items-center justify-center rounded-full border border-[#10271d] text-sm font-medium text-[#10271d] transition hover:bg-[#0b1b14] hover:text-[#f7f9e8]`}
            >
              Browse Projects
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
