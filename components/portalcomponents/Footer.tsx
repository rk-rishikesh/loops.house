import Image from "next/image";
import Link from "next/link";
import { funnelSans, pixelifySans } from "@/app/fonts";

export function Footer() {
  return (
    <div
      id="settings"
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[#385244] px-6 gap-32 pt-12"
    >
      <div className="relative z-50 flex max-w-7xl flex-col items-center gap-16 text-center">
        <div className="flex flex-col gap-2 items-center">
          <h1
            className={`${pixelifySans.className} font-bold uppercase leading-none tracking-[-0.04em] text-[#E2FEA5] text-[120px]`}
          >
            LOOPS HOUSE
          </h1>
          <p
            className={`${funnelSans.className} max-w-xl text-base leading-relaxed text-[#E2FEA5] sm:text-lg`}
          >
            Don&apos;t sleep on your ideas. Make them a reality with Loops House.
          </p>
        </div>

        <Link
          href="/login"
          className={`${funnelSans.className} mt-4 uppercase inline-flex h-[44px] w-[200px] items-center justify-center rounded-full border-2 border-[#2C3E50] bg-[#DFF7C4] px-8 text-sm font-medium text-[#2C3E50] transition hover:bg-[#ccebb0] cursor-pointer`}
        >
          Enter the Loop
        </Link>
      </div>

      {/* Footer: clouds with cat on top */}
      <div className="pointer-events-none select-none">
        <div className="relative w-full">
          <Image
            src="/assets/footer/base.svg"
            alt=""
            width={1100}
            height={300}
          />
          <div className="absolute bottom-0 left-[20%] flex justify-center">
            <Image
              src="/assets/footer/sleepingCat.svg"
              alt=""
              width={750}
              height={120}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
