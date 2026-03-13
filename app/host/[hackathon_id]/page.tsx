import { ArrowLeft, ArrowUpRight, BarChart3, Gavel, Settings, Trophy } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HackathonPhaseBadge } from "@/components/ui/hackathon-phase-badge";
import { computePhase, getPhasePermissions } from "@/lib/hackathon-phase";
import { getServerAuth } from "@/lib/server-auth";
import { getHackathonServer, getProjectsServer, getSubmissionsServer } from "@/lib/server-data";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

/* ─── Arrow circle ───────────────────────────────────────────────── */
function ArrowCircle({ size = 44 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-flex items-center justify-center rounded-full shrink-0 transition-transform duration-200 bg-[#0F2C23] text-[#E2FEA5]"
    >
      <ArrowUpRight size={Math.round(size * 0.4)} />
    </span>
  );
}

export default async function HostBoosterPage({
  params,
}: {
  params: Promise<{ hackathon_id: string }>;
}) {
  const auth = await getServerAuth();
  if (
    !auth ||
    !(auth.capabilities.isAdmin || auth.capabilities.isEventCreator || auth.capabilities.isJudge)
  ) {
    redirect("/login");
  }

  const { hackathon_id } = await params;
  // Guard against malformed IDs (eg. "/host/boosters")
  if (!hackathon_id.includes("-")) {
    redirect("/host");
  }
  const [hackathon, projects, submissions] = await Promise.all([
    getHackathonServer(hackathon_id),
    getProjectsServer(),
    getSubmissionsServer(hackathon_id),
  ]);

  if (!hackathon) {
    redirect("/host");
  }

  const phase = computePhase(hackathon);
  const permissions = getPhasePermissions(phase);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FFE8" }}>
      <div className="px-10 pt-10 pb-24">
        {/* ── Hero heading ────────────────────────────────────────── */}
        <div className="mb-16">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-start gap-4">
              <h1
                className="font-black text-[#0F2C23] leading-[0.88] uppercase"
                style={{
                  fontFamily: PX,
                  fontSize: "clamp(40px, 7vw, 96px)",
                  letterSpacing: "-0.025em",
                }}
              >
                {hackathon.name}
              </h1>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <HackathonPhaseBadge hackathon={hackathon} size="md" />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <p
              className="max-w-[420px] text-right leading-relaxed"
              style={{
                fontFamily: FN,
                fontSize: "clamp(14px, 1.5vw, 18px)",
                color: "rgba(15,44,35,0.6)",
              }}
            >
              Hackathon-level view. See analytics and submissions for this specific program.
            </p>
          </div>
        </div>

        {/* ── Quick actions ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Link href={`/host/${hackathon.id}/analytics`} className="group no-underline">
            <div
              className="rounded-3xl p-7 flex flex-col justify-between transition-all duration-200 group-hover:scale-[1.01]"
              style={{ backgroundColor: "#0F2C23", minHeight: 220 }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "rgba(248,255,232,0.06)" }}
                >
                  <BarChart3 size={22} style={{ color: "#E2FEA5" }} />
                </div>
                <ArrowCircle size={44} />
              </div>
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-2">
                  <h3
                    className="font-black uppercase leading-tight"
                    style={{
                      fontFamily: PX,
                      fontSize: "clamp(18px, 2vw, 24px)",
                      letterSpacing: "-0.02em",
                      color: "#F8FFE8",
                    }}
                  >
                    Analytics
                  </h3>
                  <span
                    className="text-[8px] tracking-[0.16em] uppercase font-bold px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: "#E2FEA5",
                      color: "#0F2C23",
                      fontFamily: PX,
                    }}
                  >
                    AI
                  </span>
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ fontFamily: FN, color: "rgba(248,255,232,0.72)" }}
                >
                  Generate AI-powered reports from submissions to this hackathon.
                </p>
              </div>
            </div>
          </Link>

          <Link href={`/host/${hackathon.id}/manage`} className="group no-underline">
            <div
              className="rounded-3xl p-7 flex flex-col justify-between transition-all duration-200 group-hover:scale-[1.01]"
              style={{ backgroundColor: "#0F2C23", minHeight: 220 }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "rgba(248,255,232,0.06)" }}
                >
                  <Settings size={22} style={{ color: "#E2FEA5" }} />
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
                    color: "#F8FFE8",
                  }}
                >
                  Manage
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ fontFamily: FN, color: "rgba(248,255,232,0.72)" }}
                >
                  Edit details, speakers, judges, and timeline.
                </p>
              </div>
            </div>
          </Link>

          <Link href={`/host/${hackathon.id}/manage/judges`} className="group no-underline">
            <div
              className="rounded-3xl p-7 flex flex-col justify-between transition-all duration-200 group-hover:scale-[1.01]"
              style={{ backgroundColor: "#0F2C23", minHeight: 220 }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "rgba(248,255,232,0.06)" }}
                >
                  <Gavel size={22} style={{ color: "#E2FEA5" }} />
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
                    color: "#F8FFE8",
                  }}
                >
                  Invite Judges
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ fontFamily: FN, color: "rgba(248,255,232,0.72)" }}
                >
                  Send judge invites and control who scores this hackathon.
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* ── Finalize CTA (only when completed phase) ──────────────── */}
        {permissions.canFinalize && (
          <div className="mb-12">
            <Link href={`/host/${hackathon.id}/finalize`} className="group no-underline block">
              <div
                className="rounded-3xl p-7 flex items-center justify-between transition-all duration-200 group-hover:scale-[1.005]"
                style={{ backgroundColor: "#E2FEA5", minHeight: 110 }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "rgba(15,44,35,0.08)" }}
                  >
                    <Trophy size={22} style={{ color: "#0F2C23" }} />
                  </div>
                  <div>
                    <h3
                      className="font-black uppercase leading-tight"
                      style={{
                        fontFamily: PX,
                        fontSize: "clamp(18px, 2vw, 24px)",
                        letterSpacing: "-0.02em",
                        color: "#0F2C23",
                      }}
                    >
                      Finalize Hackathon
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ fontFamily: FN, color: "rgba(15,44,35,0.7)" }}
                    >
                      Set AI vs Judge weighting and lock the leaderboard results.
                    </p>
                  </div>
                </div>
                <ArrowCircle size={44} />
              </div>
            </Link>
          </div>
        )}

        {/* ── Submissions table ────────────────────────────────────── */}
        <div>
          <div className="flex items-baseline justify-between mb-6">
            {submissions.length > 0 && (
              <span
                className="text-[10px] tracking-[0.18em] uppercase font-bold text-[#0F2C23]/40"
                style={{ fontFamily: PX }}
              >
                {submissions.length} submission
                {submissions.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div
            className="grid border-b border-t border-[rgba(15,44,35,0.16)] py-3"
            style={{ gridTemplateColumns: "80px 1fr 180px", gap: "0 24px" }}
          >
            {["Number", "Project", "Action"].map((col) => (
              <p
                key={col}
                className="text-[11px] tracking-[0.12em] uppercase font-semibold text-[#0F2C23]/40"
                style={{ fontFamily: PX }}
              >
                {col}
              </p>
            ))}
          </div>

          {submissions.length === 0 ? (
            <div className="py-24 text-center border-b border-[rgba(15,44,35,0.14)]">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
                style={{
                  backgroundColor: "rgba(15,44,35,0.08)",
                  color: "#0F2C23",
                }}
              >
                <Gavel size={24} />
              </div>
              <p
                className="font-black uppercase mb-3"
                style={{
                  fontFamily: PX,
                  fontSize: "clamp(18px, 2.5vw, 28px)",
                  letterSpacing: "-0.02em",
                  color: "#0F2C23",
                }}
              >
                No submissions yet.
              </p>
              <p
                className="leading-relaxed"
                style={{ fontFamily: FN, fontSize: 15, color: "rgba(15,44,35,0.6)" }}
              >
                Once builders submit to this hackathon, they&apos;ll appear here for grading.
              </p>
            </div>
          ) : (
            submissions.map((sub, idx) => {
              const project = projects.find((p) => p.project_id === sub.project_id);
              if (!project) {
                return null;
              }
              return (
                <div
                  key={sub.id}
                  className="grid items-center py-7 border-b border-[rgba(15,44,35,0.12)] transition-all duration-150 hover:bg-[rgba(15,44,35,0.02)] rounded-sm"
                  style={{
                    gridTemplateColumns: "80px 1fr 180px",
                    gap: "0 24px",
                  }}
                >
                  <p
                    className="font-bold text-[#0F2C23]"
                    style={{
                      fontFamily: PX,
                      fontSize: "clamp(13px, 1.4vw, 15px)",
                    }}
                  >
                    {String(idx + 1).padStart(2, "0")}.
                  </p>
                  <div>
                    <p
                      className="font-semibold text-[#0F2C23] leading-snug"
                      style={{
                        fontFamily: FN,
                        fontSize: "clamp(13px, 1.3vw, 15px)",
                      }}
                    >
                      {project?.name ?? "Unknown project"}
                    </p>
                    {project?.tagline && (
                      <p
                        className="text-[13px] mt-0.5"
                        style={{ fontFamily: FN, color: "rgba(15,44,35,0.55)" }}
                      >
                        {project.tagline}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Link
                      href={`/projects/${sub.project_id}`}
                      className="group inline-flex items-center gap-0 rounded-full overflow-hidden no-underline transition-all duration-200 hover:shadow-md"
                      style={{ backgroundColor: "#0F2C23" }}
                    >
                      <span
                        className="w-8 h-8 flex items-center justify-center rounded-full border"
                        style={{ backgroundColor: "#E2FEA5", borderColor: "transparent" }}
                      >
                        <ArrowUpRight size={13} className="text-[#0F2C23]" />
                      </span>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
