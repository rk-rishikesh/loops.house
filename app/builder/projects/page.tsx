import Link from "next/link";
import { ArrowLeft, ArrowUpRight, PlusCircle, FolderOpen } from "lucide-react";
import { getProjectsServer } from "@/lib/server-data";
import type { StoredProject } from "@/lib/data-mappers";

// ─── Arrow circle ─────────────────────────────────────────────────────────────
function ArrowCircle({ size = 44 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-flex items-center justify-center rounded-full bg-[#2d4a3e] text-[#f0ebe0] shrink-0 transition-transform duration-200"
    >
      <ArrowUpRight size={size * 0.38} />
    </span>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────
function ProjectRow({ project: p, index }: { project: StoredProject; index: number }) {
  return (
    <Link href={`/builder/projects/${p.project_id}`} className="no-underline group">
      <div
        className="grid items-start py-7 border-b border-[#2d4a3e]/12 transition-all duration-150 group-hover:bg-[#2d4a3e]/[0.03] rounded-sm"
        style={{ gridTemplateColumns: "80px 1fr 1.6fr 56px", gap: "0 24px" }}
      >
        {/* Number */}
        <p
          className="font-bold text-[#2d4a3e] pt-0.5"
          style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(13px, 1.4vw, 15px)" }}
        >
          {String(index + 1).padStart(2, "0")}.
        </p>

        {/* Chapter — name + tagline + tags */}
        <div>
          <p
            className="font-semibold text-[#2d4a3e] mb-1.5 leading-snug"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(13px, 1.3vw, 15px)" }}
          >
            {p.name}
          </p>
        </div>

        {/* Description — logo + hint */}
        <div className="flex items-start gap-4">
          <p
            className="text-[#2d4a3e]/50 leading-relaxed text-sm"
            style={{ fontFamily: "Georgia, serif" }}
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
  const projects = await getProjectsServer();
  console.log(projects)
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40" style={{ backgroundColor: "#f0ebe0" }}>
        <div>
          <div
            className="flex w-full items-stretch border-t border-b border-[#1a1a1a] text-[10px] tracking-[0.18em] uppercase font-bold text-[#1a1a1a]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <Link
              href="/builder"
              className="w-[240px] max-w-xs px-10 py-8 flex items-center justify-start border-r border-[#1a1a1a] no-underline hover:bg-[#e1dbcf]"
            >
              <span className="flex items-center gap-2">
                <ArrowLeft size={11} />
                <span>Builder</span>
              </span>
            </Link>
            <div className="flex-1 min-w-0 py-4 flex items-center justify-end px-6">
              <span>
                {projects.length} project{projects.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-10 pt-10 pb-24">

        {/* ── Hero heading ─────────────────────────────────────────────────── */}
        <div className="mb-16 flex flex-row justify-between">
          
          <h1
            className="font-black text-[#2d4a3e] leading-[0.88] uppercase"
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: "clamp(60px, 10vw, 148px)",
              letterSpacing: "-0.025em",
            }}
          >
            MY
            <br />
            PROJECTS.
          </h1>

          {/* Subheading right + CTA */}
          <div className="flex justify-end mt-8">
            <div className="flex flex-col items-end gap-5">
              <p
                className="text-[#2d4a3e]/55 max-w-[380px] text-right leading-relaxed"
                style={{ fontFamily: "Georgia, serif", fontSize: "clamp(15px, 1.6vw, 19px)" }}
              >
                Create a project and let AI agents refine your story, generate social posts, and apply to boosters with confidence.
              </p>

              {/* Create new — pill CTA */}
              <Link
                href="/builder/new"
                className="inline-flex items-center gap-0 rounded-full overflow-hidden no-underline shadow-sm hover:shadow-md transition-shadow"
                style={{ backgroundColor: "#2d4a3e" }}
              >
                <span
                  className="pl-5 pr-4 py-3 text-[11px] tracking-[0.18em] uppercase font-bold text-[#f0ebe0] flex items-center gap-2"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <PlusCircle size={13} />
                  New Profile
                </span>
                <span className="w-10 h-10 flex items-center justify-center bg-[#d6cfc0] rounded-full m-1">
                  <ArrowUpRight size={14} className="text-[#2d4a3e]" />
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Table header ─────────────────────────────────────────────────── */}
        <div
          className="grid border-b border-t border-[#2d4a3e]/20 py-3"
          style={{ gridTemplateColumns: "80px 1fr 1.6fr 56px", gap: "0 24px" }}
        >
          {["Number", "Project", "About", "Open"].map((col) => (
            <p
              key={col}
              className="text-[11px] tracking-[0.12em] uppercase font-semibold text-[#2d4a3e]/40"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {col}
            </p>
          ))}
        </div>

        {/* ── Table body ───────────────────────────────────────────────────── */}
        {projects.length === 0 ? (
          <div className="py-24 text-center border-b border-[#2d4a3e]/12">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
              style={{ backgroundColor: "rgba(45,74,62,0.08)", color: "#2d4a3e" }}
            >
              <FolderOpen size={24} />
            </div>
            <p
              className="font-black text-[#2d4a3e] uppercase mb-3"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "clamp(20px, 3vw, 32px)",
                letterSpacing: "-0.02em",
              }}
            >
              No projects yet.
            </p>
            <p
              className="text-[#2d4a3e]/50 mb-10 leading-relaxed"
              style={{ fontFamily: "Georgia, serif", fontSize: 15 }}
            >
              Create your first profile to get started.
            </p>
            <Link
              href="/builder/new"
              className="inline-flex items-center gap-2 rounded-full no-underline text-[#f0ebe0] text-[10px] tracking-widest uppercase font-bold px-7 py-3"
              style={{ backgroundColor: "#2d4a3e", fontFamily: "'Inter', sans-serif" }}
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

      {/* ── Ticker ──────────────────────────────────────────────────────────── */}
      <div
        className="overflow-hidden border-t border-[#2d4a3e]/10 py-3"
        style={{ backgroundColor: "#e8e2d4" }}
      >
        <div
          className="flex gap-10 whitespace-nowrap"
          style={{ animation: "ticker 28s linear infinite" }}
        >
          {[...Array(3)].map((_, ri) =>
            ["MY PROJECTS", "\u2605", "PROFILE CREATOR", "\u2605", "APPLY TO BOOSTERS", "\u2605"].map((t, i) => (
              <span
                key={`${ri}-${i}`}
                className="text-[10px] tracking-[0.2em] uppercase font-bold shrink-0"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  color: t === "\u2605" ? "#2d4a3e" : "rgba(45,74,62,0.4)",
                }}
              >
                {t}
              </span>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0%  { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
