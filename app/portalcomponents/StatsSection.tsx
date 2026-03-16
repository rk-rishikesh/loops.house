import Image from "next/image";
import Link from "next/link";
import { funnelSans, pixelifySans } from "@/app/fonts";

export function StatsSection() {
  return (
    <div
      id="activity"
      className="flex min-h-screen w-full items-center justify-center bg-[#F8FFE8] text-[#0f241c] md:h-screen md:items-stretch"
    >
      <div className="flex w-full max-w-7xl flex-col">
        <div className="relative flex flex-col items-center gap-6 md:top-[90px] md:flex-row md:items-start md:justify-between md:gap-16">
          {/* Left column */}
          <div className="flex flex-col items-center gap-6 text-center md:items-start md:gap-16 md:text-left">
            {/* Ideate / Build / Launch heading stack */}
            <div className="flex flex-col items-center gap-1 text-center sm:gap-2 md:flex-row md:items-baseline md:gap-6 md:text-left">
              <span
                className={`${pixelifySans.className} font-bold leading-none tracking-[-0.04em] text-[84px] text-[#0F2C23] sm:text-[110px] md:text-[150px]`}
              >
                Shape.
              </span>
              <span
                className={`${pixelifySans.className} font-bold leading-none tracking-[-0.04em] text-[84px] text-[#0F2C23CC] sm:text-[110px] md:text-[150px]`}
              >
                Your.
              </span>
              <span
                className={`${pixelifySans.className} font-bold leading-none tracking-[-0.04em] text-[84px] text-[#0F2C2399] sm:text-[110px] md:text-[150px]`}
              >
                Ideas.
              </span>
            </div>

            {/* Cats row + desktop copy */}
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:gap-10">
              <div className="flex flex-row items-center justify-center gap-4 md:justify-start">
                <Image
                  src="/assets/portal/catOne.svg"
                  alt="Thinking cat"
                  width={180}
                  height={180}
                  className="h-24 w-24 object-contain sm:h-32 sm:w-32 md:h-44 md:w-44"
                />
                <Image
                  src="/assets/portal/catTwo.svg"
                  alt="Laptop cat"
                  width={180}
                  height={180}
                  className="relative top-1 h-24 w-24 object-contain sm:top-2 sm:h-32 sm:w-32 md:h-44 md:w-44"
                />
                <Image
                  src="/assets/portal/catThree.svg"
                  alt="Paper plane cat"
                  width={180}
                  height={180}
                  className="h-24 w-24 object-contain sm:h-32 sm:w-32 md:h-44 md:w-44"
                />
              </div>

              {/* Desktop text beside cats */}
              <div className="hidden max-w-md flex-col gap-3 md:flex left-72 top-24 relative">
                <h2
                  className={`${funnelSans.className} text-3xl font-semibold tracking-tight text-[#10271d]`}
                >
                  From idea to launch
                </h2>
                <p
                  className={`${funnelSans.className} text-lg leading-relaxed text-[#10271d]`}
                >
                  Start with raw ideas, prototype fast in Loops, and launch updates
                  to your community without losing momentum.
                </p>
              </div>
            </div>

            {/* Mobile text (Col 3 on small screens) */}
            <div className="mt-6 max-w-md text-center md:hidden">
              <h2
                className={`${funnelSans.className} text-2xl font-semibold tracking-tight text-[#10271d]`}
              >
                From idea to launch
              </h2>
              <p
                className={`${funnelSans.className} mt-3 text-base leading-relaxed text-[#10271d]`}
              >
                Ideate with other builders, turn concepts into live loops, and ship
                updates with Loops AI guiding every step.
              </p>
            </div>

            <Link
              href="/login"
              className={`${funnelSans.className} w-[160px] h-[44px] inline-flex items-center justify-between rounded-full bg-[#10271d] text-sm font-medium text-[#f7f9e8] shadow-sm transition hover:bg-[#0b1b14]`}
            >
              <div className="flex flex-row items-center justify-between gap-8 left-4">
                <span className="uppercase left-4 relative text-sm">Get Started</span>
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
      </div>
    </div>
  );
}

