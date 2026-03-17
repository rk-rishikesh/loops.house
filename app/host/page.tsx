import { ArrowUpRight, FolderOpen, Plus, Users, Zap } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HackathonPhaseBadge } from "@/components/ui/hackathon-phase-badge";
import { getServerAuth } from "@/lib/server-auth";
import { getHackathonsServer, getSubmissionsForHackathonsServer } from "@/lib/server-data";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

/* ─── Page ────────────────────────────────────────────────────────── */
export default async function HostDashboardPage() {
  const auth = await getServerAuth();
  if (!auth) redirect("/login?redirect=/host");

  const allHackathons = await getHackathonsServer({ includeDrafts: true });
  const hackathons = allHackathons.filter(
    (h) => h.host_id === auth.userId || auth.capabilities.cohostOf.includes(h.id),
  );
  const hackathonIds = hackathons.map((b: { id: string }) => b.id);
  const submissions = await getSubmissionsForHackathonsServer(hackathonIds);

  const totalHackathons = hackathons.length;
  const totalProjectsSubmitted = submissions.length;
  const uniqueTeams = new Set(submissions.map((s: { team_id: string }) => s.team_id));
  const totalDevelopersEngaged = uniqueTeams.size;

  const hackathonStats: Record<string, { projects: number; teams: number }> = {};
  for (const sub of submissions) {
    const stats =
      hackathonStats[sub.hackathon_id] ??
      (hackathonStats[sub.hackathon_id] = { projects: 0, teams: 0 });
    stats.projects += 1;
  }
  // compute unique team counts per hackathon
  const hackathonTeamSets: Record<string, Set<string>> = {};
  for (const sub of submissions) {
    const set =
      hackathonTeamSets[sub.hackathon_id] ??
      (hackathonTeamSets[sub.hackathon_id] = new Set<string>());
    set.add(sub.team_id);
  }
  for (const [hackathonId, set] of Object.entries(hackathonTeamSets)) {
    hackathonStats[hackathonId] = hackathonStats[hackathonId] ?? {
      projects: 0,
      teams: 0,
    };
    hackathonStats[hackathonId].teams = set.size;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FFE8" }}>
      <div className="px-10 pt-10 pb-24">
        {/* ══ HERO + STAT ROW ══════════════════════════════════════════
            Heading left — four stat tiles stacked right.             */}
        <div className="mb-14">
          <div className="flex items-start justify-between gap-8">
            <div>
              <h1
                className="font-black text-[#0F2C23] leading-[0.88] uppercase"
                style={{
                  fontFamily: PX,
                  fontSize: "clamp(52px, 9vw, 130px)",
                  letterSpacing: "-0.025em",
                }}
              >
                HOST
                <br />
                DASHBOARD.
              </h1>
              <p
                className="text-[#0F2C23]/50 mt-5 max-w-[360px] leading-relaxed"
                style={{ fontFamily: FN, fontSize: "clamp(14px, 1.3vw, 16px)" }}
              >
                Manage programs, review builder submissions, and track engagement across your
                hackathons.
              </p>
            </div>

            {/* Stat tiles — stacked vertically */}
            <div className="flex flex-col gap-2 shrink-0 mt-1">
              {[
                {
                  label: "Hackathons Created",
                  value: totalHackathons,
                  sub: null,
                  bg: "#0F2C23",
                  fg: "#E2FEA5",
                  fgMid: "rgba(226,254,165,0.45)",
                  Icon: Zap,
                  iconColor: "rgba(226,254,165,0.3)",
                },
                {
                  label: "Developers Engaged",
                  value: totalDevelopersEngaged,
                  sub: null,
                  bg: "#E2FEA5",
                  fg: "#0F2C23",
                  fgMid: "rgba(15,44,35,0.45)",
                  Icon: Users,
                  iconColor: "rgba(15,44,35,0.25)",
                },
                {
                  label: "Projects Submitted",
                  value: totalProjectsSubmitted,
                  sub: null,
                  bg: "rgba(15,44,35,0.04)",
                  fg: "#0F2C23",
                  fgMid: "rgba(15,44,35,0.38)",
                  Icon: FolderOpen,
                  iconColor: "rgba(15,44,35,0.22)",
                },
              ].map(({ label, value, sub, bg, fg, fgMid, Icon, iconColor }) => (
                <div
                  key={label}
                  className="rounded-2xl flex items-center gap-5 px-6 py-5"
                  style={{ backgroundColor: bg, minWidth: 260 }}
                >
                  <p
                    className="font-black leading-none"
                    style={{
                      fontFamily: FN,
                      fontSize: 30,
                      letterSpacing: "-0.04em",
                      color: fg,
                    }}
                  >
                    {value}
                  </p>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[9px] tracking-[0.2em] uppercase font-bold leading-none"
                      style={{
                        fontFamily: FN,
                        color: fgMid,
                      }}
                    >
                      {label}
                    </p>
                    {sub && (
                      <p
                        className="text-[9px] uppercase mt-1"
                        style={{
                          fontFamily: FN,
                          color: fgMid,
                          opacity: 0.75,
                          letterSpacing: "0.2em",
                        }}
                      >
                        {sub}
                      </p>
                    )}
                  </div>
                  <Icon size={18} style={{ color: iconColor, flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ MAIN SECTION — hosted hackathons table ═════════════════════ */}
        <div className="mt-8">
          <div className="rounded-3xl p-8" style={{ backgroundColor: "rgba(15,44,35,0.04)" }}>
            {/* Section header */}
            <div className="flex items-center justify-between mb-7">
              <div className="flex items-center justify-between w-full">
                <div className="flex-1 items-center gap-2">
                  {/* <p
                    className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40 mb-1"
                    style={{ fontFamily: FN }}
                  >
                    Your Programs
                  </p> */}
                  <h2
                    className="font-black text-[#0F2C23] uppercase"
                    style={{
                      fontFamily: FN,
                      fontSize: "clamp(20px, 2.5vw, 28px)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Your Hosted Hackathons
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href="/host/new"
                    className="inline-flex items-center gap-2 no-underline rounded-full text-[#E2FEA5] text-[9px] tracking-widest uppercase font-bold px-5 py-3.5"
                    style={{ backgroundColor: "#0F2C23", fontFamily: FN }}
                  >
                    <Plus size={10} /> Create Hackathon
                  </Link>
              
                </div>
              </div>
            </div>

            {/* Empty state */}
            {hackathons.length === 0 && (
              <div className="py-20 text-center">
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
                  style={{ backgroundColor: "rgba(15,44,35,0.08)", color: "#0F2C23" }}
                >
                  <Zap size={22} />
                </div>
                <p
                  className="font-black text-[#0F2C23] uppercase mb-2"
                  style={{ fontFamily: FN, fontSize: 16, letterSpacing: "-0.01em" }}
                >
                  No hackathons yet.
                </p>
                <p className="text-[#0F2C23]/50 text-sm mb-7" style={{ fontFamily: FN }}>
                  Create your first program to start engaging builders.
                </p>
                <Link
                  href="/host/new"
                  className="inline-flex items-center gap-2 no-underline rounded-full text-[#E2FEA5] text-[9px] tracking-widest uppercase font-bold px-5 py-3.5"
                  style={{ backgroundColor: "#0F2C23", fontFamily: FN }}
                >
                  <Plus size={10} /> Create Hackathon
                </Link>
              </div>
            )}

            {/* Table */}
            {hackathons.length > 0 && (
              <>
                {/* Column headers */}
                <div
                  className="grid py-3 mb-1"
                  style={{
                    gridTemplateColumns: "24px 1.6fr 140px 80px",
                    gap: "0 36px",
                    borderTop: "1px solid rgba(15,44,35,0.12)",
                    borderBottom: "1px solid rgba(15,44,35,0.12)",
                  }}
                >
                  {["#", "Program", "Status", "View"].map((col) => (
                    <p
                      key={col}
                      className={`text-[9px] tracking-[0.12em] uppercase font-bold text-[#0F2C23]/30 ${
                        col === "Status" || col === "View" ? "text-center" : ""
                      }`}
                      style={{ fontFamily: FN }}
                    >
                      {col}
                    </p>
                  ))}
                </div>

                {/* Rows */}
                {hackathons.map((b, idx) => {
                  return (
                    <Link key={b.id} href={`/host/${b.id}`} className="no-underline group">
                      <div
                        className="grid py-5 transition-all rounded-sm hover:bg-[rgba(15,44,35,0.025)]"
                        style={{
                          gridTemplateColumns: "24px 1.6fr 140px 80px",
                          gap: "0 36px",
                          borderBottom: "1px solid rgba(15,44,35,0.07)",
                          alignItems: "center",
                        }}
                      >
                        {/* Index */}
                        <span
                          className="font-black text-[#0F2C23]/18 tabular-nums"
                          style={{ fontFamily: FN, fontSize: 11, letterSpacing: "-0.01em" }}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </span>

                        {/* Name + theme */}
                        <div className="min-w-0">
                          <p
                            className="font-black text-[#0F2C23] uppercase leading-tight truncate"
                            style={{
                              fontFamily: FN,
                              fontSize: "clamp(12px, 1.3vw, 14px)",
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {b.name}
                          </p>
                          {b.theme && (
                            <p
                              className="text-[#0F2C23]/45 text-[11px] mt-0.5 truncate"
                              style={{ fontFamily: FN }}
                            >
                              {b.theme}
                            </p>
                          )}
                        </div>

                        {/* Phase */}
                        <HackathonPhaseBadge phase={b.phase} />

                        {/* Arrow */}
                        <div className="flex justify-center">
                          <span
                            className="w-8 h-8 flex items-center justify-center rounded-full transition-transform group-hover:scale-105"
                            style={{ backgroundColor: "#0F2C23" }}
                          >
                            <ArrowUpRight size={13} style={{ color: "#E2FEA5" }} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
