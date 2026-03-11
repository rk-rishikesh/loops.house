"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Share2, Loader2, Copy, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { getProject, getHackathon } from "@/lib/storage";
import { socialAmplifierSchema, type SocialAmplifierSchema } from "@/lib/validations/schemas";
import type { StoredProject, StoredHackathon } from "@/lib/data-mappers";

type SocialAmplifierResult = {
  linkedin_post?: string;
  twitter_post?: string;
  suggested_hashtags?: string[];
};

export function SocialGenerator({
  projects,
  hackathons,
}: {
  projects: StoredProject[];
  hackathons: StoredHackathon[];
}) {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-500">Loading...</div>}>
      <SocialGeneratorContent projects={projects} hackathons={hackathons} />
    </Suspense>
  );
}

function SocialGeneratorContent({
  projects,
  hackathons,
}: {
  projects: StoredProject[];
  hackathons: StoredHackathon[];
}) {
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get("project_id") ?? "";
  const [copied, setCopied] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SocialAmplifierSchema>({
    resolver: zodResolver(socialAmplifierSchema),
    defaultValues: {
      project_id: projectIdFromUrl || (projects[0]?.project_id ?? ""),
      hackathon_id: "",
      hackathon_result: "",
      tone: "excited",
    },
  });

  const hackathonId = watch("hackathon_id");

  const mutation = useMutation({
    mutationFn: async (data: SocialAmplifierSchema): Promise<SocialAmplifierResult> => {
      const project = await getProject(data.project_id);
      if (!project) throw new Error("Project not found.");

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const payload: Record<string, unknown> = {
        project: {
          name: project.name,
          tagline: project.tagline ?? "",
          refined_description: project.refined_description ?? project.description ?? "",
          tech_stack_tags: project.tech_stack_tags ?? [],
          category: project.category ?? "Other",
          key_features: project.key_features ?? [],
          loops_profile_url: `${origin}/viewer/projects/${data.project_id}`,
        },
        tone: data.tone,
      };

      if (data.hackathon_id) {
        const hackathon = await getHackathon(data.hackathon_id);
        if (hackathon) {
          payload.hackathon = {
            name: hackathon.name,
            ...(data.hackathon_result ? { result: data.hackathon_result } : {}),
          };
        }
      }

      const res = await fetch("/api/builder-agents/social-amplifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate posts");
      return json as SocialAmplifierResult;
    },
  });

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // ignore
    }
  };

  const result = mutation.data;

  return (
    <div>
      <Link
        href="/builder"
        className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Social amplifier</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Generate LinkedIn and Twitter posts for your project. Pick a project and optional hackathon context.
      </p>

      <form
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="mt-6 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 max-w-2xl space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Project *</label>
          <select
            {...register("project_id")}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.project_id} value={p.project_id}>{p.name}</option>
            ))}
          </select>
          {errors.project_id && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.project_id.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Hackathon (optional)</label>
          <select
            {...register("hackathon_id")}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
          >
            <option value="">None</option>
            {hackathons.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {hackathonId && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Hackathon result (optional)</label>
            <select
              {...register("hackathon_result")}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
            >
              <option value="">Participant</option>
              <option value="winner">Winner</option>
              <option value="runner-up">Runner-up</option>
              <option value="finalist">Finalist</option>
              <option value="participant">Participant</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tone</label>
          <select
            {...register("tone")}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
          >
            <option value="excited">Excited</option>
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-violet-600 text-white px-4 py-2 font-medium hover:bg-violet-700 disabled:opacity-50"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
          Generate posts
        </button>
      </form>

      {mutation.error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">
          {mutation.error.message}
        </p>
      )}

      {result && (
        <div className="mt-8 space-y-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Generated posts</h2>
          {result.linkedin_post && (
            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">LinkedIn</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.linkedin_post!, "linkedin")}
                  className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline"
                >
                  {copied === "linkedin" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === "linkedin" ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{result.linkedin_post}</p>
            </div>
          )}
          {result.twitter_post && (
            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Twitter / X</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.twitter_post!, "twitter")}
                  className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline"
                >
                  {copied === "twitter" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === "twitter" ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{result.twitter_post}</p>
              <p className="mt-1 text-xs text-zinc-500">{result.twitter_post.length} characters</p>
            </div>
          )}
          {result.suggested_hashtags && result.suggested_hashtags.length > 0 && (
            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Suggested hashtags</span>
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{result.suggested_hashtags.join(" ")}</p>
              <button
                type="button"
                onClick={() => copyToClipboard(result.suggested_hashtags!.join(" "), "hashtags")}
                className="mt-2 flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline"
              >
                {copied === "hashtags" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === "hashtags" ? "Copied" : "Copy"}
              </button>
            </div>
          )}
        </div>
      )}

      {projects.length === 0 && (
        <p className="mt-6 text-sm text-zinc-500">
          No projects yet. <Link href="/builder/new" className="text-violet-600 dark:text-violet-400 hover:underline">Create a profile</Link> first.
        </p>
      )}
    </div>
  );
}
