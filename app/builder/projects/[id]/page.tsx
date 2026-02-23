"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Share2, ExternalLink, FileText, Code2, Video, Palette, Github, Globe, Link2 } from "lucide-react";
import { getProject, getBooster } from "@/lib/storage";
import { useState, useEffect } from "react";
import type { StoredProject } from "@/lib/storage";

const KB_SECTION_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  profile: { label: "Profile", icon: FileText },
  code: { label: "Code", icon: Code2 },
  demo: { label: "Demo", icon: Video },
  theme: { label: "Theme", icon: Palette },
};

function LinkRow({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:underline text-sm"
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="truncate">{label || href}</span>
      <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70" />
    </a>
  );
}

export default function BuilderProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<StoredProject | null | undefined>(undefined);

  const [socialLoading, setSocialLoading] = useState(false);
  const [socialResult, setSocialResult] = useState<{ linkedin_post?: string; twitter_post?: string; suggested_hashtags?: string[] } | null>(null);
  const [kbActiveTab, setKbActiveTab] = useState<string | null>(null);

  useEffect(() => {
    setProject(getProject(projectId));
  }, [projectId]);

  if (project === undefined) {
    return (
      <div className="max-w-4xl mx-auto pb-12">
        <Link href="/builder/projects" className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-600 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to projects
        </Link>
        <p className="mt-4 text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="max-w-4xl mx-auto pb-12">
        <Link href="/builder/projects" className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-600 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to projects
        </Link>
        <p className="mt-4 text-zinc-500">Project not found. It may exist only on another device (localStorage is per-browser).</p>
      </div>
    );
  }

  const p = project;
  const loopsProfileUrl = typeof window !== "undefined" ? `${window.location.origin}/viewer/projects/${projectId}` : "";
  const socialLinks = (p.social_links ?? []) as { label: string; url: string }[];
  const additionalLinks = (p.additional_links ?? []) as { label: string; url: string }[];
  const screenshots = (p.screenshot_urls ?? []) as string[];

  const handleShare = async () => {
    setSocialLoading(true);
    setSocialResult(null);
    try {
      const res = await fetch("/api/builder-agents/social-amplifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: {
            name: p.name,
            tagline: p.tagline || "",
            refined_description: p.refined_description || "",
            tech_stack_tags: p.tech_stack_tags || [],
            category: p.category || "",
            key_features: p.key_features || [],
            loops_profile_url: loopsProfileUrl,
          },
          tone: "excited",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setSocialResult(data);
    } catch (e) {
      setSocialResult({ linkedin_post: "", twitter_post: String(e) });
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <Link
        href="/builder/projects"
        className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to projects
      </Link>

      {/* Profile section — all project details */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex gap-4">
              {p.logo_url && (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0 bg-zinc-100 dark:bg-zinc-800">
                  <Image src={p.logo_url} alt="" fill className="object-contain" unoptimized />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{p.name}</h1>
                {(p.tagline ?? String(p.refined_description ?? p.description ?? "").trim().slice(0, 120)) && (
                  <p className="mt-1 text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                    {p.tagline ?? String(p.refined_description ?? p.description ?? "").trim().slice(0, 120)}
                    {p.tagline && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 font-medium">AI</span>}
                  </p>
                )}
                {p.category && (
                  <span className="mt-2 inline-block text-xs px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {String(p.category)}
                  </span>
                )}
                {p.booster_id && getBooster(p.booster_id) && (
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Submitted to{" "}
                    <Link href="/builder/boosters" className="text-violet-600 dark:text-violet-400 hover:underline">
                      {getBooster(p.booster_id)!.name}
                    </Link>
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <a
                href={loopsProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> View public page
              </a>
              <button
                onClick={handleShare}
                disabled={socialLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 text-white px-3 py-2 text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                <Share2 className="w-4 h-4" /> Share (generate posts)
              </button>
            </div>
          </div>

          {(String(p.refined_description ?? p.description ?? "").trim()).length > 0 && (
            <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Description</h2>
              <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {String(p.refined_description ?? p.description ?? "")}
              </p>
            </div>
          )}

          {screenshots.length > 0 && (
            <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Images</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {screenshots.slice(0, 6).map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="relative aspect-video rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800">
                    <Image src={src} alt="" fill className="object-cover" unoptimized />
                  </a>
                ))}
              </div>
            </div>
          )}

          {(p.tech_stack_tags?.length ?? 0) > 0 && (
            <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Tech stack <span className="normal-case font-normal text-zinc-400">(AI generated)</span></h2>
              <div className="flex flex-wrap gap-2">
                {(p.tech_stack_tags ?? []).map((t) => (
                  <span key={t} className="px-2.5 py-1 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200 text-xs font-medium">
                    {String(t)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Links</h2>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {p.github_url && <LinkRow href={p.github_url} label="GitHub repo" icon={Github} />}
              {p.website_url && <LinkRow href={p.website_url} label="Website" icon={Globe} />}
              {p.youtube_url && <LinkRow href={p.youtube_url} label="YouTube demo" icon={Video} />}
              {socialLinks.map((s, i) => (
                <LinkRow key={i} href={s.url} label={s.label || s.url} icon={Link2} />
              ))}
              {additionalLinks.map((a, i) => (
                <LinkRow key={i} href={a.url} label={a.label || a.url} icon={ExternalLink} />
              ))}
              {!p.github_url && !p.website_url && !p.youtube_url && socialLinks.length === 0 && additionalLinks.length === 0 && (
                <span className="text-zinc-500 text-sm">No links added</span>
              )}
            </div>
          </div>

          {(p.primary_color || p.accent_color || p.theme_label) && (
            <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Theme <span className="normal-case font-normal text-zinc-400">(AI generated)</span></h2>
              <div className="flex flex-wrap items-center gap-6">
                {Boolean(p.primary_color) && (
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="w-12 h-12 rounded-xl border border-zinc-300 dark:border-zinc-600 shadow-inner" style={{ backgroundColor: String(p.primary_color) }} />
                    <span className="text-xs text-zinc-500">Primary</span>
                  </div>
                )}
                {Boolean(p.accent_color) && (
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="w-12 h-12 rounded-xl border border-zinc-300 dark:border-zinc-600 shadow-inner" style={{ backgroundColor: String(p.accent_color) }} />
                    <span className="text-xs text-zinc-500">Accent</span>
                  </div>
                )}
                {Boolean(p.secondary_color) && (
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="w-12 h-12 rounded-xl border border-zinc-300 dark:border-zinc-600 shadow-inner" style={{ backgroundColor: String(p.secondary_color) }} />
                    <span className="text-xs text-zinc-500">Secondary</span>
                  </div>
                )}
                {Boolean(p.theme_label) && <span className="text-sm text-zinc-600 dark:text-zinc-400 capitalize">{String(p.theme_label).replace(/-/g, " ")}</span>}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Knowledge base section — test-like UI */}
      {(p.kb_sections?.length ?? 0) > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Knowledge base</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            {typeof p.knowledge_base_chunks === "number" ? `${p.knowledge_base_chunks} chunks` : ""} — sources used for project chat and code query.
          </p>
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="flex flex-wrap gap-1 p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              {(p.kb_sections as string[]).map((source) => {
                const meta = KB_SECTION_LABELS[source] ?? { label: source, icon: FileText };
                const Icon = meta.icon;
                const isActive = kbActiveTab === source;
                return (
                  <button
                    key={source}
                    type="button"
                    onClick={() => setKbActiveTab(isActive ? null : source)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? "bg-violet-600 text-white shadow-sm" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
            {kbActiveTab && (
              <div className="p-5 min-h-[200px]">
                {kbActiveTab === "profile" && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Profile & description</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
                      {String(p.refined_description ?? p.description ?? "")}
                    </p>
                  </div>
                )}
                {kbActiveTab === "code" && (
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Code (flattened repository)</p>
                    {(p.tech_stack_tags?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {(p.tech_stack_tags ?? []).map((t) => (
                          <span key={t} className="px-2 py-1 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200 text-xs font-medium">
                            {String(t)}
                          </span>
                        ))}
                      </div>
                    )}
                    {p.github_url && (
                      <a href={p.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:underline text-sm">
                        <Github className="w-4 h-4" /> {p.github_url}
                      </a>
                    )}
                    {p.flattened_codebase && (
                      <>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {`${(String(p.flattened_codebase).length / 1024).toFixed(1)} KB · scroll to browse`}
                        </p>
                        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 max-h-[420px] overflow-auto">
                          <pre className="p-4 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words font-mono">
                            {String(p.flattened_codebase).length > 120_000
                              ? String(p.flattened_codebase).slice(0, 120_000) + "\n\n... (truncated for display)"
                              : p.flattened_codebase}
                          </pre>
                        </div>
                      </>
                    )}
                    {!p.flattened_codebase && !p.github_url && (
                      <p className="text-sm text-zinc-500">No code content. Add a GitHub URL when creating the profile to include flattened code.</p>
                    )}
                  </div>
                )}
                {kbActiveTab === "demo" && (
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Demo (YouTube)</p>
                    {p.youtube_url && (
                      <a href={p.youtube_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:underline text-sm">
                        <Video className="w-4 h-4" /> Watch demo
                      </a>
                    )}
                    {(p.key_features?.length ?? 0) > 0 ? (
                      <ul className="list-disc list-inside space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                        {(p.key_features ?? []).map((f, i) => (
                          <li key={i}>{String(f)}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-zinc-500">Demo summary and transcript are in the knowledge base.</p>
                    )}
                  </div>
                )}
                {kbActiveTab === "theme" && (
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Theme & colors</p>
                    <div className="flex flex-wrap gap-6 items-center">
                      {Boolean(p.primary_color) && (
                        <div className="flex flex-col items-center gap-2">
                          <span className="w-14 h-14 rounded-xl border border-zinc-300 dark:border-zinc-600" style={{ backgroundColor: String(p.primary_color) }} />
                          <span className="text-xs text-zinc-500">Primary</span>
                        </div>
                      )}
                      {Boolean(p.accent_color) && (
                        <div className="flex flex-col items-center gap-2">
                          <span className="w-14 h-14 rounded-xl border border-zinc-300 dark:border-zinc-600" style={{ backgroundColor: String(p.accent_color) }} />
                          <span className="text-xs text-zinc-500">Accent</span>
                        </div>
                      )}
                      {Boolean(p.secondary_color) && (
                        <div className="flex flex-col items-center gap-2">
                          <span className="w-14 h-14 rounded-xl border border-zinc-300 dark:border-zinc-600" style={{ backgroundColor: String(p.secondary_color) }} />
                          <span className="text-xs text-zinc-500">Secondary</span>
                        </div>
                      )}
                      {Boolean(p.theme_label) && <span className="text-sm text-zinc-600 dark:text-zinc-400 capitalize">{String(p.theme_label).replace(/-/g, " ")}</span>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Key features (standalone if present) */}
      {(p.key_features?.length ?? 0) > 0 && (
        <div className="mt-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Key features</h2>
          <ul className="list-disc list-inside space-y-2 text-zinc-600 dark:text-zinc-400 text-sm">
            {(p.key_features ?? []).map((f, i) => (
              <li key={i}>{String(f)}</li>
            ))}
          </ul>
        </div>
      )}

      {socialResult && (
        <div className="mt-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
          <h2 className="font-semibold text-zinc-900 dark:text-white">Generated posts</h2>
          {socialResult.linkedin_post && (
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">LinkedIn</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{socialResult.linkedin_post}</p>
            </div>
          )}
          {socialResult.twitter_post && (
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Twitter / X</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{socialResult.twitter_post}</p>
            </div>
          )}
          {socialResult.suggested_hashtags && socialResult.suggested_hashtags.length > 0 && (
            <p className="text-xs text-zinc-500">Hashtags: {socialResult.suggested_hashtags.join(" ")}</p>
          )}
          {typeof socialResult.twitter_post === "string" && socialResult.twitter_post.startsWith("Error") && (
            <p className="text-sm text-red-600">{socialResult.twitter_post}</p>
          )}
        </div>
      )}
    </div>
  );
}
