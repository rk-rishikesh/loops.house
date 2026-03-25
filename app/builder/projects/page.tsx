import { ArrowUpRight, FolderOpen, PlusCircle } from "lucide-react";
import Link from "next/link";
import type { StoredProject } from "@/lib/data-mappers";
import { getServerAuth } from "@/lib/server-auth";
import { getProjectsServer, getTeamsServer } from "@/lib/server-data";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

// ─── Arrow circle ─────────────────────────────────────────────────────────────
function ArrowCircle({ size = 44 }: { size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        backgroundColor: "#0F2C23",
        color: "#E2FEA5",
      }}
      className="inline-flex items-center justify-center rounded-full shrink-0 transition-transform duration-200"
    >
      <ArrowUpRight size={size * 0.38} />
    </span>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────
function ProjectRow({
  project: p,
  index,
}: {
  project: StoredProject;
  index: number;
}) {
  return (
    <Link
      href={`/builder/projects/${p.project_id}`}
      className="no-underline group"
    >
      <div
        className="grid items-start py-7 border-b transition-all duration-150 group-hover:bg-[rgba(15,44,35,0.03)] rounded-sm"
        style={{
          gridTemplateColumns: "80px 1fr 1.6fr 56px",
          gap: "0 24px",
          borderColor: "rgba(15,44,35,0.12)",
        }}
      >
        {/* Number */}
        <p
          className="font-bold pt-0.5"
          style={{
            fontFamily: FN,
            fontSize: "clamp(13px, 1.4vw, 15px)",
            color: "#0F2C23",
          }}
        >
          {String(index + 1).padStart(2, "0")}.
        </p>

        {/* Chapter — name + tagline + tags */}
        <div>
          <p
            className="font-semibold mb-1.5 leading-snug"
            style={{
              fontFamily: FN,
              fontSize: "clamp(13px, 1.3vw, 15px)",
              color: "#0F2C23",
            }}
          >
            {p.name}
          </p>
        </div>

        {/* Description — logo + hint */}
        <div className="flex items-start gap-4">
          <p
            className="leading-relaxed text-sm"
            style={{ fontFamily: FN, color: "rgba(15,44,35,0.5)" }}
          >
            {p.tagline}
          </p>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <ArrowCircle size={44} />
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function BuilderProjectsPage() {
  const auth = await getServerAuth();
  const [allProjects, userTeams] = await Promise.all([
    getProjectsServer(),
    auth ? getTeamsServer(auth.userId) : Promise.resolve([]),
  ]);
  const userTeamIds = new Set(userTeams.map((t) => t.id));
  const projects = allProjects.filter(
    (p) => p.team_id && userTeamIds.has(p.team_id),
  );
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FFE8" }}>
      <div className="px-10 pt-10 pb-24">
        {/* ── Hero heading ─────────────────────────────────────────────────── */}
        <div className="mb-16 flex flex-row justify-between">
          <h1
            className="font-black leading-[0.88] uppercase"
            style={{
              fontFamily: FN,
              fontSize: "clamp(48px, 8vw, 120px)",
              letterSpacing: "-0.025em",
              color: "#0F2C23",
            }}
          >
            MY
            <br />
            PROJECTS
          </h1>

          {/* Subheading right + CTA */}
          <div className="flex justify-end mt-8">
            <div className="flex flex-col items-end gap-5">
              <p
                className="max-w-[380px] text-right leading-relaxed"
                style={{
                  fontFamily: FN,
                  fontSize: "clamp(15px, 1.6vw, 19px)",
                  color: "rgba(15,44,35,0.55)",
                }}
              >
                Create a project and let AI agents refine your story, generate
                social posts, and apply to hackathons with confidence.
              </p>

              {/* Create new — pill CTA */}
              <Link
                href="/builder/new"
                className="inline-flex items-center gap-0 rounded-full overflow-hidden no-underline shadow-sm hover:shadow-md transition-shadow"
                style={{ backgroundColor: "#0F2C23" }}
              >
                <span
                  className="pl-5 pr-4 py-3 text-[11px] tracking-[0.18em] uppercase font-bold flex items-center gap-2"
                  style={{ fontFamily: PX, color: "#E2FEA5" }}
                >
                  <PlusCircle size={13} />
                  New Project
                </span>
                <span
                  className="w-10 h-10 flex items-center justify-center rounded-full m-1"
                  style={{ backgroundColor: "#E2FEA5" }}
                >
                  <ArrowUpRight size={14} style={{ color: "#0F2C23" }} />
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Table header ─────────────────────────────────────────────────── */}
        <div
          className="grid border-b border-t py-4"
          style={{
            gridTemplateColumns: "80px 1fr 1.6fr 56px",
            gap: "0 24px",
            borderColor: "rgba(15,44,35,0.12)",
            backgroundColor: "#F8FFE8",
          }}
        >
          {["Number", "Project", "About", "Open"].map((col, i) => (
            <p
              key={col}
              className={`text-[10px] tracking-[0.14em] uppercase font-semibold ${
                i === 0
                  ? "text-left"
                  : i === 2
                    ? "text-center"
                    : i === 3
                      ? "text-right"
                      : "text-left"
              }`}
              style={{ fontFamily: FN, color: "rgba(15,44,35,0.4)" }}
            >
              {col}
            </p>
          ))}
        </div>

        {/* ── Table body ───────────────────────────────────────────────────── */}
        {projects.length === 0 ? (
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
              <FolderOpen size={24} />
            </div>
            <p
              className="font-black uppercase mb-3"
              style={{
                fontFamily: PX,
                fontSize: "clamp(20px, 3vw, 32px)",
                letterSpacing: "-0.02em",
                color: "#0F2C23",
              }}
            >
              No projects yet.
            </p>
            <p
              className="mb-10 leading-relaxed"
              style={{
                fontFamily: FN,
                fontSize: 15,
                color: "rgba(15,44,35,0.5)",
              }}
            >
              Create your first profile to get started.
            </p>
            <Link
              href="/builder/new"
              className="inline-flex items-center gap-2 rounded-full no-underline text-[10px] tracking-widest uppercase font-bold px-7 py-3"
              style={{
                backgroundColor: "#0F2C23",
                color: "#E2FEA5",
                fontFamily: PX,
              }}
            >
              <PlusCircle size={12} /> Create Profile
            </Link>
          </div>
        ) : (
          projects.map((p, idx) => (
            <ProjectRow key={p.project_id} project={p} index={idx} />
          ))
        )}
      </div>
    </div>
  );
}
