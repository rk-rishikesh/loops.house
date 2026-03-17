"use client";

import { ArrowLeft, ArrowRight, Loader2, Plus, Sparkles, Trash2, Info, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { TechnicalResourceItem } from "@/lib/data-mappers";
import { saveHackathonAction } from "@/lib/actions";
import { HackathonProgramPreview } from "./hackathon-program-preview";

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
  prizes: {
    title: string;
    currency: string;
    amount: number;
    description?: string;
  }[];
  documentation_plan: string[];
  organizer_notes: string[];
}

interface HackathonProgramResponse {
  hackathon_id: string;
  draft: ProgramDraft;
  generated_at: string;
}

interface HostApplicationFormProps {
  userId?: string;
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
    hint: "Helps the AI narrow challenge statements.",
    type: "text" as const,
    placeholder: "e.g. AI copilots for productivity, devtools, or infra",
    field: "theme" as const,
    required: true,
  },
  {
    id: "program_goal",
    number: "03",
    question: "What should this hackathon achieve?",
    hint: "Describe the outcome for builders, sponsors, and your community.",
    type: "textarea" as const,
    placeholder: "What do you want this hackathon to achieve for builders and sponsors?",
    field: "program_goal" as const,
    required: true,
  },
  {
    id: "problem_statements",
    number: "04",
    question: "What problems should builders solve?",
    hint: "One problem per line. The AI will expand each into a full challenge.",
    type: "textarea" as const,
    placeholder: "Build a tool that…\nHelp teams ship AI copilots for…",
    field: "problem_statements" as const,
    required: true,
  },
  {
    id: "timeline",
    number: "05",
    question: "When is the hackathon happening?",
    hint: "Set the key dates for your hackathon. You can updated them later again from Host Dashboard",
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
    required: true,
  },
  {
    id: "bounty_pool_summary",
    number: "07",
    question: "Any prizes or rewards?",
    hint: "Helps attract builders.",
    type: "text" as const,
    placeholder: "$10k total pool, $5k grand prize, swag for top 20…",
    field: "bounty_pool_summary" as const,
    required: true,
  },
  {
    id: "organizer_notes",
    number: "08",
    question: "Anything else?",
    hint: "Cconstraints, tone, or what success looks like to you.",
    type: "textarea" as const,
    placeholder:
      "Anything you'd tell a human co-host about constraints, partners, or success criteria.",
    field: "organizer_notes" as const,
    required: true,
  },
];

type FormField = keyof {
  name: string;
  theme: string;
  program_goal: string;
  problem_statements: string;
  website_url: string;
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
    label: "Timeline",
    headline: "Dates set the pace",
    body: "Clear deadlines create urgency and help builders plan. A well-spaced schedule that includes building start time, submission deadline, judging schedule, results announcement date, keeps momentum high throughout the program.",
    stat: "4 dates",
    statLabel: "define the full lifecycle",
  },
  {
    label: "Resources",
    headline: "Give builders a head start",
    body: "Link your website, documentation, starter kits, and API references. The more accessible your technical resources, the faster builders can ship meaningful projects.",
    stat: "3×",
    statLabel: "faster starts with good docs",
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

export function HostApplicationForm(_props: HostApplicationFormProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [form, setForm] = useState({
    name: "",
    theme: "",
    program_goal: "",
    problem_statements: "",
    website_url: "",
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
    if (currentStep.id === "timeline") {
      if (
        !form.start_date.trim() ||
        !form.submission_deadline.trim() ||
        !form.judging_deadline.trim() ||
        !form.results_date.trim()
      ) {
        setError("Please set all dates (Start, Submission, Judging, Results) to continue.");
        return;
      }
    } else if (currentStep.id === "resources") {
      if (!form.website_url.trim()) {
        setError("Main website URL is required.");
        return;
      }
      const urlRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/i;
      if (!urlRegex.test(form.website_url.trim())) {
        setError("Please enter a valid URL for the website (e.g., https://...).");
        return;
      }
      for (const res of form.technical_resources) {
        if (!res.description.trim() || !res.url.trim()) {
          setError("All added technical resources must have both a name and a URL.");
          return;
        }
        if (!urlRegex.test(res.url.trim())) {
          setError(`Invalid URL format for resource: ${res.description}`);
          return;
        }
      }
    } else {
      const val = form[currentStep.field as FormField]?.toString().trim() || "";
      if (!val) {
        setError("This field is required.");
        return;
      }
      
      const wordCount = val.split(/\s+/).filter(Boolean).length;
      if (currentStep.type === "textarea" && wordCount < 5) {
        setError("Please provide more detail. At least 5 words are required.");
        return;
      }
      if (currentStep.type === "text" && wordCount < 2) {
        setError("Please provide more detail. At least 2 words are required.");
        return;
      }
      if (currentStep.id === "problem_statements" && wordCount < 10) {
        setError("Please provide more detail. At least 10 words are required for problem statements.");
        return;
      }
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
      const problemStatementsFromAi = (draft.draft.challenge_statements ?? [])
        .map((c) => {
          const title = (c.title ?? "").trim();
          const summary = (c.summary ?? "").trim();
          if (title && summary) return `${title} — ${summary}`;
          return title || summary;
        })
        .filter(Boolean);
      const problemStatementsFromUser = form.problem_statements
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const problemStatements =
        problemStatementsFromAi.length > 0 ? problemStatementsFromAi : problemStatementsFromUser;

      const hackathonId = draft.hackathon_id || crypto.randomUUID();
      const result = await saveHackathonAction({
        id: hackathonId,
        name: draft.draft.hackathon_name || form.name || "Untitled hackathon",
        description: draft.draft.overview || undefined,
        problem_statements: problemStatements,
        theme: form.theme || undefined,
        website_url: form.website_url || undefined,
        technical_resources:
          form.technical_resources.length > 0 ? form.technical_resources : undefined,
        bounty_pool_summary: form.bounty_pool_summary || undefined,
        program_goal: form.program_goal || undefined,
        start_date: form.start_date || undefined,
        submission_deadline: form.submission_deadline || undefined,
        judging_deadline: form.judging_deadline || undefined,
        results_date: form.results_date || undefined,
        organizer_notes: draft.draft.organizer_notes.join("\n") || undefined,
        judging_criteria: draft.draft.judging_criteria ?? [],
      });

      if (!result.success) throw new Error(result.error);
      router.push(`/host/${hackathonId}/manage/edit`);
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
                  fontFamily: FN,
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
                      <label
                        className="text-[9px] uppercase font-bold tracking-[0.1em] text-[#0F2C23]/40"
                        style={{ fontFamily: FN }}
                      >
                        {d.label}
                      </label>
                      <input
                        type="datetime-local"
                        value={form[d.field as FormField] as string}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, [d.field]: e.target.value }))
                        }
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
                    <label
                      className="text-[9px] uppercase font-bold tracking-[0.1em] text-[#0F2C23]/40"
                      style={{ fontFamily: FN }}
                    >
                      Main Website
                    </label>
                    <input
                      type="url"
                      value={form.website_url}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, website_url: e.target.value }))
                      }
                      placeholder="https://yourwebsite.com"
                      className="bg-white/40 border border-[#0F2C23]/10 rounded-xl px-4 py-3 outline-none focus:border-[#0F2C23] transition-all text-sm"
                      style={{ fontFamily: FN }}
                    />
                  </div>

                  <div className="space-y-4">
                    <label
                      className="text-[9px] uppercase font-bold tracking-[0.1em] text-[#0F2C23]/40"
                      style={{ fontFamily: FN }}
                    >
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
                              setForm((prev) => ({ ...prev, technical_resources: newRes }));
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
                              setForm((prev) => ({ ...prev, technical_resources: newRes }));
                            }}
                            className="flex-1 bg-white/40 border border-[#0F2C23]/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-[#0F2C23]"
                            style={{ fontFamily: FN }}
                          />
                          <button
                            onClick={() => {
                              const newRes = form.technical_resources.filter((_, idx) => idx !== i);
                              setForm((prev) => ({ ...prev, technical_resources: newRes }));
                            }}
                            className="p-3 text-[#0F2C23]/20 hover:text-[#0F2C23] transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            technical_resources: [
                              ...prev.technical_resources,
                              { url: "", description: "" },
                            ],
                          }))
                        }
                        className="flex items-center gap-2 text-[9px] uppercase font-bold tracking-widest text-[#0F2C23]/40 hover:text-[#0F2C23] transition-colors"
                        style={{ fontFamily: FN }}
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
                    fontFamily: FN,
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
                      fontFamily: FN,
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
                    fontFamily: FN,
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: "#F8FFE8",
                  }}
                >
                  {step === STEPS.length - 1 ? "Finish brief" : "Next"}
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ) : (
            /* ── Done state ── */
            <div>
              <p
                style={{
                  fontFamily: FN,
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
                  fontFamily: FN,
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
                      fontFamily: FN,
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
                      fontFamily: FN,
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
                    {isSaving ? "Saving…" : "Save as Draft"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => animateStep(0)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: FN,
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
                    fontFamily: FN,
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
                    fontFamily: FN,
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
                {/* <div
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
                      fontFamily: FN,
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
                      fontFamily: FN,
                      fontSize: 9,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: "rgba(226,254,165,0.3)",
                    }}
                  >
                    {filler.statLabel}
                  </span>
                </div> */}
              </div>

              {/* Bottom: answered so far */}
              {summary.length > 0 && (
                <div
                  style={{
                    borderTop: "1px solid rgba(226,254,165,0.08)",
                    padding: "24px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  {/* Progress Bar */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p
                        style={{
                          fontFamily: FN,
                          fontSize: 9,
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          fontWeight: 700,
                          color: "#E2FEA5",
                        }}
                      >
                        Knowledge Graph Updated
                      </p>
                      <span
                        style={{
                          fontFamily: FN,
                          fontSize: 10,
                          fontWeight: 700,
                          color: "rgba(226,254,165,0.6)",
                        }}
                      >
                        {Math.round((summary.length / STEPS.length) * 100)}%
                      </span>
                    </div>
                    {/* Progress Track */}
                    <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#E2FEA5] transition-all duration-500 ease-out" 
                        style={{ width: `${(summary.length / STEPS.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Recent Brief Answers */}
                  <div className="flex flex-col gap-3 mt-2">
                    {summary.slice(-4).map((s) => {
                    const val = form[s.field as FormField]?.toString().trim();
                    const truncated = val && val.length > 60 ? `${val.slice(0, 60)}…` : val;
                    return (
                      <div key={s.id} className="flex items-start gap-3">
                        <span
                          style={{
                            fontFamily: FN,
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
                    <h2
                      className="text-4xl font-black uppercase text-[#0F2C23] mb-4"
                      style={{ fontFamily: FN }}
                    >
                      Review Your Brief
                    </h2>
                    <p className="text-lg text-[#0F2C23]/60" style={{ fontFamily: FN }}>
                      Ready to let the AI architect your program?
                    </p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      {STEPS.map((s) => {
                        const val = form[s.field as FormField]?.toString().trim();
                        if (!val || s.id === "timeline" || s.id === "resources" || s.id === "bounty_pool_summary") return null;
                        return (
                          <div key={s.id}>
                            <p
                              className="text-[10px] uppercase font-bold tracking-widest text-[#0F2C23]/30 mb-2"
                              style={{ fontFamily: FN }}
                            >
                              {s.number} — {s.id}
                            </p>
                            <p
                              className="text-[15px] text-[#0F2C23]/80 leading-relaxed"
                              style={{ fontFamily: FN }}
                            >
                              {val}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="space-y-8">
                      <div>
                        <p
                          className="text-[10px] uppercase font-bold tracking-widest text-[#0F2C23]/30 mb-4"
                          style={{ fontFamily: FN }}
                        >
                          IMPORTANT DATES
                        </p>
                        <div className="bg-[#0F2C23] border border-[#E2FEA5]/10 rounded-2xl p-6 space-y-4 shadow-[0_20px_40px_-10px_rgba(15,44,35,0.2)]">
                          {[
                            { label: "Start", val: form.start_date },
                            { label: "Submit", val: form.submission_deadline },
                            { label: "Results", val: form.results_date },
                          ].map((d) => (
                            <div key={d.label} className="flex justify-between items-center border-b border-[#F8FFE8]/10 pb-3 last:border-0 last:pb-0">
                              <span
                                className="text-[10px] uppercase font-bold text-[#F8FFE8]/40"
                                style={{ fontFamily: FN }}
                              >
                                {d.label}
                              </span>
                              <span
                                className="text-sm font-medium text-[#E2FEA5]"
                                style={{ fontFamily: FN }}
                              >
                                {d.val ? new Date(d.val).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Not set"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {form.bounty_pool_summary && (
                        <div>
                          <p
                            className="text-[10px] uppercase font-bold tracking-widest text-[#0F2C23]/30 mb-4"
                            style={{ fontFamily: FN }}
                          >
                            BOUNTIES & PRIZES
                          </p>
                          <div className="bg-[#E2FEA5] border border-[#0F2C23]/10 rounded-3xl p-8 shadow-[0_20px_40px_-10px_rgba(226,254,165,0.4)] relative overflow-hidden">
                            <h3 className="text-4xl font-black text-[#0F2C23] tracking-tight mb-2" style={{ fontFamily: FN }}>
                              {form.bounty_pool_summary}
                            </h3>
                            <p className="text-[10px] text-[#0F2C23]/60 font-bold uppercase tracking-widest" style={{ fontFamily: FN }}>
                              Total Bounty Value
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BOTTOM ACTION BAR (SUMMARY) */}
                  <div className="fixed bottom-0 left-0 right-0 p-8 flex justify-center pointer-events-none z-50">
                    <div className="bg-[#0F2C23] border border-[#E2FEA5]/10 rounded-full p-2 flex gap-4 shadow-2xl pointer-events-auto items-center pl-6">
                      <button
                        onClick={() => setDone(false)}
                        className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-[#F8FFE8]/60 hover:text-[#E2FEA5] transition-colors"
                        style={{ fontFamily: FN }}
                      >
                        <Pencil size={12} />
                        Go Back and Make Edits
                      </button>
                      <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="px-8 py-3.5 bg-[#E2FEA5] text-[#0F2C23] rounded-full text-[10px] uppercase font-black tracking-widest hover:scale-[1.02] transition-transform flex items-center gap-3"
                        style={{ fontFamily: PX }}
                      >
                        {isGenerating ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Sparkles size={14} />
                        )}
                        {isGenerating ? "Synthesizing..." : "Generate Program Draft"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <HackathonProgramPreview draft={draft.draft} />

                  {/* ══ STICKY ACTION BAR (DRAFT) ══ */}
                  <div className="fixed bottom-0 left-0 right-0 p-8 flex justify-center pointer-events-none z-50">
                    <div className="bg-[#0F2C23] border border-[#E2FEA5]/10 rounded-full p-2.5 flex items-center gap-6 shadow-[0_20px_40px_-10px_rgba(15,44,35,0.4)] pointer-events-auto">
                      <div className="flex items-center gap-3 pl-6">
                        <Info size={14} className="text-[#E2FEA5]/60" />
                        <p
                          className="text-[11px] text-[#F8FFE8]/70 font-medium"
                          style={{ fontFamily: FN }}
                        >
                          Draft is editable later
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pl-4 border-l border-[#F8FFE8]/10">
                        <button
                          onClick={handleGenerate}
                          disabled={isGenerating}
                          className="text-[10px] uppercase font-bold tracking-widest text-[#F8FFE8]/80 px-6 py-3 rounded-full hover:bg-white/5 transition-colors"
                          style={{ fontFamily: FN }}
                        >
                          {isGenerating ? "Reasoning..." : "Re-Generate"}
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="text-[11px] uppercase font-black tracking-widest bg-[#E2FEA5] text-[#0F2C23] px-10 py-3.5 rounded-full hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-50 flex items-center gap-2"
                          style={{ fontFamily: PX }}
                        >
                          {isSaving ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <ArrowRight size={14} />
                          )}
                          {isSaving ? "Saving..." : "Save as Draft"}
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
