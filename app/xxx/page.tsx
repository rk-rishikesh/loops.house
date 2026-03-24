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
  {
    text: "AN",
    color: "#9F4231",
    startX: 215,
    startY: 0,
    endX: 110,
    endY: 160,
  },
  { text: "GH", color: "#9F4231", startX: 435, startY: 0, endX: 0, endY: 320 },
  {
    text: "AI",
    color: "#000000",
    startX: 655,
    startY: 0,
    endX: 110,
    endY: 480,
  },
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
    <main className="flex w-full flex-col bg-[#EDEDED] overflow-x-hidden gap-24">
      {/* Conatiner 1 */}
      <div ref={containerRef} className="relative flex items-stretch">
        <Image
          src="/assets/shanghai/heroPattern.svg"
          className="pointer-events-none absolute select-none -top-26"
          alt="Shanghai hero pattern"
          width={1437}
          height={400}
          priority
        />

        <div className="relative left-[51px] top-[450px] z-10 flex w-full items-start justify-start">
          <div className="relative flex flex-col pl-[51px]">
            <span
              className={`${pixelifySans.className} align-middle text-[66px] font-bold leading-[2.2px] tracking-[-0.03em] text-[#111827]`}
            >
              LOOPS HOUSE
            </span>

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

      <div className="pointer-events-none absolute right-[144px] z-0 flex flex-col leading-[186px] top-[720px]">
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

      <div className="absolute align-middle items-center justify-center flex top-[720px]">
        {/* Partners heading */}
        <div className="relative z-20">
          <h2
            className={`${pixelifySans.className} text-8xl font-bold tracking-[-0.02em] text-[#5E0F00]`}
          >
            PARTNERS
          </h2>
        </div>
      </div>
      {/* Conatiner 2 */}
      <div className="relative mt-64 flex flex-col">
        <div className="relative z-20 flex w-full flex-col items-center justify-start px-6 pt-20 text-center md:pt-28">
          <div className="w-[412px] text-right flex flex-col gap-8">
            <p
              className={`${funnelSans.className} h-[112px] w-[412px] text-right text-lg leading-6 text-[#111827] sm:text-xl`}
            >
              ​Loops House Shanghai Residency is a 7-day intensive builder
              residency for AI founders and engineers working on agentic
              systems, automation, and multi-agent coordination.
            </p>
            <p
              className={`${funnelSans.className} justify-end text-right text-base font-medium text-[#5E0F00] sm:text-lg`}
            >
              10th May - 16th May, 2026
            </p>
            <button
              type="button"
              className={`${funnelSans.className} inline-flex h-[44px] w-[200px] items-center justify-center self-end rounded-full bg-[#5E0F00] text-sm font-medium text-[#EDEDED]`}
            >
              <div className="flex flex-row items-center justify-between gap-20">
                <span className="relative left-6 text-sm uppercase">
                  Apply Now
                </span>
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
      </div>

      {/* Partners marquee */}
      <div className="relative z-20 mt-44 overflow-hidden top-[1020px]">
        <motion.div
          className="flex w-max gap-0"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 16,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        >
          {[0, 1].map((copy) => (
            <div
              key={copy}
              className="flex shrink-0 items-center gap-6 pr-6"
              aria-hidden={copy === 1 || undefined}
            >
              <div
                className="flex shrink-0 items-center justify-center bg-[#5E0F00] px-6"
                style={{ width: 291, height: 215, borderRadius: 25 }}
              >
                <span
                  className={`${funnelSans.className} text-3xl font-semibold text-[#EDEDED]`}
                >
                  dcipher
                </span>
              </div>
              <div
                className="flex shrink-0 items-center justify-center bg-[#5E0F00] px-6"
                style={{ width: 291, height: 215, borderRadius: 182 }}
              >
                <span
                  className={`${funnelSans.className} text-3xl font-semibold text-[#EDEDED]`}
                >
                  randamu
                </span>
              </div>
              <div
                className="flex shrink-0 items-center justify-center bg-[#5E0F00] px-6"
                style={{ width: 291, height: 215, borderRadius: 25 }}
              >
                <span
                  className={`${funnelSans.className} text-3xl font-semibold text-[#EDEDED]`}
                >
                  protofire
                </span>
              </div>
              <div
                className="flex shrink-0 items-center justify-center bg-[#5E0F00] px-6"
                style={{ width: 291, height: 215, borderRadius: 182 }}
              >
                <span
                  className={`${funnelSans.className} text-3xl font-semibold text-[#EDEDED]`}
                >
                  protocol labs
                </span>
              </div>
              <div
                className="flex shrink-0 items-center justify-center bg-[#5E0F00] px-6"
                style={{ width: 291, height: 215, borderRadius: 25 }}
              >
                <span
                  className={`${funnelSans.className} text-3xl font-semibold text-[#EDEDED]`}
                >
                  partner
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-20 w-full">
        <Image
          src="/assets/shanghai/footer.svg"
          alt="Shanghai footer pattern"
          width={1437}
          height={400}
          className="h-auto w-full"
        />
      </div>
    </main>
  );
}
