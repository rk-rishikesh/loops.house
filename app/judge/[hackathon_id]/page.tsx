import { ArrowLeft, ArrowUpRight, Gavel } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { canJudgeHackathon } from "@/lib/capabilities";
import { getServerAuth } from "@/lib/server-auth";
import { getHackathonServer, getProjectsServer, getSubmissionsServer } from "@/lib/server-data";

export default async function JudgeHackathonPage({
  params,
}: {
  params: Promise<{ hackathon_id: string }>;
}) {
  const auth = await getServerAuth();
  if (!auth) redirect("/login");

  const { hackathon_id } = await params;
  if (!hackathon_id.includes("-")) redirect("/judge");

  // Verify this user can judge this specific hackathon
  if (!canJudgeHackathon(auth.capabilities, hackathon_id)) {
    redirect("/judge");
  }

  const [hackathon, projects, submissions] = await Promise.all([
    getHackathonServer(hackathon_id),
    getProjectsServer(),
    getSubmissionsServer(hackathon_id),
  ]);

  if (!hackathon) redirect("/judge");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>
      {/* Nav strip */}
      <div className="pt-0">
        <div
          className="flex w-full items-stretch border-t border-b border-[#1a1a1a] text-[10px] tracking-[0.18em] uppercase font-bold text-[#1a1a1a]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <Link
            href="/judge"
            className="w-[240px] max-w-xs px-10 py-8 flex items-center justify-start border-r border-[#1a1a1a] no-underline hover:bg-[#e1dbcf]"
          >
            <span className="flex items-center gap-2">
              <ArrowLeft size={11} />
              <span>Judge Dashboard</span>
            </span>
          </Link>
          <div className="flex-1 min-w-0 py-8 flex items-center justify-end px-10 gap-4">
            <span>{hackathon.name}</span>
          </div>
        </div>
      </div>

      <div className="px-10 pt-10 pb-24">
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
            {hackathon.name}
          </h1>
          <div className="flex justify-end mt-6">
            <p
              className="text-[#2d4a3e]/55 max-w-[420px] text-right leading-relaxed"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(14px, 1.5vw, 18px)",
              }}
            >
              Review and score submissions for this hackathon.
            </p>
          </div>
        </div>

        {/* Submissions table */}
        <div>
          <div className="flex items-baseline justify-between mb-6">
            {submissions.length > 0 && (
              <span
                className="text-[10px] tracking-widest uppercase font-bold text-[#2d4a3e]/30"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {submissions.length} submission
                {submissions.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div
            className="grid border-b border-t border-[#2d4a3e]/20 py-3"
            style={{ gridTemplateColumns: "80px 1fr 180px", gap: "0 24px" }}
          >
            {["Number", "Project", "Action"].map((col) => (
              <p
                key={col}
                className="text-[11px] tracking-[0.12em] uppercase font-semibold text-[#2d4a3e]/40"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {col}
              </p>
            ))}
          </div>

          {submissions.length === 0 ? (
            <div className="py-24 text-center border-b border-[#2d4a3e]/12">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
                style={{
                  backgroundColor: "rgba(45,74,62,0.08)",
                  color: "#2d4a3e",
                }}
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
                No submissions yet.
              </p>
              <p
                className="text-[#2d4a3e]/50 leading-relaxed"
                style={{ fontFamily: "Georgia, serif", fontSize: 15 }}
              >
                Once builders submit to this hackathon, they&apos;ll appear here for grading.
              </p>
            </div>
          ) : (
            submissions.map((sub, idx) => {
              const project = projects.find((p) => p.project_id === sub.project_id);
              if (!project) return null;
              return (
                <div
                  key={sub.id}
                  className="grid items-center py-7 border-b border-[#2d4a3e]/12 transition-all duration-150 hover:bg-[#2d4a3e]/2 rounded-sm"
                  style={{
                    gridTemplateColumns: "80px 1fr 180px",
                    gap: "0 24px",
                  }}
                >
                  <p
                    className="font-bold text-[#2d4a3e]"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "clamp(13px, 1.4vw, 15px)",
                    }}
                  >
                    {String(idx + 1).padStart(2, "0")}.
                  </p>
                  <div>
                    <p
                      className="font-semibold text-[#2d4a3e] leading-snug"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "clamp(13px, 1.3vw, 15px)",
                      }}
                    >
                      {project.name ?? "Unknown project"}
                    </p>
                    {project.tagline && (
                      <p
                        className="text-[#2d4a3e]/45 text-sm mt-0.5"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {project.tagline}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Link
                      href={`/judge/${hackathon.id}/${sub.project_id}`}
                      className="group inline-flex items-center gap-0 rounded-full overflow-hidden no-underline transition-all duration-200 hover:shadow-md"
                      style={{ backgroundColor: "#2d4a3e" }}
                    >
                      <span
                        className="py-2.5 px-3 text-[9px] tracking-[0.15em] uppercase font-bold text-[#f0ebe0] flex items-center gap-2"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        <Gavel size={11} />
                        Grade
                      </span>
                      <span
                        className="w-8 h-8 flex items-center justify-center rounded-full m-1"
                        style={{ backgroundColor: "#d6cfc0" }}
                      >
                        <ArrowUpRight size={13} className="text-[#2d4a3e]" />
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
