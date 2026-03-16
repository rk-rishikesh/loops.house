"use client";

import Image from "next/image";
import Link from "next/link";
import { funnelSans, pixelifySans } from "@/app/fonts";
import { motion } from "framer-motion";

const terminalLines = [
  "IRL co-building environment.",
  "Direct access to Loops AI signals.",
  "Demo day + ecosystem exposure.",
];

export function ResidencySection() {
  return (
    <div
      id="dashboard"
      className="flex h-screen w-full justify-center bg-[#385244]"
    >
      <div className="flex w-full max-w-7xl flex-col">
        {/* Top-left: navigation / progress pills */}
        <div className="relative top-8 flex justify-center gap-3 md:justify-start">
          <div className="flex h-8 w-32 items-center justify-center rounded-full bg-[#f0f0f0] text-xs font-medium text-[#10271d]">
            Ideate
          </div>
          <div className="flex h-8 w-32 items-center justify-center rounded-full border border-[#f0f0f0] bg-transparent text-xs font-medium text-[#f0f0f0]">
            Validate
          </div>
          <div className="flex h-8 w-32 items-center justify-center rounded-full border border-[#f0f0f0] bg-transparent text-xs font-medium text-[#f0f0f0B3]">
            Accelerate
          </div>
        </div>

        {/* Desktop layout */}
        <div className="relative top-[60px] hidden w-full flex-row items-start md:flex">
          {/* Left column: title, description, CTA */}
          <div className="flex flex-col gap-20">
            <div className="flex flex-col">
              <span
                className={`${pixelifySans.className} font-bold tracking-[-0.04em] text-[180px] leading-none text-[#E2FEA5]`}
              >
                Loops
              </span>
              <span
                className={`${pixelifySans.className} font-bold tracking-[-0.04em] text-[180px] leading-[132.2px] text-[#E2FEA554] opacity-70`}
              >
                Residency
              </span>
            </div>

            <div className="flex flex-col gap-10">
              <p
                className={`${funnelSans.className} max-w-xl text-lg leading-relaxed text-[#f0f0f0]`}
              >
                Join a curated cohort of technical founders building in public.
                Collaborate, validate, and ship alongside high-conviction builders.
              </p>

              <Link
                href="/shanghai"
                className={`${funnelSans.className} inline-flex h-[44px] w-[200px] items-center justify-center rounded-full bg-[#E2FEA5] text-sm font-medium text-[#0F2C23] shadow-sm transition hover:bg-[#0b1b14] hover:text-[#E2FEA5]`}
              >
                <div className="flex flex-row items-center justify-between gap-20">
                  <span className="relative left-6 text-sm uppercase">Apply Now</span>
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

          {/* Right column - terminal / agentic panel */}
          {/* <div className="flex flex-1 flex-col items-start gap-8 pl-10">
            <motion.div
              className="w-full max-w-lg px-2 py-2"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="mb-4 flex items-center justify-between text-[12px] text-[#7ea58b]">
                <span className="font-mono">loops@house:~ residency</span>
                <span className="font-mono text-[11px]">agent • live</span>
              </div>

              <div className="mb-6 font-mono text-[13px] text-[#7ea58b]">
                &gt; shaping your agentic hacker house...
              </div>

              <div className="flex flex-col gap-7">
                {terminalLines.map((line, lineIndex) => {
                  // Split by word to ensure spaces render correctly
                  const words = line.split(" ");
                  // Calculate cumulative char count for stagger timing
                  const lineStart = 0.8 + lineIndex * 2.2;
                  let charCount = 0;

                  return (
                    <div
                      key={line}
                      className="flex items-baseline font-mono text-[13px] leading-relaxed text-[#E2FEA5]"
                    >
                      <span className="mr-3 text-[#7ea58b] text-[16px]">$</span>

                      <span className="flex flex-wrap gap-x-[0.35em]">
                        {words.map((word, wordIndex) => {
                          const wordStart = lineStart + charCount * 0.055;
                          charCount += word.length + 1; // +1 for space

                          return (
                            <span key={wordIndex} className="inline-flex">
                              {Array.from(word).map((ch, charIndex) => {
                                const delay = wordStart + charIndex * 0.055;
                                return (
                                  <motion.span
                                    key={charIndex}
                                    className="inline-block"
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true, amount: 0.5 }}
                                    transition={{
                                      delay,
                                      duration: 0.06,
                                    }}
                                  >
                                    {ch}
                                  </motion.span>
                                );
                              })}
                            </span>
                          );
                        })}

                        <motion.span
                          className="inline-block w-[2px] h-[18px] bg-[#7ea58b] ml-1 self-center"
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: [0, 1, 0] }}
                          viewport={{ once: false }}
                          transition={{
                            delay: lineStart + charCount * 0.055,
                            duration: 0.8,
                            repeat: Infinity,
                            repeatType: "loop",
                          }}
                        />
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <div className="relative h-[450px] w-[450px]">
              <Image
                src="/assets/portal/coworkingCat.svg"
                alt=""
                fill
                className="object-contain object-bottom-left"
              />
            </div>
          </div> */}
        </div>

        <div className="relative top-12 flex flex-col items-center gap-8 px-6 text-center md:hidden">
          {/* Col 1: Loops Residency */}
          <div className="flex flex-col gap-2">
            <span
              className={`${pixelifySans.className} font-bold tracking-[-0.04em] text-[56px] leading-none text-[#E2FEA5]`}
            >
              Loops
            </span>
            <span
              className={`${pixelifySans.className} font-bold tracking-[-0.04em] text-[48px] leading-none text-[#E2FEA554]`}
            >
              Residency
            </span>
          </div>

          <motion.div
            className="w-full max-w-sm px-2 text-left"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <div className="mb-3 flex items-center justify-between text-[11px] text-[#7ea58b]">
              <span className="font-mono">loops@house:~ residency</span>
              <span className="font-mono text-[10px]">agent • live</span>
            </div>

            <div className="mb-4 font-mono text-[12px] text-[#7ea58b]">
              &gt; evaluating your residency fit...
            </div>

            <div className="flex flex-col gap-5">
              {terminalLines.map((line, lineIndex) => {
                const words = line.split(" ");
                const lineStart = 0.7 + lineIndex * 2.0;
                let charCount = 0;

                return (
                  <div
                    key={line}
                    className="flex items-baseline font-mono text-[12px] leading-relaxed text-[#E2FEA5]"
                  >
                    <span className="mr-2 text-[#7ea58b] text-[12px]">$</span>
                    <span className="flex flex-wrap gap-x-[0.35em]">
                      {words.map((word, wordIndex) => {
                        const wordStart = lineStart + charCount * 0.06;
                        charCount += word.length + 1;

                        return (
                          <span key={wordIndex} className="inline-flex">
                            {Array.from(word).map((ch, charIndex) => (
                              <motion.span
                                key={charIndex}
                                className="inline-block"
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true, amount: 0.5 }}
                                transition={{
                                  delay: wordStart + charIndex * 0.06,
                                  duration: 0.07,
                                }}
                              >
                                {ch}
                              </motion.span>
                            ))}
                          </span>
                        );
                      })}

                      <motion.span
                        className="inline-block w-[2px] h-[10px] bg-[#7ea58b] ml-1 self-center"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: [0, 1, 0] }}
                        viewport={{ once: false }}
                        transition={{
                          delay: lineStart + charCount * 0.06,
                          duration: 0.8,
                          repeat: Infinity,
                          repeatType: "loop",
                        }}
                      />
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <div className="relative h-[260px] w-[220px]">
            <Image
              src="/assets/portal/coworkingCat.svg"
              alt=""
              fill
              className="object-contain"
            />
          </div>

          <Link
            href="/shanghai"
            className={`${funnelSans.className} mt-2 inline-flex h-[44px] w-[200px] items-center justify-center rounded-full bg-[#E2FEA5] text-sm font-medium text-[#0F2C23] shadow-sm transition hover:text-[#E2FEA5] hover:bg-[#0F2C23]`}
          >
            <span className="uppercase">Apply Now</span>
          </Link>
        </div>
      </div>
    </div>
  );
}