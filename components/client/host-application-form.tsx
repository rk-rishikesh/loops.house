"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { StoredHackathon, TechnicalResourceItem } from "@/lib/data-mappers";
import { useSaveHackathon } from "@/lib/queries";
import { HackathonProgramPreview } from "./hackathon-program-preview";
import { Loader2, Sparkles, ArrowLeft, ArrowRight, Trash2, Plus } from "lucide-react";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

interface ProgramDraft {
  hackathon_name: string;
  hackathon_id_suggestion: string;
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

interface HackathonProgramResponse {
  hackathon_id: string;
  draft: ProgramDraft;
  generated_at: string;
}

interface HostApplicationFormProps {
  userId: string;
}

const STEPS = [
  {
    id: "name",
    number: "01",
    question: "Give your hackathon a working title.",
    hint: "You can always change this later.",
    type: "text" as const,
    placeholder: "e.g. AI Builders Sprint 2026",
    field: "name" as const,
    required: true,
  },
  {
    id: "theme",
    number: "02",
    question: "What's the theme or focus area?",
    hint: "Optional — helps the AI narrow challenge statements.",
    type: "text" as const,
    placeholder: "e.g. AI copilots for productivity, devtools, or infra",
    field: "theme" as const,
    required: false,
  },
  {
    id: "program_goal",
    number: "03",
    question: "What should this hackathon achieve?",
    hint: "Describe the outcome for builders, sponsors, and your community.",
    type: "textarea" as const,
    placeholder: "What do you want this hackathon to achieve for builders and sponsors?",
    field: "program_goal" as const,
    required: false,
  },
  {
    id: "problem_statements",
    number: "04",
    question: "What problems should builders solve?",
    hint: "One problem per line. The AI will expand each into a full challenge.",
    type: "textarea" as const,
    placeholder: "Build a tool that…\nHelp teams ship AI copilots for…",
    field: "problem_statements" as const,
    required: false,
  },
  {
    id: "timeline",
    number: "05",
    question: "When is the program happening?",
    hint: "Set the key dates for your hackathon. These appear on the public schedule.",
    type: "date-group" as const,
    field: "timeline" as const,
    required: true,
  },
  {
    id: "resources",
    number: "06",
    question: "Technical Resources & Links",
    hint: "Add your website and any documentation or starter kits for builders.",
    type: "links" as const,
    field: "resources" as const,
    required: false,
  },
  {
    id: "bounty_pool_summary",
    number: "07",
    question: "Any prizes or rewards?",
    hint: "Optional — helps attract builders.",
    type: "text" as const,
    placeholder: "$10k total pool, $5k grand prize, swag for top 20…",
    field: "bounty_pool_summary" as const,
    required: false,
  },
  {
    id: "organizer_notes",
    number: "08",
    question: "Anything else the AI should know?",
    hint: "Partners, constraints, tone, or what success looks like to you.",
    type: "textarea" as const,
    placeholder:
      "Anything you'd tell a human co-host about constraints, partners, or success criteria.",
    field: "organizer_notes" as const,
    required: false,
  },
];

type FormField = keyof {
  name: string;
  theme: string;
  program_goal: string;
  problem_statements: string;
  website_url: string;
  technical_docs: string;
  bounty_pool_summary: string;
  organizer_notes: string;
};

/* ── Right-panel filler content per step ──────────────────────────── */
const STEP_FILLER = [
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
    body: "The clearest hackathons have a single sentence that explains why they exist. The AI uses your goal to calibrate judging criteria, challenge difficulty, and the overall arc.",
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
    label: "Context",
    headline: "The AI reads everything",
    body: "These notes are fed directly to the AI agent. The more context you provide about your sponsors, community expectations, or technical constraints, the better the output.",
    stat: "100%",
    statLabel: "of notes are used in generation",
  },
];

export function HostApplicationForm({ userId }: HostApplicationFormProps) {
  const router = useRouter();
  const saveHackathonMutation = useSaveHackathon();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [form, setForm] = useState({
    name: "",
    theme: "",
    program_goal: "",
    problem_statements: "",
    website_url: "",
    technical_docs: "",
    technical_resources: [] as TechnicalResourceItem[],
    bounty_pool_summary: "",
    organizer_notes: "",
    start_date: "",
    submission_deadline: "",
    judging_deadline: "",
    results_date: "",
    timeline: "",
    resources: "",
  });

  const [draft, setDraft] = useState<HackathonProgramResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [done, setDone] = useState(false);

  const currentStep = STEPS[step];
  const filler = STEP_FILLER[step];

  // Auto-focus text inputs when step changes
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 320);
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

  const handleGenerate = () => {
    setError(null);
    setSuccessMessage(null);
    setDraft(null);

    if (!form.name.trim()) {
      setError("Please provide a working title for your hackathon.");
      return;
    }

    const problemStatements = form.problem_statements
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const id = crypto.randomUUID();
    const hackathonPayload = {
      id,
      name: form.name || "Untitled hackathon",
      theme: form.theme || undefined,
      problem_statements: problemStatements,
      website_url: form.website_url || undefined,
      technical_docs: form.technical_docs || undefined,
      bounty_pool_summary: form.bounty_pool_summary || undefined,
      program_goal: form.program_goal || undefined,
      organizer_notes: form.organizer_notes ? [form.organizer_notes] : undefined,
    };

    startGenerating(async () => {
      try {
        const res = await fetch("/api/host-agents/hackathon-generator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hackathon: hackathonPayload }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to generate program draft.");
        setDraft(json as HackathonProgramResponse);
        setSuccessMessage("AI draft generated. Review below, then save your hackathon.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to run hackathon agent.");
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

      const hackathonId = draft.hackathon_id || crypto.randomUUID();
      const hackathon: StoredHackathon = {
        id: hackathonId,
        name: draft.draft.hackathon_name || form.name || "Untitled hackathon",
        description: draft.draft.overview || undefined,
        host_id: userId,
        problem_statements: problemStatements,
        theme: form.theme || undefined,
        website_url: form.website_url || undefined,
        technical_resources: form.technical_resources.length > 0 ? form.technical_resources : undefined,
        technical_docs: form.technical_docs || undefined,
        bounty_pool_summary: form.bounty_pool_summary || undefined,
        program_goal: form.program_goal || undefined,
        start_date: form.start_date || undefined,
        submission_deadline: form.submission_deadline || undefined,
        judging_deadline: form.judging_deadline || undefined,
        results_date: form.results_date || undefined,
        organizer_notes: draft.draft.organizer_notes.join("\n") || undefined,
        sponsor_tracks: [],
        judging_criteria: draft.draft.judging_criteria ?? [],
        created_at: new Date().toISOString(),
      };

      await saveHackathonMutation.mutateAsync(hackathon);
      router.push("/host/" + hackathon.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save hackathon.");
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
      style={{ backgroundColor: "#F8FFE8", fontFamily: FN }}
    >
      {/* ── Main split ──────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ══ LEFT — question ═══════════════════════════════════════ */}
        <div
          className="flex flex-col justify-center px-12 py-12"
          style={{ width: "75%", borderRight: "1px solid rgba(15,44,35,0.1)" }}
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
                  fontFamily: PX,
                  fontSize: "clamp(60px, 8vw, 100px)",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  color: "rgba(15,44,35,0.07)",
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
                  fontFamily: PX,
                  fontWeight: 900,
                  fontSize: "clamp(22px, 3vw, 32px)",
                  letterSpacing: "-0.025em",
                  color: "#0F2C23",
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
                  color: "rgba(15,44,35,0.5)",
                  lineHeight: 1.6,
                  marginBottom: 32,
                }}
              >
                {currentStep.hint}
                {!currentStep.required && (
                  <span
                    style={{
                      fontFamily: PX,
                      fontSize: 9,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: "rgba(15,44,35,0.3)",
                      marginLeft: 10,
                    }}
                  >
                    Optional
                  </span>
                )}
              </p>

              {/* ── Input ── */}
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
                    fontFamily: FN,
                    color: "#0F2C23",
                    backgroundColor: "transparent",
                    border: "none",
                    borderBottom: "2px solid rgba(15,44,35,0.2)",
                    outline: "none",
                    padding: "12px 0",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#0F2C23")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "rgba(15,44,35,0.2)")}
                />
              )}

              {currentStep.type === "date-group" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                  {[
                    { label: "Start Date", field: "start_date" },
                    { label: "Submission Deadline", field: "submission_deadline" },
                    { label: "Judging Deadline", field: "judging_deadline" },
                    { label: "Results Date", field: "results_date" },
                  ].map((d) => (
                    <div key={d.field} className="flex flex-col gap-2">
                      <label className="text-[9px] uppercase font-bold tracking-[0.1em] text-[#0F2C23]/40" style={{ fontFamily: PX }}>
                        {d.label}
                      </label>
                      <input
                        type="datetime-local"
                        value={form[d.field as FormField] as string}
                        onChange={(e) => setForm(prev => ({ ...prev, [d.field]: e.target.value }))}
                        className="bg-white/40 border border-[#0F2C23]/10 rounded-xl px-4 py-3 outline-none focus:border-[#0F2C23] transition-all text-sm"
                        style={{ fontFamily: FN }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {currentStep.type === "links" && (
                <div className="space-y-8 mt-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] uppercase font-bold tracking-[0.1em] text-[#0F2C23]/40" style={{ fontFamily: PX }}>
                      Main Website
                    </label>
                    <input
                      type="url"
                      value={form.website_url}
                      onChange={(e) => setForm(prev => ({ ...prev, website_url: e.target.value }))}
                      placeholder="https://yourhackathon.com"
                      className="bg-white/40 border border-[#0F2C23]/10 rounded-xl px-4 py-3 outline-none focus:border-[#0F2C23] transition-all text-sm"
                      style={{ fontFamily: FN }}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[9px] uppercase font-bold tracking-[0.1em] text-[#0F2C23]/40" style={{ fontFamily: PX }}>
                      Technical Resources
                    </label>
                    <div className="space-y-3">
                      {form.technical_resources.map((res, i) => (
                        <div key={i} className="flex gap-2 animate-[fadeUp_0.2s_ease-out]">
                          <input
                            type="text"
                            placeholder="Resource Name (e.g. GitHub)"
                            value={res.description}
                            onChange={(e) => {
                              const newRes = [...form.technical_resources];
                              newRes[i].description = e.target.value;
                              setForm(prev => ({ ...prev, technical_resources: newRes }));
                            }}
                            className="w-1/3 bg-white/40 border border-[#0F2C23]/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-[#0F2C23]"
                            style={{ fontFamily: FN }}
                          />
                          <input
                            type="url"
                            placeholder="https://..."
                            value={res.url}
                            onChange={(e) => {
                              const newRes = [...form.technical_resources];
                              newRes[i].url = e.target.value;
                              setForm(prev => ({ ...prev, technical_resources: newRes }));
                            }}
                            className="flex-1 bg-white/40 border border-[#0F2C23]/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-[#0F2C23]"
                            style={{ fontFamily: FN }}
                          />
                          <button
                            onClick={() => {
                              const newRes = form.technical_resources.filter((_, idx) => idx !== i);
                              setForm(prev => ({ ...prev, technical_resources: newRes }));
                            }}
                            className="p-3 text-[#0F2C23]/20 hover:text-[#0F2C23] transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => setForm(prev => ({ 
                          ...prev, 
                          technical_resources: [...prev.technical_resources, { url: "", description: "" }] 
                        }))}
                        className="flex items-center gap-2 text-[9px] uppercase font-bold tracking-widest text-[#0F2C23]/40 hover:text-[#0F2C23] transition-colors"
                        style={{ fontFamily: PX }}
                      >
                        <Plus size={12} /> Add more link
                      </button>
                    </div>
                  </div>
                </div>
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
                    fontFamily: FN,
                    color: "#0F2C23",
                    backgroundColor: "rgba(15,44,35,0.04)",
                    border: "2px solid rgba(15,44,35,0.12)",
                    borderRadius: 14,
                    outline: "none",
                    padding: "16px 18px",
                    resize: "none",
                    lineHeight: 1.7,
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#0F2C23")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(15,44,35,0.12)")}
                />
              )}

              {error && (
                <p
                  style={{
                    fontSize: 12,
                    color: "#8b1c1c",
                    marginTop: 8,
                    fontFamily: PX,
                  }}
                >
                  {error}
                </p>
              )}

              {/* ── Nav buttons ── */}
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
                      border: "1.5px solid rgba(15,44,35,0.2)",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                      fontFamily: PX,
                      fontSize: 10,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: "rgba(15,44,35,0.5)",
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
                    backgroundColor: "#0F2C23",
                    cursor: "pointer",
                    fontFamily: PX,
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: "#F8FFE8",
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
                      fontFamily: PX,
                      fontSize: 10,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: "rgba(15,44,35,0.3)",
                    }}
                  >
                    Skip
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* ── Done state ── */
            <div>
              <p
                style={{
                  fontFamily: PX,
                  fontSize: 80,
                  fontWeight: 900,
                  color: "rgba(15,44,35,0.07)",
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
                  fontFamily: PX,
                  fontWeight: 900,
                  fontSize: "clamp(22px, 3vw, 30px)",
                  letterSpacing: "-0.025em",
                  color: "#0F2C23",
                  lineHeight: 1.15,
                  marginBottom: 10,
                }}
              >
                Brief complete.
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(15,44,35,0.5)",
                  lineHeight: 1.7,
                  marginBottom: 32,
                  maxWidth: 380,
                }}
              >
                Your answers are ready to hand off to the AI agent. It will turn your brief into a
                full program outline — challenges, judging criteria, schedule, and more.
              </p>

              {successMessage && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    backgroundColor: "rgba(15,44,35,0.06)",
                    border: "1px solid rgba(15,44,35,0.15)",
                    fontSize: 13,
                    color: "#0F2C23",
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
                      backgroundColor: "#0F2C23",
                      cursor: isGenerating ? "wait" : "pointer",
                      fontFamily: PX,
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: "#F8FFE8",
                      opacity: isGenerating ? 0.7 : 1,
                    }}
                  >
                    {isGenerating ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Sparkles size={12} />
                    )}
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
                      backgroundColor: "#0F2C23",
                      cursor: isSaving ? "wait" : "pointer",
                      fontFamily: PX,
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: "#F8FFE8",
                      opacity: isSaving ? 0.7 : 1,
                    }}
                  >
                    {isSaving ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <ArrowRight size={12} />
                    )}
                    {isSaving ? "Saving…" : "Save hackathon"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => animateStep(0)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: PX,
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: "rgba(15,44,35,0.3)",
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
          style={{ width: "42%", backgroundColor: "#0F2C23", overflow: "hidden" }}
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
                    fontFamily: PX,
                    fontSize: 9,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: "rgba(226,254,165,0.3)",
                    marginBottom: 16,
                  }}
                >
                  {filler.label}
                </p>

                {/* Headline */}
                <h2
                  style={{
                    fontFamily: PX,
                    fontWeight: 900,
                    fontSize: "clamp(20px, 2.4vw, 28px)",
                    letterSpacing: "-0.025em",
                    color: "#F8FFE8",
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
                    color: "rgba(226,254,165,0.55)",
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
                    backgroundColor: "rgba(226,254,165,0.06)",
                    border: "1px solid rgba(226,254,165,0.1)",
                    alignSelf: "flex-start",
                  }}
                >
                  <span
                    style={{
                      fontFamily: PX,
                      fontWeight: 900,
                      fontSize: 26,
                      letterSpacing: "-0.03em",
                      color: "#E2FEA5",
                      lineHeight: 1,
                      marginBottom: 4,
                    }}
                  >
                    {filler.stat}
                  </span>
                  <span
                    style={{
                      fontFamily: PX,
                      fontSize: 9,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: "rgba(226,254,165,0.3)",
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
                    borderTop: "1px solid rgba(226,254,165,0.08)",
                    padding: "16px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <p
                    style={{
                      fontFamily: PX,
                      fontSize: 9,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: "rgba(226,254,165,0.22)",
                      marginBottom: 4,
                    }}
                  >
                    Brief so far
                  </p>
                  {summary.slice(-4).map((s) => {
                    const val = form[s.field as FormField]?.toString().trim();
                    const truncated = val && val.length > 60 ? `${val.slice(0, 60)}…` : val;
                    return (
                      <div key={s.id} className="flex items-start gap-3">
                        <span
                          style={{
                            fontFamily: PX,
                            fontSize: 9,
                            fontWeight: 900,
                            color: "rgba(226,254,165,0.2)",
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
                            color: "rgba(226,254,165,0.5)",
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
            /* DONE: FULL SCREEN DRAFT VIEW or SUMMARY */
            <div className="fixed inset-0 bg-[#F8FFE8] z-[60] overflow-y-auto animate-[fadeUp_0.4s_ease-out]">
              {!draft ? (
                /* SUMMARY BEFORE GENERATING */
                <div className="max-w-4xl mx-auto px-10 py-24">
                  <header className="mb-16">
                    <h2 className="text-4xl font-black uppercase text-[#0F2C23] mb-4" style={{ fontFamily: PX }}>Review Your Brief</h2>
                    <p className="text-lg text-[#0F2C23]/60" style={{ fontFamily: FN }}>Ready to let the AI architect your program?</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <div className="space-y-8">
                        {STEPS.map((s) => {
                          const val = form[s.field as FormField]?.toString().trim();
                          if (!val || s.id === "timeline" || s.id === "resources") return null;
                          return (
                            <div key={s.id}>
                               <p className="text-[10px] uppercase font-bold tracking-widest text-[#0F2C23]/30 mb-2" style={{ fontFamily: PX }}>{s.number} — {s.id}</p>
                               <p className="text-[15px] text-[#0F2C23]/80 leading-relaxed" style={{ fontFamily: FN }}>{val}</p>
                            </div>
                          );
                        })}
                     </div>
                     <div className="space-y-8">
                        <div>
                           <p className="text-[10px] uppercase font-bold tracking-widest text-[#0F2C23]/30 mb-4" style={{ fontFamily: PX }}>VITAL DATES</p>
                           <div className="bg-white/50 border border-[#0F2C23]/10 rounded-2xl p-6 space-y-4">
                              {[
                                { label: 'Start', val: form.start_date },
                                { label: 'Submit', val: form.submission_deadline },
                                { label: 'Results', val: form.results_date },
                              ].map(d => (
                                <div key={d.label} className="flex justify-between items-center">
                                   <span className="text-[10px] uppercase font-bold text-[#0F2C23]/40" style={{ fontFamily: PX }}>{d.label}</span>
                                   <span className="text-sm font-medium text-[#0F2C23]" style={{ fontFamily: FN }}>{d.val || 'Not set'}</span>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* BOTTOM ACTION BAR (SUMMARY) */}
                  <div className="fixed bottom-0 left-0 right-0 p-8 flex justify-center pointer-events-none">
                     <div className="bg-white border border-[#0F2C23]/10 rounded-2xl p-4 flex gap-4 shadow-xl pointer-events-auto">
                        <button 
                           onClick={() => setDone(false)}
                           className="px-6 py-3 text-[10px] uppercase font-bold tracking-widest text-[#0F2C23]/60 hover:text-[#0F2C23]"
                           style={{ fontFamily: PX }}
                        >
                           Make Edits
                        </button>
                        <button 
                           onClick={handleGenerate}
                           disabled={isGenerating}
                           className="px-10 py-3 bg-[#0F2C23] text-[#E2FEA5] rounded-xl text-[10px] uppercase font-bold tracking-widest hover:scale-[1.03] transition-transform flex items-center gap-3"
                           style={{ fontFamily: PX }}
                        >
                           {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                           {isGenerating ? "Synthesizing..." : "Generate Program Draft"}
                        </button>
                     </div>
                  </div>
                </div>
              ) : (
                <>
                  <HackathonProgramPreview draft={draft.draft} />
                  
                  {/* ══ STICKY ACTION BAR (DRAFT) ══ */}
                  <div className="fixed bottom-0 left-0 right-0 bg-[#F8FFE8]/80 backdrop-blur-xl border-t border-[#0F2C23]/10 p-8 z-50">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <button
                          onClick={() => setDraft(null)}
                          className="text-[10px] uppercase font-bold tracking-widest text-[#0F2C23]/50 hover:text-[#0F2C23] transition-colors"
                          style={{ fontFamily: PX }}
                        >
                          &larr; Back to Brief
                        </button>
                        <div className="h-4 w-px bg-[#0F2C23]/10" />
                        <p className="text-xs text-[#0F2C23]/40 font-medium" style={{ fontFamily: FN }}>
                          This draft is editable after you finalise the program.
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          onClick={handleGenerate}
                          disabled={isGenerating}
                          className="text-[10px] uppercase font-bold tracking-widest text-[#0F2C23] px-6 py-3 rounded-xl border border-[#0F2C23]/10 hover:bg-white transition-all shadow-sm"
                          style={{ fontFamily: PX }}
                        >
                          {isGenerating ? "Reasoning..." : "Re-Generate"}
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="text-[10px] uppercase font-bold tracking-widest bg-[#0F2C23] text-[#E2FEA5] px-10 py-3 rounded-xl hover:scale-[1.02] transition-all shadow-lg shadow-[#0F2C23]/20 disabled:opacity-50"
                          style={{ fontFamily: PX }}
                        >
                          {isSaving ? "Finalising..." : "Finalise Program"}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
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
