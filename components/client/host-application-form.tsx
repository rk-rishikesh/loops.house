"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Info,
  Pencil,
} from "lucide-react";
import { motion } from "framer-motion";
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
  theme: string;
  program_goal: string;
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
    placeholder:
      "What do you want this hackathon to achieve for builders and sponsors?",
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
        setError(
          "Please set all dates (Start, Submission, Judging, Results) to continue.",
        );
        return;
      }
    } else if (currentStep.id === "resources") {
      if (!form.website_url.trim()) {
        setError("Main website URL is required.");
        return;
      }
      const urlRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/i;
      if (!urlRegex.test(form.website_url.trim())) {
        setError(
          "Please enter a valid URL for the website (e.g., https://...).",
        );
        return;
      }
      for (const res of form.technical_resources) {
        if (!res.description.trim() || !res.url.trim()) {
          setError(
            "All added technical resources must have both a name and a URL.",
          );
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
        setError(
          "Please provide more detail. At least 10 words are required for problem statements.",
        );
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
      start_date: form.start_date || undefined,
      submission_deadline: form.submission_deadline || undefined,
      judging_deadline: form.judging_deadline || undefined,
      results_date: form.results_date || undefined,
      organizer_notes: form.organizer_notes
        ? [form.organizer_notes]
        : undefined,
    };

    startGenerating(async () => {
      try {
        const res = await fetch("/api/host-agents/hackathon-generator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hackathon: hackathonPayload }),
        });
        const json = await res.json();
        if (!res.ok)
          throw new Error(json.error || "Failed to generate program draft.");
        setDraft(json as HackathonProgramResponse);
        setSuccessMessage(
          "AI draft generated. Review below, then save your hackathon.",
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to run hackathon agent.",
        );
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
        problemStatementsFromAi.length > 0
          ? problemStatementsFromAi
          : problemStatementsFromUser;

      const aiPrizeSummary = (draft.draft.prizes ?? [])
        .map((p) => {
          const amount =
            typeof p.amount === "number" && p.amount > 0
              ? `${p.currency} ${p.amount}`
              : "";
          const parts = [p.title, amount].filter(Boolean).join(" — ");
          return p.description ? `${parts}\n${p.description}` : parts;
        })
        .filter(Boolean)
        .join("\n\n");

      const hackathonId = draft.hackathon_id || crypto.randomUUID();
      const result = await saveHackathonAction({
        id: hackathonId,
        name: draft.draft.hackathon_name || form.name || "Untitled hackathon",
        description: draft.draft.overview || undefined,
        problem_statements: problemStatements,
        theme: draft.draft.theme || form.theme || undefined,
        website_url: form.website_url || undefined,
        technical_resources:
          form.technical_resources.length > 0
            ? form.technical_resources
            : undefined,
        bounty_pool_summary:
          aiPrizeSummary || form.bounty_pool_summary || undefined,
        program_goal:
          draft.draft.program_goal || form.program_goal || undefined,
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
      setError(
        err instanceof Error ? err.message : "Failed to save hackathon.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const inputBase: React.CSSProperties = {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "rgba(15,44,35,0.06)",
    border: "none",
    borderRadius: 16,
    padding: "18px 22px",
    fontFamily: FN,
    fontSize: 16,
    color: "#0F2C23",
    outline: "none",
    transition: "background-color 0.2s ease",
    letterSpacing: "0.01em",
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#F8FFE8", fontFamily: FN }}
    >
      {/* ── Main split ──────────────────────────────────────────── */}
      <div className="flex flex-1">
        {/* ══ LEFT — question ═══════════════════════════════════════ */}
        <main className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-20 py-10">
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
                  fontFamily: FN,
                  fontSize: "clamp(40px, 6vw, 72px)",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  color: "rgba(15,44,35,0.2)",
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
                  fontSize: "clamp(28px, 4.5vw, 56px)",
                  letterSpacing: "-0.02em",
                  color: "#0F2C23",
                  textTransform: "uppercase",
                  lineHeight: 0.9,
                  marginTop: 40,
                  marginBottom: 10,
                }}
              >
                {currentStep.question}
              </h1>

              {/* Hint */}
              <p
                style={{
                  fontFamily: FN,
                  fontSize: "clamp(14px, 1.4vw, 16px)",
                  color: "rgba(15,44,35,0.6)",
                  lineHeight: 1.7,
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
                    setForm((prev) => ({
                      ...prev,
                      [currentStep.field]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  placeholder={currentStep.placeholder}
                  className="outline-none placeholder-[#2d4a3e]/30"
                  style={inputBase}
                  onFocus={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(15,44,35,0.1)")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(15,44,35,0.06)")
                  }
                />
              )}

              {currentStep.type === "date-group" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                  {[
                    { label: "Start Date", field: "start_date" },
                    {
                      label: "Submission Deadline",
                      field: "submission_deadline",
                    },
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
                          setForm((prev) => ({
                            ...prev,
                            [d.field]: e.target.value,
                          }))
                        }
                        className="outline-none transition-all text-sm placeholder-[#2d4a3e]/30"
                        style={{
                          ...inputBase,
                          maxWidth: "none",
                          padding: "12px 14px",
                          fontSize: 14,
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "rgba(15,44,35,0.1)")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "rgba(15,44,35,0.06)")
                        }
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
                        setForm((prev) => ({
                          ...prev,
                          website_url: e.target.value,
                        }))
                      }
                      placeholder="https://yourwebsite.com"
                      className="outline-none placeholder-[#2d4a3e]/30 transition-all text-sm"
                      style={{ ...inputBase, maxWidth: "none" }}
                      onFocus={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "rgba(15,44,35,0.1)")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "rgba(15,44,35,0.06)")
                      }
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
                        <div
                          key={i}
                          className="flex gap-2 animate-[fadeUp_0.2s_ease-out]"
                        >
                          <input
                            type="text"
                            placeholder="Resource Name (e.g. GitHub)"
                            value={res.description}
                            onChange={(e) => {
                              const newRes = [...form.technical_resources];
                              newRes[i].description = e.target.value;
                              setForm((prev) => ({
                                ...prev,
                                technical_resources: newRes,
                              }));
                            }}
                            className="w-1/3 outline-none placeholder-[#2d4a3e]/30 transition-all text-xs"
                            style={{
                              ...inputBase,
                              width: "auto",
                              maxWidth: "none",
                              padding: "12px 14px",
                              fontSize: 14,
                            }}
                            onFocus={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "rgba(15,44,35,0.1)")
                            }
                            onBlur={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "rgba(15,44,35,0.06)")
                            }
                          />
                          <input
                            type="url"
                            placeholder="https://..."
                            value={res.url}
                            onChange={(e) => {
                              const newRes = [...form.technical_resources];
                              newRes[i].url = e.target.value;
                              setForm((prev) => ({
                                ...prev,
                                technical_resources: newRes,
                              }));
                            }}
                            className="flex-1 outline-none placeholder-[#2d4a3e]/30 transition-all text-xs"
                            style={{
                              ...inputBase,
                              width: "auto",
                              maxWidth: "none",
                              padding: "12px 14px",
                              fontSize: 14,
                            }}
                            onFocus={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "rgba(15,44,35,0.1)")
                            }
                            onBlur={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "rgba(15,44,35,0.06)")
                            }
                          />
                          <button
                            onClick={() => {
                              const newRes = form.technical_resources.filter(
                                (_, idx) => idx !== i,
                              );
                              setForm((prev) => ({
                                ...prev,
                                technical_resources: newRes,
                              }));
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
                    setForm((prev) => ({
                      ...prev,
                      [currentStep.field]: e.target.value,
                    }))
                  }
                  placeholder={currentStep.placeholder}
                  className="resize-none outline-none placeholder-[#2d4a3e]/30 transition-all"
                  style={{ ...inputBase, lineHeight: 1.7 }}
                  onFocus={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(15,44,35,0.1)")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(15,44,35,0.06)")
                  }
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
              <div className="flex items-center gap-4 mt-12 flex-wrap">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "12px 20px",
                      borderRadius: 100,
                      border: "1.5px solid rgba(15,44,35,0.25)",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                      fontFamily: FN,
                      fontSize: 10,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: "#0F2C23",
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
                    padding: "12px 28px",
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
                Your answers are ready to hand off to the AI agent. It will turn
                your brief into a full program outline — challenges, judging
                criteria, schedule, and more.
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
        </main>

        {/* ══ RIGHT — step sidebar ═══════════════════════════════════ */}
        {!done && (
          <aside
            className="hidden lg:flex w-[400px] shrink-0 flex-col justify-between p-12 relative overflow-hidden"
            style={{ backgroundColor: "#0F2C23" }}
          >
            <div
              className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[120px] pointer-events-none"
              style={{ backgroundColor: "rgba(226,254,165,0.05)" }}
            />

            {/* Header / Big Number */}
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex items-baseline gap-4">
                <motion.span
                  key={step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-black leading-none"
                  style={{
                    fontFamily: FN,
                    fontSize: 120,
                    letterSpacing: "0.02em",
                    color: "#E2FEA5",
                    textShadow: "0 0 40px rgba(226,254,165,0.1)",
                  }}
                >
                  {String(step + 1).padStart(2, "0")}
                </motion.span>
                <div className="flex flex-col">
                  <p
                    className="text-[11px] tracking-[0.3em] uppercase font-black"
                    style={{ fontFamily: FN, color: "rgba(226,254,165,0.4)" }}
                  >
                    Current
                  </p>
                  <p
                    className="text-[11px] tracking-[0.3em] uppercase font-black"
                    style={{ fontFamily: FN, color: "rgba(226,254,165,0.4)" }}
                  >
                    Phase
                  </p>
                </div>
              </div>
              <div className="h-1 w-24 bg-[#E2FEA5]/10 rounded-full overflow-hidden mt-2">
                <motion.div
                  className="h-full bg-[#E2FEA5]"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((step + 1) / STEPS.length) * 100}%`,
                  }}
                  transition={{ duration: 0.6, ease: "circOut" }}
                />
              </div>
            </div>

            {/* Step Progress Stepper */}
            <div className="relative z-10 py-6">
              <div className="relative max-h-[55vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex flex-col gap-6">
                  {STEPS.map((s, absoluteIdx) => {
                    const isCur = absoluteIdx === step;
                    const isPast = absoluteIdx < step;

                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{
                          opacity: isCur ? 1 : isPast ? 0.6 : 0.2,
                          x: 0,
                        }}
                        className="group flex items-start gap-5"
                      >
                        {/* Node */}
                        <div className="relative z-20 shrink-0 mt-1">
                          {isPast ? (
                            <div className="w-[28px] h-[28px] rounded-full bg-[#E2FEA5] flex items-center justify-center">
                              <Check
                                size={14}
                                className="text-[#0F2C23] stroke-3"
                              />
                            </div>
                          ) : isCur ? (
                            <div className="relative">
                              <div className="relative w-[28px] h-[28px] rounded-full bg-[#E2FEA5] flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-[#0F2C23]" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center bg-[#0F2C23]">
                              <div className="w-1 h-1 rounded-full bg-white/20" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex flex-col pt-0.5 min-w-0">
                          <p
                            className="text-[9px] tracking-widest uppercase font-bold"
                            style={{
                              fontFamily: FN,
                              color: isCur
                                ? "#E2FEA5"
                                : "rgba(226,254,165,0.4)",
                            }}
                          >
                            Step {String(absoluteIdx + 1).padStart(2, "0")}
                          </p>
                          <h3
                            className="text-[14px] font-bold leading-tight truncate"
                            style={{
                              fontFamily: FN,
                              color: isCur
                                ? "#F8FFE8"
                                : "rgba(248,255,232,0.6)",
                            }}
                          >
                            {s.question.replace(/\?|\./g, "")}
                          </h3>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>
        )}

        {done && (
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
                  <p
                    className="text-lg text-[#0F2C23]/60"
                    style={{ fontFamily: FN }}
                  >
                    Ready to let the AI architect your program?
                  </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    {STEPS.map((s) => {
                      const val = form[s.field as FormField]?.toString().trim();
                      if (
                        !val ||
                        s.id === "timeline" ||
                        s.id === "resources" ||
                        s.id === "bounty_pool_summary"
                      )
                        return null;
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
                          <div
                            key={d.label}
                            className="flex justify-between items-center border-b border-[#F8FFE8]/10 pb-3 last:border-0 last:pb-0"
                          >
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
                              {d.val
                                ? new Date(d.val).toLocaleDateString(
                                    undefined,
                                    {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )
                                : "Not set"}
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
                          <h3
                            className="text-4xl font-black text-[#0F2C23] tracking-tight mb-2"
                            style={{ fontFamily: FN }}
                          >
                            {form.bounty_pool_summary}
                          </h3>
                          <p
                            className="text-[10px] text-[#0F2C23]/60 font-bold uppercase tracking-widest"
                            style={{ fontFamily: FN }}
                          >
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
                      {isGenerating
                        ? "Synthesizing..."
                        : "Generate Program Draft"}
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

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
