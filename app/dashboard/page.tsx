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
        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {/* Project Hub */}
          <Link
            href="/builder/projects"
            className="no-underline rounded-3xl relative overflow-hidden group"
            style={{ backgroundColor: "#16382C" }}
          >
            <div className="p-8 h-full min-h-[260px] flex flex-col justify-between">
              <div>
                <p
                  className="text-[10px] tracking-[0.22em] uppercase font-bold mb-4"
                  style={{ fontFamily: PX, color: "rgba(226,254,165,0.6)" }}
                >
                  My workspace
                </p>
                <h2
                  className="font-black text-[#E2FEA5] uppercase mb-4"
                  style={{
                    fontFamily: PX,
                    fontSize: "clamp(22px, 2.6vw, 26px)",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Project Hub
                </h2>
                <p
                  className="text-[15px] leading-relaxed"
                  style={{ fontFamily: FN, color: "rgba(226,254,165,0.8)" }}
                >
                  Create, manage, and submit your projects to open programs.
                </p>
              </div>
            </div>
          </Link>

          {/* Explore Boosters */}
          <Link
            href="/hackathons"
            className="no-underline rounded-3xl relative overflow-hidden group"
            style={{ backgroundColor: "rgba(15,44,35,0.04)" }}
          >
            <div className="p-8 h-full min-h-[260px] flex flex-col justify-between">
              <div>
                <p
                  className="text-[10px] tracking-[0.22em] uppercase font-bold mb-4"
                  style={{ fontFamily: PX, color: "rgba(15,44,35,0.7)" }}
                >
                  Boost your project
                </p>
                <h2
                  className="font-black text-[#0F2C23] uppercase mb-4"
                  style={{
                    fontFamily: PX,
                    fontSize: "clamp(22px, 2.6vw, 26px)",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Explore Boosters
                </h2>
                <p
                  className="text-[15px] leading-relaxed"
                  style={{ fontFamily: FN, color: "rgba(15,44,35,0.8)" }}
                >
                  Browse hackathons, grants, and build programs to accelerate your project.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
