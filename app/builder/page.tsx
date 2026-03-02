"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Users,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  Zap,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────
type Section = "home" | "projects" | "teams" | "boosters";
type BoosterType = "idea" | "momentum" | "capital";

// ─── Mock data (replace with your hooks) ─────────────────────────────────────
const mockProjects = [
  { project_id: "1", name: "Alpha Initiative", tagline: "Early-stage startup" },
  { project_id: "2", name: "Beta Labs", tagline: "Research project" },
];
const mockTeams = [
  { id: "1", name: "Core Team" },
  { id: "2", name: "Design Squad" },
];
const mockBoosters = [
  { id: "1", name: "Concept Validator", booster_type: "idea" as BoosterType, theme: "Validation", problem_statements: ["a", "b"] },
  { id: "2", name: "Sprint Engine", booster_type: "momentum" as BoosterType, theme: "Acceleration", problem_statements: ["a"] },
  { id: "3", name: "Seed Connect", booster_type: "capital" as BoosterType, theme: "Funding", problem_statements: ["a", "b", "c"] },
];

// ─── Booster meta ─────────────────────────────────────────────────────────────
const BOOSTER_META: Record<BoosterType, { icon: React.ReactNode; label: string; index: string }> = {
  idea: { icon: <Zap size={15} />, label: "Idea Booster", index: "01" },
  momentum: { icon: <TrendingUp size={15} />, label: "Momentum Booster", index: "02" },
  capital: { icon: <DollarSign size={15} />, label: "Capital Booster", index: "03" },
};

// ─── Arrow circle button ──────────────────────────────────────────────────────
function ArrowCircle({ dark = false, size = 40 }: { dark?: boolean; size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center rounded-full shrink-0 ${dark ? "bg-[#2d4a3e] text-[#f5f0e8]" : "bg-[#2d4a3e] text-[#f5f0e8]"
        }`}
    >
      <ArrowUpRight size={size * 0.4} />
    </span>
  );
}

// ─── SlideIn wrapper ──────────────────────────────────────────────────────────
function SlideIn({ children, active }: { children: React.ReactNode; active: boolean }) {
  return (
    <div
      className="transition-all duration-[400ms] ease-out"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : "translateY(16px)",
        pointerEvents: active ? "auto" : "none",
      }}
    >
      {children}
    </div>
  );
}

// ─── Back button ──────────────────────────────────────────────────────────────
function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 text-xs tracking-widest uppercase font-medium text-[#2d4a3e] mb-10 opacity-60 hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer"
    >
      <ArrowLeft size={13} /> Hub
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProjectHubPage() {
  const projects = mockProjects;
  const teams = mockTeams;
  const boosters = mockBoosters;
  const loading = false;

  const [section, setSection] = useState<Section>("home");
  const [mounted, setMounted] = useState(false);
  const [boosterType, setBoosterType] = useState<BoosterType>("idea");
  const [navHighlightIndex, setNavHighlightIndex] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const id = setInterval(() => setNavHighlightIndex((i) => (i + 1) % 5), 2200);
    return () => clearInterval(id);
  }, []);

  const boostersForType = boosters.filter((b) => b.booster_type === boosterType);

  const goTo = (s: Section) => {
    setMounted(false);
    setTimeout(() => { setSection(s); setMounted(true); }, 80);
  };

  return (
    <div className="h-full bg-[#f0ebe0] font-sans">
      {/* ── HOME ──────────────────────────────────────────────────────────── */}
      {section === "home" && (
        <SlideIn active={mounted}>
          {/* Full viewport hero */}
          <div className="relative min-h-screen overflow-hidden flex flex-col">
            {/* Large hero typography */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none select-none">
              <div className="pl-16">
                <h1
                  className="text-[clamp(80px,11vw,160px)] font-extrabold leading-[0.9] tracking-tight text-[#1a1a1a]"
                  style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
                >
                  Build
                </h1>
              </div>
              <div className="pb-12 pr-16 flex justify-end">
                <h1
                  className="text-[clamp(80px,11vw,160px)] font-extrabold leading-[0.9] tracking-tight text-[#1a1a1a]"
                  style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
                >
                  Ship.
                </h1>
              </div>
            </div>

            {/* Content grid over hero */}
            <div className="relative z-10 grid grid-cols-12 gap-5 px-16 py-20 min-h-screen items-center">

              {/* Left description — col 1-3 */}
              <div className="col-span-3 self-center mt-20">
                <p className="text-[#1a1a1a]/60 text-sm leading-relaxed max-w-[220px]" style={{ fontFamily: "Georgia, serif" }}>
                  Loops House is home for builders—validate ideas, gain momentum, and connect with capital. Your dashboard to projects, boosters, and teams.
                </p>
              </div>

              {/* Boosters card — col 4-8, centered */}
              <div className="col-span-4 col-start-5 self-center top-12 relative">
                <div
                  className="rounded-2xl p-10 shadow-xl"
                  style={{ backgroundColor: "#d6cfc0" }}
                >
                  {(["idea", "momentum", "capital"] as BoosterType[]).map((type, i) => {
                    const meta = BOOSTER_META[type];
                    return (
                      <div key={type}>
                        <button
                          type="button"
                          onClick={() => { setBoosterType(type); goTo("boosters"); }}
                          className="w-full flex items-center justify-between py-7 group cursor-pointer bg-transparent border-none text-left"
                        >
                          <div className="flex items-center gap-8">
                            <span
                              className="text-[#2d4a3e] font-black leading-none"
                              style={{ fontSize: "clamp(36px, 5vw, 52px)", fontFamily: "'Inter', sans-serif", letterSpacing: "-0.02em" }}
                            >
                              {meta.index}
                            </span>
                            <div>
                              <p className="text-[10px] tracking-[0.18em] uppercase font-semibold text-[#2d4a3e]/80 leading-none mb-1">
                                {type.toUpperCase()}
                              </p>
                              <p className="text-[10px] tracking-[0.18em] uppercase font-semibold text-[#2d4a3e]/80 leading-none">
                                BOOSTER
                              </p>
                            </div>
                          </div>
                          <ArrowCircle />
                        </button>
                        {i < 2 && <div className="h-px bg-[#2d4a3e]/20" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right nav — col 10-12 */}
              <div className="col-span-3 col-start-10 self-start mt-24">
                {/* Section nav — clearer labels, rotating highlight */}
                <nav className="mb-10">
                  {[
                    { label: "Dashboard", section: "home" as Section },
                    { label: "My Projects", section: "projects" as Section },
                    { label: "Boosters", section: "boosters" as Section },
                    { label: "My Teams", section: "teams" as Section },
                    { label: "Residency", section: "teams" as Section },
                  ].map((item, i) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => goTo(item.section)}
                      className="w-full text-left text-lg font-semibold leading-[1.7] cursor-pointer hover:text-[#1a1a1a] transition-colors duration-300 border-none bg-transparent p-0"
                      style={{
                        color: i === navHighlightIndex ? "#1a1a1a" : "#1a1a1a40",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>

                {/* Project Hub CTA */}
                <button
                  type="button"
                  onClick={() => goTo("projects")}
                  className="flex items-center gap-0 rounded-full overflow-hidden cursor-pointer border-none mb-6 shadow-sm hover:shadow-md transition-shadow"
                  style={{ backgroundColor: "#2d4a3e" }}
                >
                  <span className="px-6 py-3 text-[11px] tracking-[0.18em] uppercase font-bold text-[#f0ebe0]">
                    Project Hub
                  </span>
                  <span className="w-10 h-10 flex items-center justify-center bg-[#d6cfc0] rounded-full m-1">
                    <ArrowUpRight size={14} className="text-[#2d4a3e]" />
                  </span>
                </button>

                <p className="text-xs text-[#1a1a1a]/50 leading-relaxed max-w-[200px]" style={{ fontFamily: "Georgia, serif" }}>
                  Your command center for hackathon projects, boosters, and teams.
                </p>
              </div>

              {/* Residency card — bottom left */}
              <div className="col-span-3 self-end">
                <button
                  type="button"
                  onClick={() => goTo("teams")}
                  className="rounded-2xl w-[180px] h-[180px] flex flex-col cursor-pointer border-none text-left hover:scale-[1.02] transition-transform"
                  style={{ backgroundColor: "#c5bd9e" }}
                >
                  <Image
                    alt=""
                    width={190}
                    height={190}
                    src="/residency/cats.png"
                    className="-top-8 relative flex justify-end"
                  />
                  <div className="flex flex-row justify-between align-middle items-center">
                    <p className="text-[24px] tracking-[0.2em] uppercase font-bold text-[#f0ebe0]">
                      Residency
                    </p>
                    <div className="flex justify-center">
                      <ArrowCircle size={24} />
                    </div>
                  </div>

                </button>
              </div>
            </div>
          </div>
        </SlideIn>
      )}

      {/* ── PROJECTS ──────────────────────────────────────────────────────── */}
      {section === "projects" && (
        <SlideIn active={mounted}>
          <div className="min-h-screen px-16 py-12">
            <BackBtn onClick={() => goTo("home")} />
            <div className="flex gap-16 flex-wrap">
              <div className="flex-1 min-w-0 basis-[420px]">
                <p className="text-[10px] tracking-[0.18em] uppercase font-bold text-[#2d4a3e]/60 mb-4">Projects</p>
                <h2
                  className="text-[clamp(36px,5vw,60px)] font-extrabold tracking-tight text-[#1a1a1a] mb-10 leading-tight"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {projects.length === 0 ? "No projects\nyet." : `${projects.length} Projects`}
                </h2>

                {projects.length === 0 ? (
                  <div className="p-12 border-2 border-dashed border-[#1a1a1a]/20 rounded-xl text-center">
                    <Sparkles size={28} className="text-[#2d4a3e] mx-auto mb-4" />
                    <p className="text-sm text-[#2d4a3e] mb-6" style={{ fontFamily: "Georgia, serif" }}>No projects yet. Build something great.</p>
                    <Link href="/builder/new" className="inline-flex items-center gap-2 bg-[#2d4a3e] text-[#f0ebe0] py-3 px-6 rounded-full text-xs tracking-widest uppercase font-bold no-underline">
                      Create first project <ArrowRight size={12} />
                    </Link>
                  </div>
                ) : (
                  <div>
                    {projects.map((p, idx) => (
                      <Link key={p.project_id} href={`/builder/projects/${p.project_id}`} className="flex items-center justify-between py-5 border-b border-[#1a1a1a]/10 no-underline group">
                        <div className="flex items-center gap-6">
                          <span className="text-2xl font-black text-[#1a1a1a]/20 tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <div>
                            <p className="text-[10px] tracking-[0.15em] uppercase font-bold text-[#1a1a1a]">{p.name}</p>
                            {p.tagline && <p className="text-xs text-[#2d4a3e]/60 mt-0.5" style={{ fontFamily: "Georgia, serif" }}>{p.tagline}</p>}
                          </div>
                        </div>
                        <ArrowCircle size={38} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="shrink-0 w-full max-w-[260px] pt-24">
                <Link href="/builder/new" className="no-underline">
                  <div className="rounded-2xl p-8 h-[380px] flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-transform" style={{ backgroundColor: "#2d4a3e" }}>
                    <div>
                      <p className="text-[10px] tracking-[0.18em] uppercase font-bold text-[#f0ebe0]/50 mb-5">New</p>
                      <p className="text-xl font-extrabold text-[#f0ebe0] leading-tight" style={{ fontFamily: "'Inter', sans-serif" }}>Create<br />Profile</p>
                    </div>
                    <div className="flex justify-end">
                      <span className="w-10 h-10 flex items-center justify-center rounded-full bg-[#d6cfc0]">
                        <ArrowUpRight size={16} className="text-[#2d4a3e]" />
                      </span>
                    </div>
                  </div>
                </Link>
                <button type="button" onClick={() => goTo("teams")} className="flex items-center gap-2 mt-4 text-[10px] tracking-widest uppercase font-bold text-[#2d4a3e]/60 hover:text-[#2d4a3e] bg-transparent border-none cursor-pointer transition-colors">
                  <Users size={12} /> Teams
                </button>
              </div>
            </div>
          </div>
        </SlideIn>
      )}

      {/* ── TEAMS ─────────────────────────────────────────────────────────── */}
      {section === "teams" && (
        <SlideIn active={mounted}>
          <div className="min-h-screen px-16 py-12">
            <BackBtn onClick={() => goTo("home")} />
            <p className="text-[10px] tracking-[0.18em] uppercase font-bold text-[#2d4a3e]/60 mb-4">Teams</p>
            <h2 className="text-[clamp(36px,5vw,60px)] font-extrabold tracking-tight text-[#1a1a1a] mb-12 leading-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
              {teams.length === 0 ? "No teams yet." : `${teams.length} Teams`}
            </h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
              {teams.map((t, i) => (
                <Link key={t.id} href={`/builder/teams/${t.id}`} className="no-underline">
                  <div className="rounded-2xl p-7 min-h-[160px] flex flex-col justify-between hover:scale-[1.02] transition-transform" style={{ backgroundColor: "#2d4a3e" }}>
                    <div>
                      <p className="text-[10px] tracking-widest text-[#f0ebe0]/40 mb-3">Team {String(i + 1).padStart(2, "0")}</p>
                      <p className="text-[11px] tracking-[0.15em] uppercase font-bold text-[#f0ebe0]">{t.name}</p>
                    </div>
                    <div className="flex justify-end mt-6">
                      <span className="w-9 h-9 flex items-center justify-center rounded-full bg-[#d6cfc0]">
                        <ArrowUpRight size={14} className="text-[#2d4a3e]" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
              <Link href="/builder/teams" className="no-underline">
                <div className="rounded-2xl p-7 min-h-[160px] flex flex-col justify-between border-2 border-dashed border-[#1a1a1a]/20">
                  <div>
                    <PlusCircle size={20} className="text-[#2d4a3e] mb-3.5" />
                    <p className="text-[11px] tracking-[0.15em] uppercase font-bold text-[#1a1a1a]">New Team</p>
                  </div>
                  <p className="text-xs text-[#2d4a3e]/60 mt-3 leading-relaxed" style={{ fontFamily: "Georgia, serif" }}>Add a team, then create projects under it.</p>
                </div>
              </Link>
            </div>
          </div>
        </SlideIn>
      )}

      {/* ── BOOSTERS ──────────────────────────────────────────────────────── */}
      {section === "boosters" && (
        <SlideIn active={mounted}>
          <div className="min-h-screen px-12 py-10" style={{ backgroundColor: "#f0ebe0" }}>
            <BackBtn onClick={() => goTo("home")} />

            {/* Type tabs */}
            {/* <div className="flex gap-2 mb-10 flex-wrap">
        {(["idea", "momentum", "capital"] as BoosterType[]).map((type) => {
          const active = boosterType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setBoosterType(type)}
              className={`inline-flex items-center gap-1.5 py-2 px-5 rounded-full text-[9px] tracking-widest uppercase font-bold cursor-pointer transition-all border-none ${
                active ? "bg-[#2d4a3e] text-[#f0ebe0]" : "bg-transparent text-[#2d4a3e]"
              }`}
              style={active ? {} : { border: "2px solid rgba(45,74,62,0.25)" }}
            >
              {BOOSTER_META[type].icon}
              {BOOSTER_META[type].label.split(" ")[0]}
            </button>
          );
        })}
      </div> */}

            {/* Main layout */}
            <div className="flex gap-8 items-start">

              {/* LEFT — heading + booster cards */}
              <div className="flex-1 min-w-0">
                {/* Large heading */}
                <h1
                  className="font-black text-[#2d4a3e] leading-[0.88] mb-12 uppercase"
                  style={{
                    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                    fontSize: "clamp(52px, 8vw, 100px)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {BOOSTER_META[boosterType].label.split(" ")[0]}
                  <br />
                  {BOOSTER_META[boosterType].label.split(" ")[1]}S
                </h1>

                {/* Booster cards list */}
                <div className="flex flex-col gap-4 max-w-[560px]">
                  {boostersForType.length === 0 ? (
                    <div
                      className="rounded-2xl p-10 border-2 border-dashed border-[#2d4a3e]/20 text-center"
                      style={{ backgroundColor: "#e8e2d4" }}
                    >
                      <Sparkles size={24} className="text-[#2d4a3e] mx-auto mb-3" />
                      <p className="text-sm text-[#2d4a3e]/70" style={{ fontFamily: "Georgia, serif" }}>
                        No boosters of this type yet.
                      </p>
                    </div>
                  ) : (
                    boostersForType.map((b, idx) => (
                      <Link
                        key={b.id}
                        href={`/boosters/${b.booster_type ?? "idea"}/${b.id}`}
                        className="no-underline group"
                      >
                        <div
                          className="rounded-2xl px-8 py-9 flex items-center gap-8 transition-all duration-200 group-hover:scale-[1.015]"
                          style={{ backgroundColor: "#d9d2c2" }}
                        >
                          {/* Index number */}
                          <span
                            className="font-black text-[#2d4a3e] leading-none shrink-0 w-16"
                            style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize: "clamp(40px, 5vw, 60px)",
                              letterSpacing: "-0.02em",
                            }}
                          >
                            {String(idx + 1).padStart(2, "0")}
                          </span>

                          {/* Name & meta */}
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-[11px] tracking-[0.2em] uppercase font-semibold text-[#2d4a3e]"
                              style={{ fontFamily: "'Inter', sans-serif" }}
                            >
                              {b.name}
                            </p>
                            {b.theme && (
                              <p className="text-[11px] text-[#2d4a3e]/50 mt-1" style={{ fontFamily: "Georgia, serif" }}>
                                {b.theme}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* RIGHT — large poster card */}
              <div className="shrink-0 self-stretch" style={{ width: "clamp(300px, 38vw, 580px)" }}>
                <div
                  className="relative w-full rounded-3xl overflow-hidden"
                  style={{
                    aspectRatio: "1/1",
                    backgroundColor: "#d9d2c2",
                  }}
                >
                  {/* Arrow circle top-right */}
                  <div className="absolute top-5 right-5">
                    <span
                      className="inline-flex items-center justify-center rounded-full bg-[#2d4a3e] text-[#f0ebe0]"
                      style={{ width: 48, height: 48 }}
                    >
                      <ArrowUpRight size={20} />
                    </span>
                  </div>

                  {/* Bottom label */}
                  <div className="absolute bottom-6 left-7">
                    <p
                      className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e] opacity-70"
                    >
                      {BOOSTER_META[boosterType].label}
                    </p>
                    <p
                      className="text-[11px] mt-1 text-[#2d4a3e] opacity-50"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {boostersForType.length} booster{boostersForType.length !== 1 ? "s" : ""} available
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </SlideIn>
      )}
    </div>
  );
}