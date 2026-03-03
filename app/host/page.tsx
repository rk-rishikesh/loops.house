import Link from "next/link";
import { BarChart3, Gavel, Plus, ArrowUpRight } from "lucide-react";
import { getBoostersServer, getProjectsServer, getSubmissionsForBoostersServer } from "@/lib/server-data";

/* ─── Arrow circle ───────────────────────────────────────────────── */
function ArrowCircle({ size = 44, inverted = false }: { size?: number; inverted?: boolean }) {
  return (
    <span
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center rounded-full shrink-0 transition-transform duration-200 ${
        inverted ? "bg-[#d6cfc0] text-[#2d4a3e]" : "bg-[#2d4a3e] text-[#f0ebe0]"
      }`}
    >
      <ArrowUpRight size={Math.round(size * 0.4)} />
    </span>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export default async function HostPage() {
  const [boosters, projects] = await Promise.all([
    getBoostersServer(),
    getProjectsServer(),
  ]);
  const boosterIds = boosters.map((b) => b.id);
  const submissions = await getSubmissionsForBoostersServer(boosterIds);

  const projectMap: Record<string, (typeof projects)[0]> = {};
  projects.forEach((p) => { projectMap[p.project_id] = p; });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <div
        className="px-10 py-5 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(45,74,62,0.1)" }}
      >
        <p
          className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Host Dashboard
        </p>
        <Link
          href="/host/boosters"
          className="inline-flex items-center gap-1.5 rounded-full no-underline text-[9px] tracking-widest uppercase font-bold px-5 py-2.5 transition-all hover:opacity-90"
          style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#2d4a3e", color: "#f0ebe0" }}
        >
          <Plus size={11} /> New Booster
        </Link>
      </div>

      <div className="px-10 pt-10 pb-24">

        {/* ── Hero heading ────────────────────────────────────────── */}
        <div className="mb-16">
          <h1
            className="font-black text-[#2d4a3e] leading-[0.88] uppercase"
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: "clamp(60px, 10vw, 148px)",
              letterSpacing: "-0.025em",
            }}
          >
            HOST
            <br />
            DASHBOARD.
          </h1>
          <div className="flex justify-end mt-8">
            <p
              className="text-[#2d4a3e]/55 max-w-[380px] text-right leading-relaxed"
              style={{ fontFamily: "Georgia, serif", fontSize: "clamp(15px, 1.6vw, 19px)" }}
            >
              Manage boosters, review submissions, and generate analytics from event data.
            </p>
          </div>
        </div>

        {/* ── Quick actions ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 mb-12">
          <Link href="/host/analytics" className="group no-underline">
            <div
              className="rounded-3xl p-7 flex flex-col justify-between transition-all duration-200 group-hover:scale-[1.01]"
              style={{ backgroundColor: "#2d4a3e", minHeight: 200 }}
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(214,207,192,0.15)" }}>
                  <BarChart3 size={22} style={{ color: "#d6cfc0" }} />
                </div>
                <ArrowCircle size={44} inverted />
              </div>
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-black text-[#f0ebe0] uppercase leading-tight" style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(18px, 2vw, 24px)", letterSpacing: "-0.02em" }}>Analytics</h3>
                  <span className="text-[8px] tracking-[0.14em] uppercase font-bold px-2 py-1 rounded-sm" style={{ backgroundColor: "rgba(214,207,192,0.15)", color: "#d6cfc0", fontFamily: "'Inter', sans-serif" }}>AI</span>
                </div>
                <p className="text-[#f0ebe0]/50 text-sm leading-relaxed" style={{ fontFamily: "Georgia, serif" }}>Generate a report from event data and submissions.</p>
              </div>
            </div>
          </Link>

          <Link href="/host/boosters" className="group no-underline">
            <div
              className="rounded-3xl p-7 flex flex-col justify-between transition-all duration-200 group-hover:scale-[1.01]"
              style={{ backgroundColor: "#d6cfc0", minHeight: 200 }}
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(45,74,62,0.1)" }}>
                  <Plus size={22} style={{ color: "#2d4a3e" }} />
                </div>
                <ArrowCircle size={44} />
              </div>
              <div className="mt-8">
                <h3 className="font-black text-[#2d4a3e] uppercase leading-tight mb-2" style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(18px, 2vw, 24px)", letterSpacing: "-0.02em" }}>New Booster</h3>
                <p className="text-[#2d4a3e]/55 text-sm leading-relaxed" style={{ fontFamily: "Georgia, serif" }}>Create idea, momentum, or capital boosters with themes and sponsor tracks.</p>
              </div>
            </div>
          </Link>
        </div>

        {/* ── Submissions table ────────────────────────────────────── */}
        <div>
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <p className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40 mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Submissions</p>
              <h2 className="font-black text-[#2d4a3e] leading-none uppercase" style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.02em" }}>
                Projects<br />Submitted.
              </h2>
            </div>
            {submissions.length > 0 && (
              <span className="text-[10px] tracking-widest uppercase font-bold text-[#2d4a3e]/30" style={{ fontFamily: "'Inter', sans-serif" }}>
                {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="grid border-b border-t border-[#2d4a3e]/20 py-3" style={{ gridTemplateColumns: "80px 1fr 1.6fr 180px", gap: "0 24px" }}>
            {["Number", "Project", "Booster", "Action"].map((col) => (
              <p key={col} className="text-[11px] tracking-[0.12em] uppercase font-semibold text-[#2d4a3e]/40" style={{ fontFamily: "'Inter', sans-serif" }}>{col}</p>
            ))}
          </div>

          {submissions.length === 0 ? (
            <div className="py-24 text-center border-b border-[#2d4a3e]/12">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6" style={{ backgroundColor: "rgba(45,74,62,0.08)", color: "#2d4a3e" }}><Gavel size={24} /></div>
              <p className="font-black text-[#2d4a3e] uppercase mb-3" style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(18px, 2.5vw, 28px)", letterSpacing: "-0.02em" }}>No submissions yet.</p>
              <p className="text-[#2d4a3e]/50 leading-relaxed" style={{ fontFamily: "Georgia, serif", fontSize: 15 }}>Once builders submit to your boosters, they&apos;ll appear here for grading.</p>
            </div>
          ) : (
            submissions.map((sub, idx) => {
              const project = projectMap[sub.project_id];
              const booster = boosters.find((b) => b.id === sub.booster_id);
              return (
                <div key={sub.id} className="grid items-center py-7 border-b border-[#2d4a3e]/12 transition-all duration-150 hover:bg-[#2d4a3e]/[0.02] rounded-sm" style={{ gridTemplateColumns: "80px 1fr 1.6fr 180px", gap: "0 24px" }}>
                  <p className="font-bold text-[#2d4a3e]" style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(13px, 1.4vw, 15px)" }}>{String(idx + 1).padStart(2, "0")}.</p>
                  <div>
                    <p className="font-semibold text-[#2d4a3e] leading-snug" style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(13px, 1.3vw, 15px)" }}>{project?.name ?? "Unknown project"}</p>
                    {project?.tagline && <p className="text-[#2d4a3e]/45 text-sm mt-0.5" style={{ fontFamily: "Georgia, serif" }}>{project.tagline}</p>}
                    {project?.category && <span className="inline-block mt-2 text-[8px] tracking-[0.12em] uppercase font-bold px-2.5 py-1 rounded-sm" style={{ backgroundColor: "rgba(45,74,62,0.08)", color: "#2d4a3e", fontFamily: "'Inter', sans-serif" }}>{project.category}</span>}
                  </div>
                  <div>
                    <p className="text-[#2d4a3e]/70 text-sm leading-snug" style={{ fontFamily: "Georgia, serif" }}>{booster?.name ?? "\u2014"}</p>
                    {booster?.booster_type && <span className="inline-block mt-1.5 text-[8px] tracking-[0.12em] uppercase font-bold px-2.5 py-1 rounded-sm" style={{ backgroundColor: "#2d4a3e", color: "#f0ebe0", fontFamily: "'Inter', sans-serif" }}>{booster.booster_type}</span>}
                  </div>
                  <div className="flex justify-end">
                    <Link href={`/host/judging?project_id=${sub.project_id}&booster_id=${sub.booster_id}`} className="group inline-flex items-center gap-0 rounded-full overflow-hidden no-underline transition-all duration-200 hover:shadow-md" style={{ backgroundColor: "#2d4a3e" }}>
                      <span className="py-2.5 px-3 text-[9px] tracking-[0.15em] uppercase font-bold text-[#f0ebe0] flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}><Gavel size={11} />Grade</span>
                      <span className="w-8 h-8 flex items-center justify-center rounded-full m-1" style={{ backgroundColor: "#d6cfc0" }}><ArrowUpRight size={13} className="text-[#2d4a3e]" /></span>
                    </Link>
                  </div>
                </div>
              );
            })
          )}

          {submissions.length > 0 && (
            <div className="flex items-center justify-between mt-8 pt-5 border-t border-[#2d4a3e]/08">
              <p className="text-[11px] text-[#2d4a3e]/40" style={{ fontFamily: "Georgia, serif" }}>
                {submissions.length} submission{submissions.length !== 1 ? "s" : ""} across {boosters.length} booster{boosters.length !== 1 ? "s" : ""}
              </p>
              <Link href="/host/analytics" className="inline-flex items-center gap-1.5 text-[9px] tracking-widest uppercase font-bold text-[#2d4a3e]/40 hover:text-[#2d4a3e] transition-colors no-underline" style={{ fontFamily: "'Inter', sans-serif" }}>
                <BarChart3 size={10} /> View Analytics
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Ticker ───────────────────────────────────────────────────── */}
      <div className="overflow-hidden border-t border-[#2d4a3e]/10 py-3" style={{ backgroundColor: "#e8e2d4" }}>
        <div className="flex gap-10 whitespace-nowrap" style={{ animation: "ticker 28s linear infinite" }}>
          {[...Array(3)].map((_, ri) =>
            ["HOST DASHBOARD", "\u2605", "GRADE SUBMISSIONS", "\u2605", "MANAGE BOOSTERS", "\u2605"].map((t, i) => (
              <span key={`${ri}-${i}`} className="text-[10px] tracking-[0.2em] uppercase font-bold shrink-0" style={{ fontFamily: "'Inter', sans-serif", color: t === "\u2605" ? "#2d4a3e" : "rgba(45,74,62,0.4)" }}>{t}</span>
            ))
          )}
        </div>
      </div>
      <style>{`@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }`}</style>
    </div>
  );
}
