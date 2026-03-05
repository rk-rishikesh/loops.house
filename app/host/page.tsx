import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Plus,
  Users,
  FolderOpen,
  Zap,
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import {
  getBoostersServer,
  getSubmissionsForBoostersServer,
} from "@/lib/server-data";

/* ─── Type labels ─────────────────────────────────────────────────── */
const TYPE_LABELS: Record<string, { label: string; dot: string }> = {
  idea:     { label: "Early Stage",  dot: "#4caf7d"  },
  momentum: { label: "Build Phase",  dot: "#d6a84a"  },
  capital:  { label: "Scale Up",     dot: "#5b8fd4"  },
};

function getBoosterStatus(timeline?: string | null): "Ongoing" | "Upcoming" | "Past" {
  const tl = (timeline ?? "").toLowerCase();
  if (tl.includes("past") || tl.includes("ended") || tl.includes("closed")) return "Past";
  if (tl.includes("upcoming") || tl.includes("soon") || tl.includes("launch")) return "Upcoming";
  if (tl.includes("ongoing") || tl.includes("open") || tl.includes("now")) return "Ongoing";
  return "Ongoing";
}

/* ─── Page ────────────────────────────────────────────────────────── */
export default async function HostDashboardPage() {
  const boosters = await getBoostersServer();
  const boosterIds = boosters.map((b) => b.id);
  const submissions = await getSubmissionsForBoostersServer(boosterIds);

  const totalBoosters = boosters.length;
  const totalProjectsSubmitted = submissions.length;
  const uniqueTeams = new Set(submissions.map((s) => s.team_id));
  const totalDevelopersEngaged = uniqueTeams.size;

  const boosterStats: Record<string, { projects: number; teams: number }> = {};
  for (const sub of submissions) {
    const stats =
      boosterStats[sub.booster_id] ??
      (boosterStats[sub.booster_id] = { projects: 0, teams: 0 });
    stats.projects += 1;
    // track unique teams per booster
    // simple set per booster keyed by booster_id_team_id
  }
  // compute unique team counts per booster
  const boosterTeamSets: Record<string, Set<string>> = {};
  for (const sub of submissions) {
    const set =
      boosterTeamSets[sub.booster_id] ??
      (boosterTeamSets[sub.booster_id] = new Set<string>());
    set.add(sub.team_id);
  }
  for (const [boosterId, set] of Object.entries(boosterTeamSets)) {
    boosterStats[boosterId] = boosterStats[boosterId] ?? {
      projects: 0,
      teams: 0,
    };
    boosterStats[boosterId].teams = set.size;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>

      {/* ══ NAV ══════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-50" style={{ backgroundColor: "#f0ebe0" }}>
        <div className="pt-0">
          <div
            className="flex w-full items-stretch border-t border-b border-[#1a1a1a] text-[10px] tracking-[0.18em] uppercase font-bold text-[#1a1a1a]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {/* Left: back to portal */}
            <Link
              href="/"
              className="w-[240px] max-w-xs px-10 py-4 flex items-center justify-start border-r border-[#1a1a1a] no-underline hover:bg-[#e1dbcf]"
            >
              <span className="flex items-center gap-2">
                <ArrowLeft size={11} />
                <span>Portal</span>
              </span>
            </Link>

            {/* Center: title + New Booster CTA */}
            <div className="flex-1 min-w-0 py-4 flex items-center justify-between px-10 border-r border-[#1a1a1a]">
              <span>Host Dashboard</span>
              <Link
                href="/host/application"
                className="px-2 py-1 inline-flex items-center gap-0 rounded-full overflow-hidden no-underline group"
                style={{ backgroundColor: "#2d4a3e" }}
              >
                <span
                  className="pl-5 pr-3 text-[9px] tracking-[0.16em] uppercase font-bold text-[#f0ebe0]"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    lineHeight: "38px",
                  }}
                >
                  New Booster
                </span>
                <span
                  className="w-8 h-8 flex items-center justify-center rounded-full"
                  style={{ backgroundColor: "#d6cfc0" }}
                >
                  <Plus size={12} style={{ color: "#2d4a3e" }} />
                </span>
              </Link>
            </div>

            {/* Right: logout — entire segment clickable, same hover as Portal */}
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="px-10 pt-10 pb-24">

        {/* ══ HERO + STAT ROW ══════════════════════════════════════════
            Heading left — four stat tiles stacked right.             */}
        <div className="mb-14">
          <div className="flex items-start justify-between gap-8">

            <div>
              <h1
                className="font-black text-[#2d4a3e] leading-[0.88] uppercase"
                style={{
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: "clamp(52px, 9vw, 130px)",
                  letterSpacing: "-0.025em",
                }}
              >
                HOST
                <br />
                DASHBOARD.
              </h1>
              <p className="text-[#2d4a3e]/50 mt-5 max-w-[360px] leading-relaxed"
                style={{ fontFamily: "Georgia, serif", fontSize: "clamp(14px, 1.3vw, 16px)" }}>
                Manage programs, review builder submissions, and track engagement across your boosters.
              </p>
            </div>

            {/* Stat tiles — stacked vertically */}
            <div className="flex flex-col gap-2 shrink-0 mt-1">
              {[
                {
                  label: "Boosters Hosted",
                  value: totalBoosters,
                  sub: null,
                  bg: "#2d4a3e",
                  fg: "#f0ebe0",
                  fgMid: "rgba(240,235,224,0.45)",
                  Icon: Zap,
                  iconColor: "rgba(240,235,224,0.3)",
                },
                {
                  label: "Developers Engaged",
                  value: totalDevelopersEngaged,
                  sub: null,
                  bg: "#d6cfc0",
                  fg: "#2d4a3e",
                  fgMid: "rgba(45,74,62,0.45)",
                  Icon: Users,
                  iconColor: "rgba(45,74,62,0.25)",
                },
                {
                  label: "Projects Submitted",
                  value: totalProjectsSubmitted,
                  sub: null,
                  bg: "#f5f2ea",
                  fg: "#2d4a3e",
                  fgMid: "rgba(45,74,62,0.38)",
                  Icon: FolderOpen,
                  iconColor: "rgba(45,74,62,0.22)",
                },
              ].map(({ label, value, sub, bg, fg, fgMid, Icon, iconColor }) => (
                <div key={label}
                  className="rounded-xl flex items-center gap-4 px-5 py-3"
                  style={{ backgroundColor: bg, minWidth: 220 }}>
                  <p className="font-black leading-none"
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: 22, letterSpacing: "-0.03em", color: fg }}>
                    {value}
                  </p>
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] tracking-[0.14em] uppercase font-bold leading-none"
                      style={{ fontFamily: "'Inter', sans-serif", color: fgMid }}>
                      {label}
                    </p>
                    {sub && (
                      <p className="text-[7px] uppercase mt-1"
                        style={{ fontFamily: "'Inter', sans-serif", color: fgMid, opacity: 0.65 }}>
                        {sub}
                      </p>
                    )}
                  </div>
                  <Icon size={14} style={{ color: iconColor, flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ MAIN SECTION — hosted boosters table ═════════════════════ */}
        <div className="mt-8">

          {/* ── Hosted boosters table ──────────────────────────── */}
          <div className="rounded-3xl p-8" style={{ backgroundColor: "#f5f2ea" }}>

            {/* Section header */}
            <div className="flex items-center justify-between mb-7">
              <div>
                <p className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40 mb-1"
                  style={{ fontFamily: "'Inter', sans-serif" }}>
                  Your Programs
                </p>
                <h2 className="font-black text-[#2d4a3e] uppercase"
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(20px, 2.5vw, 28px)", letterSpacing: "-0.02em" }}>
                  Hosted Boosters.
                </h2>
              </div>
            </div>

            {/* Empty state */}
            {boosters.length === 0 && (
              <div className="py-20 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
                  style={{ backgroundColor: "rgba(45,74,62,0.08)", color: "#2d4a3e" }}>
                  <Zap size={22} />
                </div>
                <p className="font-black text-[#2d4a3e] uppercase mb-2"
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, letterSpacing: "-0.01em" }}>
                  No boosters yet.
                </p>
                <p className="text-[#2d4a3e]/50 text-sm mb-7" style={{ fontFamily: "Georgia, serif" }}>
                  Create your first program to start engaging builders.
                </p>
                <Link href="/host/boosters"
                  className="inline-flex items-center gap-2 no-underline rounded-full text-[#f0ebe0] text-[9px] tracking-widest uppercase font-bold px-5 py-2.5"
                  style={{ backgroundColor: "#2d4a3e", fontFamily: "'Inter', sans-serif" }}>
                  <Plus size={10} /> Create Booster
                </Link>
              </div>
            )}

            {/* Table */}
            {boosters.length > 0 && (
              <>
                {/* Column headers */}
                <div
                  className="grid py-3 mb-1"
                  style={{
                    gridTemplateColumns: "24px 1fr 110px 150px 110px 36px",
                    gap: "0 14px",
                    borderTop: "1px solid rgba(45,74,62,0.12)",
                    borderBottom: "1px solid rgba(45,74,62,0.12)",
                  }}
                >
                  {[
                    "#",
                    "Program",
                    "Category",
                    "Stats",
                    "Status",
                    "",
                  ].map((col) => (
                    <p
                      key={col}
                      className="text-[9px] tracking-[0.12em] uppercase font-bold text-[#2d4a3e]/30"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {col}
                    </p>
                  ))}
                </div>

                {/* Rows */}
                {boosters.map((b, idx) => {
                  const typeMeta =
                    TYPE_LABELS[b.booster_type ?? "idea"] ?? {
                      label: b.booster_type,
                      dot: "#2d4a3e",
                    };
                  const stats = boosterStats[b.id] ?? {
                    projects: 0,
                    teams: 0,
                  };
                  const status = getBoosterStatus(b.timeline);
                  return (
                    <Link
                      key={b.id}
                      href={`/host/${b.id}`}
                      className="no-underline group"
                    >
                      <div
                        className="grid py-5 transition-all rounded-sm hover:bg-[#2d4a3e]/2.5"
                        style={{
                          gridTemplateColumns:
                            "24px 1fr 110px 150px 110px 36px",
                          gap: "0 14px",
                          borderBottom: "1px solid rgba(45,74,62,0.07)",
                          alignItems: "center",
                        }}
                      >
                        {/* Index */}
                        <span className="font-black text-[#2d4a3e]/18 tabular-nums"
                          style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "-0.01em" }}>
                          {String(idx + 1).padStart(2, "0")}
                        </span>

                        {/* Name + theme */}
                        <div className="min-w-0">
                          <p className="font-black text-[#2d4a3e] uppercase leading-tight truncate"
                            style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(12px, 1.3vw, 14px)", letterSpacing: "-0.01em" }}>
                            {b.name}
                          </p>
                          {b.theme && (
                            <p className="text-[#2d4a3e]/45 text-[11px] mt-0.5 truncate" style={{ fontFamily: "Georgia, serif" }}>
                              {b.theme}
                            </p>
                          )}
                        </div>

                        {/* Type pill with dot */}
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: typeMeta.dot }}
                          />
                          <span
                            className="text-[8px] tracking-[0.08em] uppercase font-bold text-[#2d4a3e]/60 truncate"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            {typeMeta.label}
                          </span>
                        </div>

                        {/* Stats: projects & developers */}
                        <div className="text-[9px] text-[#2d4a3e]/70 leading-snug">
                          <p style={{ fontFamily: "'Inter', sans-serif" }}>
                            {stats.projects} project
                            {stats.projects !== 1 ? "s" : ""}
                          </p>
                          <p style={{ fontFamily: "'Inter', sans-serif" }}>
                            {stats.teams} developer
                            {stats.teams !== 1 ? "s" : ""}
                          </p>
                        </div>

                        {/* Status */}
                        <span
                          className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[8px] tracking-[0.12em] uppercase font-bold"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            backgroundColor:
                              status === "Ongoing"
                                ? "rgba(76,175,125,0.12)"
                                : status === "Upcoming"
                                ? "rgba(214,168,74,0.12)"
                                : "rgba(45,74,62,0.06)",
                            color:
                              status === "Ongoing"
                                ? "#2d7a50"
                                : status === "Upcoming"
                                ? "#8a6a1a"
                                : "rgba(45,74,62,0.55)",
                          }}
                        >
                          {status}
                        </span>

                        {/* Arrow */}
                        <span className="w-8 h-8 flex items-center justify-center rounded-full transition-transform group-hover:scale-105"
                          style={{ backgroundColor: "#2d4a3e" }}>
                          <ArrowUpRight size={13} style={{ color: "#f0ebe0" }} />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ══ TICKER ═══════════════════════════════════════════════════ */}
      <div className="overflow-hidden border-t border-[#2d4a3e]/10 py-3" style={{ backgroundColor: "#e8e2d4" }}>
        <div className="flex gap-10 whitespace-nowrap" style={{ animation: "ticker 28s linear infinite" }}>
          {[...Array(3)].map((_, ri) =>
            ["HOST DASHBOARD", "★", "MANAGE BOOSTERS", "★", "GRADE SUBMISSIONS", "★", "BUILDER PROGRAMS", "★"].map((t, i) => (
              <span key={`${ri}-${i}`}
                className="text-[10px] tracking-[0.2em] uppercase font-bold shrink-0"
                style={{ fontFamily: "'Inter', sans-serif", color: t === "★" ? "#2d4a3e" : "rgba(45,74,62,0.4)" }}>
                {t}
              </span>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }
      `}</style>
    </div>
  );
}