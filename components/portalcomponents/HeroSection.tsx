"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { funnelSans, pixelifySans } from "@/app/fonts";
import AnimatedButton from "@/components/buttons/animatedButton";
import AnimatedHeroCat from "@/components/portalcomponents/AnimatedHeroCat";

export function HeroSection() {
  return (
    <div
      id="overview"
      className="flex h-screen w-full flex-col bg-[#F8FFE8] text-[#0f241c]"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 md:block md:flex-none md:px-0">
        <header className="flex w-full shrink-0 flex-col items-center pb-2 pt-[clamp(1.25rem,5vh,2.25rem)] md:mb-2 md:mt-2 md:h-[80px] md:flex-row md:justify-between md:py-0">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="Loops Logo"
              width={28}
              height={28}
              className="h-5 w-7"
            />
            <span
              className={`${pixelifySans.className} text-xl font-bold uppercase tracking-tighter text-[#10271d]`}
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
        </header>

        <div className="flex min-h-0 flex-1 flex-col items-center pb-[max(4rem,env(safe-area-inset-bottom))] pt-[clamp(1rem,4vh,2rem)] md:hidden mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-1 text-center"
          >
            <div className="flex flex-row flex-nowrap items-baseline justify-center gap-3">
              <motion.span
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.38,
                  delay: 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`${funnelSans.className} text-[clamp(3.75rem,16vw,5.5rem)] font-bold leading-none tracking-[-0.04em] text-[#10271d]`}
              >
                Ideate
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.38,
                  delay: 0.16,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`${funnelSans.className} text-[clamp(3.75rem,16vw,5.5rem)] font-bold leading-none tracking-[-0.04em] text-[#b5c1b4]`}
              >
                Launch
              </motion.span>
            </div>
            <motion.span
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.38,
                delay: 0.24,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`${funnelSans.className} relative text-[clamp(3.75rem,16vw,5.5rem)] font-bold leading-none tracking-[-0.04em] text-[#10271d]`}
            >
              Iterate
              <span
                className="pointer-events-none absolute -bottom-1 left-1/2 h-2 w-[min(100%,11rem)] -translate-x-1/2 rounded-full bg-[#10271d]/12 blur-md"
                aria-hidden
              />
            </motion.span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.06,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex min-h-0 w-full flex-1 items-center justify-center"
          >
            <div className="flex w-full max-w-[22rem] flex-col items-center gap-[clamp(0.75rem,2.5vh,1.5rem)]">
              <div className="relative flex aspect-[320/180] w-full max-w-[20rem] items-end justify-center overflow-hidden rounded-[25px] bg-[#3C574B]">
                <AnimatedHeroCat
                  src="/assets/portal/peepingCat.png"
                  alt=""
                  width={285}
                  height={180}
                  className="max-h-44 w-auto object-contain object-bottom"
                />
                <Image
                  src="/assets/portal/catHands.png"
                  alt=""
                  width={196}
                  height={124}
                  className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-0.5"
                />
              </div>
              <p
                className={`${funnelSans.className} px-2 text-center text-[0.9375rem] leading-snug text-[#0f241c]/80`}
              >
                Projects built with agents. Evaluated by agents. Competing on
                traction.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.42,
              delay: 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="w-full max-w-[20rem] pt-[clamp(1rem,3vh,1.5rem)]"
          >
            <Link href="/login" className="inline-flex w-full justify-center">
              <AnimatedButton
                text="Login to Loops"
                leftPadding={34}
                rightPadding={9}
                height={64}
                fullWidth
              />
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative top-[10px] mt-12 hidden flex-row items-start justify-between md:flex"
        >
          <div className="flex flex-col gap-48">
            <div className="relative -left-2 top-16 flex flex-col gap-20">
              <motion.span
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{
                  duration: 0.42,
                  delay: 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`block text-[#10271d] ${funnelSans.className} font-bold tracking-[-0.04em] text-[220px] leading-[84px]`}
              >
                Ideate
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{
                  duration: 0.42,
                  delay: 0.16,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`block text-[#b5c1b4] ${funnelSans.className} font-bold tracking-[-0.04em] text-[220px] leading-[84px]`}
              >
                Launch
              </motion.span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-12 ">
            <div className="flex flex-col items-center gap-10">
              <div className="flex h-[193px] w-[342px] items-end justify-center overflow-hidden rounded-[25px] bg-[#3C574B]">
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
              <div className={funnelSans.className}>
                Projects built with agents. Evaluated by agents. Competing on
                traction.
              </div>

              <div className="flex flex-row items-end gap-12">
                <div className="flex flex-col gap-3">
                  <Link
                    href="/projects"
                    className="inline-flex h-[44px] w-[220px] items-center justify-center"
                  >
                    <AnimatedButton
                      text="Projects Gallery"
                      leftPadding={20}
                      rightPadding={2}
                      gap={22}
                      height={44}
                      invertedColors
                      fullWidth
                    />
                  </Link>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{
                    duration: 0.42,
                    delay: 0.24,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`${funnelSans.className} text-[220px] font-bold leading-[152.2px] tracking-[-0.04em] text-[#10271d]`}
                >
                  Iterate
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
