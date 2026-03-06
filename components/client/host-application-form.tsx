"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Check } from "lucide-react";
import { useSaveBooster } from "@/lib/queries";
import type { StoredBooster } from "@/lib/data-mappers";

type BoosterType = "idea" | "momentum" | "capital";

interface ProgramDraft {
  booster_name: string;
  booster_id_suggestion: string;
  overview: string;
  target_audience: string;
  goals: string[];
  challenge_statements: {
    title: string;
    summary: string;
    primary_problem?: string;
    difficulty?: "beginner" | "intermediate" | "advanced";
  }[];
  schedule: { phase: string; description: string }[];
  submission_requirements: string[];
  judging_criteria: { name: string; description: string }[];
  documentation_plan: string[];
  organizer_notes: string[];
}

interface BoosterProgramResponse {
  booster_id: string;
  draft: ProgramDraft;
  generated_at: string;
}

interface HostApplicationFormProps {
  userId: string;
}

const STEPS = [
  {
    id: "booster_type",
    number: "01",
    question: "What kind of booster are you running?",
    hint: "Each type shapes how the program is structured.",
    type: "choice" as const,
    choices: [
      { value: "idea", label: "Idea", desc: "Spark early-stage concepts" },
      { value: "momentum", label: "Momentum", desc: "Accelerate existing projects" },
      { value: "capital", label: "Capital", desc: "Fund the best submissions" },
    ],
    field: "booster_type" as const,
    required: false,
  },
  {
    id: "name",
    number: "02",
    question: "Give your booster a working title.",
    hint: "You can always change this later.",
    type: "text" as const,
    placeholder: "e.g. AI Builders Sprint 2026",
    field: "name" as const,
    required: true,
  },
  {
    id: "theme",
    number: "03",
    question: "What's the theme or focus area?",
    hint: "Optional — helps the AI narrow challenge statements.",
    type: "text" as const,
    placeholder: "e.g. AI copilots for productivity, devtools, or infra",
    field: "theme" as const,
    required: false,
  },
  {
    id: "program_goal",
    number: "04",
    question: "What should this booster achieve?",
    hint: "Describe the outcome for builders, sponsors, and your community.",
    type: "textarea" as const,
    placeholder: "What do you want this booster to achieve for builders and sponsors?",
    field: "program_goal" as const,
    required: false,
  },
  {
    id: "problem_statements",
    number: "05",
    question: "What problems should builders solve?",
    hint: "One problem per line. The AI will expand each into a full challenge.",
    type: "textarea" as const,
    placeholder: "Build a tool that…\nHelp teams ship AI copilots for…",
    field: "problem_statements" as const,
    required: false,
  },
  {
    id: "bounty_pool_summary",
    number: "06",
    question: "Any prizes or rewards?",
    hint: "Optional — helps attract builders.",
    type: "text" as const,
    placeholder: "$10k total pool, $5k grand prize, swag for top 20…",
    field: "bounty_pool_summary" as const,
    required: false,
  },
  {
    id: "timeline",
    number: "07",
    question: "What's the rough timeline?",
    hint: "Launch date, key milestones, submission deadline.",
    type: "text" as const,
    placeholder: "Launch April 1 → submissions May 15 → demo day June 1",
    field: "timeline" as const,
    required: false,
  },
  {
    id: "organizer_notes",
    number: "08",
    question: "Anything else the AI should know?",
    hint: "Partners, constraints, tone, or what success looks like to you.",
    type: "textarea" as const,
    placeholder: "Anything you'd tell a human co-host about constraints, partners, or success criteria.",
    field: "organizer_notes" as const,
    required: false,
  },
];

type FormField = keyof {
  booster_type: BoosterType;
  name: string;
  theme: string;
  program_goal: string;
  problem_statements: string;
  website_url: string;
  technical_docs: string;
  bounty_pool_summary: string;
  timeline: string;
  organizer_notes: string;
};

/* ── Right-panel filler content per step ──────────────────────────── */
const STEP_FILLER = [
  {
    label: "Program type",
    headline: "The shape of your booster",
    body: "Idea boosters spark new concepts from scratch. Momentum boosters accelerate builders already mid-build. Capital boosters fund the most promising submissions with real prizes.",
    stat: "3 types",
    statLabel: "of builder programs",
  },
  {
    label: "Identity",
    headline: "A name sets the tone",
    body: "Your title is the first thing builders see. Make it specific enough to signal the focus but broad enough to inspire. The AI will refine it into a full program identity.",
    stat: "2.3×",
    statLabel: "more signups with a strong title",
  },
  {
    label: "Focus",
    headline: "Theme narrows the field",
    body: "A tight theme attracts the right builders and produces more coherent challenge statements. Broad is fine — even 'AI tools for developers' is enough signal.",
    stat: "41%",
    statLabel: "better challenge quality with a theme",
  },
  {
    label: "Purpose",
    headline: "Goals drive everything",
    body: "The clearest boosters have a single sentence that explains why they exist. The AI uses your goal to calibrate judging criteria, challenge difficulty, and the overall arc.",
    stat: "1 sentence",
    statLabel: "is all you need to start",
  },
  {
    label: "Challenges",
    headline: "Problems become prompts",
    body: "Each line you write becomes a structured challenge statement with a title, summary, and difficulty level. The more specific your problems, the richer the AI output.",
    stat: "3–6",
    statLabel: "problems is the sweet spot",
  },
  {
    label: "Incentives",
    headline: "Prizes move builders",
    body: "Even small prize pools signal seriousness. Tiered rewards (grand, runner-up, category) produce more competitive submissions than a single large prize.",
    stat: "68%",
    statLabel: "of builders check prizes first",
  },
  {
    label: "Cadence",
    headline: "Timelines create urgency",
    body: "The best boosters have visible checkpoints — not just a start and end date. Intermediate milestones keep builders engaged and give you feedback loops.",
    stat: "4–6 weeks",
    statLabel: "is the optimal booster length",
  },
  {
    label: "Context",
    headline: "The AI reads everything",
    body: "These notes are fed directly to the AI agent. The more context you provide about your sponsors, community expectations, or technical constraints, the better the output.",
    stat: "100%",
    statLabel: "of notes are used in generation",
  },
];

export function HostApplicationForm({ userId }: HostApplicationFormProps) {
  const router = useRouter();
  const saveBoosterMutation = useSaveBooster();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [form, setForm] = useState({
    booster_type: "idea" as BoosterType,
    name: "",
    theme: "",
    program_goal: "",
    problem_statements: "",
    website_url: "",
    technical_docs: "",
    bounty_pool_summary: "",
    timeline: "",
    organizer_notes: "",
  });

  const [draft, setDraft] = useState<BoosterProgramResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [done, setDone] = useState(false);

  const currentStep = STEPS[step];
  const filler = STEP_FILLER[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  // Auto-focus text inputs when step changes
  useEffect(() => {
    if (currentStep.type !== "choice") {
      setTimeout(() => inputRef.current?.focus(), 320);
    }
  }, [step]);

  function animateStep(toStep: number) {
    setVisible(false);
    setTimeout(() => {
      setStep(toStep);
      setVisible(true);
    }, 220);
  }

  function handleNext() {
    if (currentStep.required && !form[currentStep.field as FormField]?.toString().trim()) {
      setError("This field is required.");
      return;
    }
    setError(null);
    if (step < STEPS.length - 1) {
      animateStep(step + 1);
    } else {
      setDone(true);
    }
  }

  function handleBack() {
    setError(null);
    if (step > 0) animateStep(step - 1);
  }

  function handleChoice(value: string) {
    setForm((prev) => ({ ...prev, booster_type: value as BoosterType }));
    setTimeout(() => animateStep(step + 1), 180);
  }

  const handleGenerate = () => {
    setError(null);
    setSuccessMessage(null);
    setDraft(null);

    if (!form.name.trim()) {
      setError("Please provide a working title for your booster.");
      return;
    }

    const problemStatements = form.problem_statements
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const id = crypto.randomUUID();
    const boosterPayload = {
      id,
      name: form.name || "Untitled booster",
      theme: form.theme || undefined,
      booster_type: form.booster_type,
      problem_statements: problemStatements,
      website_url: form.website_url || undefined,
      technical_docs: form.technical_docs || undefined,
      bounty_pool_summary: form.bounty_pool_summary || undefined,
      program_goal: form.program_goal || undefined,
      timeline: form.timeline || undefined,
      organizer_notes: form.organizer_notes ? [form.organizer_notes] : undefined,
    };

    startGenerating(async () => {
      try {
        const res = await fetch("/api/host-agents/booster-generator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ booster: boosterPayload }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to generate program draft.");
        setDraft(json as BoosterProgramResponse);
        setSuccessMessage("AI draft generated. Review below, then save your booster.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to run booster agent.");
      }
    });
  };

  const handleSave = async () => {
    if (!draft) return;
    setError(null);
    setIsSaving(true);

    try {
      const problemStatements = form.problem_statements
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const boosterId = draft.booster_id || crypto.randomUUID();
      const booster: StoredBooster = {
        id: boosterId,
        name: draft.draft.booster_name || form.name || "Untitled booster",
        host_id: userId,
        problem_statements: problemStatements,
        theme: form.theme || undefined,
        booster_type: form.booster_type,
        website_url: form.website_url || undefined,
        technical_docs: form.technical_docs || undefined,
        bounty_pool_summary: form.bounty_pool_summary || undefined,
        program_goal: form.program_goal || undefined,
        timeline: form.timeline || undefined,
        organizer_notes: form.organizer_notes || undefined,
        sponsor_tracks: [],
        judging_criteria: draft.draft.judging_criteria ?? [],
        created_at: new Date().toISOString(),
      };

      await saveBoosterMutation.mutateAsync(booster);
      router.push("/host");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save booster.");
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Summary of answered questions for right panel ─────────────── */
  const summary = STEPS.slice(0, step).filter((s) => {
    const val = form[s.field as FormField]?.toString().trim();
    return val && val.length > 0;
  });

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#f0ebe0", fontFamily: "Georgia, serif" }}
    >
      {/* ── Top nav bar ─ strip style ───────────────────────────── */}
      <div className="sticky top-0 z-50" style={{ backgroundColor: "#f0ebe0" }}>
        <div
          className="flex w-full items-stretch border-t border-b border-[#1a1a1a] text-[10px] tracking-[0.18em] uppercase font-bold text-[#1a1a1a]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {/* Left: back to host */}
          <Link
            href="/host"
            className="w-[240px] max-w-xs px-10 py-8 flex items-center justify-start border-r border-[#1a1a1a] no-underline hover:bg-[#e1dbcf]"
          >
            <span className="flex items-center gap-2">
              <ArrowLeft size={11} />
              <span>Host</span>
            </span>
          </Link>

          {/* Right: New Booster + progress */}
          <div className="flex-1 min-w-0 py-8 flex items-center justify-between px-10">
            <span>New Booster</span>
            {!done && (
              <div className="flex items-center gap-4">
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ width: 140, backgroundColor: "rgba(45,74,62,0.12)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, backgroundColor: "#2d4a3e" }}
                  />
                </div>
                <span
                  className="text-[9px] tracking-[0.15em] uppercase font-bold"
                  style={{ color: "rgba(45,74,62,0.55)" }}
                >
                  {step + 1} / {STEPS.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main split ──────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ══ LEFT — question ═══════════════════════════════════════ */}
        <div
          className="flex flex-col justify-center px-12 py-12"
          style={{ width: "75%", borderRight: "1px solid rgba(45,74,62,0.1)" }}
        >
          {!done ? (
            <div
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(14px)",
                transition: "opacity 0.22s ease, transform 0.22s ease",
              }}
            >
              {/* Step number */}
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "clamp(60px, 8vw, 100px)",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  color: "rgba(45,74,62,0.07)",
                  lineHeight: 1,
                  marginBottom: -16,
                  userSelect: "none",
                }}
              >
                {currentStep.number}
              </p>

              {/* Question */}
              <h1
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(22px, 3vw, 32px)",
                  letterSpacing: "-0.025em",
                  color: "#2d4a3e",
                  lineHeight: 1.15,
                  marginBottom: 10,
                }}
              >
                {currentStep.question}
              </h1>

              {/* Hint */}
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(45,74,62,0.5)",
                  lineHeight: 1.6,
                  marginBottom: 32,
                }}
              >
                {currentStep.hint}
                {!currentStep.required && (
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 9,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: "rgba(45,74,62,0.3)",
                      marginLeft: 10,
                    }}
                  >
                    Optional
                  </span>
                )}
              </p>

              {/* ── Input ── */}
              {currentStep.type === "choice" && (
                <div className="flex flex-col gap-3" style={{ maxWidth: 460 }}>
                  {currentStep.choices?.map((ch) => {
                    const active = form.booster_type === ch.value;
                    return (
                      <button
                        key={ch.value}
                        type="button"
                        onClick={() => handleChoice(ch.value)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "18px 22px",
                          borderRadius: 16,
                          border: `2px solid ${active ? "#2d4a3e" : "rgba(45,74,62,0.12)"}`,
                          backgroundColor: active ? "#2d4a3e" : "#f5f2ea",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(45,74,62,0.35)";
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ede8de";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(45,74,62,0.12)";
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f5f2ea";
                          }
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontFamily: "'Inter', sans-serif",
                              fontWeight: 800,
                              fontSize: 14,
                              letterSpacing: "-0.01em",
                              color: active ? "#f0ebe0" : "#2d4a3e",
                              marginBottom: 2,
                            }}
                          >
                            {ch.label}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: active ? "rgba(240,235,224,0.6)" : "rgba(45,74,62,0.45)",
                            }}
                          >
                            {ch.desc}
                          </div>
                        </div>
                        {active && <Check size={16} style={{ color: "#d6cfc0", flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              )}

              {currentStep.type === "text" && (
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  value={form[currentStep.field as FormField] as string}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [currentStep.field]: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  placeholder={currentStep.placeholder}
                  style={{
                    width: "100%",
                    fontSize: 18,
                    fontFamily: "Georgia, serif",
                    color: "#2d4a3e",
                    backgroundColor: "transparent",
                    border: "none",
                    borderBottom: "2px solid rgba(45,74,62,0.2)",
                    outline: "none",
                    padding: "12px 0",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#2d4a3e")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "rgba(45,74,62,0.2)")}
                />
              )}

              {currentStep.type === "textarea" && (
                <textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  rows={4}
                  value={form[currentStep.field as FormField] as string}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [currentStep.field]: e.target.value }))
                  }
                  placeholder={currentStep.placeholder}
                  style={{
                    width: "100%",
                    fontSize: 15,
                    fontFamily: "Georgia, serif",
                    color: "#2d4a3e",
                    backgroundColor: "#f5f2ea",
                    border: "2px solid rgba(45,74,62,0.12)",
                    borderRadius: 14,
                    outline: "none",
                    padding: "16px 18px",
                    resize: "none",
                    lineHeight: 1.7,
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#2d4a3e")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(45,74,62,0.12)")}
                />
              )}

              {error && (
                <p
                  style={{
                    fontSize: 12,
                    color: "#8b1c1c",
                    marginTop: 8,
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {error}
                </p>
              )}

              {/* ── Nav buttons ── */}
              {currentStep.type !== "choice" && (
                <div className="flex items-center gap-3 mt-8">
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "10px 18px",
                        borderRadius: 100,
                        border: "1.5px solid rgba(45,74,62,0.2)",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 10,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        color: "rgba(45,74,62,0.5)",
                      }}
                    >
                      <ArrowLeft size={11} />
                      Back
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleNext}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "12px 24px",
                      borderRadius: 100,
                      border: "none",
                      backgroundColor: "#2d4a3e",
                      cursor: "pointer",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: "#f0ebe0",
                    }}
                  >
                    {step === STEPS.length - 1 ? "Finish brief" : "Continue"}
                    <ArrowRight size={12} />
                  </button>

                  {!currentStep.required && step < STEPS.length - 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, [currentStep.field]: "" }));
                        animateStep(step + 1);
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 10,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        color: "rgba(45,74,62,0.3)",
                      }}
                    >
                      Skip
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ── Done state ── */
            <div>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 80,
                  fontWeight: 900,
                  color: "rgba(45,74,62,0.07)",
                  lineHeight: 1,
                  marginBottom: -10,
                  userSelect: "none",
                  letterSpacing: "-0.04em",
                }}
              >
                ✓
              </p>
              <h1
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(22px, 3vw, 30px)",
                  letterSpacing: "-0.025em",
                  color: "#2d4a3e",
                  lineHeight: 1.15,
                  marginBottom: 10,
                }}
              >
                Brief complete.
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(45,74,62,0.5)",
                  lineHeight: 1.7,
                  marginBottom: 32,
                  maxWidth: 380,
                }}
              >
                Your answers are ready to hand off to the AI agent. It will turn your brief into a full program outline — challenges, judging criteria, schedule, and more.
              </p>

              {successMessage && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    backgroundColor: "rgba(45,74,62,0.06)",
                    border: "1px solid rgba(45,74,62,0.15)",
                    fontSize: 13,
                    color: "#2d4a3e",
                    marginBottom: 20,
                  }}
                >
                  {successMessage}
                </div>
              )}
              {error && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    backgroundColor: "rgba(200,60,60,0.07)",
                    border: "1px solid rgba(200,60,60,0.15)",
                    fontSize: 13,
                    color: "#8b1c1c",
                    marginBottom: 20,
                  }}
                >
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                {!draft ? (
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "14px 28px",
                      borderRadius: 100,
                      border: "none",
                      backgroundColor: "#2d4a3e",
                      cursor: isGenerating ? "wait" : "pointer",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: "#f0ebe0",
                      opacity: isGenerating ? 0.7 : 1,
                    }}
                  >
                    {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {isGenerating ? "Generating…" : "Generate program draft"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "14px 28px",
                      borderRadius: 100,
                      border: "none",
                      backgroundColor: "#2d4a3e",
                      cursor: isSaving ? "wait" : "pointer",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: "#f0ebe0",
                      opacity: isSaving ? 0.7 : 1,
                    }}
                  >
                    {isSaving ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />}
                    {isSaving ? "Saving…" : "Save booster"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => animateStep(0)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: "rgba(45,74,62,0.3)",
                  }}
                >
                  Edit answers
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ══ RIGHT — filler / brief preview ═══════════════════════ */}
        <div
          className="flex flex-col"
          style={{ width: "42%", backgroundColor: "#2d4a3e", overflow: "hidden" }}
        >
          {!done ? (
            <div
              className="flex flex-col h-full"
              style={{
                opacity: visible ? 1 : 0,
                transition: "opacity 0.22s ease",
              }}
            >
              {/* Top: context card */}
              <div className="flex-1 flex flex-col justify-center px-10 py-10">
                {/* Label */}
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 9,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: "rgba(240,235,224,0.3)",
                    marginBottom: 16,
                  }}
                >
                  {filler.label}
                </p>

                {/* Headline */}
                <h2
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 900,
                    fontSize: "clamp(20px, 2.4vw, 28px)",
                    letterSpacing: "-0.025em",
                    color: "#f0ebe0",
                    lineHeight: 1.1,
                    marginBottom: 14,
                  }}
                >
                  {filler.headline}
                </h2>

                {/* Body */}
                <p
                  style={{
                    fontSize: 13,
                    color: "rgba(240,235,224,0.55)",
                    lineHeight: 1.7,
                    marginBottom: 28,
                  }}
                >
                  {filler.body}
                </p>

                {/* Stat */}
                <div
                  style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    padding: "18px 24px",
                    borderRadius: 18,
                    backgroundColor: "rgba(240,235,224,0.06)",
                    border: "1px solid rgba(240,235,224,0.1)",
                    alignSelf: "flex-start",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 900,
                      fontSize: 26,
                      letterSpacing: "-0.03em",
                      color: "#d6cfc0",
                      lineHeight: 1,
                      marginBottom: 4,
                    }}
                  >
                    {filler.stat}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 9,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: "rgba(240,235,224,0.3)",
                    }}
                  >
                    {filler.statLabel}
                  </span>
                </div>
              </div>

              {/* Bottom: answered so far */}
              {summary.length > 0 && (
                <div
                  style={{
                    borderTop: "1px solid rgba(240,235,224,0.08)",
                    padding: "16px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 9,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: "rgba(240,235,224,0.22)",
                      marginBottom: 4,
                    }}
                  >
                    Brief so far
                  </p>
                  {summary.slice(-4).map((s) => {
                    const val = form[s.field as FormField]?.toString().trim();
                    const truncated = val && val.length > 60 ? val.slice(0, 60) + "…" : val;
                    return (
                      <div key={s.id} className="flex items-start gap-3">
                        <span
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 9,
                            fontWeight: 900,
                            color: "rgba(240,235,224,0.2)",
                            letterSpacing: "0.05em",
                            marginTop: 2,
                            flexShrink: 0,
                            width: 22,
                          }}
                        >
                          {s.number}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: "rgba(240,235,224,0.5)",
                            lineHeight: 1.5,
                          }}
                        >
                          {truncated}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Done: full AI draft preview */
            <div className="flex flex-col h-full overflow-y-auto px-10 py-10">
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 9,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: "rgba(240,235,224,0.3)",
                  marginBottom: 20,
                }}
              >
                {draft ? "AI draft" : "Your brief"}
              </p>

              {!draft ? (
                /* Brief summary before generation */
                <div className="space-y-5">
                  {STEPS.map((s) => {
                    const val = form[s.field as FormField]?.toString().trim();
                    if (!val) return null;
                    return (
                      <div key={s.id}>
                        <p
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 9,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            fontWeight: 700,
                            color: "rgba(240,235,224,0.28)",
                            marginBottom: 4,
                          }}
                        >
                          {s.number} — {s.id.replace(/_/g, " ")}
                        </p>
                        <p style={{ fontSize: 13, color: "rgba(240,235,224,0.6)", lineHeight: 1.6 }}>
                          {val.length > 120 ? val.slice(0, 120) + "…" : val}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* AI draft content */
                (() => {
                  const d: any = draft.draft;
                  const boosterName = d.booster_name ?? form.name;
                  const overview = d.overview ?? "No overview generated.";
                  const goals: string[] = d.goals ?? [];
                  const challenges: any[] = d.challenge_statements ?? [];
                  const schedule: any[] = d.schedule ?? [];
                  const slug = d.booster_id_suggestion;

                  return (
                    <div className="space-y-8">
                      <div>
                        <h2
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 900,
                            fontSize: 22,
                            letterSpacing: "-0.02em",
                            color: "#f0ebe0",
                            lineHeight: 1.1,
                            marginBottom: 8,
                          }}
                        >
                          {boosterName}
                        </h2>
                        {slug && (
                          <p
                            style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize: 9,
                              letterSpacing: "0.14em",
                              textTransform: "uppercase",
                              fontWeight: 700,
                              color: "rgba(240,235,224,0.25)",
                              marginBottom: 12,
                            }}
                          >
                            /{slug}
                          </p>
                        )}
                        <p style={{ fontSize: 13, color: "rgba(240,235,224,0.6)", lineHeight: 1.7 }}>
                          {overview}
                        </p>
                      </div>

                      {goals.length > 0 && (
                        <div>
                          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: "rgba(240,235,224,0.25)", marginBottom: 10 }}>Goals</p>
                          <div className="space-y-2">
                            {goals.map((g, i) => (
                              <div key={i} className="flex items-start gap-3">
                                <span style={{ color: "rgba(240,235,224,0.2)", fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 10, marginTop: 2 }}>→</span>
                                <span style={{ fontSize: 13, color: "rgba(240,235,224,0.6)", lineHeight: 1.6 }}>{g}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {challenges.length > 0 && (
                        <div>
                          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: "rgba(240,235,224,0.25)", marginBottom: 10 }}>Challenges</p>
                          <div className="space-y-3">
                            {challenges.slice(0, 3).map((c, i) => (
                              <div key={i} style={{ padding: "12px 16px", borderRadius: 12, backgroundColor: "rgba(240,235,224,0.05)", border: "1px solid rgba(240,235,224,0.08)" }}>
                                <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 12, color: "rgba(240,235,224,0.8)", marginBottom: 3 }}>{c.title}</p>
                                <p style={{ fontSize: 12, color: "rgba(240,235,224,0.45)", lineHeight: 1.5 }}>{c.summary}</p>
                              </div>
                            ))}
                            {challenges.length > 3 && (
                              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: "rgba(240,235,224,0.25)" }}>+ {challenges.length - 3} more challenges</p>
                            )}
                          </div>
                        </div>
                      )}

                      {schedule.length > 0 && (
                        <div>
                          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: "rgba(240,235,224,0.25)", marginBottom: 10 }}>Schedule</p>
                          <div className="space-y-2">
                            {schedule.slice(0, 4).map((s, i) => (
                              <div key={i} className="flex items-start gap-3">
                                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 9, color: "rgba(240,235,224,0.2)", width: 16, marginTop: 3, flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
                                <div>
                                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 11, color: "rgba(240,235,224,0.7)" }}>{s.phase}</span>
                                  <span style={{ fontSize: 11, color: "rgba(240,235,224,0.4)", marginLeft: 8 }}>{s.description}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}