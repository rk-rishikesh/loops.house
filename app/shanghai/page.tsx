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
import ShanghaiJoinButton from "@/components/buttons/shanghaiJoinButton";

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

export default function TrialPage() {
  const containerRef = useRef<HTMLElement>(null);
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
    <main className="bg-[#EDEDED]">
      <section
        ref={containerRef}
        className="relative h-screen overflow-visible bg-[#EDEDED]"
      >
        <Image
          src="/assets/shanghai/heroPattern.svg"
          className="pointer-events-none absolute -top-26 w-full select-none"
          alt="Shanghai hero pattern"
          width={1437}
          height={400}
          priority
        />
        <div
          className="absolute left-[51px] z-10 flex items-start justify-start"
          style={{ top: "420px" }}
        >
          <div className="relative flex flex-col">
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
      </section>
      <section className="h-auto py-16 flex items-center justify-end bg-[#EDEDED] px-6 pr-12 md:pr-20">
        <div className="w-full flex justify-end">
          <div className="flex items-start gap-10 overflow-visible">
            <div className="w-[540px] text-right flex flex-col items-end gap-6">
              <p
                className={`${funnelSans.className} w-[420px] max-w-[420px] self-end text-justify text-xl leading-7 text-[#111827] sm:text-2xl`}
              >
                Register for the Loops Shanghai Hackathon to build AI-native and
                decentralized products alongside Asia's most elite builders and
                compete for an exclusive residency at Loops House Shanghai.
                <br />
                <br />
                We are scouting for the boldest technical founders to hack
                alongside Asia's most elite builders and compete for an
                exclusive residency at Loops House Shanghai.
              </p>
              <p
                className={`${funnelSans.className} justify-end text-right text-base font-medium text-[#5E0F00] sm:text-lg`}
              >
                10th April - 23rd April, 2026
              </p>
              <ShanghaiJoinButton
                onClick={() => {
                  window.location.href = "https://luma.com/2uei9ti4";
                }}
              />
            </div>

            <div className="pointer-events-none mr-6 flex flex-col leading-[186px]">
              <span
                className={`${pixelifySans.className} relative left-4 -mt-1 text-[96px] sm:text-[140px] md:text-[180px] font-bold text-[#9F4231]`}
              >
                居
              </span>
              <span
                className={`${pixelifySans.className} relative left-4 -mt-1 text-[96px] sm:text-[140px] md:text-[180px] font-bold text-[#9F4231]`}
              >
                住
              </span>
              <span
                className={`${pixelifySans.className} relative left-4 -mt-1 text-[96px] sm:text-[140px] md:text-[180px] font-bold text-[#9F4231]`}
              >
                权
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="h-auto">
        <h2
          className={`${pixelifySans.className} text-center text-[120px] font-bold leading-none tracking-tight text-[#9F4231] mb-20`}
        >
          OUR PARTNERS
        </h2>
        <div className="relative z-20 mt-32 overflow-hidden">
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
                  className="flex shrink-0 items-center justify-center border border-[#9F4231] bg-[#5E0F00] px-6"
                  style={{ width: 291, height: 215, borderRadius: 25 }}
                >
                  <span className="text-3xl font-semibold text-[#EDEDED]">
                    GERMINA LABS
                  </span>
                </div>
                <div
                  className="flex shrink-0 items-center justify-center border border-[#9F4231] bg-[#5E0F00] px-6"
                  style={{ width: 291, height: 215, borderRadius: 182 }}
                >
                  <span className="text-3xl font-semibold text-[#EDEDED]">
                    DEVCOMPASS
                  </span>
                </div>
                <div
                  className="flex shrink-0 items-center justify-center border border-[#9F4231] bg-[#5E0F00] px-6"
                  style={{ width: 291, height: 215, borderRadius: 25 }}
                >
                  <span className="text-3xl font-semibold text-[#EDEDED]">
                    OPEN BUILD
                  </span>
                </div>
                <div
                  className="flex shrink-0 items-center justify-center border border-[#9F4231] bg-[#5E0F00] px-6"
                  style={{ width: 291, height: 215, borderRadius: 182 }}
                >
                  <span className="text-3xl font-semibold text-[#EDEDED]">
                    GERMINA LABS
                  </span>
                </div>
                <div
                  className="flex shrink-0 items-center justify-center border border-[#9F4231] bg-[#5E0F00] px-6"
                  style={{ width: 291, height: 215, borderRadius: 25 }}
                >
                  <span className="text-3xl font-semibold text-[#EDEDED]">
                    DEVCOMPASS
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
      <section className="relative h-screen w-full">
        <Image
          src="/assets/shanghai/footer.svg"
          alt="Shanghai footer pattern"
          fill
          sizes="100vw"
          className="object-cover"
        />
      </section>
    </main>
  );
}
