import { ArrowUpRight, FolderOpen, Trophy, Zap } from "lucide-react";
import Link from "next/link";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

export default function DashboardPage() {
  return (
    <div className="min-h-screen absolute -top-8" style={{ backgroundColor: "#F8FFE8" }}>
      <div className="px-10 pt-16 pb-24">
        {/* Hero row */}
        <div className="flex flex-row justify-between gap-10 mb-16">
          <h1
            className="font-black text-[#0F2C23] leading-[0.9] uppercase"
            style={{
              fontFamily: PX,
              fontSize: "clamp(64px, 10vw, 140px)",
              letterSpacing: "-0.04em",
            }}
          >
            Loops
            <br />
            House.
          </h1>

          <p
            className="max-w-sm text-right leading-relaxed mt-4"
            style={{
              fontFamily: FN,
              fontSize: "clamp(14px, 1.4vw, 18px)",
              color: "rgba(15,44,35,0.7)",
            }}
          >
            Spin up projects, refine ideas, and ship faster with agent-assisted boosters.
          </p>
        </div>

        {/* Cards row */}
        <div className="mt-14 grid gap-8 md:grid-cols-1 lg:grid-cols-3">
          {/* Project Hub */}
          <Link
            href="/builder/projects"
            className="no-underline rounded-[48px] relative overflow-hidden group transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_40px_80px_-20px_rgba(15,44,35,0.25)]"
            style={{ backgroundColor: "#0F2C23" }}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="dot-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1.5" fill="#E2FEA5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dot-pattern)" />
              </svg>
            </div>

            <div className="p-10 h-full min-h-[320px] flex flex-col justify-between relative z-10">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#E2FEA5] text-[#0F2C23] shadow-[0_0_30px_rgba(226,254,165,0.2)]">
                  <FolderOpen size={28} />
                </div>
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-[#E2FEA5] group-hover:bg-[#E2FEA5] group-hover:text-[#0F2C23] group-hover:border-[#E2FEA5] transition-all duration-300">
                  <ArrowUpRight size={20} />
                </div>
              </div>

              <div>
                <h2
                  className="font-black text-[#E2FEA5] uppercase mb-4"
                  style={{
                    fontFamily: PX,
                    fontSize: "clamp(26px, 3vw, 32px)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  View My Projects.
                </h2>
                <p
                  className="text-[15px] leading-relaxed"
                  style={{ fontFamily: FN, color: "rgba(255,255,255,0.55)" }}
                >
                  Create, refine, and submit your projects to hackathons.
                </p>
              </div>
            </div>
          </Link>

          {/* Discover Hackathons */}
          <Link
            href="/hackathons"
            className="no-underline rounded-[48px] relative overflow-hidden group transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_40px_80px_-20px_rgba(226,254,165,0.4)]"
            style={{ backgroundColor: "#E2FEA5" }}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.1] pointer-events-none">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0F2C23" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-pattern)" />
              </svg>
            </div>

            <div className="p-10 h-full min-h-[320px] flex flex-col justify-between relative z-10">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#0F2C23] text-[#E2FEA5] shadow-[0_0_30px_rgba(15,44,35,0.1)]">
                  <Zap size={28} />
                </div>
                <div className="w-10 h-10 rounded-full border border-[#0F2C23]/20 flex items-center justify-center text-[#0F2C23] group-hover:bg-[#0F2C23] group-hover:text-[#E2FEA5] group-hover:border-[#0F2C23] transition-all duration-300">
                  <ArrowUpRight size={20} />
                </div>
              </div>

              <div>
                <h2
                  className="font-black text-[#0F2C23] uppercase mb-4"
                  style={{
                    fontFamily: PX,
                    fontSize: "clamp(26px, 3vw, 32px)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Explore Hackathons.
                </h2>
                <p
                  className="text-[15px] leading-relaxed"
                  style={{ fontFamily: FN, color: "rgba(15,44,35,0.7)" }}
                >
                  Browse open challenges, grants, and hackathons to find your next break.
                </p>
              </div>
            </div>
          </Link>

          {/* Host a Hackathon */}
          <Link
            href="/host"
            className="no-underline rounded-[48px] relative overflow-hidden group transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_40px_80px_-20px_rgba(15,44,35,0.08)] border border-[#0F2C23]/5"
            style={{ backgroundColor: "rgba(15, 44, 35, 0.04)" }}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern
                    id="diagonal-pattern"
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 0 20 L 20 0 M -5 5 L 5 -5 M 15 25 L 25 15"
                      fill="none"
                      stroke="#0F2C23"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#diagonal-pattern)" />
              </svg>
            </div>

            <div className="p-10 h-full min-h-[320px] flex flex-col justify-between relative z-10">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#0F2C23] text-[#E2FEA5] shadow-[0_0_30px_rgba(15,44,35,0.05)]">
                  <Trophy size={28} />
                </div>
                <div className="w-10 h-10 rounded-full border border-[#0F2C23]/10 flex items-center justify-center text-[#0F2C23] group-hover:bg-[#0F2C23] group-hover:text-[#E2FEA5] group-hover:border-[#0F2C23] transition-all duration-300">
                  <ArrowUpRight size={20} />
                </div>
              </div>

              <div>
                <h2
                  className="font-black text-[#0F2C23] uppercase mb-4"
                  style={{
                    fontFamily: PX,
                    fontSize: "clamp(26px, 3vw, 32px)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Host a Hackathon.
                </h2>
                <p
                  className="text-[15px] leading-relaxed"
                  style={{ fontFamily: FN, color: "rgba(15,44,35,0.65)" }}
                >
                  Launch your own ecosystem hackathon and discover talent.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
