"use client";

import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Check, X, Minus, ChevronDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveProject } from "@/lib/storage";
import { useTeams, useBoosters } from "@/lib/queries";
import { useAuth } from "@/app/providers";
import { createProfileSchema, type CreateProfileSchema } from "@/lib/validations/schemas";
import Image from "next/image";

const STEPS = ["code-reader", "demo-reader", "theme-reader", "knowledge-base"] as const;
type StepStatus = "pending" | "started" | "done" | "failed" | "skipped";

export default function NewProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-500">Loading...</div>}>
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
  const hasAppliedDefaults = useRef(false);

  const { data: teams = [] } = useTeams(user?.id);
  const { data: boosters = [] } = useBoosters();

  const teamIdFromUrl = searchParams.get("team_id");
  const boosterIdFromUrl = searchParams.get("booster_id");

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isValid },
    watch,
  } = useForm<CreateProfileSchema>({
    resolver: zodResolver(createProfileSchema),
    mode: "onChange",
    defaultValues: {
      team_id: "",
      name: "",
      description: "",
      github_url: "",
      youtube_url: "",
      logo_url: "",
      website_url: "",
      screenshot_urls: "",
      social_links: "",
      booster_id: "",
    },
  });

  // Apply URL params as defaults once after data is loaded
  useEffect(() => {
    if (hasAppliedDefaults.current) return;

    const validUrlTeam = teamIdFromUrl && teams.some((t) => t.id === teamIdFromUrl) ? teamIdFromUrl : null;
    const fallbackTeamId = teams[0]?.id ?? "";
    const validUrlBooster = boosterIdFromUrl && boosters.some((b) => b.id === boosterIdFromUrl) ? boosterIdFromUrl : null;

    // Only apply when we have something meaningful to set
    if (!validUrlTeam && !fallbackTeamId && !validUrlBooster) {
      return;
    }

    reset((prev) => ({
      ...prev,
      team_id: validUrlTeam ?? (prev.team_id || fallbackTeamId),
      booster_id: validUrlBooster ?? prev.booster_id,
    }));
    hasAppliedDefaults.current = true;
  }, [teamIdFromUrl, boosterIdFromUrl, teams, boosters, reset]);

  const FORM_STEPS: { key: keyof CreateProfileSchema; label: string }[] = [
    { key: "team_id", label: "Choose your team" },
    { key: "name", label: "Name your project" },
    { key: "description", label: "Describe your project" },
    { key: "github_url", label: "Add your GitHub repo (optional)" },
    { key: "youtube_url", label: "Add your YouTube demo (optional)" },
    { key: "logo_url", label: "Add your logo URL (optional)" },
    { key: "screenshot_urls", label: "Add screenshot URLs (optional)" },
    { key: "website_url", label: "Add your website URL (optional)" },
    { key: "social_links", label: "Add social links (optional)" },
    ...(boosters.length > 0 ? [{ key: "booster_id", label: "Link to a booster (optional)" as const }] : []),
  ];

  const totalSteps = FORM_STEPS.length;
  const activeStep = FORM_STEPS[Math.min(currentStep, Math.max(totalSteps - 1, 0))];
  const isLastStep = currentStep === totalSteps - 1;

  const onSubmit = useCallback(
    async (data: CreateProfileSchema) => {
      setError(null);
      setProgressErrors({});
      setLoading(true);
      STEPS.forEach((s) => setProgress((p) => ({ ...p, [s]: "pending" })));

      const screenshotUrls = data.screenshot_urls
        ? data.screenshot_urls.split("\n").map((u) => u.trim()).filter(Boolean)
        : undefined;
      const socialLinks = data.social_links
        ? data.social_links
          .split("\n")
          .map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return null;
            const comma = trimmed.indexOf(",");
            if (comma > 0) {
              return { label: trimmed.slice(0, comma).trim(), url: trimmed.slice(comma + 1).trim() };
            }
            return { label: trimmed, url: trimmed };
          })
          .filter((x): x is { label: string; url: string } => x !== null && Boolean(x.url))
        : undefined;

      try {
        const res = await fetch("/api/builder-agents/profile-creator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            team_id: data.team_id,
            name: data.name,
            description: data.description,
            logo_url: data.logo_url,
            website_url: data.website_url,
            github_url: data.github_url,
            youtube_url: data.youtube_url,
            screenshot_urls: screenshotUrls,
            social_links: socialLinks,
            booster_id: data.booster_id,
          }),
        });

        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || json.message || "Profile creation failed");
        }
        if (!res.body) {
          throw new Error("No response body");
        }

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
              if (parsed.message !== undefined && typeof parsed.message === "string") {
                serverError = parsed.message;
              }
              if (parsed.step !== undefined && typeof parsed.step === "string") {
                const status = (parsed.status === "done" || parsed.status === "failed" || parsed.status === "skipped" ? parsed.status : "started") as StepStatus;
                setProgress((p) => ({ ...p, [parsed.step as string]: status }));
                if (parsed.status === "failed" && typeof parsed.error === "string") {
                  const stepName = parsed.step as string;
                  setProgressErrors((e) => ({ ...e, [stepName]: parsed.error as string }));
                }
              }
              if (currentEvent === "complete" && parsed.project_id !== undefined && typeof parsed.project_id === "string") {
                lastComplete = parsed;
              }
              if (currentEvent === "flattened_codebase" && lastComplete && parsed.project_id === lastComplete.project_id && typeof parsed.flattened_codebase === "string") {
                lastComplete = { ...lastComplete, flattened_codebase: parsed.flattened_codebase };
              }
            } catch {
              // ignore unparseable lines
            }
          }
        }

        if (serverError && !lastComplete) {
          throw new Error(serverError);
        }
        if (lastComplete && typeof lastComplete.project_id === "string") {
          await saveProject({
            ...lastComplete,
            team_id: data.team_id,
            created_at: new Date().toISOString(),
          } as Parameters<typeof saveProject>[0]);
          router.push(`/builder/projects/${lastComplete.project_id}`);
          return;
        }
        throw new Error(serverError || "No profile data received. Try again or check the console for errors.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const teamId = watch("team_id");

  const handleNext = async () => {
    if (!activeStep) return;
    const ok = await trigger(activeStep.key);
    if (!ok) return;
    setCurrentStep((step) => Math.min(step + 1, totalSteps - 1));
  };

  const handlePrev = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  return (
    <div>
      <Link
        href="/builder"
        className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-600 mb-6"
      >
        <Image
          src="/builder/back.svg"
          alt="Back to sections"
          width={24}
          height={24}
          unoptimized
        />
      </Link>
      {/* <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Create Loops profile</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        We&apos;ll ask you a few quick questions, one at a time, then analyze your repo, demo, and screenshots to build your project profile.
      </p> */}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 max-w-7xl h-[515px] rounded-3xl bg-[#20332b] text-[#ECEEE5] px-8 py-10 flex flex-col"
      >
        {activeStep && (
          <div className="text-center px-10">
            <p className="text-xs uppercase tracking-[0.18em] text-[#ECEEE5]/80">
              {activeStep.label}
            </p>
            <p className="mt-6 text-3xl sm:text-4xl font-semibold tracking-[0.12em]">
              Question {FORM_STEPS.indexOf(activeStep) + 1}
            </p>
          </div>
        )}

        <div className="mt-auto space-y-10">

          {activeStep?.key === "team_id" && (
            <div>
              <p className="text-sm font-medium text-[#ECEEE5]/80 mb-6">Which team is this profile for?</p>
              {teams.length === 0 ? (
                <div className="mt-4 py-4">
                  <p className="text-sm text-[#ECEEE5]/85">
                    You don&apos;t have any teams yet.
                  </p>
                  <Link
                    href="/builder/teams"
                    className="mt-4 inline-flex items-center justify-center rounded-full border border-[#ECEEE5]/40 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[#ECEEE5] hover:bg-[#ECEEE5] hover:text-[#20332b] transition-colors"
                  >
                    Create a team
                  </Link>
                </div>
              ) : (
                <div className="mt-4 relative inline-block w-full">
                  <select
                    {...register("team_id")}
                    className="w-full bg-transparent border-0 border-b border-[#ECEEE5]/60 px-1 py-2 pr-8 text-lg text-[#ECEEE5] focus:outline-none focus:border-[#ECEEE5] appearance-none"
                  >
                    <option value="">Select a team…</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ECEEE5]/70" />
                </div>
              )}
              {errors.team_id && (
                <p className="mt-2 text-xs text-red-200">{errors.team_id.message}</p>
              )}
            </div>
          )}

          {activeStep?.key === "name" && (
            <div>
              <p className="text-sm font-medium text-[#ECEEE5]/80 mb-6">What should we call this project?</p>
              <input
                type="text"
                {...register("name")}
                className="mt-4 w-full bg-transparent border-0 border-b border-[#ECEEE5]/60 px-1 py-2 text-lg text-[#ECEEE5] placeholder:text-[#ECEEE5]/40 focus:outline-none focus:border-[#ECEEE5]"
              />
              {errors.name && (
                <p className="mt-2 text-xs text-red-200">{errors.name.message}</p>
              )}
            </div>
          )}

          {activeStep?.key === "description" && (
            <div>
              <p className="text-sm font-medium text-[#ECEEE5]/80 mb-6">Describe what this project does.</p>
              <textarea
                rows={4}
                {...register("description")}
                className="mt-4 w-full bg-transparent border-0 border-b border-[#ECEEE5]/60 px-1 py-2 text-lg text-[#ECEEE5] placeholder:text-[#ECEEE5]/40 focus:outline-none focus:border-[#ECEEE5]"
              />
              {errors.description && (
                <p className="mt-2 text-xs text-red-200">{errors.description.message}</p>
              )}
            </div>
          )}

          {activeStep?.key === "github_url" && (
            <div>
              <p className="text-sm font-medium text-[#ECEEE5]/80 mb-6">Where is the code hosted?</p>
              <input
                type="url"
                placeholder="https://github.com/user/repo"
                {...register("github_url")}
                className="mt-4 w-full bg-transparent border-0 border-b border-[#ECEEE5]/60 px-1 py-2 text-lg text-[#ECEEE5] placeholder:text-[#ECEEE5]/40 focus:outline-none focus:border-[#ECEEE5]"
              />
              {errors.github_url && (
                <p className="mt-2 text-xs text-red-200">{errors.github_url.message}</p>
              )}
            </div>
          )}

          {activeStep?.key === "youtube_url" && (
            <div>
              <p className="text-sm font-medium text-[#ECEEE5]/80 mb-6">Do you have a YouTube demo?</p>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                {...register("youtube_url")}
                className="mt-4 w-full bg-transparent border-0 border-b border-[#ECEEE5]/60 px-1 py-2 text-lg text-[#ECEEE5] placeholder:text-[#ECEEE5]/40 focus:outline-none focus:border-[#ECEEE5]"
              />
              {errors.youtube_url && (
                <p className="mt-2 text-xs text-red-200">{errors.youtube_url.message}</p>
              )}
            </div>
          )}

          {activeStep?.key === "logo_url" && (
            <div>
              <p className="text-sm font-medium text-[#ECEEE5]/80 mb-6">Share a logo image URL (optional).</p>
              <input
                type="url"
                {...register("logo_url")}
                className="mt-4 w-full bg-transparent border-0 border-b border-[#ECEEE5]/60 px-1 py-2 text-lg text-[#ECEEE5] placeholder:text-[#ECEEE5]/40 focus:outline-none focus:border-[#ECEEE5]"
              />
              {errors.logo_url && (
                <p className="mt-2 text-xs text-red-200">{errors.logo_url.message}</p>
              )}
            </div>
          )}

          {activeStep?.key === "screenshot_urls" && (
            <div>
              <p className="text-sm font-medium text-[#ECEEE5]/80 mb-6">Links to screenshots (one per line).</p>
              <textarea
                rows={2}
                placeholder="https://example.com/screenshot1.png"
                {...register("screenshot_urls")}
                className="mt-4 w-full bg-transparent border-0 border-b border-[#ECEEE5]/60 px-1 py-2 text-lg text-[#ECEEE5] placeholder:text-[#ECEEE5]/40 focus:outline-none focus:border-[#ECEEE5]"
              />
            </div>
          )}

          {activeStep?.key === "website_url" && (
            <div>
              <p className="text-sm font-medium text-[#ECEEE5]/80 mb-6">Project website URL (optional).</p>
              <input
                type="url"
                {...register("website_url")}
                className="mt-4 w-full bg-transparent border-0 border-b border-[#ECEEE5]/60 px-1 py-2 text-lg text-[#ECEEE5] placeholder:text-[#ECEEE5]/40 focus:outline-none focus:border-[#ECEEE5]"
              />
              {errors.website_url && (
                <p className="mt-2 text-xs text-red-200">{errors.website_url.message}</p>
              )}
            </div>
          )}

          {activeStep?.key === "social_links" && (
            <div>
              <p className="text-sm font-medium text-[#ECEEE5]/80 mb-6">
                Social links (one per line: Label, URL).
              </p>
              <textarea
                rows={2}
                placeholder="Twitter, https://twitter.com/..."
                {...register("social_links")}
                className="mt-4 w-full bg-transparent border-0 border-b border-[#ECEEE5]/60 px-1 py-2 text-lg text-[#ECEEE5] placeholder:text-[#ECEEE5]/40 focus:outline-none focus:border-[#ECEEE5]"
              />
            </div>
          )}

          {activeStep?.key === "booster_id" && boosters.length > 0 && (
            <div>
              <p className="text-sm font-medium text-[#ECEEE5]/80 mb-6">Link this profile to a booster (optional).</p>
              <div className="mt-4 relative inline-block w-full">
                <select
                  {...register("booster_id")}
                  className="w-full bg-transparent border-0 border-b border-[#ECEEE5]/60 px-1 py-2 pr-8 text-lg text-[#ECEEE5] focus:outline-none focus:border-[#ECEEE5] appearance-none"
                >
                  <option value="">None</option>
                  {boosters.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ECEEE5]/70" />
              </div>
            </div>
          )}

          {loading && (
            <div className="rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Progress</p>
              {STEPS.map((step) => (
                <div key={step} className="flex items-center gap-2 text-sm">
                  {progress[step] === "done" && <Check className="w-4 h-4 shrink-0 text-emerald-500" />}
                  {progress[step] === "failed" && <X className="w-4 h-4 shrink-0 text-red-500" />}
                  {progress[step] === "skipped" && <Minus className="w-4 h-4 shrink-0 text-zinc-400" />}
                  {progress[step] === "started" && <Loader2 className="w-4 h-4 shrink-0 animate-spin text-violet-500" />}
                  {progress[step] === "pending" && <span className="w-4 h-4 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />}
                  <span className="text-zinc-600 dark:text-zinc-400">{step.replace(/-/g, " ")}</span>
                  {progress[step] === "failed" && progressErrors[step] && (
                    <span className="text-xs text-red-500 truncate max-w-[200px]" title={progressErrors[step]}>
                      — {progressErrors[step]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-200">{error}</p>
          )}

          <div className="mt-8 flex justify-end gap-3 text-sm">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                disabled={loading}
                className="rounded-lg px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center"
              >
                <Image
                  src="/builder/back.svg"
                  alt="Previous question"
                  width={20}
                  height={20}
                  unoptimized
                />
              </button>
            )}
            {!isLastStep && (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="rounded-lg text-white px-3 py-2 font-medium disabled:opacity-50  hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center"
              >
                <Image
                  src="/builder/next.svg"
                  alt="Next question"
                  width={20}
                  height={20}
                  unoptimized
                />
              </button>
            )}
            {isLastStep && (
              <button
                type="submit"
                disabled={loading || !isValid || !teamId}
                className="rounded-lg bg-violet-600 text-white px-4 py-2 font-medium hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Create profile
              </button>
            )}
          </div>

        </div>
      </form>
    </div>
  );
}
