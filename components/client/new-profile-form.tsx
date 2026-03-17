"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Database,
  GraduationCap,
  Loader2,
  Network,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { ImageUpload, MultiImageUpload } from "@/components/client/image-upload";
import {
  KB_STEPS,
  type KBStepStatus,
  KnowledgeBasePanel,
} from "@/components/client/knowledge-base-panel";
import { saveProjectAction, saveTeamAction } from "@/lib/actions";
import type { StoredProject, StoredTeam } from "@/lib/data-mappers";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

// ─── Types ────────────────────────────────────────────────────────────────────
// STEPS and StepStatus are now imported from knowledge-base-panel.tsx

// Stricter builder profile schema (all key links required, richer description)
const builderProfileSchema = z.object({
  team_id: z.string().optional(),
  name: z.string().min(1, "Project name is required"),
  description: z
    .string()
    .min(80, "Please add a more detailed description (at least 80 characters)."),
  github_url: z.string().url("GitHub URL must be a valid link"),
  youtube_url: z.url("YouTube URL must be a valid link").optional(),
  logo_url: z.url("Logo is required"),
  website_url: z.url("Website URL must be a valid link"),
  screenshot_urls: z.string().optional(),
  social_links: z.string().optional(),
  hackathon_id: z.string().optional(),
});
type BuilderProfileInput = z.infer<typeof builderProfileSchema>;

// ─── Custom dropdown ──────────────────────────────────────────────────────────
function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Select…",
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full max-w-lg">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-200 border-none cursor-pointer"
        style={{
          backgroundColor: open ? "#0F2C23" : "rgba(15,44,35,0.06)",
          color: open ? "#F8FFE8" : selected ? "#0F2C23" : "rgba(15,44,35,0.55)",
        }}
      >
        <span className="font-semibold text-base" style={{ fontFamily: PX }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            color: open ? "#F8FFE8" : "rgba(15,44,35,0.7)",
          }}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 z-50 mt-1 rounded-2xl overflow-hidden shadow-xl"
          style={{ backgroundColor: "#0F2C23" }}
        >
          {options.map((opt, i) => {
            const isSel = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left cursor-pointer border-none transition-colors duration-100"
                style={{
                  fontFamily: FN,
                  fontSize: 14,
                  color: isSel ? "#F8FFE8" : "rgba(226,254,165,0.75)",
                  backgroundColor: isSel ? "rgba(226,254,165,0.16)" : "transparent",
                  borderBottom:
                    i < options.length - 1 ? "1px solid rgba(226,254,165,0.16)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isSel)
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "rgba(226,254,165,0.1)";
                }}
                onMouseLeave={(e) => {
                  if (!isSel)
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
              >
                {opt.label}
                {isSel && <Check size={13} style={{ color: "#F8FFE8" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ProgressPanel has been moved to knowledge-base-panel.tsx as KnowledgeBasePanel

// ─── Props ────────────────────────────────────────────────────────────────────
interface NewProfileFormProps {
  teams: StoredTeam[];
  userId: string;
  initialTeamId?: string;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function NewProfileForm({ teams, userId: _userId, initialTeamId }: NewProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState<Record<string, KBStepStatus>>({});
  const [progressErrors, setProgressErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [animDir, setAnimDir] = useState<1 | -1>(1);
  const [animKey, setAnimKey] = useState(0);
  const hasAppliedDefaults = useRef(false);
  const [screenshotFiles, setScreenshotFiles] = useState<string[]>([]);
  const [showIntro, setShowIntro] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    control,
    formState: { errors, isValid },
    watch,
  } = useForm<BuilderProfileInput>({
    resolver: zodResolver(builderProfileSchema),
    mode: "onChange",
    defaultValues: {
      team_id: "",
      name: "",
      description: "",
      github_url: "",
      logo_url: "",
      website_url: "",
      social_links: "",
    },
  });

  useEffect(() => {
    if (hasAppliedDefaults.current) return;
    const validUrlTeam =
      initialTeamId && teams.some((t) => t.id === initialTeamId) ? initialTeamId : null;
    if (!validUrlTeam) return;
    reset((prev) => ({
      ...prev,
      team_id: validUrlTeam,
    }));
    hasAppliedDefaults.current = true;
  }, [initialTeamId, teams, reset]);

  const FORM_STEPS: {
    key: keyof BuilderProfileInput;
    label: string;
    sub: string;
    optional?: boolean;
    placeholder?: string;
    type?: string;
    multiline?: boolean;
    upload?: "logo" | "screenshots";
  }[] = [
    {
      key: "name",
      label: "Name your project.",
      sub: "A great name is memorable and clear.",
      placeholder: "My awesome project…",
    },
    {
      key: "description",
      label: "Describe what it does.",
      sub: "A few sentences about what makes it special.",
      placeholder: "A platform that helps teams…",
      multiline: true,
    },
    {
      key: "github_url",
      label: "Where's the code?",
      sub: "Link your GitHub repository.",
      placeholder: "https://github.com/user/repo",
      type: "url",
    },
    {
      key: "youtube_url",
      label: "Got a demo video?",
      sub: "Paste your YouTube demo link.",
      placeholder: "https://youtube.com/watch?v=…",
      type: "url",
    },
    {
      key: "logo_url",
      label: "Upload a logo.",
      sub: "Show off your brand identity.",
      upload: "logo",
    },
    {
      key: "screenshot_urls",
      label: "Any screenshots?",
      sub: "Upload images that show what you built.",
      upload: "screenshots",
    },
    {
      key: "website_url",
      label: "Where can people find it?",
      sub: "Your live project URL.",
      placeholder: "https://myproject.com",
      type: "url",
    },
    {
      key: "social_links",
      label: "Social links to share?",
      sub: "Format: Label, URL — one per line.",
      optional: true,
      placeholder: "Twitter, https://twitter.com/…",
      multiline: true,
    },
    ...(teams.length > 0
      ? [
          {
            key: "team_id" as keyof BuilderProfileInput,
            label: "Assign to an existing team?",
            sub: "Or we\u2019ll auto-create one for you.",
            optional: true,
          },
        ]
      : []),
    // TODO: Hackathon linking removed — submissions handle hackathon association now.
    // Future: add policy to prevent >1 submission per user per hackathon.
    // Tracking algorithm: get all user teams → get team projects → check if any
    // team→project already has a submission for that hackathon before allowing a new one.
  ];

  const totalSteps = FORM_STEPS.length;
  const activeStep = FORM_STEPS[Math.min(currentStep, totalSteps - 1)];
  const isLastStep = currentStep === totalSteps - 1;
  const projectName = watch("name");

  const navigateTo = (next: number, dir: 1 | -1) => {
    setAnimDir(dir);
    setAnimKey((k) => k + 1);
    setCurrentStep(next);
  };

  const handleNext = async () => {
    if (!activeStep) return;
    setError(null);
    const ok = await trigger(activeStep.key);
    if (!ok && !activeStep.optional) return;
    if (currentStep < totalSteps - 1) navigateTo(currentStep + 1, 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) navigateTo(currentStep - 1, -1);
  };

  const onSubmit = useCallback(
    async (data: BuilderProfileInput) => {
      setError(null);
      setProgressErrors({});
      setLoading(true);
      KB_STEPS.forEach((s) => setProgress((p) => ({ ...p, [s]: "pending" })));

      // Enforce at least 4 screenshots
      if (screenshotFiles.length < 2) {
        setError("Please upload at least 2 screenshots of your project.");
        setLoading(false);
        return;
      }

      // Auto-create team if none selected
      let resolvedTeamId = data.team_id;
      if (!resolvedTeamId) {
        const teamName = `${data.name}(Team)`;
        const result = await saveTeamAction({ name: teamName });
        if (!result.success) {
          setError(result.error || "Failed to auto-create team");
          setLoading(false);
          return;
        }
        resolvedTeamId = result.data.id;
      }

      const screenshotUrls = screenshotFiles.length > 0 ? screenshotFiles : undefined;
      const socialLinks = data.social_links
        ? data.social_links
            .split("\n")
            .map((line) => {
              const trimmed = line.trim();
              if (!trimmed) return null;
              const comma = trimmed.indexOf(",");
              if (comma > 0)
                return {
                  label: trimmed.slice(0, comma).trim(),
                  url: trimmed.slice(comma + 1).trim(),
                };
              return { label: trimmed, url: trimmed };
            })
            .filter((x): x is { label: string; url: string } => x !== null && Boolean(x.url))
        : undefined;

      try {
        const res = await fetch("/api/builder-agents/profile-creator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            team_id: resolvedTeamId,
            screenshot_urls: screenshotUrls,
            social_links: socialLinks,
          }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || json.message || "Profile creation failed");
        }
        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let lastComplete: Record<string, unknown> | null = null;
        let serverError: string | null = null;
        let currentEvent: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7).trim();
              continue;
            }
            if (!line.startsWith("data: ")) continue;
            const chunk = line.slice(6);
            if (chunk === "[DONE]") continue;
            try {
              const parsed = JSON.parse(chunk) as Record<string, unknown>;
              if (typeof parsed.message === "string") serverError = parsed.message;
              if (typeof parsed.step === "string") {
                const status = (
                  ["done", "failed", "skipped"].includes(parsed.status as string)
                    ? parsed.status
                    : "started"
                ) as KBStepStatus;
                setProgress((p) => ({ ...p, [parsed.step as string]: status }));
                if (parsed.status === "failed" && typeof parsed.error === "string")
                  setProgressErrors((e) => ({
                    ...e,
                    [parsed.step as string]: parsed.error as string,
                  }));
              }
              if (currentEvent === "complete" && typeof parsed.project_id === "string")
                lastComplete = parsed;
              if (
                currentEvent === "flattened_codebase" &&
                lastComplete &&
                parsed.project_id === lastComplete.project_id &&
                typeof parsed.flattened_codebase === "string"
              )
                lastComplete = { ...lastComplete, flattened_codebase: parsed.flattened_codebase };
            } catch {
              /* ignore */
            }
          }
        }

        if (serverError && !lastComplete) throw new Error(serverError);
        if (lastComplete && typeof lastComplete.project_id === "string") {
          const result = await saveProjectAction({
            ...lastComplete,
            team_id: resolvedTeamId,
            created_at: new Date().toISOString(),
          } as StoredProject);
          if (!result.success) throw new Error(result.error);
          router.push(`/builder/projects/${lastComplete.project_id}`);
          return;
        }
        throw new Error(serverError || "No profile data received.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [router, screenshotFiles],
  );

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

  const animStyle: React.CSSProperties = {
    animation: `${animDir > 0 ? "slideUpIn" : "slideDownIn"} 0.38s cubic-bezier(0.22,1,0.36,1) both`,
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F8FFE8" }}>
      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1">
        {/* LEFT — form / intro */}
        <main className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-20 py-10">
          {loading ? (
            <div className="h-full min-h-[70vh] flex items-stretch">
              <KnowledgeBasePanel progress={progress} errors={progressErrors} />
            </div>
          ) : showIntro ? (
            <section className="w-full">
              <div className="grid lg:grid-cols-[1.2fr,1fr] gap-8 lg:gap-16 items-center">
                {/* Left Panel */}
                <div className="flex flex-col items-start text-left">
                  <div className=" flex flex-row gap-12">
                    <h1
                      className="font-black text-[#0F2C23] leading-[0.85] uppercase mb-6"
                      style={{
                        fontFamily: PX,
                        fontSize: "clamp(48px, 6.2vw, 88px)",
                        letterSpacing: "-0.04em",
                      }}
                    >
                      PROJECT
                      <br />
                      ONBOARDING.
                    </h1>
                    <p
                      className="leading-relaxed mb-8 max-w-xl"
                      style={{
                        fontFamily: FN,
                        fontSize: "clamp(15px, 1.25vw, 18px)",
                        color: "rgba(15,44,35,0.6)",
                      }}
                    >
                      Your project pipeline from raw links to an{" "}
                      <span className="text-[#0F2C23] font-bold">AI-ready knowledge graph</span>.
                      Ship faster with agents that actually understand your codebase.
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-4">
                    <button
                      type="button"
                      onClick={() => setShowIntro(false)}
                      className="group relative inline-flex items-center gap-4 rounded-full border-none cursor-pointer px-10 py-5 overflow-hidden transition-all duration-300 active:scale-95"
                      style={{
                        backgroundColor: "#0F2C23",
                        boxShadow: "0 20px 40px -10px rgba(15, 44, 35, 0.4)",
                      }}
                    >
                      <div className="absolute inset-0 bg-[#E2FEA5] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      <span
                        className="relative z-10 text-[10px] font-black tracking-[0.2em] uppercase transition-colors duration-300 text-[#F8FFE8] group-hover:text-[#0F2C23]"
                        style={{ fontFamily: PX }}
                      >
                        Initialize Creator
                      </span>
                      <ArrowRight
                        size={14}
                        className="relative z-10 transition-all duration-300 text-[#F8FFE8] group-hover:text-[#0F2C23] group-hover:translate-x-1"
                      />
                    </button>
                    <p
                      className="text-[9px] pl-2 uppercase font-bold tracking-[0.2em]"
                      style={{ fontFamily: PX, color: "rgba(15,44,35,0.35)" }}
                    >
                      Process time: ~2 minutes
                    </p>
                  </div>
                </div>

                {/* Right Panel: Cards in 2x2 Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
                  {[
                    {
                      num: "01",
                      icon: <Database size={20} />,
                      title: "Feed project.",
                      desc: "Drop your repo & demo. We handle the rest.",
                    },
                    {
                      num: "02",
                      icon: <Network size={20} />,
                      title: "Build graph.",
                      desc: "Engine crawls repo to build deep project context.",
                    },
                    {
                      num: "03",
                      icon: <Sparkles size={20} />,
                      title: "Ideator ON.",
                      desc: "Riff on ideas and positions with your project agent.",
                    },
                    {
                      num: "04",
                      icon: <GraduationCap size={20} />,
                      title: "Mentor LIVE.",
                      desc: "A personal coach that helps you ship quality code.",
                    },
                  ].map((step) => (
                    <div
                      key={step.num}
                      className="flex flex-col gap-4 p-7 rounded-[32px] border border-[#0F2C23]/5 transition-all duration-300 hover:border-[#0F2C23]/10 hover:shadow-lg hover:scale-[1.03]"
                      style={{ backgroundColor: "rgba(226, 254, 165, 0.4)" }}
                    >
                      <div className="flex justify-between items-start">
                        <span
                          className="font-black text-[24px] leading-none opacity-20"
                          style={{ fontFamily: PX, color: "#0F2C23" }}
                        >
                          {step.num}
                        </span>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#0F2C23] text-[#E2FEA5]">
                          {step.icon}
                        </div>
                      </div>
                      <div>
                        <h3
                          className="font-bold text-[15px] mb-1.5 uppercase tracking-tight"
                          style={{ fontFamily: PX, color: "#0F2C23" }}
                        >
                          {step.title}
                        </h3>
                        <p
                          className="text-[12px] leading-relaxed opacity-70"
                          style={{ fontFamily: FN, color: "#0F2C23" }}
                        >
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step header */}
              <div key={`hdr-${animKey}`} style={{ ...animStyle, marginBottom: 40 }}>
                <div className="flex items-center gap-3 mb-5">
                  <span
                    className="font-black leading-none"
                    style={{
                      fontFamily: PX,
                      fontSize: "clamp(40px, 6vw, 72px)",
                      letterSpacing: "-0.03em",
                      color: "rgba(15,44,35,0.2)",
                    }}
                  >
                    {String(currentStep + 1).padStart(2, "0")}
                  </span>
                </div>
                <h1
                  className="font-black text-[#0F2C23] leading-[0.9] uppercase mb-4"
                  style={{
                    fontFamily: PX,
                    fontSize: "clamp(28px, 4.5vw, 56px)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {activeStep?.label}
                </h1>
                <p
                  className="leading-relaxed"
                  style={{
                    fontFamily: FN,
                    fontSize: "clamp(14px, 1.4vw, 16px)",
                    color: "rgba(15,44,35,0.6)",
                  }}
                >
                  {activeStep?.sub}
                </p>
              </div>

              {/* Input */}
              <div key={`inp-${animKey}`} style={{ ...animStyle, animationDelay: "0.06s" }}>
                {/* team_id — optional, only shown when user has teams */}
                {activeStep?.key === "team_id" && teams.length > 0 && (
                  <Controller
                    name="team_id"
                    control={control}
                    render={({ field }) => (
                      <CustomDropdown
                        options={[
                          { value: "", label: `Auto-create: ${projectName || "Project"}(Team)` },
                          ...teams.map((t) => ({ value: t.id, label: t.name })),
                        ]}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder={`Auto-create: ${projectName || "Project"}(Team)`}
                      />
                    )}
                  />
                )}

                {/* Upload inputs */}
                {activeStep?.upload === "logo" && (
                  <Controller
                    name="logo_url"
                    control={control}
                    render={({ field }) => (
                      <ImageUpload
                        value={field.value}
                        onChange={field.onChange}
                        variant="square"
                        placeholder="Upload logo"
                      />
                    )}
                  />
                )}

                {activeStep?.upload === "screenshots" && (
                  <MultiImageUpload
                    value={screenshotFiles}
                    onChange={(urls) => setScreenshotFiles(urls)}
                    max={10}
                    placeholder="Upload screenshots"
                  />
                )}

                {/* Social links — compact rows with add button */}
                {activeStep?.key === "social_links" && (
                  <Controller
                    name="social_links"
                    control={control}
                    render={({ field }) => {
                      const items = (field.value ?? "").split("\n");
                      if (items.length === 0) items.push("");

                      const updateItem = (index: number, value: string) => {
                        const next = [...items];
                        next[index] = value;
                        field.onChange(next.join("\n"));
                      };

                      const addItem = () => {
                        field.onChange([...items, ""].join("\n"));
                      };

                      const removeItem = (index: number) => {
                        const next = items.filter((_, i) => i !== index);
                        field.onChange((next.length ? next : [""]).join("\n"));
                      };

                      return (
                        <div className="flex flex-col gap-3">
                          {items.map((val, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={val}
                                onChange={(e) => updateItem(idx, e.target.value)}
                                placeholder="Label, https://link.com/…"
                                className="outline-none placeholder-[#2d4a3e]/30"
                                style={{
                                  ...inputBase,
                                  maxWidth: 420,
                                  paddingTop: 12,
                                  paddingBottom: 12,
                                  fontSize: 14,
                                }}
                                onFocus={(e) =>
                                  (e.currentTarget.style.backgroundColor = "rgba(15,44,35,0.1)")
                                }
                                onBlur={(e) =>
                                  (e.currentTarget.style.backgroundColor = "rgba(15,44,35,0.06)")
                                }
                              />
                              {items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeItem(idx)}
                                  className="flex items-center justify-center rounded-full border-none cursor-pointer"
                                  style={{
                                    width: 26,
                                    height: 26,
                                    backgroundColor: "rgba(15,44,35,0.06)",
                                    color: "rgba(15,44,35,0.7)",
                                  }}
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={addItem}
                            className="inline-flex items-center justify-center gap-2 border-none cursor-pointer text-[10px] tracking-widest uppercase font-bold mt-1"
                            style={{
                              fontFamily: PX,
                              width: "100%",
                              maxWidth: 420,
                              borderRadius: 16,
                              paddingTop: 12,
                              paddingBottom: 12,
                              backgroundColor: "rgba(15,44,35,0.06)",
                              color: "#0F2C23",
                            }}
                          >
                            <Plus size={12} /> Add link
                          </button>
                        </div>
                      );
                    }}
                  />
                )}

                {/* Text / URL inputs */}
                {activeStep?.key !== "team_id" &&
                  activeStep?.key !== "social_links" &&
                  !activeStep?.upload &&
                  (activeStep?.multiline ? (
                    <textarea
                      rows={4}
                      placeholder={activeStep.placeholder}
                      {...register(activeStep.key)}
                      className="resize-none outline-none placeholder-[#2d4a3e]/30"
                      style={{ ...inputBase, fontFamily: FN, lineHeight: 1.7 }}
                      onFocus={(e) =>
                        (e.currentTarget.style.backgroundColor = "rgba(15,44,35,0.1)")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.backgroundColor = "rgba(15,44,35,0.06)")
                      }
                    />
                  ) : (
                    <input
                      type={activeStep?.type ?? "text"}
                      placeholder={activeStep?.placeholder}
                      {...register(activeStep!.key)}
                      className="outline-none placeholder-[#2d4a3e]/30"
                      style={inputBase}
                      onFocus={(e) =>
                        (e.currentTarget.style.backgroundColor = "rgba(15,44,35,0.1)")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.backgroundColor = "rgba(15,44,35,0.06)")
                      }
                    />
                  ))}

                {/* Field error */}
                {activeStep?.key && errors[activeStep.key] && (
                  <p className="mt-2 text-sm" style={{ fontFamily: FN, color: "#c0392b" }}>
                    {errors[activeStep.key]?.message as string}
                  </p>
                )}

                {/* Error */}
                {error && !loading && (
                  <p className="mt-4 text-sm" style={{ fontFamily: FN, color: "#c0392b" }}>
                    {error}
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div
                key={`btn-${animKey}`}
                className="flex items-center gap-4 mt-12 flex-wrap"
                style={{ ...animStyle, animationDelay: "0.12s" }}
              >
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-full cursor-pointer transition-all duration-200 hover:opacity-70 text-[10px] tracking-widest uppercase font-bold px-5 py-3"
                    style={{
                      backgroundColor: "transparent",
                      color: "#0F2C23",
                      border: "1.5px solid rgba(15,44,35,0.25)",
                      fontFamily: PX,
                    }}
                  >
                    <ArrowLeft size={11} /> Back
                  </button>
                )}

                {!isLastStep ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-full border-none cursor-pointer transition-all duration-200 hover:opacity-90 text-[10px] tracking-widest uppercase font-bold px-7 py-3"
                    style={{
                      backgroundColor: "#0F2C23",
                      color: "#F8FFE8",
                      fontFamily: PX,
                    }}
                  >
                    Continue <ArrowRight size={12} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || !isValid}
                    className="inline-flex items-center gap-2 rounded-full border-none cursor-pointer transition-all duration-200 hover:opacity-90 disabled:opacity-40 text-[10px] tracking-widest uppercase font-bold px-7 py-3"
                    style={{
                      backgroundColor: "#0F2C23",
                      color: "#F8FFE8",
                      fontFamily: PX,
                    }}
                  >
                    {loading && <Loader2 size={12} className="animate-spin" />}
                    {loading ? "Creating…" : "Create Profile"}
                  </button>
                )}
              </div>
            </form>
          )}
        </main>

        {/* RIGHT — decorative sidebar (only during questions) */}
        {!showIntro && !loading && (
          <aside
            className="hidden lg:flex w-[400px] shrink-0 flex-col justify-between p-12 relative overflow-hidden"
            style={{ backgroundColor: "#0F2C23" }}
          >
            {/* Background Effects */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(226,254,165,0.2) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
            <div
              className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[120px] pointer-events-none"
              style={{ backgroundColor: "rgba(226,254,165,0.05)" }}
            />

            {/* Header / Big Number */}
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex items-baseline gap-4">
                <motion.span
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-black leading-none"
                  style={{
                    fontFamily: PX,
                    fontSize: 120,
                    letterSpacing: "-0.06em",
                    color: "#E2FEA5",
                    textShadow: "0 0 40px rgba(226,254,165,0.1)",
                  }}
                >
                  {String(currentStep + 1).padStart(2, "0")}
                </motion.span>
                <div className="flex flex-col">
                  <p
                    className="text-[11px] tracking-[0.3em] uppercase font-black"
                    style={{ fontFamily: PX, color: "rgba(226,254,165,0.4)" }}
                  >
                    Current
                  </p>
                  <p
                    className="text-[11px] tracking-[0.3em] uppercase font-black"
                    style={{ fontFamily: PX, color: "rgba(226,254,165,0.4)" }}
                  >
                    Phase
                  </p>
                </div>
              </div>
              <div className="h-1 w-24 bg-[#E2FEA5]/10 rounded-full overflow-hidden mt-2">
                <motion.div
                  className="h-full bg-[#E2FEA5]"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                  transition={{ duration: 0.6, ease: "circOut" }}
                />
              </div>
            </div>

            {/* Step Progress Stepper */}
            <div className="relative z-10 py-6">
              <div className="absolute left-[15px] top-8 bottom-8 w-px bg-white/5" />

              <div className="flex flex-col gap-6">
                {FORM_STEPS.slice(
                  Math.max(0, Math.min(currentStep - 1, totalSteps - 5)),
                  Math.max(5, currentStep + 4),
                ).map((step) => {
                  const absoluteIdx = FORM_STEPS.indexOf(step);
                  const isCur = absoluteIdx === currentStep;
                  const isPast = absoluteIdx < currentStep;

                  return (
                    <motion.div
                      key={step.key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: isCur ? 1 : isPast ? 0.6 : 0.2, x: isCur ? 4 : 0 }}
                      className="group flex items-start gap-5"
                    >
                      {/* Node */}
                      <div className="relative z-20 flex-shrink-0 mt-1">
                        {isPast ? (
                          <div className="w-[28px] h-[28px] rounded-full bg-[#E2FEA5] flex items-center justify-center">
                            <Check size={14} className="text-[#0F2C23] stroke-[3]" />
                          </div>
                        ) : isCur ? (
                          <div className="relative">
                            <motion.div
                              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute inset-0 rounded-full bg-[#E2FEA5]"
                            />
                            <div className="relative w-[28px] h-[28px] rounded-full bg-[#E2FEA5] shadow-[0_0_15px_rgba(226,254,165,0.3)] flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-[#0F2C23]" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-[28px] h-[28px] rounded-full border border-white/20 flex items-center justify-center bg-[#0F2C23]">
                            <div className="w-1 h-1 rounded-full bg-white/20" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex flex-col pt-0.5 min-w-0">
                        <p
                          className="text-[9px] tracking-widest uppercase font-bold"
                          style={{
                            fontFamily: PX,
                            color: isCur ? "#E2FEA5" : "rgba(226,254,165,0.4)",
                          }}
                        >
                          Step {String(absoluteIdx + 1).padStart(2, "0")}
                        </p>
                        <h3
                          className="text-[14px] font-bold leading-tight truncate"
                          style={{
                            fontFamily: FN,
                            color: isCur ? "#F8FFE8" : "rgba(248,255,232,0.6)",
                          }}
                        >
                          {step.label.replace(/\?|\./g, "")}
                        </h3>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="relative z-10">
              <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-4 overflow-hidden">
                <div className="shrink-0 w-10 h-10 rounded-full bg-[#E2FEA5]/10 flex items-center justify-center">
                  <div className="flex gap-1">
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-[#E2FEA5]"
                    />
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                      className="w-1.5 h-1.5 rounded-full bg-[#E2FEA5]"
                    />
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                      className="w-1.5 h-1.5 rounded-full bg-[#E2FEA5]"
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <p
                    className="text-[10px] uppercase font-black tracking-widest text-[#E2FEA5]/40"
                    style={{ fontFamily: PX }}
                  >
                    System Processing
                  </p>
                  <p className="text-[14px] font-bold text-[#F8FFE8]" style={{ fontFamily: FN }}>
                    Building Knowledge base
                  </p>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      <style>{`
        @keyframes slideUpIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDownIn {
          from { opacity: 0; transform: translateY(-18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        textarea::placeholder, input::placeholder { color: rgba(15,44,35,0.4); }
      `}</style>
    </div>
  );
}
