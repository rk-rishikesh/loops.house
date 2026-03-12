import Link from "next/link";
import { ArrowUpRight, Gavel, Calendar, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server-auth";
import {
  getUserJudgeHackathonsServer,
  getHackathonsByIdsServer,
  getSubmissionsForHackathonsServer,
} from "@/lib/server-data";

function ArrowCircle({ size = 44 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-flex items-center justify-center rounded-full shrink-0 bg-[#d6cfc0] text-[#2d4a3e]"
    >
      <ArrowUpRight size={Math.round(size * 0.4)} />
    </span>
  );
}

export default async function JudgeDashboardPage() {
  const auth = await getServerAuth();
  if (!auth) redirect("/login");

  const { capabilities, userId } = auth;
  if (!capabilities.isJudge && !capabilities.isAdmin) {
    redirect("/dashboard");
  }

  const hackathonIds = capabilities.isAdmin
    ? [] // admins see all — handled below
    : await getUserJudgeHackathonsServer(userId);

  // Admin sees all hackathons they judge; if admin has no judge assignments, show empty
  if (!capabilities.isAdmin && hackathonIds.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>
        <div className="px-10 pt-16 pb-24">
          <h1
            className="font-black text-[#2d4a3e] leading-[0.88] uppercase mb-8"
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: "clamp(46px, 8vw, 120px)",
              letterSpacing: "-0.025em",
            }}
          >
            Judge
          </h1>
          <div className="py-24 text-center">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
              style={{ backgroundColor: "rgba(45,74,62,0.08)", color: "#2d4a3e" }}
            >
              <Gavel size={24} />
            </div>
            <p
              className="font-black text-[#2d4a3e] uppercase mb-3"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "clamp(18px, 2.5vw, 28px)",
                letterSpacing: "-0.02em",
              }}
            >
              No hackathons assigned.
            </p>
            <p
              className="text-[#2d4a3e]/50 leading-relaxed"
              style={{ fontFamily: "Georgia, serif", fontSize: 15 }}
            >
              When a host invites you to judge a hackathon, it will appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hackathonMap = await getHackathonsByIdsServer(hackathonIds);
  const hackathons = Object.values(hackathonMap);
  const submissions = await getSubmissionsForHackathonsServer(hackathonIds);

  // Count submissions per hackathon
  const subCountMap: Record<string, number> = {};
  for (const sub of submissions) {
    subCountMap[sub.hackathon_id] = (subCountMap[sub.hackathon_id] ?? 0) + 1;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>
      <div className="px-10 pt-16 pb-24">
        {/* Hero heading */}
        <div className="mb-16">
          <h1
            className="font-black text-[#2d4a3e] leading-[0.88] uppercase"
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: "clamp(46px, 8vw, 120px)",
              letterSpacing: "-0.025em",
            }}
          >
            Judge
          </h1>
          <div className="flex justify-end mt-6">
            <p
              className="text-[#2d4a3e]/55 max-w-[420px] text-right leading-relaxed"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(14px, 1.5vw, 18px)",
              }}
            >
              Your judging dashboard. Select a hackathon to review and score
              submissions.
            </p>
          </div>
        </div>

        {/* Hackathon cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hackathons.map((h) => {
            const subCount = subCountMap[h.id] ?? 0;
            return (
              <Link
                key={h.id}
                href={`/judge/${h.id}`}
                className="group no-underline"
              >
                <div
                  className="rounded-3xl p-7 flex flex-col justify-between transition-all duration-200 group-hover:scale-[1.01]"
                  style={{ backgroundColor: "#2d4a3e", minHeight: 220 }}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "rgba(214,207,192,0.15)" }}
                    >
                      <Gavel size={22} style={{ color: "#d6cfc0" }} />
                    </div>
                    <ArrowCircle size={44} />
                  </div>
                  <div className="mt-8">
                    <h3
                      className="font-black text-[#f0ebe0] uppercase leading-tight mb-2"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "clamp(18px, 2vw, 24px)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {h.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="flex items-center gap-1.5 text-[#f0ebe0]/50 text-sm" style={{ fontFamily: "Georgia, serif" }}>
                        <Users size={13} />
                        {subCount} submission{subCount !== 1 ? "s" : ""}
                      </span>
                      {h.start_date && (
                        <span className="flex items-center gap-1.5 text-[#f0ebe0]/50 text-sm" style={{ fontFamily: "Georgia, serif" }}>
                          <Calendar size={13} />
                          {new Date(h.start_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
