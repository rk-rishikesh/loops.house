import { ArrowUpRight, Gavel } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { canJudgeHackathon } from "@/lib/capabilities";
import { getServerAuth } from "@/lib/server-auth";
import { getHackathonServer, getProjectsServer, getSubmissionsServer } from "@/lib/server-data";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

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
    <div className="min-h-screen" style={{ backgroundColor: "#F8FFE8" }}>
      <div className="px-10 pt-10 pb-24">
        {/* Hero heading */}
        <div className="mb-16 flex flex-row items-end justify-between gap-6 flex-wrap">
          <h1
            className="font-black text-[#0F2C23] leading-[0.88] uppercase"
            style={{
              fontFamily: PX,
              fontSize: "clamp(42px, 6vw, 80px)",
              letterSpacing: "-0.025em",
            }}
          >
            {hackathon.name}
          </h1>
          <p
            className="max-w-[420px] text-right leading-relaxed"
            style={{
              fontFamily: FN,
              fontSize: "clamp(14px, 1.5vw, 18px)",
              color: "rgba(15,44,35,0.55)",
            }}
          >
            Review and score submissions for this hackathon using the AI-powered judging flow.
          </p>
        </div>

        {/* Submissions table */}
        <div>
          <div className="flex items-baseline justify-between mb-6">
            {submissions.length > 0 && (
              <span
                className="text-[10px] tracking-[0.16em] uppercase font-bold"
                style={{ fontFamily: PX, color: "rgba(15,44,35,0.4)" }}
              >
                {submissions.length} submission
                {submissions.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div
            className="grid border-b border-t py-3"
            style={{
              gridTemplateColumns: "80px 1fr 180px",
              gap: "0 24px",
              borderColor: "rgba(15,44,35,0.2)",
            }}
          >
            {["Number", "Project", "Action"].map((col) => (
              <p
                key={col}
                className="text-[11px] tracking-[0.12em] uppercase font-semibold"
                style={{ fontFamily: PX, color: "rgba(15,44,35,0.4)" }}
              >
                {col}
              </p>
            ))}
          </div>

          {submissions.length === 0 ? (
            <div
              className="py-24 text-center border-b"
              style={{ borderColor: "rgba(15,44,35,0.12)" }}
            >
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
                className="font-black text-[#0F2C23] uppercase mb-3"
                style={{
                  fontFamily: PX,
                  fontSize: "clamp(18px, 2.5vw, 28px)",
                  letterSpacing: "-0.02em",
                }}
              >
                No submissions yet.
              </p>
              <p
                className="leading-relaxed"
                style={{ fontFamily: FN, fontSize: 15, color: "rgba(15,44,35,0.55)" }}
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
                  className="grid items-center py-7 border-b transition-all duration-150 rounded-sm"
                  style={{
                    gridTemplateColumns: "80px 1fr 180px",
                    gap: "0 24px",
                    borderColor: "rgba(15,44,35,0.12)",
                    backgroundColor: "transparent",
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
                        fontFamily: PX,
                        fontSize: "clamp(13px, 1.3vw, 15px)",
                      }}
                    >
                      {project.name ?? "Unknown project"}
                    </p>
                    {project.tagline && (
                      <p
                        className="text-sm mt-0.5"
                        style={{ fontFamily: FN, color: "rgba(15,44,35,0.55)" }}
                      >
                        {project.tagline}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Link
                      href={`/judge/${hackathon.id}/${sub.project_id}`}
                      className="group inline-flex items-center gap-0 rounded-full overflow-hidden no-underline transition-all duration-200 hover:shadow-md"
                      style={{ backgroundColor: "#0F2C23" }}
                    >
                      <span
                        className="py-2.5 px-3 text-[9px] tracking-[0.15em] uppercase font-bold flex items-center gap-2"
                        style={{ fontFamily: PX, color: "#F8FFE8" }}
                      >
                        <Gavel size={11} />
                        Grade
                      </span>
                      <span
                        className="w-8 h-8 flex items-center justify-center rounded-full m-1"
                        style={{ backgroundColor: "#E2FEA5" }}
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
