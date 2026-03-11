"use client";

import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Check, X, Minus, ChevronDown, ArrowUpRight } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTeams, useHackathons, useSaveProject } from "@/lib/queries";
import { useAuth } from "@/app/providers";
import { createProfileSchema, type CreateProfileSchema } from "@/lib/validations/schemas";

// ─── Types ────────────────────────────────────────────────────────────────────
const STEPS = ["code-reader", "demo-reader", "theme-reader", "knowledge-base"] as const;
type StepStatus = "pending" | "started" | "done" | "failed" | "skipped";

// ─── Dropdown ─────────────────────────────────────────────────────────────────
interface DropdownOption { value: string; label: string }

function CustomDropdown({
  options, value, onChange, placeholder = "Select…",
}: {
  options: DropdownOption[];
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
          backgroundColor: open ? "#2d4a3e" : "#d6cfc0",
          color: open ? "#f0ebe0" : (selected ? "#2d4a3e" : "rgba(45,74,62,0.45)"),
        }}
      >
        <span
          className="font-semibold text-base"
          style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "0.01em" }}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            color: open ? "#f0ebe0" : "#2d4a3e",
          }}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 z-50 mt-1 rounded-2xl overflow-hidden shadow-xl"
          style={{ backgroundColor: "#2d4a3e" }}
        >
          {options.map((opt, i) => {
            const isSel = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left cursor-pointer border-none transition-colors duration-100"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14,
                  color: isSel ? "#f0ebe0" : "rgba(240,235,224,0.6)",
                  backgroundColor: isSel ? "rgba(240,235,224,0.12)" : "transparent",
                  borderBottom: i < options.length - 1 ? "1px solid rgba(240,235,224,0.07)" : "none",
                }}
                onMouseEnter={(e) => { if (!isSel) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(240,235,224,0.07)"; }}
                onMouseLeave={(e) => { if (!isSel) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
              >
                {opt.label}
                {isSel && <Check size={13} style={{ color: "#f0ebe0" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Progress step indicator ──────────────────────────────────────────────────
function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? 24 : 6,
            height: 6,
            backgroundColor: i === current
              ? "#2d4a3e"
              : i < current
              ? "rgba(45,74,62,0.4)"
              : "rgba(45,74,62,0.15)",
          }}
        />
      ))}
    </div>
  );
}

// ─── Progress panel ───────────────────────────────────────────────────────────
function ProgressPanel({
  steps, progress, errors,
}: {
  steps: readonly string[];
  progress: Record<string, StepStatus>;
  errors: Record<string, string>;
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#2d4a3e" }}>
      <div className="px-6 py-4 border-b border-[#f0ebe0]/08">
        <p
          className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#f0ebe0]/50"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Analysing your project…
        </p>
      </div>
      <div className="px-6 py-5 flex flex-col gap-3">
        {steps.map((s) => {
          const status = progress[s] ?? "pending";
          return (
            <div key={s} className="flex items-center gap-3">
              <span className="shrink-0">
                {status === "done"    && <Check size={14} style={{ color: "#d6cfc0" }} />}
                {status === "failed"  && <X size={14} style={{ color: "#ff8080" }} />}
                {status === "skipped" && <Minus size={14} style={{ color: "rgba(240,235,224,0.3)" }} />}
                {status === "started" && <Loader2 size={14} className="animate-spin" style={{ color: "#d6cfc0" }} />}
                {status === "pending" && (
                  <span className="block w-3.5 h-3.5 rounded-full" style={{ backgroundColor: "rgba(240,235,224,0.15)" }} />
                )}
              </span>
              <span
                className="text-[13px] flex-1"
                style={{
                  fontFamily: "Georgia, serif",
                  color: status === "done" ? "#f0ebe0" : status === "failed" ? "#ff8080" : "rgba(240,235,224,0.45)",
                }}
              >
                {s.replace(/-/g, " ")}
              </span>
              {status === "failed" && errors[s] && (
                <span className="text-[10px] text-[#ff8080] opacity-70 max-w-[120px] truncate">
                  {errors[s]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function NewProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f0ebe0" }}>
        <Loader2 size={20} className="animate-spin text-[#2d4a3e]" />
      </div>
    }>
      <NewProfileContent />
    </Suspense>
  );
}

function NewProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState<Record<string, StepStatus>>({});
  const [progressErrors, setProgressErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [animDir, setAnimDir] = useState<1 | -1>(1);
  const [animKey, setAnimKey] = useState(0);
  const hasAppliedDefaults = useRef(false);

  const { data: teams = [] } = useTeams(user?.id);
  const { data: hackathons = [] } = useHackathons();
  const saveProjectMutation = useSaveProject();

  const teamIdFromUrl = searchParams.get("team_id");
  const hackathonIdFromUrl = searchParams.get("hackathon_id");

  const {
    register, handleSubmit, reset, trigger, control,
    formState: { errors, isValid },
    watch,
  } = useForm<CreateProfileSchema>({
    resolver: zodResolver(createProfileSchema),
    mode: "onChange",
    defaultValues: {
      team_id: "", name: "", description: "", github_url: "", youtube_url: "",
      logo_url: "", website_url: "", screenshot_urls: "", social_links: "", hackathon_id: "",
    },
  });

  useEffect(() => {
    if (hasAppliedDefaults.current) return;
    const validUrlTeam = teamIdFromUrl && teams.some((t) => t.id === teamIdFromUrl) ? teamIdFromUrl : null;
    const fallbackTeamId = teams[0]?.id ?? "";
    const validUrlHackathon = hackathonIdFromUrl && hackathons.some((b) => b.id === hackathonIdFromUrl) ? hackathonIdFromUrl : null;
    if (!validUrlTeam && !fallbackTeamId && !validUrlHackathon) return;
    reset((prev) => ({
      ...prev,
      team_id: validUrlTeam ?? (prev.team_id || fallbackTeamId),
      hackathon_id: validUrlHackathon ?? prev.hackathon_id,
    }));
    hasAppliedDefaults.current = true;
  }, [teamIdFromUrl, hackathonIdFromUrl, teams, hackathons, reset]);

  const FORM_STEPS: {
    key: keyof CreateProfileSchema;
    label: string;
    sub: string;
    optional?: boolean;
    placeholder?: string;
    type?: string;
    multiline?: boolean;
  }[] = [
    { key: "team_id",          label: "Which team is this for?",     sub: "Select the team this profile belongs to." },
    { key: "name",             label: "Name your project.",           sub: "A great name is memorable and clear.",                                          placeholder: "My awesome project…" },
    { key: "description",      label: "Describe what it does.",       sub: "A few sentences about what makes it special.",                                  placeholder: "A platform that helps teams…", multiline: true },
    { key: "github_url",       label: "Where's the code?",            sub: "Link your GitHub repository.",              optional: true,                      placeholder: "https://github.com/user/repo",   type: "url" },
    { key: "youtube_url",      label: "Got a demo video?",            sub: "Paste your YouTube demo link.",             optional: true,                      placeholder: "https://youtube.com/watch?v=…",  type: "url" },
    { key: "logo_url",         label: "Add a logo URL.",              sub: "Show off your brand identity.",             optional: true,                      placeholder: "https://example.com/logo.png",   type: "url" },
    { key: "screenshot_urls",  label: "Any screenshots?",             sub: "One URL per line — show what you built.",   optional: true,                      placeholder: "https://example.com/screen.png", multiline: true },
    { key: "website_url",      label: "Where can people find it?",    sub: "Your live project URL.",                    optional: true,                      placeholder: "https://myproject.com",          type: "url" },
    { key: "social_links",     label: "Social links to share?",       sub: "Format: Label, URL — one per line.",        optional: true,                      placeholder: "Twitter, https://twitter.com/…",  multiline: true },
    ...(hackathons.length > 0 ? [{
      key: "hackathon_id" as keyof CreateProfileSchema,
      label: "Link a hackathon.",
      sub: "Connect this profile to a hackathon.",
      optional: true,
    }] : []),
  ];

  const totalSteps = FORM_STEPS.length;
  const activeStep = FORM_STEPS[Math.min(currentStep, totalSteps - 1)];
  const isLastStep = currentStep === totalSteps - 1;
  const teamId = watch("team_id");

  const navigateTo = (next: number, dir: 1 | -1) => {
    setAnimDir(dir);
    setAnimKey((k) => k + 1);
    setCurrentStep(next);
  };

  const handleNext = async () => {
    if (!activeStep) return;
    const ok = await trigger(activeStep.key);
    if (!ok && !activeStep.optional) return;
    if (currentStep < totalSteps - 1) navigateTo(currentStep + 1, 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) navigateTo(currentStep - 1, -1);
  };

  const onSubmit = useCallback(async (data: CreateProfileSchema) => {
    setError(null);
    setProgressErrors({});
    setLoading(true);
    STEPS.forEach((s) => setProgress((p) => ({ ...p, [s]: "pending" })));

    const screenshotUrls = data.screenshot_urls
      ? data.screenshot_urls.split("\n").map((u) => u.trim()).filter(Boolean)
      : undefined;
    const socialLinks = data.social_links
      ? data.social_links.split("\n").map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return null;
          const comma = trimmed.indexOf(",");
          if (comma > 0) return { label: trimmed.slice(0, comma).trim(), url: trimmed.slice(comma + 1).trim() };
          return { label: trimmed, url: trimmed };
        }).filter((x): x is { label: string; url: string } => x !== null && Boolean(x.url))
      : undefined;

    try {
      const res = await fetch("/api/builder-agents/profile-creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, screenshot_urls: screenshotUrls, social_links: socialLinks }),
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
          if (line.startsWith("event: ")) { currentEvent = line.slice(7).trim(); continue; }
          if (!line.startsWith("data: ")) continue;
          const chunk = line.slice(6);
          if (chunk === "[DONE]") continue;
          try {
            const parsed = JSON.parse(chunk) as Record<string, unknown>;
            if (typeof parsed.message === "string") serverError = parsed.message;
            if (typeof parsed.step === "string") {
              const status = (["done","failed","skipped"].includes(parsed.status as string) ? parsed.status : "started") as StepStatus;
              setProgress((p) => ({ ...p, [parsed.step as string]: status }));
              if (parsed.status === "failed" && typeof parsed.error === "string")
                setProgressErrors((e) => ({ ...e, [parsed.step as string]: parsed.error as string }));
            }
            if (currentEvent === "complete" && typeof parsed.project_id === "string") lastComplete = parsed;
            if (currentEvent === "flattened_codebase" && lastComplete && parsed.project_id === lastComplete.project_id && typeof parsed.flattened_codebase === "string")
              lastComplete = { ...lastComplete, flattened_codebase: parsed.flattened_codebase };
          } catch { /* ignore */ }
        }
      }

      if (serverError && !lastComplete) throw new Error(serverError);
      if (lastComplete && typeof lastComplete.project_id === "string") {
        await saveProjectMutation.mutateAsync({ ...lastComplete, team_id: data.team_id, created_at: new Date().toISOString() } as import("@/lib/storage").StoredProject);
        router.push(`/builder/projects/${lastComplete.project_id}`);
        return;
      }
      throw new Error(serverError || "No profile data received.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [router, saveProjectMutation]);

  // Shared input style
  const inputBase: React.CSSProperties = {
    width: "100%",
    backgroundColor: "#d6cfc0",
    border: "none",
    borderRadius: 16,
    padding: "18px 22px",
    fontFamily: "'Inter', sans-serif",
    fontSize: 16,
    color: "#2d4a3e",
    outline: "none",
    transition: "background-color 0.2s ease",
    letterSpacing: "0.01em",
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f0ebe0" }}>

      {/* ── Top nav ──────────────────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-10 py-5 border-b"
        style={{ borderColor: "rgba(45,74,62,0.12)", backgroundColor: "#f0ebe0" }}
      >
        <Link
          href="/builder"
          className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold text-[#2d4a3e]/50 hover:text-[#2d4a3e] transition-colors no-underline"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <ArrowLeft size={12} /> Builder
        </Link>

        <p
          className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40 absolute left-1/2 -translate-x-1/2"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Create Profile
        </p>

        <StepDots total={totalSteps} current={currentStep} />
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1">

        {/* LEFT — form area */}
        <main className="flex-1 flex flex-col justify-center px-10 md:px-20 lg:px-32 py-16 max-w-3xl">

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step header */}
            <div
              key={`header-${animKey}`}
              className="mb-10"
              style={{
                animation: `${animDir > 0 ? "slideUpIn" : "slideDownIn"} 0.38s cubic-bezier(0.22,1,0.36,1) both`,
              }}
            >
              {/* Step counter + optional badge */}
              <div className="flex items-center gap-3 mb-5">
                <span
                  className="font-black text-[#2d4a3e]/20 leading-none"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "clamp(36px, 6vw, 64px)",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {String(currentStep + 1).padStart(2, "0")}
                </span>
                {activeStep?.optional && (
                  <span
                    className="text-[8px] tracking-[0.15em] uppercase font-bold px-2.5 py-1 rounded-sm"
                    style={{
                      backgroundColor: "rgba(45,74,62,0.08)",
                      color: "#2d4a3e",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    optional
                  </span>
                )}
              </div>

              {/* Question */}
              <h1
                className="font-black text-[#2d4a3e] leading-[0.9] mb-4 uppercase"
                style={{
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: "clamp(28px, 4.5vw, 56px)",
                  letterSpacing: "-0.02em",
                }}
              >
                {activeStep?.label}
              </h1>
              <p
                className="text-[#2d4a3e]/50 leading-relaxed"
                style={{ fontFamily: "Georgia, serif", fontSize: "clamp(14px, 1.5vw, 16px)" }}
              >
                {activeStep?.sub}
              </p>
            </div>

            {/* Input area */}
            <div
              key={`input-${animKey}`}
              style={{
                animation: `${animDir > 0 ? "slideUpIn" : "slideDownIn"} 0.38s cubic-bezier(0.22,1,0.36,1) 0.06s both`,
                maxWidth: 520,
              }}
            >
              {/* team_id */}
              {activeStep?.key === "team_id" && (
                teams.length === 0 ? (
                  <div>
                    <p className="text-sm text-[#2d4a3e]/50 mb-6" style={{ fontFamily: "Georgia, serif" }}>
                      You don&apos;t have any teams yet.
                    </p>
                    <Link
                      href="/builder/teams"
                      className="inline-flex items-center gap-2 rounded-full no-underline text-[#f0ebe0] text-[10px] tracking-widest uppercase font-bold px-6 py-3"
                      style={{ backgroundColor: "#2d4a3e", fontFamily: "'Inter', sans-serif" }}
                    >
                      Create a team <ArrowRight size={12} />
                    </Link>
                  </div>
                ) : (
                  <Controller
                    name="team_id"
                    control={control}
                    render={({ field }) => (
                      <CustomDropdown
                        options={teams.map((t) => ({ value: t.id, label: t.name }))}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Select a team…"
                      />
                    )}
                  />
                )
              )}

              {/* hackathon_id */}
              {activeStep?.key === "hackathon_id" && hackathons.length > 0 && (
                <Controller
                  name="hackathon_id"
                  control={control}
                  render={({ field }) => (
                    <CustomDropdown
                      options={[{ value: "", label: "None" }, ...hackathons.map((b) => ({ value: b.id, label: b.name }))]}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="None"
                    />
                  )}
                />
              )}

              {/* Text + URL inputs */}
              {activeStep?.key !== "team_id" && activeStep?.key !== "hackathon_id" && (
                activeStep?.multiline ? (
                  <textarea
                    rows={4}
                    placeholder={activeStep.placeholder}
                    {...register(activeStep.key)}
                    className="w-full resize-none outline-none transition-all duration-200 placeholder-[#2d4a3e]/30"
                    style={{
                      ...inputBase,
                      fontFamily: "Georgia, serif",
                      lineHeight: 1.7,
                    }}
                    onFocus={(e) => (e.currentTarget.style.backgroundColor = "#cdc7b7")}
                    onBlur={(e) => (e.currentTarget.style.backgroundColor = "#d6cfc0")}
                  />
                ) : (
                  <input
                    type={activeStep?.type ?? "text"}
                    placeholder={activeStep?.placeholder}
                    {...register(activeStep!.key)}
                    className="outline-none transition-all duration-200 placeholder-[#2d4a3e]/30"
                    style={inputBase}
                    onFocus={(e) => (e.currentTarget.style.backgroundColor = "#cdc7b7")}
                    onBlur={(e) => (e.currentTarget.style.backgroundColor = "#d6cfc0")}
                  />
                )
              )}

              {/* Field error */}
              {activeStep?.key && errors[activeStep.key] && (
                <p
                  className="mt-2 text-sm"
                  style={{ fontFamily: "Georgia, serif", color: "#c0392b" }}
                >
                  {errors[activeStep.key]?.message as string}
                </p>
              )}

              {/* Loading progress */}
              {loading && (
                <div className="mt-6">
                  <ProgressPanel steps={STEPS} progress={progress} errors={progressErrors} />
                </div>
              )}

              {/* Submit error */}
              {error && !loading && (
                <p
                  className="mt-4 text-sm"
                  style={{ fontFamily: "Georgia, serif", color: "#c0392b" }}
                >
                  {error}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div
              key={`btns-${animKey}`}
              className="flex items-center gap-4 mt-12 flex-wrap"
              style={{
                animation: `${animDir > 0 ? "slideUpIn" : "slideDownIn"} 0.38s cubic-bezier(0.22,1,0.36,1) 0.12s both`,
              }}
            >
              {/* Back */}
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-full border-none cursor-pointer transition-all duration-200 text-[10px] tracking-widest uppercase font-bold px-5 py-3 hover:opacity-70"
                  style={{
                    backgroundColor: "transparent",
                    color: "#2d4a3e",
                    border: "1.5px solid rgba(45,74,62,0.25)",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <ArrowLeft size={11} /> Back
                </button>
              )}

              {/* Continue / Submit */}
              {!isLastStep ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-full border-none cursor-pointer transition-all duration-200 hover:opacity-90 text-[10px] tracking-widest uppercase font-bold px-7 py-3"
                  style={{ backgroundColor: "#2d4a3e", color: "#f0ebe0", fontFamily: "'Inter', sans-serif" }}
                >
                  Continue <ArrowRight size={12} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !isValid || !teamId}
                  className="inline-flex items-center gap-2 rounded-full border-none cursor-pointer transition-all duration-200 hover:opacity-90 disabled:opacity-40 text-[10px] tracking-widest uppercase font-bold px-7 py-3"
                  style={{ backgroundColor: "#2d4a3e", color: "#f0ebe0", fontFamily: "'Inter', sans-serif" }}
                >
                  {loading && <Loader2 size={12} className="animate-spin" />}
                  {loading ? "Creating…" : "Create Profile"}
                </button>
              )}

              {/* Skip */}
              {activeStep?.optional && !isLastStep && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="text-[10px] tracking-widest uppercase font-bold text-[#2d4a3e]/35 hover:text-[#2d4a3e]/60 transition-colors bg-transparent border-none cursor-pointer"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Skip
                </button>
              )}
            </div>
          </form>
        </main>

        {/* RIGHT — decorative panel */}
        <aside
          className="hidden lg:flex w-[380px] shrink-0 flex-col justify-between p-10 relative overflow-hidden"
          style={{ backgroundColor: "#2d4a3e" }}
        >
          {/* Subtle dot grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(214,207,192,0.12) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          {/* Top — step fraction */}
          <div className="relative z-10">
            <p
              className="font-black text-[#f0ebe0]/10 leading-none"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 96,
                letterSpacing: "-0.04em",
              }}
            >
              {String(currentStep + 1).padStart(2, "0")}
            </p>
            <p
              className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#f0ebe0]/30 mt-2"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              of {String(totalSteps).padStart(2, "0")} steps
            </p>
          </div>

          {/* Middle — step list preview */}
          <div className="relative z-10 flex flex-col gap-2">
            {FORM_STEPS.slice(Math.max(0, currentStep - 1), currentStep + 4).map((step, i) => {
              const absIdx = Math.max(0, currentStep - 1) + i;
              const isCurrent = absIdx === currentStep;
              const isPast = absIdx < currentStep;
              return (
                <div
                  key={step.key}
                  className="flex items-center gap-3 transition-all duration-300"
                  style={{ opacity: isCurrent ? 1 : isPast ? 0.35 : 0.2 }}
                >
                  {isPast ? (
                    <Check size={12} style={{ color: "#d6cfc0", flexShrink: 0 }} />
                  ) : (
                    <div
                      className="shrink-0 rounded-full"
                      style={{
                        width: isCurrent ? 8 : 6,
                        height: isCurrent ? 8 : 6,
                        backgroundColor: isCurrent ? "#d6cfc0" : "rgba(214,207,192,0.4)",
                      }}
                    />
                  )}
                  <p
                    className="truncate"
                    style={{
                      fontFamily: isCurrent ? "'Inter', sans-serif" : "Georgia, serif",
                      fontSize: isCurrent ? 13 : 12,
                      fontWeight: isCurrent ? 700 : 400,
                      color: isCurrent ? "#f0ebe0" : "#d6cfc0",
                      letterSpacing: isCurrent ? "0.01em" : 0,
                    }}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Bottom — arrow + label */}
          <div className="relative z-10 flex items-end justify-between">
            <p
              className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#f0ebe0]/25"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Create Profile
            </p>
            <span
              className="inline-flex items-center justify-center rounded-full"
              style={{ width: 40, height: 40, backgroundColor: "#d6cfc0" }}
            >
              <ArrowUpRight size={16} style={{ color: "#2d4a3e" }} />
            </span>
          </div>
        </aside>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes slideUpIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDownIn {
          from { opacity: 0; transform: translateY(-18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        textarea::placeholder, input::placeholder { color: rgba(45,74,62,0.35); }
        textarea:focus, input:focus { outline: none; }
      `}</style>
    </div>
  );
}