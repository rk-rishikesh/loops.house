import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProjectsServer } from "@/lib/server-data";
import { ProjectSearchFilter } from "@/components/client/project-search-filter";
import { LogoutButton } from "@/components/logout-button";

export default async function ViewerPage() {
  const projects = await getProjectsServer();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>

      {/* ── Top strip nav ───────────────────────────────────────────────────── */}
      <div className="pt-0">
        <div
          className="flex w-full border-t border-b border-[#1a1a1a] text-[10px] tracking-[0.18em] uppercase font-bold text-[#1a1a1a]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <Link
            href="/"
            className="flex-1 min-w-0 py-8 flex items-center justify-center border-r border-[#1a1a1a] no-underline hover:bg-[#e1dbcf]"
          >
            <span className="flex items-center gap-2">
              <ArrowLeft size={11} />
              <span>Portal</span>
            </span>
          </Link>
          <div className="flex-1 min-w-0 py-8 flex items-center justify-center border-r border-[#1a1a1a]">
            <span>Loops Repository</span>
          </div>
          <div className="flex-1 min-w-0 py-8 flex items-center justify-center border-r border-[#1a1a1a]">
            <span>Category</span>
          </div>
          <div className="flex-1 min-w-0 py-8 flex items-center justify-center border-r border-[#1a1a1a]">
            <span>
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="w-16 py-8 flex items-center justify-center">
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="px-10 pt-10 pb-24">

        {/* ── Hero heading ───────────────────────────────────────────────── */}
        <div className="mb-16">
          <h1
            className="font-black text-[#2d4a3e] leading-[0.88] uppercase"
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: "clamp(60px, 10vw, 148px)",
              letterSpacing: "-0.025em",
            }}
          >
            ALL
            <br />
            PROJECTS.
          </h1>

          <div className="flex mt-8 justify-end">
            <div className="flex flex-col">
              <p
                className="text-[#2d4a3e]/55 max-w-[380px] text-right leading-relaxed"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "clamp(15px, 1.6vw, 19px)",
                }}
              >
                Open any project to chat and ask questions about the code.
              </p>
            </div>
          </div>
        </div>

        {/* ── Client island: search + filter + table ────────────────────── */}
        <ProjectSearchFilter projects={projects} />
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
            ["ALL PROJECTS", "\u2605", "CHAT & ASK CODE", "\u2605", "OPEN SOURCE BUILDERS", "\u2605"].map((t, i) => (
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
          100%{ transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
