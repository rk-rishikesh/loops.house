"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Check, X, Minus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveProject } from "@/lib/storage";
import { useTeams, useBoosters } from "@/lib/queries";
import { useAuth } from "@/app/providers";
import { createProfileSchema, type CreateProfileSchema } from "@/lib/validations/schemas";

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
  const [progress, setProgress] = useState<Record<string, StepStatus>>({});
  const [progressErrors, setProgressErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const { data: teams = [] } = useTeams(user?.id);
  const { data: boosters = [] } = useBoosters();

  const teamIdFromUrl = searchParams.get("team_id");
  const boosterIdFromUrl = searchParams.get("booster_id");

  const {
    register,
    handleSubmit,
    reset,
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

  // Apply URL params as defaults once data is loaded
  useEffect(() => {
    const validUrlTeam = teamIdFromUrl && teams.some((t) => t.id === teamIdFromUrl) ? teamIdFromUrl : null;
    const fallbackTeamId = teams[0]?.id ?? "";
    const validUrlBooster = boosterIdFromUrl && boosters.some((b) => b.id === boosterIdFromUrl) ? boosterIdFromUrl : null;

    reset((prev) => ({
      ...prev,
      team_id: validUrlTeam ?? (prev.team_id || fallbackTeamId),
      booster_id: validUrlBooster ?? prev.booster_id,
    }));
  }, [teamIdFromUrl, boosterIdFromUrl, teams, boosters, reset]);

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

  return (
    <div>
      <Link
        href="/builder"
        className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Create Loops profile</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Create a team first, then select it below. We&apos;ll analyze your repo, demo, and screenshots to build your project profile.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 max-w-xl space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Team *</label>
          {teams.length === 0 ? (
            <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
              No teams yet. <Link href="/builder/teams" className="underline hover:no-underline">Create a team</Link> first, then return here.
            </p>
          ) : (
            <select
              {...register("team_id")}
              className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
            >
              <option value="">Select a team…</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
          {errors.team_id && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.team_id.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Project name *</label>
          <input
            type="text"
            {...register("name")}
            className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Description *</label>
          <textarea
            rows={4}
            {...register("description")}
            className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">GitHub repo URL</label>
          <input
            type="url"
            placeholder="https://github.com/user/repo"
            {...register("github_url")}
            className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
          />
          {errors.github_url && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.github_url.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">YouTube demo URL</label>
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            {...register("youtube_url")}
            className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
          />
          {errors.youtube_url && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.youtube_url.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Logo URL</label>
          <input
            type="url"
            {...register("logo_url")}
            className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
          />
          {errors.logo_url && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.logo_url.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Screenshot URLs (one per line)</label>
          <textarea
            rows={2}
            placeholder="https://example.com/screenshot1.png"
            {...register("screenshot_urls")}
            className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Website URL</label>
          <input
            type="url"
            {...register("website_url")}
            className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
          />
          {errors.website_url && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.website_url.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Social links (one per line: Label, URL)</label>
          <textarea
            rows={2}
            placeholder="Twitter, https://twitter.com/..."
            {...register("social_links")}
            className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
          />
        </div>

        {boosters.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Link to booster (optional)</label>
            <select
              {...register("booster_id")}
              className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
            >
              <option value="">None</option>
              {boosters.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {loading && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4 space-y-2">
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
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !isValid || !teamId}
            className="rounded-lg bg-violet-600 text-white px-4 py-2 font-medium hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Create profile
          </button>
          <Link
            href="/builder"
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
