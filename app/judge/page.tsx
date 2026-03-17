import { ArrowUpRight, Calendar, Clock, Gavel, History, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server-auth";
import {
  getHackathonsByIdsServer,
  getSubmissionsForHackathonsServer,
  getUserJudgeHackathonsServer,
} from "@/lib/server-data";
import { PHASE_COLORS, PHASE_LABELS, type HackathonPhase } from "@/lib/hackathon-phase";
import type { StoredHackathon } from "@/lib/data-mappers";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

function ArrowCircle({ size = 44 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-flex items-center justify-center rounded-full shrink-0 bg-[#0F2C23] text-[#F8FFE8]"
    >
      <ArrowUpRight size={Math.round(size * 0.4)} />
    </span>
  );
}

function PhaseBadge({ phase }: { phase: HackathonPhase }) {
  const colors = PHASE_COLORS[phase];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase"
      style={{ backgroundColor: colors.bg, color: colors.text, fontFamily: FN }}
    >
      {phase === "judging" && <Gavel size={11} />}
      {phase === "upcoming" && <Clock size={11} />}
      {(phase === "completed" || phase === "finalized") && <History size={11} />}
      {PHASE_LABELS[phase]}
    </span>
  );
}

/** Judging-phase hackathons link to the judge dashboard; all others link to the public hackathon page */
function hackathonHref(h: StoredHackathon, phase: HackathonPhase) {
  return phase === "judging" ? `/judge/${h.id}` : `/hackathons/${h.id}`;
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
      <div className="min-h-screen" style={{ backgroundColor: "#F8FFE8" }}>
        <div className="px-10 pt-16 pb-24">
          <h1
            className="font-black text-[#0F2C23] leading-[0.88] uppercase mb-8"
            style={{
              fontFamily: PX,
              fontSize: "clamp(46px, 8vw, 120px)",
              letterSpacing: "-0.025em",
            }}
          >
            Judge
          </h1>
          <div className="py-24 text-center">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
              style={{ backgroundColor: "rgba(15,44,35,0.08)", color: "#0F2C23" }}
            >
              <Gavel size={24} />
            </div>
            <p
              className="font-black text-[#0F2C23] uppercase mb-3"
              style={{
                fontFamily: PX,
                fontSize: "clamp(18px, 2.5vw, 28px)",
                letterSpacing: "-0.02em",
              }}
            >
              No hackathons assigned.
            </p>
            <p
              className="leading-relaxed"
              style={{ fontFamily: FN, fontSize: 15, color: "rgba(15,44,35,0.55)" }}
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

  // Group hackathons by phase
  const grouped: Record<string, { hackathon: StoredHackathon; phase: HackathonPhase }[]> = {
    judging: [],
    upcoming: [],
    building: [],
    completed: [],
    finalized: [],
  };
  for (const h of hackathons) {
    grouped[h.phase].push({ hackathon: h, phase: h.phase });
  }

  // Order: active judging first, then upcoming, building, completed, finalized
  const sectionOrder: { key: string; title: string; subtitle: string }[] = [
    { key: "judging", title: "Active — Ready to Judge", subtitle: "These hackathons are in the judging phase. Review and score submissions now." },
    { key: "upcoming", title: "Upcoming", subtitle: "Judging hasn't started yet for these hackathons." },
    { key: "building", title: "Building Phase", subtitle: "Builders are still working. Judging will open after the submission deadline." },
    { key: "completed", title: "Past — Awaiting Finalization", subtitle: "Judging period is over. Results pending finalization by the host." },
    { key: "finalized", title: "Past — Finalized", subtitle: "These hackathons have been completed and finalized." },
  ];

  const nonEmptySections = sectionOrder.filter((s) => grouped[s.key].length > 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FFE8" }}>
      <div className="px-10 pt-16 pb-24">
        {/* Hero heading */}
        <div className="mb-16 flex flex-row items-end justify-between gap-6 flex-wrap">
          <h1
            className="font-black text-[#0F2C23] leading-[0.88] uppercase"
            style={{
              fontFamily: PX,
              fontSize: "clamp(60px, 9vw, 140px)",
              letterSpacing: "-0.025em",
            }}
          >
            JUDGE
          </h1>
          <p
            className="max-w-[420px] text-right leading-relaxed"
            style={{
              fontFamily: FN,
              fontSize: "clamp(14px, 1.5vw, 18px)",
              color: "rgba(15,44,35,0.55)",
            }}
          >
            Your judging dashboard. Select a hackathon to review and score submissions.
          </p>
        </div>

        {/* Grouped hackathon sections */}
        {nonEmptySections.map((section) => (
          <div key={section.key} className="mb-12">
            <div className="mb-5">
              <h2
                className="font-black text-[#0F2C23] uppercase leading-tight"
                style={{
                  fontFamily: PX,
                  fontSize: "clamp(20px, 3vw, 32px)",
                  letterSpacing: "-0.02em",
                }}
              >
                {section.title}
              </h2>
              <p
                className="mt-1 leading-relaxed"
                style={{ fontFamily: FN, fontSize: 14, color: "rgba(15,44,35,0.5)" }}
              >
                {section.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {grouped[section.key].map(({ hackathon: h, phase }) => {
                const subCount = subCountMap[h.id] ?? 0;
                const isActive = phase === "judging";
                const href = hackathonHref(h, phase);

                return (
                  <Link key={h.id} href={href} className="group no-underline">
                    <div
                      className="rounded-3xl p-7 flex flex-col justify-between transition-all duration-200 group-hover:scale-[1.01] relative overflow-hidden"
                      style={{
                        backgroundColor: isActive ? "#0F2C23" : "rgba(15,44,35,0.06)",
                        minHeight: 260,
                        border: isActive ? "2px solid #E2FEA5" : "1px solid rgba(15,44,35,0.1)",
                      }}
                    >
                      {/* Watermark — active cards only */}
                      {isActive && (
                        <span
                          className="pointer-events-none select-none"
                          style={{
                            position: "absolute",
                            right: -12,
                            top: 18,
                            fontFamily: PX,
                            fontSize: 40,
                            letterSpacing: "0.32em",
                            textTransform: "uppercase",
                            color: "rgba(248,255,232,0.06)",
                          }}
                        >
                          AI Powered
                        </span>
                      )}

                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: isActive
                                ? "rgba(248,255,232,0.06)"
                                : "rgba(15,44,35,0.06)",
                            }}
                          >
                            <Gavel
                              size={22}
                              style={{ color: isActive ? "#E2FEA5" : "#0F2C23" }}
                            />
                          </div>
                          <PhaseBadge phase={phase} />
                        </div>
                        <ArrowCircle size={44} />
                      </div>

                      <div className="mt-8">
                        <h3
                          className="font-black uppercase leading-tight mb-2"
                          style={{
                            fontFamily: PX,
                            fontSize: "clamp(18px, 2vw, 24px)",
                            letterSpacing: "-0.02em",
                            color: isActive ? "#F8FFE8" : "#0F2C23",
                          }}
                        >
                          {h.name}
                        </h3>
                        <div className="flex items-center gap-4 mt-3">
                          <span
                            className="flex items-center gap-1.5 text-sm"
                            style={{
                              fontFamily: FN,
                              color: isActive
                                ? "rgba(248,255,232,0.7)"
                                : "rgba(15,44,35,0.55)",
                            }}
                          >
                            <Users size={13} />
                            {subCount} submission{subCount !== 1 ? "s" : ""}
                          </span>
                          {h.start_date && (
                            <span
                              className="flex items-center gap-1.5 text-sm"
                              style={{
                                fontFamily: FN,
                                color: isActive
                                  ? "rgba(248,255,232,0.7)"
                                  : "rgba(15,44,35,0.55)",
                              }}
                            >
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
        ))}
      </div>
    </div>
  );
}
