"use client";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Loader2,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { StoredHackathon } from "@/lib/data-mappers";
import { useSaveHackathon } from "@/lib/queries";

/* ─── Types ──────────────────────────────────────────────────────── */
interface ProgramDraft {
  hackathon_name: string;
  hackathon_id_suggestion: string;
  overview: string;
  target_audience: string;
  goals: string[];
  challenge_statements: {
    title: string;
    summary: string;
    difficulty?: string;
  }[];
  schedule: { phase: string; description: string }[];
  submission_requirements: string[];
  judging_criteria: { name: string; description: string }[];
  organizer_notes: string[];
}
interface ProgramDraftResponse {
  hackathon_id: string;
  draft: ProgramDraft;
  generated_at: string;
}
interface ResourceTrackPlan {
  name: string;
  description: string;
  docs_to_prepare: string[];
}
interface ResourcePlan {
  technical_cheatsheet: string;
  tracks: ResourceTrackPlan[];
  challenge_resource_map: { challenge_title: string; key_docs: string[] }[];
}
interface ResourcePlanResponse {
  hackathon_id: string;
  resources: ResourcePlan;
  generated_at: string;
}

type FormData = {
  id: string;
  name: string;
  theme: string;
  program_goal: string;
  problem_statements: string;
  bounty_pool_summary: string;
  start_date: string;
  submission_deadline: string;
  judging_deadline: string;
  results_date: string;
  website_url: string;
  technical_resources: { url: string; description: string }[];
  organizer_notes: string;
};

const EMPTY_FORM: FormData = {
  id: "",
  name: "",
  theme: "",
  program_goal: "",
  problem_statements: "",
  bounty_pool_summary: "",
  start_date: "",
  submission_deadline: "",
  judging_deadline: "",
  results_date: "",
  website_url: "",
  technical_resources: [],
  organizer_notes: "",
};

function StepLabel({ n }: { n: string; label: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-6">
      <span
        className="font-black text-[#2d4a3e]/18"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 32,
          letterSpacing: "-0.025em",
        }}
      >
        {n}
      </span>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#2d4a3e]/40 mb-2"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {children}
    </p>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs text-[#2d4a3e]/45 mt-1.5 leading-relaxed"
      style={{ fontFamily: "Georgia, serif" }}
    >
      {children}
    </p>
  );
}

const inputBase: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#d6cfc0",
  border: "none",
  borderRadius: 16,
  padding: "14px 18px",
  fontFamily: "Georgia, serif",
  fontSize: 15,
  color: "#2d4a3e",
  outline: "none",
};

const textareaBase: React.CSSProperties = {
  ...inputBase,
  resize: "none",
  lineHeight: 1.7,
};

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={inputBase}
      className="placeholder-[#2d4a3e]/30 transition-colors"
      onFocus={(e) => (e.currentTarget.style.backgroundColor = "#cdc7b7")}
      onBlur={(e) => (e.currentTarget.style.backgroundColor = "#d6cfc0")}
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={textareaBase}
      className="placeholder-[#2d4a3e]/30 transition-colors"
      onFocus={(e) => (e.currentTarget.style.backgroundColor = "#cdc7b7")}
      onBlur={(e) => (e.currentTarget.style.backgroundColor = "#d6cfc0")}
    />
  );
}

function NextButton({
  onClick,
  label = "Next",
  disabled = false,
}: {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-0 rounded-full overflow-hidden border-none cursor-pointer transition-all duration-200 hover:shadow-md disabled:opacity-35 disabled:cursor-not-allowed"
      style={{ backgroundColor: "#2d4a3e" }}
    >
      <span
        className="pl-6 pr-3 py-4 text-[10px] tracking-[0.18em] uppercase font-bold text-[#f0ebe0]"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {label}
      </span>
      <span
        className="w-10 h-10 flex items-center justify-center rounded-full m-1.5"
        style={{ backgroundColor: "#d6cfc0" }}
      >
        <ArrowRight size={14} className="text-[#2d4a3e]" />
      </span>
    </button>
  );
}

/* ─── Progress dots ──────────────────────────────────────────────── */
const FORM_STEPS = [
  "theme",
  "goal",
  "statements",
  "bounty",
  "dates",
  "website",
  "resources",
  "notes",
] as const;
type FormStep = (typeof FORM_STEPS)[number];

function ProgressDots({ current }: { current: FormStep }) {
  const idx = FORM_STEPS.indexOf(current);
  return (
    <div className="flex items-center gap-1.5">
      {FORM_STEPS.map((s, i) => (
        <span
          key={s}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === idx ? 20 : 6,
            height: 6,
            backgroundColor: i <= idx ? "#2d4a3e" : "rgba(45,74,62,0.18)",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
type View = "list" | "form" | "generating" | "review";

export function HackathonForm({
  hackathons,
  userId,
}: {
  hackathons: StoredHackathon[];
  userId?: string;
}) {
  const saveHackathonMutation = useSaveHackathon();

  const [view, setView] = useState<View>("list");
  const [formStep, setFormStep] = useState<FormStep>("theme");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM });
  const [programDraft, setProgramDraft] = useState<ProgramDraftResponse | null>(null);
  const [resourcePlan, setResourcePlan] = useState<ResourcePlanResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  /* ─── Helpers ─── */
  const startNew = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setProgramDraft(null);
    setResourcePlan(null);
    setAiError(null);
    setFormStep("theme");
    setView("form");
  };

  const startEdit = (h: StoredHackathon) => {
    setForm({
      id: h.id,
      name: h.name,
      theme: h.theme ?? "",
      program_goal: h.program_goal ?? "",
      problem_statements: h.problem_statements.join("\n"),
      bounty_pool_summary: h.bounty_pool_summary ?? "",
      start_date: h.start_date ?? "",
      submission_deadline: h.submission_deadline ?? "",
      judging_deadline: h.judging_deadline ?? "",
      results_date: h.results_date ?? "",
      website_url: h.website_url ?? "",
      technical_resources: h.technical_resources ?? [],
      organizer_notes: h.organizer_notes ?? "",
    });
    setEditingId(h.id);
    setProgramDraft(null);
    setResourcePlan(null);
    setAiError(null);
    setFormStep("theme");
    setView("form");
  };

  const buildPayload = () => {
    const id = editingId || crypto.randomUUID();
    const problem_statements = form.problem_statements
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const technical_resources = form.technical_resources.map((r) => ({
      url: r.url ?? "",
      description: r.description ?? "",
    }));
    const technical_docs =
      technical_resources.length > 0
        ? technical_resources
            .map((r) => (r.description ? `${r.url} — ${r.description}` : r.url))
            .join("\n")
        : undefined;
    return {
      id,
      name: form.name || "Unnamed hackathon",
      problem_statements,
      theme: form.theme || undefined,
      website_url: form.website_url || undefined,
      technical_resources,
      technical_docs,
      bounty_pool_summary: form.bounty_pool_summary || undefined,
      program_goal: form.program_goal || undefined,
      start_date: form.start_date || undefined,
      submission_deadline: form.submission_deadline || undefined,
      judging_deadline: form.judging_deadline || undefined,
      results_date: form.results_date || undefined,
      organizer_notes: form.organizer_notes || undefined,
    };
  };

  const runAgents = async () => {
    setView("generating");
    setAiError(null);
    setProgramDraft(null);
    setResourcePlan(null);
    try {
      const payload = buildPayload();
      const [pr, rr] = await Promise.all([
        fetch("/api/host-agents/hackathon-generator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hackathon: payload }),
        }),
        fetch("/api/host-agents/resource-provisioner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hackathon: payload }),
        }),
      ]);
      const pj = await pr.json();
      const rj = await rr.json();
      if (!pr.ok) throw new Error(pj.error || "Program generation failed");
      if (!rr.ok) throw new Error(rj.error || "Resource generation failed");
      setProgramDraft(pj as ProgramDraftResponse);
      setResourcePlan(rj as ResourcePlanResponse);
      if (pj.draft?.hackathon_name) set("name", pj.draft.hackathon_name);
      setView("review");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to run hackathon agents");
      setView("form");
      setFormStep("notes");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = buildPayload();
    const hackathon: StoredHackathon & { host_id?: string } = {
      ...payload,
      host_id: userId,
      created_at:
        hackathons.find((h) => h.id === payload.id)?.created_at ?? new Date().toISOString(),
    };
    await saveHackathonMutation.mutateAsync(hackathon);
    setSaving(false);
    setView("list");
  };

  /* ─── Render ─── */
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-50 px-10 py-5 flex items-center justify-between"
        style={{
          backgroundColor: "#f0ebe0",
          borderBottom: "1px solid rgba(45,74,62,0.1)",
        }}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/host"
            className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold text-[#2d4a3e]/50 hover:text-[#2d4a3e] transition-colors no-underline"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <ArrowLeft size={12} /> Host
          </Link>
          {view !== "list" && (
            <>
              <span className="text-[#2d4a3e]/20 text-sm">/</span>
              <button
                type="button"
                onClick={() => setView("list")}
                className="text-[10px] tracking-widest uppercase font-bold text-[#2d4a3e]/50 hover:text-[#2d4a3e] transition-colors border-none bg-transparent cursor-pointer"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Hackathons
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {view === "form" && <ProgressDots current={formStep} />}
          {view === "list" && (
            <button
              type="button"
              onClick={startNew}
              className="inline-flex items-center gap-1.5 rounded-full border-none cursor-pointer text-[9px] tracking-widest uppercase font-bold px-5 py-2.5 transition-all hover:opacity-90"
              style={{
                fontFamily: "'Inter', sans-serif",
                backgroundColor: "#2d4a3e",
                color: "#f0ebe0",
              }}
            >
              <Plus size={11} /> New Hackathon
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* VIEW: LIST                                                     */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {view === "list" && (
        <div className="px-10 pt-10 pb-24">
          {/* Hero */}
          <div className="mb-14">
            <h1
              className="font-black text-[#2d4a3e] leading-[0.88] uppercase"
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: "clamp(52px, 9vw, 138px)",
                letterSpacing: "-0.025em",
              }}
            >
              HACKATHONS.
            </h1>
            <div className="flex justify-end mt-8">
              <p
                className="text-[#2d4a3e]/55 max-w-[380px] text-right leading-relaxed"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "clamp(14px, 1.5vw, 18px)",
                }}
              >
                Create hackathons. Fill a brief and let the AI draft the full program.
              </p>
            </div>
          </div>

          {/* Table header */}
          <div
            className="grid border-b border-t border-[#2d4a3e]/20 py-3 mb-0"
            style={{
              gridTemplateColumns: "64px 1fr 140px auto",
              gap: "0 20px",
            }}
          >
            {["No.", "Hackathon", "Statements", ""].map((col) => (
              <p
                key={col}
                className="text-[11px] tracking-[0.12em] uppercase font-semibold text-[#2d4a3e]/40"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {col}
              </p>
            ))}
          </div>

          {/* Empty state */}
          {hackathons.length === 0 && (
            <div className="py-24 text-center border-b border-[#2d4a3e]/12">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
                style={{
                  backgroundColor: "rgba(45,74,62,0.08)",
                  color: "#2d4a3e",
                }}
              >
                <Plus size={24} />
              </div>
              <p
                className="font-black text-[#2d4a3e] uppercase mb-3"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "clamp(18px, 2.5vw, 28px)",
                  letterSpacing: "-0.02em",
                }}
              >
                No hackathons yet.
              </p>
              <p
                className="text-[#2d4a3e]/50 mb-8 text-sm"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Create your first hackathon to start running challenges.
              </p>
              <button
                type="button"
                onClick={startNew}
                className="inline-flex items-center gap-0 rounded-full overflow-hidden border-none cursor-pointer hover:shadow-md"
                style={{ backgroundColor: "#2d4a3e" }}
              >
                <span
                  className="pl-6 pr-3 py-3.5 text-[10px] tracking-widest uppercase font-bold text-[#f0ebe0] flex items-center gap-2"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <Plus size={11} /> Create Hackathon
                </span>
                <span
                  className="w-9 h-9 flex items-center justify-center rounded-full m-1"
                  style={{ backgroundColor: "#d6cfc0" }}
                >
                  <ArrowUpRight size={13} className="text-[#2d4a3e]" />
                </span>
              </button>
            </div>
          )}

          {/* Rows */}
          {hackathons.map((h, idx) => (
            <div
              key={h.id}
              className="grid items-center py-7 border-b border-[#2d4a3e]/10 hover:bg-[#2d4a3e]/[0.02] rounded-sm transition-all"
              style={{
                gridTemplateColumns: "64px 1fr 140px auto",
                gap: "0 20px",
              }}
            >
              <p
                className="font-bold text-[#2d4a3e]"
                style={{ fontFamily: "'Inter', sans-serif", fontSize: 14 }}
              >
                {String(idx + 1).padStart(2, "0")}.
              </p>
              <div>
                <p
                  className="font-semibold text-[#2d4a3e]"
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: 15 }}
                >
                  {h.name}
                </p>
                {h.theme && (
                  <p
                    className="text-[#2d4a3e]/50 text-sm mt-0.5"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {h.theme}
                  </p>
                )}
              </div>
              <p className="text-[#2d4a3e]/50 text-sm" style={{ fontFamily: "Georgia, serif" }}>
                {h.problem_statements.length} statement
                {h.problem_statements.length !== 1 ? "s" : ""}
              </p>
              <button
                type="button"
                onClick={() => startEdit(h)}
                className="inline-flex items-center gap-1.5 rounded-full border-none cursor-pointer text-[9px] tracking-widest uppercase font-bold px-4 py-2.5 transition-all hover:opacity-75"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  backgroundColor: "rgba(45,74,62,0.08)",
                  color: "#2d4a3e",
                }}
              >
                <Pencil size={10} /> Edit
              </button>
            </div>
          ))}

          {/* Footer */}
          {hackathons.length > 0 && (
            <div className="flex items-center justify-between mt-8 pt-5 border-t border-[#2d4a3e]/08">
              <p className="text-[11px] text-[#2d4a3e]/40" style={{ fontFamily: "Georgia, serif" }}>
                {hackathons.length} hackathon
                {hackathons.length !== 1 ? "s" : ""}
              </p>
              <button
                type="button"
                onClick={startNew}
                className="inline-flex items-center gap-1.5 text-[9px] tracking-widest uppercase font-bold text-[#2d4a3e]/40 hover:text-[#2d4a3e] transition-colors border-none bg-transparent cursor-pointer"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <Plus size={10} /> New Hackathon
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* VIEW: FORM (one question per step)                             */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {view === "form" && (
        <div className="px-10 pt-10 pb-24 max-w-[860px]">
          {/* Form hero — step-based */}
          <div className="mb-14">
            <h2
              className="font-black text-[#2d4a3e] leading-[0.88] uppercase"
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: "clamp(40px, 7vw, 96px)",
                letterSpacing: "-0.025em",
              }}
            >
              {formStep === "theme" && "Theme"}
              {formStep === "goal" && "Program Goal"}
              {formStep === "statements" && "Problem Statements"}
              {formStep === "bounty" && "Bounty & Rewards"}
              {formStep === "dates" && "Key Dates"}
              {formStep === "website" && "Website"}
              {formStep === "resources" && "Technical Resources"}
              {formStep === "notes" && "Organizer Notes"}
            </h2>
          </div>

          {/* Error banner */}
          {aiError && (
            <div
              className="mb-8 flex items-start gap-3 rounded-2xl px-5 py-4"
              style={{
                backgroundColor: "rgba(200,60,60,0.07)",
                border: "1px solid rgba(200,60,60,0.15)",
              }}
            >
              <X size={13} className="shrink-0 mt-0.5" style={{ color: "#cc2222" }} />
              <p className="text-sm text-red-700" style={{ fontFamily: "Georgia, serif" }}>
                {aiError}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-16">
            {/* ─── STEP: Theme ─── */}
            {formStep === "theme" && (
              <div id="step-theme">
                <StepLabel n="01" label="Theme" />
                <p
                  className="text-[#2d4a3e]/55 text-sm mb-5 leading-relaxed"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Give your hackathon a one-line theme. This frames the challenge for builders.
                </p>
                <FieldLabel>Theme (optional)</FieldLabel>
                <Input
                  value={form.theme}
                  onChange={(v) => set("theme", v)}
                  placeholder="e.g. AI for good, Web3 infra, Sustainable tech..."
                />
                <div className="mt-5">
                  <NextButton onClick={() => setFormStep("goal")} />
                </div>
              </div>
            )}

            {/* ─── STEP: Goal ─── */}
            {formStep === "goal" && (
              <div id="step-goal">
                <StepLabel n="02" label="Program Goal" />
                <p
                  className="text-[#2d4a3e]/55 text-sm mb-5 leading-relaxed"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  In one or two sentences — what do you want this hackathon to achieve for builders
                  and sponsors?
                </p>
                <FieldLabel>Program Goal</FieldLabel>
                <Textarea
                  value={form.program_goal}
                  onChange={(v) => set("program_goal", v)}
                  placeholder="Help builders ship AI copilots that integrate with enterprise workflows..."
                  rows={3}
                />
                <div className="mt-5">
                  <NextButton onClick={() => setFormStep("statements")} />
                </div>
              </div>
            )}

            {/* ─── STEP: Problem statements ─── */}
            {formStep === "statements" && (
              <div id="step-statements">
                <StepLabel n="03" label="Problem Statements" />
                <p
                  className="text-[#2d4a3e]/55 text-sm mb-5 leading-relaxed"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  List the problems builders should solve. One per line. The AI will expand these
                  into full challenge statements.
                </p>
                <FieldLabel>Problem Statements (one per line)</FieldLabel>
                <Textarea
                  value={form.problem_statements}
                  onChange={(v) => set("problem_statements", v)}
                  placeholder={
                    "Build a tool that...\nSolve the problem of...\nCreate a system that..."
                  }
                  rows={5}
                />
                <FieldHint>
                  Leave blank to let the AI generate these from your theme and goal.
                </FieldHint>
                <div className="mt-5">
                  <NextButton onClick={() => setFormStep("bounty")} />
                </div>
              </div>
            )}

            {/* ─── STEP: Bounty ─── */}
            {formStep === "bounty" && (
              <div id="step-bounty">
                <StepLabel n="04" label="Bounty & Rewards" />
                <p
                  className="text-[#2d4a3e]/55 text-sm mb-5 leading-relaxed"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Summarize prizes, grants, or other incentives for builders.
                </p>
                <FieldLabel>Bounty Pool Summary (optional)</FieldLabel>
                <Textarea
                  value={form.bounty_pool_summary}
                  onChange={(v) => set("bounty_pool_summary", v)}
                  placeholder="$10k total pool, $5k grand prize, swag for top 20..."
                  rows={2}
                />
                <div className="mt-5">
                  <NextButton onClick={() => setFormStep("dates")} />
                </div>
              </div>
            )}

            {/* ─── STEP: Key Dates ─── */}
            {formStep === "dates" && (
              <div id="step-dates">
                <StepLabel n="05" label="Key Dates" />
                <p
                  className="text-[#2d4a3e]/55 text-sm mb-5 leading-relaxed"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Set the key dates for your hackathon timeline.
                </p>
                <div className="flex flex-col gap-4">
                  <div>
                    <FieldLabel>Start Date</FieldLabel>
                    <Input
                      value={form.start_date}
                      onChange={(v) => set("start_date", v)}
                      placeholder="e.g. 2026-05-01"
                      type="date"
                    />
                  </div>
                  <div>
                    <FieldLabel>Submission Deadline</FieldLabel>
                    <Input
                      value={form.submission_deadline}
                      onChange={(v) => set("submission_deadline", v)}
                      placeholder="e.g. 2026-06-15"
                      type="date"
                    />
                  </div>
                  <div>
                    <FieldLabel>Judging Deadline</FieldLabel>
                    <Input
                      value={form.judging_deadline}
                      onChange={(v) => set("judging_deadline", v)}
                      placeholder="e.g. 2026-06-20"
                      type="date"
                    />
                  </div>
                  <div>
                    <FieldLabel>Results Date</FieldLabel>
                    <Input
                      value={form.results_date}
                      onChange={(v) => set("results_date", v)}
                      placeholder="e.g. 2026-06-25"
                      type="date"
                    />
                  </div>
                </div>
                <div className="mt-5">
                  <NextButton onClick={() => setFormStep("website")} />
                </div>
              </div>
            )}

            {/* ─── STEP: Website ─── */}
            {formStep === "website" && (
              <div id="step-website">
                <StepLabel n="06" label="Website" />
                <p
                  className="text-[#2d4a3e]/55 text-sm mb-5 leading-relaxed"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Your program or sponsor website. Builders will see this on your hackathon page.
                </p>
                <FieldLabel>Website URL (optional)</FieldLabel>
                <Input
                  value={form.website_url}
                  onChange={(v) => set("website_url", v)}
                  placeholder="https://your-site.com"
                  type="url"
                />
                <div className="mt-5">
                  <NextButton onClick={() => setFormStep("resources")} />
                </div>
              </div>
            )}

            {/* ─── STEP: Technical resources ─── */}
            {formStep === "resources" && (
              <div id="step-resources">
                <StepLabel n="07" label="Technical Resources" />
                <p
                  className="text-[#2d4a3e]/55 text-sm mb-5 leading-relaxed"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Notion docs, API references, SDK guides — anything technical builders will need.
                </p>
                <div className="flex flex-col gap-3">
                  {form.technical_resources.map((res, i) => (
                    <div
                      key={i}
                      className="grid gap-2"
                      style={{ gridTemplateColumns: "1fr 1.4fr 32px" }}
                    >
                      <Input
                        value={res.url}
                        onChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            technical_resources: f.technical_resources.map((r, j) =>
                              j === i ? { ...r, url: v } : r,
                            ),
                          }))
                        }
                        placeholder="https://docs.example.com"
                        type="url"
                      />
                      <Input
                        value={res.description}
                        onChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            technical_resources: f.technical_resources.map((r, j) =>
                              j === i ? { ...r, description: v } : r,
                            ),
                          }))
                        }
                        placeholder="Short description"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            technical_resources: f.technical_resources.filter((_, j) => j !== i),
                          }))
                        }
                        className="w-8 h-8 rounded-xl flex items-center justify-center self-center border-none cursor-pointer transition-all hover:opacity-70"
                        style={{
                          backgroundColor: "rgba(45,74,62,0.1)",
                          color: "#2d4a3e",
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        technical_resources: [
                          ...f.technical_resources,
                          { url: "", description: "" },
                        ],
                      }))
                    }
                    className="inline-flex items-center gap-2 text-[9px] tracking-widest uppercase font-bold border-none bg-transparent cursor-pointer hover:opacity-70 transition-opacity w-fit"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      color: "#2d4a3e",
                    }}
                  >
                    <Plus size={10} /> Add resource
                  </button>
                </div>
                <div className="mt-5">
                  <NextButton onClick={() => setFormStep("notes")} />
                </div>
              </div>
            )}

            {/* ─── STEP: Organizer notes ─── */}
            {formStep === "notes" && (
              <div id="step-notes">
                <StepLabel n="08" label="Organizer Notes" />
                <p
                  className="text-[#2d4a3e]/55 text-sm mb-5 leading-relaxed"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Freeform scratchpad for the AI: constraints, success criteria, partners, rough
                  ideas. Anything you'd tell a human co-host.
                </p>
                <FieldLabel>Organizer Notes (optional)</FieldLabel>
                <Textarea
                  value={form.organizer_notes}
                  onChange={(v) => set("organizer_notes", v)}
                  placeholder="Anything you'd tell a human co-host about this program..."
                  rows={5}
                />

                <div
                  className="mt-8 flex items-center justify-between p-6 rounded-3xl"
                  style={{ backgroundColor: "#2d4a3e" }}
                >
                  <div>
                    <p
                      className="font-black text-[#f0ebe0] uppercase"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 15,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Ready to generate
                    </p>
                    <p
                      className="text-[#f0ebe0]/50 text-sm mt-1"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      AI will draft the full program and technical resources from your brief.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={runAgents}
                    className="inline-flex items-center gap-0 rounded-full overflow-hidden border-none cursor-pointer transition-all hover:shadow-lg"
                    style={{ backgroundColor: "#d6cfc0" }}
                  >
                    <span
                      className="pl-6 pr-3 py-4 text-[10px] tracking-[0.18em] uppercase font-bold text-[#2d4a3e] flex items-center gap-2"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      <Sparkles size={12} /> Generate Draft
                    </span>
                    <span
                      className="w-10 h-10 flex items-center justify-center rounded-full m-1.5"
                      style={{ backgroundColor: "#2d4a3e" }}
                    >
                      <ArrowRight size={14} className="text-[#f0ebe0]" />
                    </span>
                  </button>
                </div>

                {/* Skip AI — save directly */}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="mt-4 inline-flex items-center gap-2 text-[9px] tracking-widest uppercase font-bold text-[#2d4a3e]/40 hover:text-[#2d4a3e] transition-colors border-none bg-transparent cursor-pointer"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {saving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                  Skip AI and save directly
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* VIEW: GENERATING                                               */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {view === "generating" && (
        <div
          className="px-10 pt-10 pb-24 flex flex-col items-center justify-center"
          style={{ minHeight: "60vh" }}
        >
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8"
            style={{ backgroundColor: "#2d4a3e" }}
          >
            <Sparkles size={32} style={{ color: "#d6cfc0" }} className="animate-pulse" />
          </div>
          <h2
            className="font-black text-[#2d4a3e] uppercase text-center mb-4"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(28px, 5vw, 56px)",
              letterSpacing: "-0.025em",
              lineHeight: 0.9,
            }}
          >
            DRAFTING
            <br />
            PROGRAM...
          </h2>
          <p
            className="text-[#2d4a3e]/50 text-center max-w-sm leading-relaxed"
            style={{ fontFamily: "Georgia, serif", fontSize: 15 }}
          >
            Generating program outline, challenge statements, and technical resources from your
            brief.
          </p>
          <div className="flex items-center gap-2 mt-8">
            {["Program outline", "Challenge statements", "Technical resources"].map((label, i) => (
              <span
                key={label}
                className="text-[8px] tracking-[0.12em] uppercase font-bold px-3 py-1.5 rounded-full"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  backgroundColor: "rgba(45,74,62,0.08)",
                  color: "rgba(45,74,62,0.5)",
                  animationDelay: `${i * 0.4}s`,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* VIEW: REVIEW                                                   */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {view === "review" && (
        <div className="px-10 pt-10 pb-24">
          {/* Hero */}
          <div className="mb-12">
            <h2
              className="font-black text-[#2d4a3e] leading-[0.88] uppercase"
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: "clamp(40px, 7vw, 96px)",
                letterSpacing: "-0.025em",
              }}
            >
              REVIEW
              <br />
              DRAFT.
            </h2>
            <div className="flex justify-end mt-5">
              <p
                className="text-[#2d4a3e]/55 max-w-[320px] text-right leading-relaxed"
                style={{ fontFamily: "Georgia, serif", fontSize: 15 }}
              >
                The AI has drafted your hackathon. Review and save — you can edit everything after.
              </p>
            </div>
          </div>

          <div className="grid gap-8 items-start" style={{ gridTemplateColumns: "1fr 320px" }}>
            {/* Left — main content */}
            <div className="flex flex-col gap-5">
              {/* Hackathon identity */}
              <div className="rounded-3xl p-7" style={{ backgroundColor: "#2d4a3e" }}>
                <p
                  className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#f0ebe0]/38 mb-4"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Generated Name & ID
                </p>
                <p
                  className="font-black text-[#f0ebe0] uppercase leading-tight"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "clamp(20px, 3vw, 32px)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {form.name || programDraft?.draft.hackathon_name || "Unnamed"}
                </p>
                {form.id && <p className="text-[#f0ebe0]/40 text-xs mt-2 font-mono">{form.id}</p>}
              </div>

              {/* Program overview */}
              {programDraft?.draft.overview && (
                <div className="rounded-3xl p-7" style={{ backgroundColor: "#f5f2ea" }}>
                  <p
                    className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40 mb-3"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Program Overview
                  </p>
                  <p
                    className="text-[#2d4a3e]/70 leading-relaxed"
                    style={{ fontFamily: "Georgia, serif", fontSize: 15 }}
                  >
                    {programDraft.draft.overview}
                  </p>
                </div>
              )}

              {/* Goals */}
              {(programDraft?.draft.goals?.length ?? 0) > 0 && (
                <div className="rounded-3xl p-7" style={{ backgroundColor: "#f5f2ea" }}>
                  <p
                    className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40 mb-1"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Goals
                  </p>
                  <h3
                    className="font-black text-[#2d4a3e] uppercase mb-5"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "clamp(16px, 2vw, 22px)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {programDraft!.draft.goals.length} Objectives.
                  </h3>
                  <div className="border-t border-[#2d4a3e]/12">
                    {programDraft!.draft.goals.map((g, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-4 py-4 border-b border-[#2d4a3e]/08"
                      >
                        <span
                          className="font-black text-[#2d4a3e]/18 shrink-0"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 12,
                            width: 24,
                          }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p
                          className="text-[#2d4a3e]/70 text-sm leading-relaxed"
                          style={{ fontFamily: "Georgia, serif" }}
                        >
                          {g}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Challenges */}
              {(programDraft?.draft.challenge_statements?.length ?? 0) > 0 && (
                <div className="rounded-3xl p-7" style={{ backgroundColor: "#f5f2ea" }}>
                  <p
                    className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40 mb-1"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Challenge Statements
                  </p>
                  <h3
                    className="font-black text-[#2d4a3e] uppercase mb-5"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "clamp(16px, 2vw, 22px)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {programDraft!.draft.challenge_statements.length} Challenges.
                  </h3>
                  <div className="border-t border-[#2d4a3e]/12">
                    {programDraft!.draft.challenge_statements.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-4 py-5 border-b border-[#2d4a3e]/08"
                      >
                        <span
                          className="font-black text-[#2d4a3e]/18 shrink-0 pt-0.5"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 12,
                            width: 24,
                          }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <p
                            className="font-semibold text-[#2d4a3e] text-sm mb-1"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            {c.title}
                          </p>
                          <p
                            className="text-[#2d4a3e]/60 text-sm leading-relaxed"
                            style={{ fontFamily: "Georgia, serif" }}
                          >
                            {c.summary}
                          </p>
                          {c.difficulty && (
                            <span
                              className="inline-block mt-2 text-[8px] tracking-[0.12em] uppercase font-bold px-2.5 py-1 rounded-sm"
                              style={{
                                backgroundColor: "rgba(45,74,62,0.08)",
                                color: "#2d4a3e",
                                fontFamily: "'Inter', sans-serif",
                              }}
                            >
                              {c.difficulty}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resource cheatsheet */}
              {resourcePlan?.resources.technical_cheatsheet && (
                <div className="rounded-3xl p-7" style={{ backgroundColor: "#2d4a3e" }}>
                  <p
                    className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#f0ebe0]/38 mb-3"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Technical Cheatsheet
                  </p>
                  <div
                    className="rounded-2xl p-5 overflow-auto max-h-64"
                    style={{
                      backgroundColor: "rgba(240,235,224,0.06)",
                      border: "1px solid rgba(240,235,224,0.07)",
                    }}
                  >
                    <pre className="text-[12px] text-[#f0ebe0]/65 whitespace-pre-wrap font-mono leading-relaxed">
                      {resourcePlan.resources.technical_cheatsheet}
                    </pre>
                  </div>
                </div>
              )}

              {/* Tracks */}
              {(resourcePlan?.resources.tracks?.length ?? 0) > 0 && (
                <div className="rounded-3xl p-7" style={{ backgroundColor: "#f5f2ea" }}>
                  <p
                    className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40 mb-1"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Resource Tracks
                  </p>
                  <h3
                    className="font-black text-[#2d4a3e] uppercase mb-5"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "clamp(16px, 2vw, 22px)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {resourcePlan!.resources.tracks.length} Tracks.
                  </h3>
                  <div className="border-t border-[#2d4a3e]/12">
                    {resourcePlan!.resources.tracks.map((t, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-4 py-5 border-b border-[#2d4a3e]/08"
                      >
                        <span
                          className="font-black text-[#2d4a3e]/18 shrink-0 pt-0.5"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 12,
                            width: 24,
                          }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <p
                            className="font-semibold text-[#2d4a3e] text-sm mb-1"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            {t.name}
                          </p>
                          <p
                            className="text-[#2d4a3e]/60 text-sm leading-relaxed"
                            style={{ fontFamily: "Georgia, serif" }}
                          >
                            {t.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <aside className="sticky top-[81px] flex flex-col gap-4">
              {/* Save CTA */}
              <div className="rounded-3xl p-7" style={{ backgroundColor: "#2d4a3e" }}>
                <p
                  className="font-black text-[#f0ebe0] uppercase mb-2"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 16,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Looks good?
                </p>
                <p
                  className="text-[#f0ebe0]/50 text-sm mb-6 leading-relaxed"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Save this hackathon. You can edit all details from the list at any time.
                </p>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full border-none cursor-pointer transition-all hover:opacity-90 disabled:opacity-40"
                  style={{
                    backgroundColor: "#d6cfc0",
                    color: "#2d4a3e",
                    padding: "14px 24px",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  {saving ? "Saving..." : "Save Hackathon"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormStep("notes");
                    setView("form");
                  }}
                  className="w-full mt-3 inline-flex items-center justify-center gap-2 rounded-full border-none cursor-pointer transition-all hover:opacity-70"
                  style={{
                    backgroundColor: "transparent",
                    color: "rgba(240,235,224,0.4)",
                    padding: "10px 24px",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  <Pencil size={10} /> Edit Brief
                </button>
              </div>

              {/* Summary */}
              <div className="rounded-2xl px-6 py-5" style={{ backgroundColor: "#d6cfc0" }}>
                <p
                  className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40 mb-4"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Summary
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Challenges",
                      value: String(programDraft?.draft.challenge_statements?.length ?? "-"),
                    },
                    {
                      label: "Goals",
                      value: String(programDraft?.draft.goals?.length ?? "-"),
                    },
                    {
                      label: "Tracks",
                      value: String(resourcePlan?.resources.tracks?.length ?? "-"),
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-xl p-3"
                      style={{ backgroundColor: "rgba(45,74,62,0.08)" }}
                    >
                      <p
                        className="font-black text-[#2d4a3e] leading-none capitalize"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: value.length > 6 ? 13 : 20,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {value}
                      </p>
                      <p
                        className="text-[9px] tracking-[0.12em] uppercase font-bold text-[#2d4a3e]/40 mt-1.5"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* ── Ticker ───────────────────────────────────────────────────── */}
      <div
        className="overflow-hidden border-t border-[#2d4a3e]/10 py-3"
        style={{ backgroundColor: "#e8e2d4" }}
      >
        <div
          className="flex gap-10 whitespace-nowrap"
          style={{ animation: "ticker 28s linear infinite" }}
        >
          {[...Array(3)].map((_, ri) =>
            ["HACKATHONS", "★", "HOST DASHBOARD", "★", "AI PROGRAM BUILDER", "★"].map((t, i) => (
              <span
                key={`${ri}-${i}`}
                className="text-[10px] tracking-[0.2em] uppercase font-bold shrink-0"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  color: t === "★" ? "#2d4a3e" : "rgba(45,74,62,0.4)",
                }}
              >
                {t}
              </span>
            )),
          )}
        </div>
      </div>

      <style>{`
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }
      `}</style>
    </div>
  );
}
