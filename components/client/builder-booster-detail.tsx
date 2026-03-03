"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  FileText,
  CheckCircle,
  Clock,
  Trophy,
  Users,
  Globe,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import type {
  StoredBooster,
  StoredProject,
  StoredSubmission,
} from "@/lib/data-mappers";
import type { AppRole } from "@/lib/supabase/types";
import { useIsMounted } from "@/hooks/use-is-mounted";

/* ── Props ──────────────────────────────────────────────────────── */
interface BuilderBoosterDetailProps {
  type: string;
  boosterId: string;
  booster: StoredBooster | null;
  projects: StoredProject[];
  submissions: StoredSubmission[];
  isAuthenticated: boolean;
  role?: AppRole | null;
}

/* ─── Type meta (builder-friendly) ──────────────────────────────── */
const TYPE_META: Record<string, { label: string; navLabel: string }> = {
  idea: { label: "Early Stage", navLabel: "Open Calls" },
  momentum: { label: "Build Phase", navLabel: "Open Calls" },
  capital: { label: "Scale Up", navLabel: "Open Calls" },
};

/* ─── Atoms ──────────────────────────────────────────────────────── */
function MicroLabel({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <p
      className="text-[9px] tracking-[0.2em] uppercase font-bold mb-2"
      style={{
        fontFamily: "'Inter', sans-serif",
        color: light ? "rgba(240,235,224,0.38)" : "rgba(45,74,62,0.4)",
      }}
    >
      {children}
    </p>
  );
}

function ArrowCircle({
  size = 40,
  inverted = false,
}: {
  size?: number;
  inverted?: boolean;
}) {
  return (
    <span
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center rounded-full shrink-0 ${
        inverted ? "bg-[#d6cfc0] text-[#2d4a3e]" : "bg-[#2d4a3e] text-[#f0ebe0]"
      }`}
    >
      <ArrowUpRight size={Math.round(size * 0.4)} />
    </span>
  );
}

/* ─── Collapsible problem accordion ─────────────────────────────── */
function ProblemAccordion({ items }: { items: string[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="border-t border-[#f0ebe0]/10">
      {items.map((item, i) => (
        <div key={i} className="border-b border-[#f0ebe0]/08">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center gap-4 py-5 text-left bg-transparent border-none cursor-pointer"
          >
            <span
              className="font-black text-[#f0ebe0]/18 shrink-0"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                width: 28,
                letterSpacing: "-0.02em",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <p
              className="flex-1 text-[#f0ebe0]/70 text-sm font-semibold leading-snug truncate"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {item.length > 90 ? item.slice(0, 90) + "..." : item}
            </p>
            {open === i ? (
              <ChevronUp
                size={13}
                style={{ color: "rgba(240,235,224,0.3)", flexShrink: 0 }}
              />
            ) : (
              <ChevronDown
                size={13}
                style={{ color: "rgba(240,235,224,0.3)", flexShrink: 0 }}
              />
            )}
          </button>
          {open === i && (
            <p
              className="pb-5 pl-[44px] text-[#f0ebe0]/60 text-sm leading-relaxed"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {item}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Action row card ────────────────────────────────────────────── */
function ActionCard({
  href,
  onClick,
  label,
  sublabel,
  badge,
  primary = false,
  disabled = false,
}: {
  href?: string;
  onClick?: () => void;
  label: string;
  sublabel?: string;
  badge?: string;
  primary?: boolean;
  disabled?: boolean;
}) {
  const bg = disabled ? "rgba(45,74,62,0.04)" : primary ? "#2d4a3e" : "#d6cfc0";
  const fg = primary ? "#f0ebe0" : "#2d4a3e";
  const fgSub = primary ? "rgba(240,235,224,0.5)" : "rgba(45,74,62,0.55)";
  const arrowBg = primary ? "#d6cfc0" : "#2d4a3e";
  const arrowFg = primary ? "#2d4a3e" : "#f0ebe0";

  const inner = (
    <div
      className={`rounded-2xl px-6 py-5 flex items-center gap-4 transition-all duration-200 ${!disabled ? "hover:scale-[1.01]" : ""}`}
      style={{ backgroundColor: bg, opacity: disabled ? 0.45 : 1 }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p
            className="font-black uppercase text-sm leading-tight"
            style={{
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "-0.01em",
              color: fg,
            }}
          >
            {label}
          </p>
          {badge && (
            <span
              className="text-[7px] tracking-[0.14em] uppercase font-bold px-2 py-0.5 rounded-sm"
              style={{
                fontFamily: "'Inter', sans-serif",
                backgroundColor: primary
                  ? "rgba(214,207,192,0.2)"
                  : "rgba(45,74,62,0.1)",
                color: primary ? "#d6cfc0" : "#2d4a3e",
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {sublabel && (
          <p
            className="text-xs leading-snug"
            style={{ fontFamily: "Georgia, serif", color: fgSub }}
          >
            {sublabel}
          </p>
        )}
      </div>
      {!disabled && (
        <span
          className="w-9 h-9 flex items-center justify-center rounded-full shrink-0"
          style={{ backgroundColor: arrowBg }}
        >
          <ArrowUpRight size={14} style={{ color: arrowFg }} />
        </span>
      )}
    </div>
  );

  if (href && !disabled)
    return (
      <Link href={href} className="no-underline block">
        {inner}
      </Link>
    );
  if (onClick && !disabled)
    return (
      <div onClick={onClick} className="cursor-pointer">
        {inner}
      </div>
    );
  return <div>{inner}</div>;
}

/* ─── Main component ─────────────────────────────────────────────── */
export function BuilderBoosterDetail({
  type,
  boosterId,
  booster,
  projects,
  submissions,
  isAuthenticated: _isAuthenticated,
  role,
}: BuilderBoosterDetailProps) {
  const mounted = useIsMounted();

  const meta = TYPE_META[type] ?? {
    label: "Opportunity",
    navLabel: "Open Calls",
  };

  /* Derive submitted project from server-fetched projects */
  const submittedProject =
    projects.find(
      (p) => (p as Record<string, unknown>).booster_id === boosterId,
    ) ?? null;

  /* ── 404 ── */
  if (booster === null) {
    return (
      <div
        className="min-h-screen px-10 py-12"
        style={{ backgroundColor: "#f0ebe0" }}
      >
        <Link
          href="/builder/boosters"
          className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold text-[#2d4a3e]/50 hover:text-[#2d4a3e] transition-colors no-underline"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <ArrowLeft size={12} /> {meta.navLabel}
        </Link>
        <p
          className="mt-12 text-[#2d4a3e]/50"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Opportunity not found.
        </p>
      </div>
    );
  }

  const hasResources = (booster.technical_resources?.length ?? 0) > 0;
  const hasTracks = (booster.sponsor_tracks?.length ?? 0) > 0;

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>
      {/* ── Sticky nav ──────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-50 px-10 py-5 flex items-center justify-between gap-4"
        style={{
          backgroundColor: "#f0ebe0",
          borderBottom: "1px solid rgba(45,74,62,0.1)",
        }}
      >
        <Link
          href="/builder/boosters"
          className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold text-[#2d4a3e]/50 hover:text-[#2d4a3e] transition-colors no-underline shrink-0"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <ArrowLeft size={12} /> {meta.navLabel}
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-[9px] tracking-[0.15em] uppercase font-bold px-3 py-1.5 rounded-full"
            style={{
              fontFamily: "'Inter', sans-serif",
              backgroundColor: "rgba(45,74,62,0.08)",
              color: "#2d4a3e",
            }}
          >
            {meta.label}
          </span>
          {submissions.length > 0 && (
            <span
              className="text-[9px] tracking-[0.15em] uppercase font-bold px-3 py-1.5 rounded-full"
              style={{
                fontFamily: "'Inter', sans-serif",
                backgroundColor: "#2d4a3e",
                color: "#f0ebe0",
              }}
            >
              {submissions.length} submission
              {submissions.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="px-10 pt-10 pb-24">
        {/* ── Hero ────────────────────────────────────────────────────── */}
        <div className="mb-14">
          <h1
            className="font-black text-[#2d4a3e] leading-[0.88] uppercase"
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: "clamp(44px, 8vw, 118px)",
              letterSpacing: "-0.025em",
            }}
          >
            {booster.name}
          </h1>
          {booster.theme && (
            <div className="flex justify-end mt-6">
              <p
                className="text-[#2d4a3e]/55 max-w-[440px] text-right leading-relaxed"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "clamp(14px, 1.4vw, 18px)",
                }}
              >
                {booster.theme}
              </p>
            </div>
          )}
        </div>

        {/* ── Three-column grid ────────────────────────────────────────── */}
        <div
          className="grid gap-6 items-start"
          style={{ gridTemplateColumns: "1fr 1fr 300px" }}
        >
          {/* LEFT -- program info */}
          <div className="flex flex-col gap-4">
            {/* About */}
            {booster.program_goal && (
              <div
                className="rounded-3xl p-7"
                style={{ backgroundColor: "#f5f2ea" }}
              >
                <MicroLabel>About this program</MicroLabel>
                <p
                  className="text-[#2d4a3e]/70 leading-relaxed mt-2"
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: "clamp(14px, 1.3vw, 16px)",
                    lineHeight: 1.9,
                  }}
                >
                  {booster.program_goal}
                </p>
              </div>
            )}

            {/* Challenges */}
            {booster.problem_statements.length > 0 && (
              <div
                className="rounded-3xl p-7 relative overflow-hidden"
                style={{ backgroundColor: "#2d4a3e" }}
              >
                {/* Watermark */}
                <span
                  className="absolute right-4 bottom-0 select-none pointer-events-none font-black text-[#f0ebe0]/03"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "clamp(80px, 12vw, 160px)",
                    letterSpacing: "-0.05em",
                    lineHeight: 0.85,
                  }}
                >
                  &#9733;
                </span>
                <MicroLabel light>Challenges</MicroLabel>
                <h2
                  className="font-black text-[#f0ebe0] uppercase mb-6"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "clamp(18px, 2.5vw, 28px)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {booster.problem_statements.length} Open Problem
                  {booster.problem_statements.length !== 1 ? "s" : ""}.
                </h2>
                <ProblemAccordion items={booster.problem_statements} />
              </div>
            )}

            {/* Sponsor tracks */}
            {hasTracks && (
              <div
                className="rounded-3xl p-7"
                style={{ backgroundColor: "#f5f2ea" }}
              >
                <MicroLabel>Sponsor Tracks</MicroLabel>
                <h2
                  className="font-black text-[#2d4a3e] uppercase mb-5"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "clamp(16px, 2vw, 22px)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {booster.sponsor_tracks!.length} Track
                  {booster.sponsor_tracks!.length !== 1 ? "s" : ""}.
                </h2>
                <div className="border-t border-[#2d4a3e]/12">
                  {booster.sponsor_tracks!.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 py-5 border-b border-[#2d4a3e]/08"
                    >
                      <span
                        className="font-black text-[#2d4a3e]/18 shrink-0 pt-0.5"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 12,
                          width: 28,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p
                          className="font-semibold text-[#2d4a3e] text-sm mb-1"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          {t.sponsor}
                        </p>
                        {t.track_description && (
                          <p
                            className="text-[#2d4a3e]/60 text-sm leading-relaxed"
                            style={{ fontFamily: "Georgia, serif" }}
                          >
                            {t.track_description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CENTRE -- meta details */}
          <div className="flex flex-col gap-4">
            {/* Prize pool */}
            {booster.bounty_pool_summary && (
              <div
                className="rounded-2xl p-6"
                style={{ backgroundColor: "#d6cfc0" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Trophy size={12} style={{ color: "rgba(45,74,62,0.5)" }} />
                  <MicroLabel>Prize Pool</MicroLabel>
                </div>
                <p
                  className="font-black text-[#2d4a3e] uppercase leading-tight"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "clamp(16px, 2.2vw, 24px)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {booster.bounty_pool_summary}
                </p>
              </div>
            )}

            {/* Timeline */}
            {booster.timeline && (
              <div
                className="rounded-2xl p-6"
                style={{ backgroundColor: "#d6cfc0" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={12} style={{ color: "rgba(45,74,62,0.5)" }} />
                  <MicroLabel>Timeline</MicroLabel>
                </div>
                <p
                  className="text-[#2d4a3e]/75 text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {booster.timeline}
                </p>
              </div>
            )}

            {/* Website */}
            {booster.website_url && (
              <Link
                href={booster.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group no-underline block"
              >
                <div
                  className="rounded-2xl px-6 py-5 flex items-center gap-4 transition-all duration-200 group-hover:scale-[1.01]"
                  style={{ backgroundColor: "#f5f2ea" }}
                >
                  <Globe size={15} style={{ color: "rgba(45,74,62,0.4)" }} />
                  <p
                    className="text-[#2d4a3e]/65 text-sm truncate flex-1"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {booster.website_url.replace(/^https?:\/\//, "")}
                  </p>
                  <ArrowCircle size={36} />
                </div>
              </Link>
            )}

            {/* Technical resources */}
            {hasResources && (
              <div
                className="rounded-2xl p-6"
                style={{ backgroundColor: "#f5f2ea" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={12} style={{ color: "rgba(45,74,62,0.5)" }} />
                  <MicroLabel>Resources</MicroLabel>
                </div>
                <div className="flex flex-col gap-2">
                  {booster.technical_resources!.map((r, i) => (
                    <Link
                      key={i}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-xl px-4 py-3 no-underline transition-all duration-150 hover:scale-[1.01]"
                      style={{ backgroundColor: "#d6cfc0" }}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[#2d4a3e] text-xs font-semibold truncate"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          {r.description || r.url}
                        </p>
                        {r.description && (
                          <p
                            className="text-[#2d4a3e]/40 text-[11px] mt-0.5 truncate"
                            style={{ fontFamily: "Georgia, serif" }}
                          >
                            {r.url.replace(/^https?:\/\//, "")}
                          </p>
                        )}
                      </div>
                      <ArrowUpRight
                        size={11}
                        style={{ color: "rgba(45,74,62,0.35)", flexShrink: 0 }}
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Submission count */}
            {submissions.length > 0 && (
              <div
                className="rounded-2xl px-6 py-5 flex items-center gap-4"
                style={{ backgroundColor: "rgba(45,74,62,0.06)" }}
              >
                <Users size={15} style={{ color: "rgba(45,74,62,0.4)" }} />
                <div>
                  <p
                    className="font-black text-[#2d4a3e]"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 24,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {submissions.length}
                  </p>
                  <p
                    className="text-[9px] tracking-widest uppercase font-bold text-[#2d4a3e]/40"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Submission{submissions.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT -- sticky actions */}
          <aside className="sticky top-[81px] flex flex-col gap-3">
            <MicroLabel>Actions</MicroLabel>

            {/* Already submitted */}
            {submittedProject && (
              <div
                className="rounded-2xl p-6"
                style={{ backgroundColor: "#2d4a3e" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={13} style={{ color: "#d6cfc0" }} />
                  <p
                    className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#f0ebe0]/50"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Submitted
                  </p>
                </div>
                <p
                  className="font-black text-[#f0ebe0] uppercase leading-tight mb-5"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 15,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {submittedProject.name}
                </p>
                <Link
                  href={`/builder/projects/${submittedProject.project_id}`}
                  className="inline-flex items-center gap-2 no-underline rounded-full px-4 py-2.5 transition-all hover:opacity-85"
                  style={{ backgroundColor: "#d6cfc0" }}
                >
                  <span
                    className="text-[9px] tracking-widest uppercase font-bold text-[#2d4a3e]"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    View project
                  </span>
                  <ArrowUpRight size={11} style={{ color: "#2d4a3e" }} />
                </Link>
              </div>
            )}

            {/* Apply -- builder */}
            {mounted && role === "builder" && !submittedProject && (
              <ActionCard
                href={`/builder/boosters/${type}/${boosterId}/submit`}
                label="Apply with project"
                sublabel="Select or create a project to submit"
                primary
              />
            )}

            {/* Ideate */}
            <ActionCard
              href={`/builder/ideate?booster_id=${boosterId}`}
              label="Ideate project"
              sublabel="Refine your idea with the AI mentor"
              badge="AI"
            />

            {/* Tech Buddy -- disabled until route is built */}
            {mounted && role === "builder" && hasTracks && (
              <ActionCard
                label="Tech Buddy"
                sublabel="Ask about sponsor APIs and docs"
                badge="SOON"
                disabled
              />
            )}

            {/* Guest */}
            {mounted && role !== "builder" && !submittedProject && (
              <div
                className="rounded-2xl p-6 border-2 border-dashed"
                style={{ borderColor: "rgba(45,74,62,0.18)" }}
              >
                <p
                  className="font-black text-[#2d4a3e] uppercase text-sm mb-2"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Apply with project
                </p>
                <p
                  className="text-[#2d4a3e]/55 text-sm mb-5 leading-relaxed"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  <Link
                    href="/login"
                    className="underline underline-offset-2 text-[#2d4a3e] hover:opacity-70 transition-opacity"
                  >
                    Login as Builder
                  </Link>{" "}
                  to submit your project to this opportunity.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-full no-underline text-[#f0ebe0] text-[9px] tracking-widest uppercase font-bold px-5 py-2.5"
                  style={{
                    backgroundColor: "#2d4a3e",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <Plus size={10} /> Join & Apply
                </Link>
              </div>
            )}

            {/* How it works */}
            <div
              className="rounded-2xl px-5 py-5 mt-2"
              style={{ backgroundColor: "#f5f2ea" }}
            >
              <MicroLabel>How it works</MicroLabel>
              <div className="flex flex-col gap-3 mt-3">
                {[
                  { n: "01", t: "Read the challenges and requirements." },
                  { n: "02", t: "Use the AI mentor to sharpen your idea." },
                  { n: "03", t: "Submit a project to enter the program." },
                ].map(({ n, t }) => (
                  <div key={n} className="flex items-start gap-3">
                    <span
                      className="font-black text-[#2d4a3e]/20 shrink-0"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 11,
                        width: 20,
                      }}
                    >
                      {n}
                    </span>
                    <p
                      className="text-xs text-[#2d4a3e]/55 leading-relaxed"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {t}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Ticker ──────────────────────────────────────────────────── */}
      <div
        className="overflow-hidden border-t border-[#2d4a3e]/10 py-3"
        style={{ backgroundColor: "#e8e2d4" }}
      >
        <div
          className="flex gap-10 whitespace-nowrap"
          style={{ animation: "ticker 28s linear infinite" }}
        >
          {[...Array(3)].map((_, ri) =>
            [
              "OPEN CALLS",
              "\u2605",
              "BUILD & SHIP",
              "\u2605",
              "GRANTS & PRIZES",
              "\u2605",
              "HACKATHONS",
              "\u2605",
            ].map((t, i) => (
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
            )),
          )}
        </div>
      </div>

      <style>{`@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }`}</style>
    </main>
  );
}
