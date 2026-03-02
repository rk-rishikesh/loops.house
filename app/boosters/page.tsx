"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lightbulb, Zap, DollarSign, ArrowLeft, ArrowUpRight } from "lucide-react";
import { useRole } from "@/lib/queries";
import Image from "next/image";

const BOOSTERS: {
  type: "idea" | "momentum" | "capital";
  label: string;
  sublabel: string;
  index: string;
  heroWord: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    type: "idea",
    label: "IDEA",
    sublabel: "BOOSTER",
    index: "01",
    heroWord: "Validate",
    description:
      "Turn raw ideas into tested concepts. Get structured feedback, problem-statement clarity, and early signal before committing to build.",
    icon: Lightbulb,
  },
  {
    type: "momentum",
    label: "MOMENTUM",
    sublabel: "BOOSTER",
    index: "02",
    heroWord: "Accelerate",
    description:
      "Break through inertia. Focused sprints, accountability structures, and community-powered momentum to keep you moving.",
    icon: Zap,
  },
  {
    type: "capital",
    label: "CAPITAL",
    sublabel: "BOOSTER",
    index: "03",
    heroWord: "Fund",
    description:
      "Connect with funding opportunities, investor signals, and financial frameworks tailored for high-conviction builders.",
    icon: DollarSign,
  },
];

function ArrowCircle({ size = 52 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-flex items-center justify-center rounded-full bg-[#2d4a3e] text-[#f0ebe0] shrink-0"
    >
      <ArrowUpRight size={size * 0.38} />
    </span>
  );
}

export default function BoostersLandingPage() {
  const { data: role } = useRole();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>
      {/* Back nav */}
      <div className="px-10 pt-10 pb-0 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold text-[#2d4a3e]/50 hover:text-[#2d4a3e] transition-colors no-underline"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <ArrowLeft size={12} /> Loops House
        </Link>
        <Image
          src="/builder/woolCat.svg"
          alt="mascot"
          width={48}
          height={48}
          unoptimized
          className="opacity-60"
        />
      </div>

      {/* Scrollable sections */}
      <div
        className="transition-all duration-500 ease-out"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
        }}
      >
        {BOOSTERS.map((b, i) => {
          const isRight = i % 2 === 1;
          return (
          <section key={b.type} className={`relative flex flex-col ${isRight ? "items-end" : ""}`}>
            {/* Giant hero word — bleeds left or right, partially behind card */}
            <div
              className={`pt-6 select-none pointer-events-none overflow-hidden ${isRight ? "pr-8 text-right" : "pl-8"}`}
              style={{ lineHeight: 0.85 }}
            >
              <span
                className="font-black text-[#2d4a3e] block"
                style={{
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: "clamp(88px, 13vw, 172px)",
                  letterSpacing: "-0.03em",
                }}
              >
                {b.heroWord}
              </span>
            </div>

            {/* Card overlapping the hero word */}
            <div className={`relative -mt-8 px-8 z-10 w-full ${isRight ? "flex flex-col items-end" : ""}`}>
              <Link href={`/boosters/${b.type}`} className="no-underline block group">
                <div
                  className="rounded-3xl max-w-[800px] px-10 pt-9 pb-11 transition-transform duration-200 group-hover:scale-[1.005]"
                  style={{ backgroundColor: "#d6cfc0" }}
                >
                  {/* Top row: big index + label + arrow circle */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-6">
                      <span
                        className="font-black text-[#2d4a3e] leading-none"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "clamp(56px, 8vw, 96px)",
                          letterSpacing: "-0.03em",
                        }}
                      >
                        {b.index}
                      </span>
                      <div>
                        <p
                          className="font-black text-[#2d4a3e] leading-[1.1]"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "clamp(16px, 2.2vw, 26px)",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {b.label}
                        </p>
                        <p
                          className="font-black text-[#2d4a3e] leading-[1.1]"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "clamp(16px, 2.2vw, 26px)",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {b.sublabel}
                        </p>
                      </div>
                    </div>
                    <ArrowCircle size={54} />
                  </div>

                  {/* Description body */}
                  <div className="mt-10 pl-1">
                    <p
                      className="text-[#2d4a3e] leading-[1.7]"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "clamp(15px, 1.6vw, 19px)",
                        maxWidth: "680px",
                        letterSpacing: "0.005em",
                      }}
                    >
                      {b.description}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </section>
          );
        })}

        {/* Bottom padding */}
        <div className="h-20" />
      </div>
    </main>
  );
}