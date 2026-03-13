"use client";

import { Cpu, Gavel, Info, Sparkles, Trophy, Users, Zap } from "lucide-react";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

interface ProgramDraft {
  hackathon_name: string;
  overview: string;
  target_audience: string;
  goals: string[];
  challenge_statements: {
    title: string;
    summary: string;
    difficulty?: "beginner" | "intermediate" | "advanced";
  }[];
  schedule: { phase: string; description: string }[];
  judging_criteria: { name: string; description: string }[];
  documentation_plan: string[];
  organizer_notes: string[];
}

interface HackathonProgramPreviewProps {
  draft: ProgramDraft;
  additionalDetails?: React.ReactNode;
}

export function HackathonProgramPreview({
  draft,
  additionalDetails,
}: HackathonProgramPreviewProps) {
  return (
    <div className="max-w-6xl mx-auto px-10 pt-20 pb-48 animate-[fadeUp_0.4s_ease-out]">
      {/* Header section */}
      <header className="mb-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#0F2C23] flex items-center justify-center text-[#E2FEA5] shadow-[0_10px_20px_-5px_rgba(15,44,35,0.3)]">
            <Sparkles size={18} />
          </div>
          <p
            className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#0F2C23]/40"
            style={{ fontFamily: PX }}
          >
            AI Generated Intelligence
          </p>
        </div>
        <h1
          className="font-black text-[#0F2C23] uppercase mb-8"
          style={{
            fontFamily: PX,
            fontSize: "clamp(48px, 7vw, 100px)",
            lineHeight: 0.88,
            letterSpacing: "-0.04em",
          }}
        >
          {draft.hackathon_name}.
        </h1>
        <p
          className="text-2xl max-w-4xl leading-relaxed text-[#0F2C23]/75"
          style={{ fontFamily: FN, letterSpacing: "-0.01em" }}
        >
          {draft.overview}
        </p>
      </header>

      {/* Core Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        {/* Audience */}
        <div className="p-10 rounded-[48px] bg-[#0F2C23] text-[#F8FFE8] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <Users size={60} />
          </div>
          <p
            className="text-[10px] uppercase tracking-[0.2em] font-bold mb-12 opacity-40"
            style={{ fontFamily: PX }}
          >
            Target Builders
          </p>
          <p className="text-xl font-medium leading-snug" style={{ fontFamily: FN }}>
            {draft.target_audience}
          </p>
        </div>

        {/* Goals */}
        <div className="md:col-span-2 p-10 rounded-[48px] border-2 border-[#0F2C23]/10 bg-white shadow-[0_20px_40px_-15px_rgba(15,44,35,0.05)]">
          <p
            className="text-[10px] uppercase tracking-[0.2em] font-bold mb-10 text-[#0F2C23]/40"
            style={{ fontFamily: PX }}
          >
            Program North Stars
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
            {draft.goals.map((g, i) => (
              <div key={i} className="flex gap-4">
                <span
                  className="text-2xl text-[#0F2C23]/15 font-black shrink-0"
                  style={{ fontFamily: PX }}
                >
                  0{i + 1}
                </span>
                <p
                  className="text-[15px] leading-relaxed text-[#0F2C23]/80 pt-1"
                  style={{ fontFamily: FN }}
                >
                  {g}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deep Dive Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
        {/* Challenge Statements */}
        <div className="lg:col-span-3">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-full bg-[#0F2C23]/5 flex items-center justify-center text-[#0F2C23]">
              <Cpu size={16} />
            </div>
            <h3 className="text-2xl font-black uppercase text-[#0F2C23]" style={{ fontFamily: PX }}>
              Challenge Matrix
            </h3>
          </div>
          <div className="space-y-6">
            {draft.challenge_statements.map((c, i) => (
              <div
                key={i}
                className="p-8 rounded-[32px] bg-white border border-[#0F2C23]/10 transition-all hover:border-[#0F2C23]/25 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h4
                    className="font-black text-[#0F2C23] uppercase text-lg leading-tight"
                    style={{ fontFamily: PX }}
                  >
                    {c.title}
                  </h4>
                  <span
                    className="text-[9px] px-3 py-1.5 rounded-full bg-[#E2FEA5] text-[#0F2C23] font-bold uppercase tracking-widest shadow-sm"
                    style={{ fontFamily: PX }}
                  >
                    {c.difficulty || "Intermediate"}
                  </span>
                </div>
                <p
                  className="text-[15px] text-[#0F2C23]/60 leading-relaxed mb-4"
                  style={{ fontFamily: FN }}
                >
                  {c.summary}
                </p>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-px flex-1 bg-[#0F2C23]/5" />
                  <span
                    className="text-[9px] uppercase font-bold text-[#0F2C23]/25 tracking-widest"
                    style={{ fontFamily: PX }}
                  >
                    Agent Priority High
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar: Timeline & Criteria */}
        <div className="lg:col-span-2 space-y-16">
          {/* Timeline */}
          <div className="p-2 border-l border-[#0F2C23]/10 ml-4">
            <div className="flex items-center gap-3 mb-10 -ml-4">
              <div className="w-8 h-8 rounded-full bg-[#0F2C23]/5 flex items-center justify-center text-[#0F2C23]">
                <Zap size={16} />
              </div>
              <h3
                className="text-2xl font-black uppercase text-[#0F2C23]"
                style={{ fontFamily: PX }}
              >
                Sequence
              </h3>
            </div>
            <div className="space-y-8">
              {draft.schedule.map((s, i) => (
                <div key={i} className="relative pl-8">
                  <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-[#0F2C23]" />
                  <p
                    className="text-[10px] uppercase font-black tracking-widest text-[#0F2C23]/30 mb-1"
                    style={{ fontFamily: PX }}
                  >
                    {s.phase}
                  </p>
                  <h4 className="font-bold text-[#0F2C23] text-lg mb-1" style={{ fontFamily: FN }}>
                    {s.phase}
                  </h4>
                  <p
                    className="text-sm text-[#0F2C23]/50 leading-relaxed"
                    style={{ fontFamily: FN }}
                  >
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Judging Criteria */}
          <div className="p-10 rounded-[48px] bg-[#E2FEA5] text-[#0F2C23] shadow-[0_30px_60px_-15px_rgba(226,254,165,0.4)] relative overflow-hidden">
            <div className="absolute -top-4 -right-4 opacity-5 rotate-12">
              <Trophy size={120} />
            </div>
            <div className="flex items-center gap-3 mb-8">
              <Gavel size={20} />
              <h3 className="text-xl font-black uppercase" style={{ fontFamily: PX }}>
                Judging Rubric
              </h3>
            </div>
            <div className="space-y-6">
              {draft.judging_criteria.map((jc, i) => (
                <div key={i} className="border-b border-[#0F2C23]/10 pb-5 last:border-0 last:pb-0">
                  <p
                    className="text-[11px] font-black uppercase mb-2 tracking-tight"
                    style={{ fontFamily: PX }}
                  >
                    {jc.name}
                  </p>
                  <p className="text-[13px] opacity-70 leading-relaxed" style={{ fontFamily: FN }}>
                    {jc.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Documentation & Notes */}
      <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-[#0F2C23]/10 pt-16">
        <div>
          <h4
            className="text-xs font-black uppercase tracking-[0.2em] text-[#0F2C23]/40 mb-6"
            style={{ fontFamily: PX }}
          >
            Organizer Backstage Notes
          </h4>
          <div className="space-y-4">
            {draft.organizer_notes.map((note, i) => (
              <div
                key={i}
                className="flex gap-3 text-sm text-[#0F2C23]/60 italic"
                style={{ fontFamily: FN }}
              >
                <Info size={14} className="shrink-0 mt-0.5" />
                <p>{note}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="p-8 rounded-[32px] bg-[#0F2C23]/5 border border-[#0F2C23]/5">
          <h4
            className="text-xs font-black uppercase tracking-[0.2em] text-[#0F2C23]/40 mb-6"
            style={{ fontFamily: PX }}
          >
            Required Documentation
          </h4>
          <div className="flex flex-wrap gap-2">
            {draft.documentation_plan.map((doc, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#0F2C23]/10 text-[11px] font-bold text-[#0F2C23]/70"
                style={{ fontFamily: FN }}
              >
                {doc}
              </span>
            ))}
          </div>
        </div>
      </div>

      {additionalDetails && (
        <div className="mt-24 border-t border-[#0F2C23]/10 pt-16">{additionalDetails}</div>
      )}

      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
