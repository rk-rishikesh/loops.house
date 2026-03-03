"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, ArrowRight, MessageSquare, Send, FileText,
  CheckCircle, Clock, Trophy, BookOpen, Users, HelpCircle,
  Zap, Lightbulb, DollarSign,
} from "lucide-react";
import { getBoosterWithTracks, getProjects, getBoosterSubmissions } from "@/lib/storage";
import type { StoredBooster, StoredProject, StoredSubmission } from "@/lib/storage";
import { getRole, type AppRole } from "@/lib/auth";
import Image from "next/image";

const TYPE_LABELS: Record<string, string> = {
  idea: "Idea Booster",
  momentum: "Momentum Booster",
  capital: "Capital Booster",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  idea: Lightbulb,
  momentum: Zap,
  capital: DollarSign,
};

// ─── Section block ────────────────────────────────────────────────────────────
function InfoBlock({
  icon: Icon,
  label,
  children,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: accent ? "#0F2C23" : "transparent",
        border: `2px solid ${accent ? "rgba(226,254,165,0.12)" : "rgba(15,44,35,0.12)"}`,
        borderRadius: 4,
        padding: "28px 28px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: 2,
            background: accent ? "rgba(226,254,165,0.1)" : "rgba(15,44,35,0.07)",
            color: accent ? "#E2FEA5" : "#3C574B",
            flexShrink: 0,
          }}
        >
          <Icon size={15} />
        </span>
        <p
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9, letterSpacing: "0.18em",
            color: accent ? "rgba(226,254,165,0.5)" : "#3C574B",
            opacity: accent ? 1 : 0.7,
          }}
        >
          {label}
        </p>
      </div>
      {children}
    </div>
  );
}

// ─── Action card ─────────────────────────────────────────────────────────────
function ActionCard({
  href,
  onClick,
  label,
  description,
  badge,
  icon: Icon,
  iconBg,
  iconColor,
  disabled = false,
  highlight = false,
}: {
  href?: string;
  onClick?: () => void;
  label: string;
  description: string;
  badge?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  disabled?: boolean;
  highlight?: boolean;
}) {
  const inner = (
    <div
      style={{
        display: "flex", alignItems: "flex-start", gap: 20,
        padding: "26px 28px",
        background: highlight ? "#E2FEA5" : disabled ? "rgba(15,44,35,0.03)" : "transparent",
        border: `2px solid ${highlight ? "transparent" : disabled ? "rgba(15,44,35,0.1)" : "rgba(15,44,35,0.12)"}`,
        borderRadius: 4,
        cursor: disabled ? "default" : "pointer",
        transition: "all 0.18s ease",
        opacity: disabled ? 0.65 : 1,
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        if (!disabled && !highlight) {
          (e.currentTarget as HTMLDivElement).style.background = "rgba(15,44,35,0.04)";
          (e.currentTarget as HTMLDivElement).style.borderColor = "#0F2C23";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !highlight) {
          (e.currentTarget as HTMLDivElement).style.background = "transparent";
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(15,44,35,0.12)";
        }
      }}
    >
      <span
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 46, height: 46, borderRadius: 2, flexShrink: 0,
          background: iconBg, color: iconColor,
        }}
      >
        <Icon size={20} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: 11,
            color: highlight ? "#0F2C23" : "#0F2C23",
            letterSpacing: "0.06em", lineHeight: 1.6, marginBottom: 8,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontFamily: "'DM Mono', monospace", fontSize: 13,
            color: highlight ? "rgba(15,44,35,0.6)" : "#3C574B",
            lineHeight: 1.65,
          }}
        >
          {description}
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
        {badge && (
          <span
            style={{
              fontFamily: "'Press Start 2P', monospace", fontSize: 7,
              letterSpacing: "0.1em",
              background: highlight ? "rgba(15,44,35,0.12)" : "#0F2C23",
              color: highlight ? "#0F2C23" : "#E2FEA5",
              padding: "4px 8px", borderRadius: 2,
            }}
          >
            {badge}
          </span>
        )}
        {!disabled && (
          <span
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32, borderRadius: "50%",
              background: highlight ? "#0F2C23" : "#0F2C23",
              color: highlight ? "#E2FEA5" : "#E2FEA5",
              marginTop: badge ? 0 : "auto",
            }}
          >
            <ArrowRight size={13} />
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} style={{ textDecoration: "none", display: "block" }}>{inner}</Link>;
  }
  return <div onClick={onClick}>{inner}</div>;
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <main className="min-h-screen bg-cream p-10 px-8">
      <div className="sk w-20 h-3 mb-[60px]" />
      <div className="sk w-80 h-7 mb-4" />
      <div className="sk w-40 h-3 mb-12" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="sk w-full h-20 mb-3" />
      ))}
    </main>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function IndividualBoosterPage() {
  const params = useParams();
  const type = (params.type as string) || "idea";
  const id = params.id as string;

  const [booster, setBooster] = useState<StoredBooster | null | undefined>(undefined);
  const [submittedProject, setSubmittedProject] = useState<StoredProject | null>(null);
  const [submissions, setSubmissions] = useState<StoredSubmission[]>([]);
  const [role, setRole] = useState<AppRole | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    getRole().then(setRole);
    getBoosterWithTracks(id).then(setBooster);
    getBoosterSubmissions(id).then(setSubmissions);
    getProjects().then((projects) => {
      const submitted = projects.find((p) => (p as Record<string, unknown>).booster_id === id) ?? null;
      setSubmittedProject(submitted);
    });
  }, [id]);

  if (booster === undefined) return <Skeleton />;

  const typeLabel = TYPE_LABELS[type] || "Booster";
  const TypeIcon = TYPE_ICONS[type] || Zap;

  if (booster === null) {
    return (
      <main style={{ minHeight: "100vh", background: "#F5F7EB", padding: "40px 32px" }}>
        <Link
          href="/boosters"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontFamily: "'Press Start 2P', monospace", fontSize: 9,
            letterSpacing: "0.12em", color: "#3C574B", textDecoration: "none",
            opacity: 0.7,
          }}
        >
          <ArrowLeft size={13} /> Boosters
        </Link>
        <p style={{ marginTop: 48, fontFamily: "'DM Mono', monospace", fontSize: 15, color: "#3C574B" }}>
          Booster not found.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      {/* ── Top nav bar ─────────────────────────────────────────────────────── */}
      <nav
        style={{
          borderBottom: "1px solid rgba(15,44,35,0.1)",
          padding: "0 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 60,
        }}
      >
        <Link
          href={`/boosters/${type}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontFamily: "'Press Start 2P', monospace", fontSize: 9,
            letterSpacing: "0.12em", color: "#3C574B", textDecoration: "none",
            opacity: 0.7, transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.7")}
        >
          <ArrowLeft size={13} /> {typeLabel}
        </Link>

        {submissions.length > 0 && (
          <span
            style={{
              fontFamily: "'Press Start 2P', monospace", fontSize: 8,
              letterSpacing: "0.12em",
              background: "#0F2C23", color: "#E2FEA5",
              padding: "6px 14px", borderRadius: 2,
            }}
          >
            {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
          </span>
        )}
      </nav>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 32px 100px" }}>

        {/* Two-column layout on wide screens */}
        <div style={{ display: "flex", gap: 48, flexWrap: "wrap", alignItems: "flex-start" }}>

          {/* ── LEFT COL: info ──────────────────────────────────────────────── */}
          <div style={{ flex: "1 1 420px", minWidth: 0 }}>

            {/* Hero heading */}
            <div className="s1" style={{ marginBottom: 48 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <span
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 48, height: 48, borderRadius: 4,
                    background: "#0F2C23", color: "#E2FEA5",
                  }}
                >
                  <TypeIcon size={22} />
                </span>
                <p
                  style={{
                    fontFamily: "'Press Start 2P', monospace", fontSize: 9,
                    letterSpacing: "0.18em", color: "#3C574B", opacity: 0.6,
                  }}
                >
                  {typeLabel}
                </p>
              </div>

              <h1
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: "clamp(20px, 3.5vw, 36px)",
                  color: "#0F2C23",
                  lineHeight: 1.65,
                  letterSpacing: "-0.01em",
                  marginBottom: 14,
                }}
              >
                {booster.name}
              </h1>

              {booster.theme && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      display: "inline-block",
                      background: "#E2FEA5", color: "#0F2C23",
                      fontFamily: "'Press Start 2P', monospace", fontSize: 8,
                      letterSpacing: "0.12em", padding: "5px 12px", borderRadius: 2,
                    }}
                  >
                    {booster.theme}
                  </span>
                </div>
              )}
            </div>

            {/* Info blocks */}
            <div className="s2" style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {booster.program_goal && (
                <InfoBlock icon={BookOpen} label="About">
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#3C574B", lineHeight: 1.75 }}>
                    {booster.program_goal}
                  </p>
                </InfoBlock>
              )}

              {booster.problem_statements.length > 0 && (
                <InfoBlock icon={FileText} label="Problem Statements" accent>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {booster.problem_statements.map((ps, i) => (
                      <li
                        key={i}
                        style={{ display: "flex", gap: 14, alignItems: "flex-start" }}
                      >
                        <span
                          style={{
                            fontFamily: "'DM Mono', monospace", fontSize: 11,
                            fontWeight: 700, color: "rgba(226,254,165,0.3)",
                            letterSpacing: "0.15em", flexShrink: 0, lineHeight: 1.8,
                          }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "rgba(226,254,165,0.75)", lineHeight: 1.7 }}>
                          {ps}
                        </p>
                      </li>
                    ))}
                  </ul>
                </InfoBlock>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {booster.timeline && (
                  <InfoBlock icon={Clock} label="Timeline">
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#3C574B", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {booster.timeline}
                    </p>
                  </InfoBlock>
                )}

                {booster.bounty_pool_summary && (
                  <InfoBlock icon={Trophy} label="Prizes">
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#3C574B", lineHeight: 1.7 }}>
                      {booster.bounty_pool_summary}
                    </p>
                  </InfoBlock>
                )}
              </div>

              {(booster.sponsor_tracks?.length ?? 0) > 0 && (
                <InfoBlock icon={Users} label="Sponsor Tracks">
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {booster.sponsor_tracks!.map((t, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: 12,
                          paddingBottom: 10,
                          borderBottom: i < booster.sponsor_tracks!.length - 1 ? "1px solid rgba(15,44,35,0.08)" : "none",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'DM Mono', monospace", fontSize: 11,
                            color: "rgba(15,44,35,0.25)", letterSpacing: "0.15em",
                            flexShrink: 0, lineHeight: 1.8,
                          }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#0F2C23", letterSpacing: "0.1em", lineHeight: 1.8, marginBottom: 4 }}>
                            {t.sponsor}
                          </p>
                          {t.track_description && (
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#3C574B", lineHeight: 1.6 }}>
                              {t.track_description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </InfoBlock>
              )}
            </div>
          </div>

          {/* ── RIGHT COL: actions ──────────────────────────────────────────── */}
          <div style={{ width: "min(100%, 360px)", flexShrink: 0 }}>

            {/* Sticky action panel */}
            <div className="s3" style={{ position: "sticky", top: 24 }}>

              {/* Section heading */}
              <p
                style={{
                  fontFamily: "'Press Start 2P', monospace", fontSize: 9,
                  letterSpacing: "0.18em", color: "#3C574B", opacity: 0.55,
                  marginBottom: 20,
                }}
              >
                Actions
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                {/* Ideate — always shown */}
                <ActionCard
                  href={`/builder/ideate?booster_id=${id}`}
                  icon={MessageSquare}
                  iconBg="rgba(15,44,35,0.08)"
                  iconColor="#3C574B"
                  label="Ideate Project"
                  description="Refine your idea with the AI mentor for this booster."
                  badge="AI"
                />

                {/* Tech Buddy — builders with sponsor tracks */}
                {mounted && role === "builder" && (booster.sponsor_tracks?.length ?? 0) > 0 && (
                  <ActionCard
                    href={`/builder/boosters/${id}/tech-buddy`}
                    icon={HelpCircle}
                    iconBg="rgba(15,44,35,0.08)"
                    iconColor="#3C574B"
                    label="Tech Buddy"
                    description="Ask technical questions about sponsor APIs and docs."
                    badge="AI"
                  />
                )}

                {/* Apply — builders */}
                {mounted && role === "builder" && (
                  <ActionCard
                    href={`/builder/boosters/${type}/${id}/submit`}
                    icon={Send}
                    iconBg="#0F2C23"
                    iconColor="#E2FEA5"
                    label="Apply with project"
                    description="Create or select a project and submit it."
                    highlight
                  />
                )}

                {/* Apply — guests */}
                {mounted && role !== "builder" && (
                  <div
                    style={{
                      padding: "26px 28px",
                      border: "2px dashed rgba(15,44,35,0.15)",
                      borderRadius: 4,
                    }}
                  >
                    <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#0F2C23", letterSpacing: "0.08em", lineHeight: 1.7, marginBottom: 10 }}>
                      Apply with project
                    </p>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#3C574B", lineHeight: 1.65 }}>
                      <Link
                        href="/login"
                        style={{ color: "#0F2C23", textDecoration: "underline", textUnderlineOffset: 4 }}
                      >
                        Login as Builder
                      </Link>{" "}
                      to submit a project to this booster.
                    </p>
                  </div>
                )}

                {/* Already submitted */}
                {submittedProject && (
                  <div
                    style={{
                      padding: "24px 28px",
                      background: "#E2FEA5",
                      borderRadius: 4,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <CheckCircle size={16} style={{ color: "#0F2C23", flexShrink: 0 }} />
                      <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "#0F2C23", letterSpacing: "0.1em" }}>
                        Submitted
                      </p>
                    </div>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "rgba(15,44,35,0.7)", marginBottom: 16, lineHeight: 1.6 }}>
                      {submittedProject.name}
                    </p>
                    <Link
                      href={`/builder/projects/${submittedProject.project_id}`}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        fontFamily: "'Press Start 2P', monospace", fontSize: 8,
                        letterSpacing: "0.1em", color: "#0F2C23",
                        background: "rgba(15,44,35,0.12)", padding: "8px 14px", borderRadius: 2,
                        textDecoration: "none",
                      }}
                    >
                      View project <ArrowRight size={11} />
                    </Link>
                  </div>
                )}
              </div>

              {/* Cat mascot below actions */}
              <div className="s4" style={{ marginTop: 40, display: "flex", justifyContent: "center" }}>
                <Image
                  src="/builder/woolCat.svg"
                  alt="Loops mascot"
                  width={90}
                  height={90}
                  unoptimized
                  style={{ objectFit: "contain", opacity: 0.55 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ticker ──────────────────────────────────────────────────── */}
      <div
        className="s5"
        style={{
          borderTop: "1px solid rgba(15,44,35,0.1)",
          background: "#0F2C23",
          overflow: "hidden",
          padding: "14px 0",
        }}
      >
        <div className="ticker-inner">
          {[...Array(2)].map((_, r) =>
            ["VALIDATE BEFORE YOU SCALE", "✦", "SHIP WITH CONVICTION", "✦", "BUILD FOR THE LONG TERM", "✦",
             "VALIDATE BEFORE YOU SCALE", "✦", "SHIP WITH CONVICTION", "✦", "BUILD FOR THE LONG TERM", "✦"].map((t, i) => (
              <span key={`${r}-${i}`} className={`tick ${t === "✦" ? "hi" : ""}`}>{t}</span>
            ))
          )}
        </div>
      </div>
    </main>
  );
}