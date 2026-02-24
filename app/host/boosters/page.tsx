"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { getBoosters, saveBooster, type StoredBooster, type BoosterType } from "@/lib/storage";

const BOOSTER_TYPES: { value: BoosterType; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "momentum", label: "Momentum" },
  { value: "capital", label: "Capital" },
];

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
  schedule: {
    phase: string;
    description: string;
  }[];
  submission_requirements: string[];
  judging_criteria: {
    name: string;
    description: string;
  }[];
  documentation_plan: string[];
  organizer_notes: string[];
}

interface ProgramDraftResponse {
  booster_id: string;
  draft: ProgramDraft;
  generated_at: string;
}

interface ResourceTrackPlan {
  name: string;
  description: string;
  docs_to_prepare: string[];
  starter_repos_or_templates: string[];
  example_apis_or_endpoints: string[];
}

interface ChallengeResourceMap {
  challenge_title: string;
  recommended_tracks: string[];
  key_docs: string[];
  getting_started_steps: string[];
}

interface ResourcePlan {
  technical_cheatsheet: string;
  tracks: ResourceTrackPlan[];
  challenge_resource_map: ChallengeResourceMap[];
}

interface ResourcePlanResponse {
  booster_id: string;
  resources: ResourcePlan;
  generated_at: string;
}

export default function HostBoostersPage() {
  const [boosters, setBoosters] = useState<StoredBooster[]>([]);
  const [editing, setEditing] = useState<StoredBooster | null>(null);
  const [programDraft, setProgramDraft] = useState<ProgramDraftResponse | null>(null);
  const [resourcePlan, setResourcePlan] = useState<ResourcePlanResponse | null>(null);
  const [aiStatus, setAiStatus] = useState<"idle" | "running">("idle");
  const [aiError, setAiError] = useState<string | null>(null);
  const [form, setForm] = useState({
    id: "",
    name: "",
    problem_statements: "",
    theme: "",
    booster_type: "idea" as BoosterType,
    website_url: "",
    technical_resources: [] as { url: string; description: string }[],
    bounty_pool_summary: "",
    program_goal: "",
    timeline: "",
    organizer_notes: "",
  });

  useEffect(() => {
    setBoosters(getBoosters());
  }, []);

  const handleSave = () => {
    const id = form.id || `booster_${Date.now()}`;
    const problem_statements = form.problem_statements
      .split("\n")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const technical_resources = (form.technical_resources || []).map((r) => ({
      url: r.url ?? "",
      description: r.description ?? "",
    }));
    const technical_docs =
      technical_resources.length > 0
        ? technical_resources
            .map((r) => (r.description ? `${r.url} — ${r.description}` : r.url))
            .join("\n")
        : undefined;

    const b: StoredBooster = {
      id,
      name: form.name || "Unnamed booster",
      problem_statements,
      theme: form.theme || undefined,
      booster_type: form.booster_type,
      website_url: form.website_url || undefined,
      technical_resources,
      technical_docs,
      bounty_pool_summary: form.bounty_pool_summary || undefined,
      program_goal: form.program_goal || undefined,
      timeline: form.timeline || undefined,
      organizer_notes: form.organizer_notes || undefined,
      created_at: editing?.created_at ?? new Date().toISOString(),
    };
    saveBooster(b);
    setBoosters(getBoosters());
    setEditing(null);
    setProgramDraft(null);
    setResourcePlan(null);
    setForm({
      id: "",
      name: "",
      problem_statements: "",
      theme: "",
      booster_type: "idea",
      website_url: "",
      technical_resources: [],
      bounty_pool_summary: "",
      program_goal: "",
      timeline: "",
      organizer_notes: "",
    });
  };

  const startNew = () => {
    setEditing(null);
    setProgramDraft(null);
    setResourcePlan(null);
    setForm({
      id: "",
      name: "",
      problem_statements: "",
      theme: "",
      booster_type: "idea",
      website_url: "",
      technical_resources: [],
      bounty_pool_summary: "",
      program_goal: "",
      timeline: "",
      organizer_notes: "",
    });
  };

  const edit = (b: StoredBooster) => {
    setEditing(b);
    setProgramDraft(null);
    setResourcePlan(null);
    setForm({
      id: b.id,
      name: b.name,
      problem_statements: b.problem_statements.join("\n"),
      theme: b.theme ?? "",
      booster_type: b.booster_type ?? "idea",
      website_url: b.website_url ?? "",
      technical_resources: b.technical_resources ?? [],
      bounty_pool_summary: b.bounty_pool_summary ?? "",
      program_goal: b.program_goal ?? "",
      timeline: b.timeline ?? "",
      organizer_notes: b.organizer_notes ?? "",
    });
  };

  const buildBoosterPayload = () => {
    const id = form.id || editing?.id || `booster_draft_${Date.now()}`;
    const problem_statements = form.problem_statements
      .split("\n")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const technical_resources = (form.technical_resources || []).map((r) => ({
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
      name: form.name || "Unnamed booster",
      problem_statements,
      theme: form.theme || undefined,
      booster_type: form.booster_type,
      website_url: form.website_url || undefined,
      technical_docs,
      bounty_pool_summary: form.bounty_pool_summary || undefined,
      program_goal: form.program_goal || undefined,
      timeline: form.timeline || undefined,
      organizer_notes: form.organizer_notes || undefined,
    };
  };

  const runBoosterAgents = async () => {
    try {
      setAiStatus("running");
      setAiError(null);
      setProgramDraft(null);
      setResourcePlan(null);
      const boosterPayload = buildBoosterPayload();

      const [programRes, resourcesRes] = await Promise.all([
        fetch("/api/host-agents/booster-generator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ booster: boosterPayload }),
        }),
        fetch("/api/host-agents/resource-provisioner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ booster: boosterPayload }),
        }),
      ]);

      const programJson = await programRes.json();
      const resourcesJson = await resourcesRes.json();

      if (!programRes.ok) {
        throw new Error(programJson.error || "Failed to generate program draft");
      }
      if (!resourcesRes.ok) {
        throw new Error(resourcesJson.error || "Failed to generate resource plan");
      }

      setProgramDraft(programJson as ProgramDraftResponse);
      setForm((prev) => ({
        ...prev,
        name: prev.name || programJson.draft?.booster_name || prev.name,
        id: prev.id || programJson.draft?.booster_id_suggestion || prev.id,
      }));
      setResourcePlan(resourcesJson as ResourcePlanResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to run booster agents";
      setAiError(message);
    } finally {
      setAiStatus("idle");
    }
  };

  return (
    <div>
      <Link
        href="/host"
        className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-amber-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Boosters</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Create and edit idea, momentum, and capital boosters. Stored in this browser.
      </p>

      <div className="mt-8 grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-900 dark:text-white">Saved boosters</h2>
            <button
              onClick={startNew}
              className="flex items-center gap-1 text-sm text-amber-600 hover:underline"
            >
              <Plus className="w-4 h-4" /> New
            </button>
          </div>
          <ul className="space-y-2">
            {boosters.length === 0 && (
              <li className="text-zinc-500 py-4">No boosters yet. Click New to add one.</li>
            )}
            {boosters.map((b: StoredBooster) => (
              <li
                key={b.id}
                className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white">{b.name}</p>
                  <p className="text-xs text-zinc-500">{b.problem_statements.length} problem statements · {(b.booster_type ?? "idea")}</p>
                </div>
                <button
                  onClick={() => edit(b)}
                  className="text-sm text-amber-600 hover:underline"
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
          <h2 className="font-semibold text-zinc-900 dark:text-white">
            {editing ? "Edit booster" : "New booster"}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Fill in as much as you can, then let the AI draft the full program & technical resources. You can edit everything before publishing.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={runBoosterAgents}
              disabled={aiStatus === "running"}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-500 text-amber-700 dark:text-amber-300 px-3 py-1.5 text-sm font-medium hover:bg-amber-50/40 dark:hover:bg-amber-900/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {aiStatus === "running" ? "Running booster agents..." : "Generate AI draft"}
            </button>
            {aiError && (
              <span className="text-xs text-red-500">
                {aiError}
              </span>
            )}
          </div>
          {(form.name || editing?.name) && (
            <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300">
              <div>
                <span className="font-medium">Booster name (auto-generated): </span>
                <span>{form.name || editing?.name}</span>
              </div>
              {form.id && (
                <div className="mt-0.5">
                  <span className="font-medium">Internal ID/slug: </span>
                  <span className="font-mono text-[11px]">{form.id}</span>
                </div>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Theme (optional)</label>
            <input
              type="text"
              value={form.theme}
              onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value }))}
              placeholder="e.g. AI for good"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Booster type</label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">Choose where this booster appears: Idea, Momentum, or Capital. Each type has its own list for builders.</p>
            <select
              value={form.booster_type}
              onChange={(e) => setForm((f) => ({ ...f, booster_type: e.target.value as BoosterType }))}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
            >
              {BOOSTER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Your website (optional)</label>
            <input
              type="url"
              value={form.website_url}
              onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))}
              placeholder="https://your-site.com"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Program goal</label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
              In one or two sentences, describe what you want this booster to achieve for builders and sponsors.
            </p>
            <textarea
              rows={2}
              value={form.program_goal}
              onChange={(e) => setForm((f) => ({ ...f, program_goal: e.target.value }))}
              placeholder="Help builders ship AI copilots that..."
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Bounty pool / rewards</label>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
                Summarize prizes, grants, or other incentives.
              </p>
              <textarea
                rows={2}
                value={form.bounty_pool_summary}
              onChange={(e) => setForm((f) => ({ ...f, bounty_pool_summary: e.target.value }))}
                placeholder="$10k total pool, $5k grand prize, swag for top 20..."
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Timeline & key dates</label>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
                Launch, checkpoints, submission deadline, judging, demo day, etc.
              </p>
              <textarea
                rows={2}
                value={form.timeline}
              onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}
                placeholder="Launch: May 1 · Submissions: June 15 · Judging: June 20..."
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Technical docs & links</label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
              Drop Notion/Google Docs, API references, SDK guides, or any other technical material.
            </p>
            <div className="space-y-2">
              {form.technical_resources.map((res, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-[2fr,3fr] gap-2">
                  <input
                    type="url"
                    value={res.url}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        technical_resources: f.technical_resources.map((r, i) =>
                          i === idx ? { ...r, url: e.target.value } : r
                        ),
                      }))
                    }
                    placeholder="https://docs.example.com"
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={res.description}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        technical_resources: f.technical_resources.map((r, i) =>
                          i === idx ? { ...r, description: e.target.value } : r
                        ),
                      }))
                    }
                    placeholder="Short description of what this resource covers"
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    technical_resources: [
                      ...(f.technical_resources || []),
                      { url: "", description: "" },
                    ],
                  }))
                }
                className="text-xs text-amber-600 hover:underline"
              >
                + Add resource
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Problem statements (optional, one per line)</label>
            <textarea
              rows={4}
              value={form.problem_statements}
              onChange={(e) => setForm((f) => ({ ...f, problem_statements: e.target.value }))}
              placeholder="Build a tool that...&#10;Solve the problem of..."
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Organizer notes</label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
              Freeform scratchpad for anything you want the booster agents to see: constraints, success criteria, partners, or rough ideas.
            </p>
            <textarea
              rows={4}
              value={form.organizer_notes}
              onChange={(e) => setForm((f) => ({ ...f, organizer_notes: e.target.value }))}
              placeholder="Anything you’d tell a human co-host about this program..."
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white"
            />
          </div>
          {aiStatus === "running" && (
            <div className="mt-4 rounded-lg border border-dashed border-amber-400 bg-amber-50/60 dark:bg-amber-900/20 p-4">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Booster agents are drafting your program…
              </p>
              <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-100/80">
                Generating program outline, challenge statements, and technical resources from your brief.
              </p>
            </div>
          )}
          {aiStatus !== "running" && (programDraft || resourcePlan) && (
            <div className="mt-4 space-y-4 rounded-lg border border-dashed border-amber-400 bg-amber-50/40 dark:bg-amber-900/10 p-4">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                AI draft (preview for this booster)
              </h3>
              {programDraft && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Program outline</h4>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                    {programDraft.draft.overview}
                  </p>
                  {programDraft.draft.goals?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Goals</p>
                      <ul className="list-disc list-inside text-sm text-zinc-700 dark:text-zinc-300">
                        {programDraft.draft.goals.map((g: string, i: number) => (
                          <li key={i}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {programDraft.draft.challenge_statements?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Challenge statements</p>
                      <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                        {programDraft.draft.challenge_statements.map((c, i) => (
                          <li key={i}>
                            <span className="font-medium">{c.title}</span>
                            {c.summary ? ` — ${c.summary}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {resourcePlan && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Technical resources</h4>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Cheatsheet</p>
                  <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap max-h-48 overflow-auto rounded-md bg-white/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-2">
                    {resourcePlan.resources.technical_cheatsheet}
                  </div>
                  {resourcePlan.resources.tracks?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Tracks</p>
                      <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                        {resourcePlan.resources.tracks.map((t, i) => (
                          <li key={i}>
                            <span className="font-medium">{t.name}</span>
                            {t.description ? ` — ${t.description}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-amber-600 text-white px-4 py-2 font-medium hover:bg-amber-700"
          >
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
