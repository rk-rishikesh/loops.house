"use client";

import {
  type MotionValue,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { useRef, useState } from "react";
import { funnelSans, pixelifySans } from "@/app/fonts";

const letters = [
  { text: "SH", color: "#9F4231", startX: 0, startY: 0, endX: 0, endY: 0 },
  { text: "AN", color: "#9F4231", startX: 215, startY: 0, endX: 110, endY: 160 },
  { text: "GH", color: "#9F4231", startX: 435, startY: 0, endX: 0, endY: 320 },
  { text: "AI", color: "#000000", startX: 655, startY: 0, endX: 110, endY: 480 },
];

function AnimatedLetter({
  text,
  color,
  startX,
  startY,
  endX,
  endY,
  progress,
  rangeStart,
  rangeEnd,
}: {
  text: string;
  color: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: MotionValue<number>;
  rangeStart: number;
  rangeEnd: number;
}) {
  const x = useTransform(progress, [rangeStart, rangeEnd], [startX, endX], {
    clamp: true,
  });
  const y = useTransform(progress, [rangeStart, rangeEnd], [startY, endY], {
    clamp: true,
  });

  return (
    <motion.span
      className={`${pixelifySans.className} absolute text-[96px] font-bold sm:text-[140px] md:text-[180px]`}
      style={{ x, y, color }}
    >
      {text}
    </motion.span>
  );
}

export default function ShanghaiPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLatched, setIsLatched] = useState(false);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "40% start"],
  });
  const progressSpring = useSpring(scrollYProgress, {
    stiffness: 45,
    damping: 26,
    mass: 1.15,
    restDelta: 0.001,
  });
  const progress = useTransform(progressSpring, (v) => v * v * (3 - 2 * v));
  const latchedProgress = useMotionValue(1);

  useMotionValueEvent(progress, "change", (v) => {
    if (!isLatched && v >= 0.98) setIsLatched(true);
  });

  return (
    <main className="flex h-full w-full flex-col bg-[#EDEDED] overflow-x-hidden">
      {/* Hero pattern + animated stacked text */}
      <div ref={containerRef} className="relative flex flex-1 items-stretch">
        {/* Background pattern */}
        <Image
          src="/assets/shanghai/heroPattern.svg"
          className="pointer-events-none absolute select-none -top-26"
          alt="Shanghai hero pattern"
          width={1437}
          height={400}
          priority
        />

        {/* Foreground: LOOPS HOUSE label + animated letters */}
        <div className="relative left-[51px] top-[450px] z-10 flex w-full items-start justify-start">
          <div className="relative flex flex-col pl-[51px]">
            <span
              className={`${pixelifySans.className} align-middle text-[66px] font-bold leading-[2.2px] tracking-[-0.03em] text-[#111827]`}
            >
              LOOPS HOUSE
            </span>

            {/* Letter animation area */}
            <div className="relative h-[320px] w-[500px] sm:h-[480px] sm:w-[700px] md:h-[660px] md:w-[960px]">
              {letters.map((letter, index) => (
                <AnimatedLetter
                  key={letter.text}
                  text={letter.text}
                  color={letter.color}
                  startX={letter.startX}
                  startY={letter.startY}
                  endX={letter.endX}
                  endY={letter.endY}
                  progress={isLatched ? latchedProgress : progress}
                  rangeStart={index * 0.12}
                  rangeEnd={0.55 + index * 0.12}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chinese text on the right */}
      <div className="absolute right-[144px] z-10 flex flex-col leading-[186px] top-[720px]">
        <span
          className={`${pixelifySans.className} relative left-[110px] -mt-6 text-[96px] sm:text-[140px] md:text-[180px] font-bold text-[#9F4231]`}
        >
          居
        </span>
        <span
          className={`${pixelifySans.className} relative left-[110px] -mt-6 text-[96px] sm:text-[140px] md:text-[180px] font-bold text-[#9F4231]`}
        >
          住
        </span>
        <span
          className={`${pixelifySans.className} relative left-[110px] -mt-6 text-[96px] sm:text-[140px] md:text-[180px] font-bold text-[#9F4231]`}
        >
          权
        </span>
      </div>

      <div className="flex flex-col">
        <div className="flex h-[46vh] w-full flex-col items-center justify-end px-6 text-center relative top-64 gap-12">
          <div className="w-[412px] text-right flex flex-col gap-8">
            <p
              className={`${funnelSans.className} h-[112px] w-[412px] text-right text-lg leading-6 text-[#111827] sm:text-xl`}
            >
              Lorem ipsum dolor sit amet consectetur. Phasellus tortor orci diam amet odio sit quam
              tellus. Felis odio feugiat odio risus facilisis auctor a. Non vitae quam.
            </p>
            <p
              className={`${funnelSans.className} justify-end text-right text-base font-medium text-[#5E0F00] sm:text-lg`}
            >
              14th May - 20th May, 2026
            </p>
            <button
              type="button"
              className={`${funnelSans.className} inline-flex h-[44px] w-[200px] items-center justify-center self-end rounded-full bg-[#5E0F00] text-sm font-medium text-[#EDEDED]`}
            >
              <div className="flex flex-row items-center justify-between gap-20">
                <span className="relative left-6 text-sm uppercase">Apply Now</span>
                <Image
                  src="/assets/shanghai/lightArrow.svg"
                  alt=""
                  width={20}
                  height={20}
                  className="h-8 w-8 shrink-0"
                />
              </div>
            </button>
          </div>
        </div>
        {/* Bottom footer graphic — above Chinese text */}

        <div className="relative z-20 w-full -mt-10">
          <Image
            src="/assets/shanghai/footer.svg"
            alt="Shanghai footer pattern"
            width={1437}
            height={400}
            className="h-auto w-full"
          />
        </div>
      </div>
    </main>
  );
}
