"use client";

import Link from "next/link";
import { Lightbulb, Zap, DollarSign, ArrowUpRight } from "lucide-react";
import { useIsMounted } from "@/hooks/use-is-mounted";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

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
      style={{ width: size, height: size, backgroundColor: "#3C574B" }}
      className="inline-flex items-center justify-center rounded-full shrink-0"
    >
      <ArrowUpRight size={size * 0.38} style={{ color: "#E2FEA5" }} />
    </span>
  );
}

export default function BoostersLandingPage() {
  const mounted = useIsMounted();

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#F8FFE8" }}>
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
            <div
              className={`pt-6 select-none pointer-events-none overflow-hidden ${isRight ? "pr-8 text-right" : "pl-8"}`}
              style={{ lineHeight: 0.85 }}
            >
              <span
                className="font-black block"
                style={{
                  fontFamily: PX,
                  fontSize: "clamp(48px, 12vw, 160px)",
                  letterSpacing: "-0.03em",
                  color: "#3C574B",
                }}
              >
                {b.heroWord}
              </span>
            </div>

            <div className={`relative -mt-8 px-8 z-10 w-full ${isRight ? "flex flex-col items-end" : ""}`}>
              <Link href={`/boosters/${b.type}`} className="no-underline block group">
                <div
                  className="rounded-3xl max-w-[800px] px-10 pt-9 pb-11 transition-transform duration-200 group-hover:scale-[1.005]"
                  style={{ backgroundColor: "#0F2C23" }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-6">
                      <span
                        className="font-black leading-none"
                        style={{
                          fontFamily: PX,
                          fontSize: "clamp(56px, 8vw, 96px)",
                          letterSpacing: "-0.03em",
                          color: "#E2FEA5",
                        }}
                      >
                        {b.index}
                      </span>
                      <div>
                        <p
                          className="font-black leading-[1.1]"
                          style={{
                            fontFamily: PX,
                            fontSize: "clamp(16px, 2.2vw, 26px)",
                            letterSpacing: "-0.01em",
                            color: "#E2FEA5",
                          }}
                        >
                          {b.label}
                        </p>
                        <p
                          className="font-black leading-[1.1]"
                          style={{
                            fontFamily: PX,
                            fontSize: "clamp(16px, 2.2vw, 26px)",
                            letterSpacing: "-0.01em",
                            color: "rgba(226,254,165,0.5)",
                          }}
                        >
                          {b.sublabel}
                        </p>
                      </div>
                    </div>
                    <ArrowCircle size={54} />
                  </div>

                  <div className="mt-10 pl-1">
                    <p
                      className="leading-[1.7]"
                      style={{
                        fontFamily: FN,
                        fontSize: "clamp(15px, 1.6vw, 19px)",
                        maxWidth: "680px",
                        letterSpacing: "0.005em",
                        color: "rgba(248,255,232,0.6)",
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

        <div className="h-20" />
      </div>
    </main>
  );
}
