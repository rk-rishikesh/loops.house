import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SubmitToHackathonForm } from "@/components/client/submit-to-hackathon-form";
import { getServerAuth } from "@/lib/server-auth";
import {
  getHackathonServer,
  getProjectsServer,
  getSubmissionsServer,
  getTeamsServer,
} from "@/lib/server-data";

function formatTimeUntil(iso?: string) {
  if (!iso) return null;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;

  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return null;

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return { days, hours, minutes };
}

export default async function SubmitToHackathonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await getServerAuth();
  if (!auth) {
    redirect("/login");
  }

  const { id: hackathonId } = await params;

  const [hackathon, allProjects, submissions, userTeams] = await Promise.all([
    getHackathonServer(hackathonId),
    getProjectsServer(),
    getSubmissionsServer(hackathonId),
    getTeamsServer(auth.userId),
  ]);

  // Only show projects the user owns (their team's projects)
  const userTeamIds = new Set(userTeams.map((t) => t.id));
  const projects = allProjects.filter((p) => p.team_id && userTeamIds.has(p.team_id));

  if (!hackathon) {
    return (
      <div>
        <Link
          href="/hackathons"
          className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to hackathons
        </Link>
        <p className="text-zinc-500">Hackathon not found.</p>
      </div>
    );
  }

  if (hackathon.phase !== "building") {
    const startsIn =
      hackathon.phase === "upcoming"
        ? formatTimeUntil(hackathon.start_date)
        : null;

    return (
      <div
        className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden"
        style={{ backgroundColor: "#F8FFE8" }}
      >
        {/* Watermark */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
          style={{
            fontFamily: "var(--font-pixelify-sans), sans-serif",
            fontSize: "clamp(120px, 18vw, 260px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: "rgba(15,44,35,0.06)",
          }}
        >
          SUBMIT
        </div>

        {/* Back link */}
        <div className="absolute top-8 left-10">
          <Link
            href={`/hackathons/${hackathonId}`}
            className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold no-underline transition-colors"
            style={{
              fontFamily: "var(--font-funnel-sans), sans-serif",
              color: "rgba(15,44,35,0.45)",
            }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to hackathon
          </Link>
        </div>

        {startsIn ? (
          <div className="relative z-10 flex flex-col items-center gap-10">
            <p
              className="text-[11px] uppercase tracking-[0.35em] font-bold"
              style={{
                fontFamily: "var(--font-funnel-sans), sans-serif",
                color: "rgba(15,44,35,0.55)",
              }}
            >
              Submissions open in
            </p>

            <div className="flex items-start gap-7">
              {[
                { value: String(startsIn.days), label: "Days" },
                { value: String(startsIn.hours).padStart(2, "0"), label: "Hours" },
                { value: String(startsIn.minutes).padStart(2, "0"), label: "Min" },
              ].map((unit) => (
                <div key={unit.label} className="flex flex-col items-center">
                  <div
                    className="flex items-center justify-center rounded-[28px]"
                    style={{
                      width: 160,
                      height: 180,
                      backgroundColor: "rgba(15,44,35,0.04)",
                      border: "1px solid rgba(15,44,35,0.10)",
                    }}
                  >
                    <span
                      className="leading-none font-bold"
                      style={{
                        fontFamily: "var(--font-pixelify-sans), sans-serif",
                        fontSize: 92,
                        color: "#0F2C23",
                      }}
                    >
                      {unit.value}
                    </span>
                  </div>
                  <span
                    className="mt-4 text-[11px] uppercase tracking-[0.25em] font-bold"
                    style={{
                      fontFamily: "var(--font-funnel-sans), sans-serif",
                      color: "rgba(15,44,35,0.45)",
                    }}
                  >
                    {unit.label}
                  </span>
                </div>
              ))}
            </div>

            <p
              className="mt-2 max-w-sm text-center text-sm leading-relaxed"
              style={{
                fontFamily: "var(--font-funnel-sans), sans-serif",
                color: "rgba(15,44,35,0.55)",
              }}
            >
              Hang tight — you&apos;ll be able to submit your project once the building phase begins.
            </p>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center gap-6 text-center px-6">
            <p
              className="font-bold uppercase leading-none"
              style={{
                fontFamily: "var(--font-pixelify-sans), sans-serif",
                fontSize: "clamp(48px, 8vw, 80px)",
                letterSpacing: "-0.04em",
                color: "#0F2C23",
              }}
            >
              {hackathon.phase}
            </p>
            <p
              className="max-w-md text-sm leading-relaxed"
              style={{
                fontFamily: "var(--font-funnel-sans), sans-serif",
                color: "rgba(15,44,35,0.6)",
              }}
            >
              Submissions are only accepted during the building phase.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <SubmitToHackathonForm hackathon={hackathon} projects={projects} submissions={submissions} />
  );
}
