"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowUpRight,
  ExternalLink,
  FileText,
  Code2,
  Video,
  Palette,
  Github,
  Globe,
  Youtube,
  Pencil,
  X,
  Save,
  Share2,
  Loader2,
} from "lucide-react";
import { useSaveProject } from "@/lib/queries";
import { useState } from "react";
import type { StoredProject, StoredSubmission } from "@/lib/data-mappers";

/* ─── Types ──────────────────────────────────────────────────────── */
const KB_TABS: Record<string, { label: string; icon: React.ElementType }> = {
  profile: { label: "Profile", icon: FileText },
  code: { label: "Code", icon: Code2 },
  demo: { label: "Demo", icon: Video },
  theme: { label: "Theme", icon: Palette },
};

/* ─── Arrow circle ───────────────────────────────────────────────── */
function ArrowCircle({
  size = 40,
  inverted = false,
}: {
  size?: number;
  inverted?: boolean;
}) {
  return (
    <span
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center rounded-full shrink-0 transition-all duration-200 ${
        inverted ? "bg-[#d6cfc0] text-[#2d4a3e]" : "bg-[#2d4a3e] text-[#f0ebe0]"
      }`}
    >
      <ArrowUpRight size={Math.round(size * 0.4)} />
    </span>
  );
}

/* ─── Section heading ────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40 mb-2"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {children}
    </p>
  );
}

/* ─── Table row ─────────────────────────────────────────────────── */
function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="grid py-4 border-b border-[#2d4a3e]/08"
      style={{ gridTemplateColumns: "140px 1fr" }}
    >
      <p
        className="text-[11px] tracking-[0.1em] uppercase font-semibold text-[#2d4a3e]/40 pt-0.5"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

/* ─── Edit modal ─────────────────────────────────────────────────── */
function EditModal({
  form,
  onChange,
  onSave,
  onClose,
  saving,
}: {
  form: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  const inputStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: "#d6cfc0",
    border: "none",
    borderRadius: 12,
    padding: "12px 16px",
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    color: "#2d4a3e",
    outline: "none",
    transition: "background-color 0.15s ease",
  };

  const fields: {
    key: string;
    label: string;
    type?: string;
    multiline?: boolean;
    placeholder?: string;
  }[] = [
    { key: "name", label: "Project Name" },
    {
      key: "tagline",
      label: "Tagline",
      placeholder: "One sentence that captures the essence…",
    },
    { key: "description", label: "Description", multiline: true },
    { key: "category", label: "Category" },
    {
      key: "tech_stack_tags",
      label: "Tech Stack",
      placeholder: "React, TypeScript, Supabase",
    },
    { key: "website_url", label: "Website URL", type: "url" },
    { key: "github_url", label: "GitHub URL", type: "url" },
    { key: "youtube_url", label: "YouTube Demo URL", type: "url" },
    { key: "logo_url", label: "Logo URL", type: "url" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 px-5 overflow-y-auto"
      style={{
        backgroundColor: "rgba(45,74,62,0.5)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="w-full max-w-xl rounded-3xl mb-14 overflow-hidden shadow-2xl"
        style={{ backgroundColor: "#f0ebe0" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-8 py-6 border-b"
          style={{ borderColor: "rgba(45,74,62,0.1)" }}
        >
          <div>
            <h2
              className="font-black text-[#2d4a3e] leading-tight uppercase"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 20,
                letterSpacing: "-0.02em",
              }}
            >
              Edit Profile
            </h2>
            <p
              className="text-[#2d4a3e]/45 text-sm mt-0.5"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Update your project details
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors"
            style={{ backgroundColor: "rgba(45,74,62,0.08)", color: "#2d4a3e" }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Fields */}
        <div className="px-8 py-6 flex flex-col gap-4">
          {fields.map(({ key, label, type, multiline, placeholder }) => (
            <div key={key}>
              <p
                className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#2d4a3e]/45 mb-2"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {label}
              </p>
              {multiline ? (
                <textarea
                  rows={4}
                  value={form[key]}
                  onChange={(e) => onChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="resize-none outline-none placeholder-[#2d4a3e]/30"
                  style={{
                    ...inputStyle,
                    fontFamily: "Georgia, serif",
                    lineHeight: 1.7,
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.backgroundColor = "#cdc7b7")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.backgroundColor = "#d6cfc0")
                  }
                />
              ) : (
                <input
                  type={type ?? "text"}
                  value={form[key]}
                  onChange={(e) => onChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="outline-none placeholder-[#2d4a3e]/30"
                  style={inputStyle}
                  onFocus={(e) =>
                    (e.currentTarget.style.backgroundColor = "#cdc7b7")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.backgroundColor = "#d6cfc0")
                  }
                />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-8 py-5 border-t"
          style={{ borderColor: "rgba(45,74,62,0.1)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] tracking-widest uppercase font-bold px-5 py-3 rounded-full border-none cursor-pointer transition-all hover:opacity-70"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: "#2d4a3e",
              border: "1.5px solid rgba(45,74,62,0.25)",
              backgroundColor: "transparent",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !form.name}
            className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold px-6 py-3 rounded-full border-none cursor-pointer transition-all hover:opacity-90 disabled:opacity-40"
            style={{
              fontFamily: "'Inter', sans-serif",
              backgroundColor: "#2d4a3e",
              color: "#f0ebe0",
            }}
          >
            {saving ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Save size={11} />
            )}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Social result panel ────────────────────────────────────────── */
function SocialPanel({
  result,
  onClose,
}: {
  result: {
    linkedin_post?: string;
    twitter_post?: string;
    suggested_hashtags?: string[];
  };
  onClose: () => void;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div
      className="rounded-3xl p-7 mt-5"
      style={{ backgroundColor: "#f5f2ea" }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3
          className="font-black text-[#2d4a3e] uppercase"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 16,
            letterSpacing: "-0.02em",
          }}
        >
          Generated Posts
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="border-none bg-transparent cursor-pointer text-[#2d4a3e]/40 hover:text-[#2d4a3e] transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Table rows */}
      <div className="border-t border-[#2d4a3e]/12">
        {result.linkedin_post && (
          <div className="py-5 border-b border-[#2d4a3e]/08">
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#2d4a3e]/40"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                LinkedIn
              </p>
              <button
                type="button"
                onClick={() => copyToClipboard(result.linkedin_post!, "linkedin")}
                className="text-[9px] tracking-[0.16em] uppercase font-bold px-3 py-1.5 rounded-full border-none cursor-pointer"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  backgroundColor: "rgba(45,74,62,0.06)",
                  color: "#2d4a3e",
                }}
              >
                {copiedKey === "linkedin" ? "Copied" : "Copy"}
              </button>
            </div>
            <p
              className="text-[#2d4a3e]/75 leading-relaxed text-sm whitespace-pre-wrap"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {result.linkedin_post}
            </p>
          </div>
        )}
        {result.twitter_post && !result.twitter_post.startsWith("Error") && (
          <div className="py-5 border-b border-[#2d4a3e]/08">
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#2d4a3e]/40"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                X / Twitter
              </p>
              <button
                type="button"
                onClick={() => copyToClipboard(result.twitter_post!, "twitter")}
                className="text-[9px] tracking-[0.16em] uppercase font-bold px-3 py-1.5 rounded-full border-none cursor-pointer"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  backgroundColor: "rgba(45,74,62,0.06)",
                  color: "#2d4a3e",
                }}
              >
                {copiedKey === "twitter" ? "Copied" : "Copy"}
              </button>
            </div>
            <p
              className="text-[#2d4a3e]/75 leading-relaxed text-sm"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {result.twitter_post}
            </p>
          </div>
        )}
        {result.suggested_hashtags && result.suggested_hashtags.length > 0 && (
          <div className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#2d4a3e]/40"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Hashtags
              </p>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    result.suggested_hashtags!.map((h) => `#${h.replace(/^#/, "")}`).join(" "),
                    "hashtags",
                  )
                }
                className="text-[9px] tracking-[0.16em] uppercase font-bold px-3 py-1.5 rounded-full border-none cursor-pointer"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  backgroundColor: "rgba(45,74,62,0.06)",
                  color: "#2d4a3e",
                }}
              >
                {copiedKey === "hashtags" ? "Copied" : "Copy all"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.suggested_hashtags.map((h) => (
                <span
                  key={h}
                  className="text-[10px] px-2.5 py-1 rounded-sm"
                  style={{
                    backgroundColor: "rgba(45,74,62,0.08)",
                    color: "#2d4a3e",
                    fontFamily: "Georgia, serif",
                  }}
                >
                  #{h.replace(/^#/, "")}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export function ProjectEditor({
  initialProject,
  initialSubmissions,
  initialBoosterNames,
  initialBoosterTypes,
  projectId,
  backHref,
  backLabel,
}: {
  initialProject: StoredProject | null;
  initialSubmissions: StoredSubmission[];
  initialBoosterNames: Record<string, string>;
  initialBoosterTypes: Record<string, string>;
  projectId: string;
  backHref?: string;
  backLabel?: string;
}) {
  const saveProjectMutation = useSaveProject();

  const [project, setProject] = useState<StoredProject | null | undefined>(
    initialProject,
  );
  const [submissions] = useState<StoredSubmission[]>(initialSubmissions);
  const [boosterNames] = useState<Record<string, string>>(initialBoosterNames);
  const [boosterTypes] = useState<Record<string, string>>(initialBoosterTypes);
  const [kbActiveTab, setKbActiveTab] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialResult, setSocialResult] = useState<{
    linkedin_post?: string;
    twitter_post?: string;
    suggested_hashtags?: string[];
  } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [activeLabTab, setActiveLabTab] = useState<
    "project-mentor" | "social-copy" | "pitch-coach" | "code-reviewer"
  >("social-copy");
  const [labPrompt, setLabPrompt] = useState("");
  const [editForm, setEditForm] = useState<Record<string, string>>({
    name: "",
    tagline: "",
    description: "",
    category: "",
    website_url: "",
    github_url: "",
    youtube_url: "",
    logo_url: "",
    tech_stack_tags: "",
  });

  const startEditing = () => {
    if (!project) return;
    setEditForm({
      name: project.name ?? "",
      tagline: project.tagline ?? "",
      description: String(
        project.refined_description ??
          (project as { description?: string }).description ??
          "",
      ),
      category: project.category ?? "",
      website_url: project.website_url ?? "",
      github_url: project.github_url ?? "",
      youtube_url: project.youtube_url ?? "",
      logo_url: project.logo_url ?? "",
      tech_stack_tags: (project.tech_stack_tags ?? []).join(", "),
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!project) return;
    setSaving(true);
    try {
      const updated: StoredProject = {
        ...project,
        name: editForm.name,
        tagline: editForm.tagline || undefined,
        description: editForm.description || undefined,
        refined_description: editForm.description || undefined,
        category: editForm.category || undefined,
        website_url: editForm.website_url || undefined,
        github_url: editForm.github_url || undefined,
        youtube_url: editForm.youtube_url || undefined,
        logo_url: editForm.logo_url || undefined,
        tech_stack_tags: editForm.tech_stack_tags
          ? editForm.tech_stack_tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };
      await saveProjectMutation.mutateAsync(updated);
      setProject(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    if (!project) return;
    setActiveLabTab("social-copy");
    setLabPrompt("");
    setShareOpen(true);
  };

  const runSocialCopy = async () => {
    if (!project) return;
    setSocialLoading(true);
    setSocialResult(null);
    try {
      const res = await fetch("/api/builder-agents/social-amplifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: {
            name: project.name,
            tagline: project.tagline || "",
            refined_description: String(project.refined_description ?? ""),
            tech_stack_tags: project.tech_stack_tags || [],
            category: project.category || "",
            key_features: project.key_features || [],
            loops_profile_url: `/viewer/projects/${projectId}`,
          },
          tone: "excited",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setSocialResult(data);
    } catch (e) {
      setSocialResult({ twitter_post: `Error: ${String(e)}` });
    } finally {
      setSocialLoading(false);
    }
  };

  /* ─── Loading / error ─── */
  if (project === undefined)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f0ebe0" }}
      >
        <Loader2
          size={18}
          className="animate-spin"
          style={{ color: "#2d4a3e" }}
        />
      </div>
    );

  const effectiveBackHref = backHref ?? "/builder/projects";
  const effectiveBackLabel = backLabel ?? "Projects";

  if (project === null)
    return (
      <div
        className="min-h-screen px-10 py-12"
        style={{ backgroundColor: "#f0ebe0" }}
      >
        <Link
          href={effectiveBackHref}
          className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold text-[#2d4a3e]/50 no-underline"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <ArrowLeft size={12} /> {effectiveBackLabel}
        </Link>
        <p
          className="mt-10 text-[#2d4a3e]/50"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Project not found.
        </p>
      </div>
    );

  const p = project;
  const socialLinks = (p.social_links ?? []) as {
    label: string;
    url: string;
  }[];
  const additionalLinks = (p.additional_links ?? []) as {
    label: string;
    url: string;
  }[];
  const screenshots = (p.screenshot_urls ?? []) as string[];
  const tags = (p.tech_stack_tags ?? []) as string[];
  const features = (p.key_features ?? []) as string[];
  const desc = String(
    p.refined_description ?? (p as { description?: string }).description ?? "",
  );
  const loopsProfileUrl = `/viewer/projects/${projectId}`;

  const links = [
    { key: "github", href: p.github_url, icon: Github, label: "GitHub" },
    { key: "website", href: p.website_url, icon: Globe, label: "Website" },
    { key: "demo", href: p.youtube_url, icon: Youtube, label: "Demo" },
  ].filter((l) => l.href);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>
      {/* ── Nav ─ strip style ───────────────────────────────────────── */}
      <div className="sticky top-0 z-50" style={{ backgroundColor: "#f0ebe0" }}>
        <div>
          <div
            className="flex w-full items-stretch border-t border-b border-[#1a1a1a] text-[10px] tracking-[0.18em] uppercase font-bold text-[#1a1a1a]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {/* Left: back */}
            <Link
              href={effectiveBackHref}
              className="w-[240px] max-w-xs px-10 py-8 flex items-center justify-start border-r border-[#1a1a1a] no-underline hover:bg-[#e1dbcf]"
            >
              <span className="flex items-center gap-2">
                <ArrowLeft size={11} />
                <span>{effectiveBackLabel}</span>
              </span>
            </Link>

            {/* Center: project name */}
            <div className="flex-1 min-w-0 py-8 flex items-center justify-center px-6 border-r border-[#1a1a1a]">
              <span>{p.name}</span>
            </div>

            {/* Right: actions as bordered tabs (Edit / Public URL) */}
            <div className="w-[320px] max-w-md flex items-stretch border-l border-[#1a1a1a]">
              <button
                type="button"
                onClick={startEditing}
                className="flex-1 min-w-0 py-8 px-6 flex items-center justify-center border-r border-[#1a1a1a] bg-transparent hover:bg-[#e1dbcf] cursor-pointer text-[9px] tracking-[0.16em] uppercase font-bold"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <span className="flex items-center gap-2">
                  <Pencil size={11} />
                  <span>Edit</span>
                </span>
              </button>

              <Link
                href={loopsProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 py-8 px-6 flex items-center justify-center border-r border-[#1a1a1a] no-underline hover:bg-[#e1dbcf] text-[9px] tracking-[0.16em] uppercase font-bold text-[#1a1a1a]"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <span className="flex items-center gap-2">
                  <ExternalLink size={11} />
                  <span>Public URL</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="px-10 py-8 max-w-[1400px] mx-auto">
        {/* ── Hero heading ─────────────────────────────────────────────── */}
        <div className="mb-12">
          <h1
            className="font-black text-[#2d4a3e] leading-[0.88] uppercase"
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: "clamp(48px, 8vw, 120px)",
              letterSpacing: "-0.025em",
            }}
          >
            {p.name}
          </h1>
          {p.tagline && (
            <div className="flex justify-end mt-4">
              <p
                className="text-[#2d4a3e]/55 max-w-[420px] text-right leading-relaxed"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "clamp(14px, 1.5vw, 18px)",
                }}
              >
                {p.tagline}
              </p>
            </div>
          )}
        </div>

        {/* ── Three-column grid ─────────────────────────────────────────── */}
        <div
          className="grid gap-5 items-start"
          style={{ gridTemplateColumns: "280px 1fr 340px" }}
        >
          {/* ═══ LEFT — sidebar ═══════════════════════════════════════════ */}
          <aside className="sticky top-[81px] flex flex-col gap-5">
            {/* Logo */}
            <div
              className="w-full rounded-3xl overflow-hidden flex items-center justify-center"
              style={{ aspectRatio: "1/1", backgroundColor: "#d6cfc0" }}
            >
              {p.logo_url ? (
                <Image
                  src={p.logo_url}
                  alt={p.name}
                  width={280}
                  height={280}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Code2 size={48} style={{ color: "#2d4a3e", opacity: 0.22 }} />
              )}
            </div>

            {/* Category + tags */}
            <div className="flex flex-wrap gap-2">
              {p.category && (
                <span
                  className="text-[8px] tracking-[0.15em] uppercase font-bold px-3 py-1.5 rounded-sm"
                  style={{
                    backgroundColor: "#2d4a3e",
                    color: "#f0ebe0",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {p.category}
                </span>
              )}
              {tags.slice(0, 5).map((t) => (
                <span
                  key={t}
                  className="text-[9px] px-2.5 py-1 rounded-sm"
                  style={{
                    backgroundColor: "rgba(45,74,62,0.08)",
                    color: "#2d4a3e",
                    fontFamily: "Georgia, serif",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Link squares */}
            {links.length > 0 && (
              <div
                className="grid gap-3"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(links.length, 3)}, 1fr)`,
                }}
              >
                {links.map(({ key, href, icon: Icon, label }) => (
                  <Link
                    key={key}
                    href={href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group no-underline"
                  >
                    <div
                      className="rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-200 group-hover:scale-[1.03]"
                      style={{ aspectRatio: "1/1", backgroundColor: "#2d4a3e" }}
                    >
                      <Icon size={24} style={{ color: "#d6cfc0" }} />
                      <span
                        className="text-[8px] tracking-[0.14em] uppercase font-bold text-[#d6cfc0]/50"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {label}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Social links */}
            {socialLinks.length > 0 && (
              <div className="flex flex-col gap-2">
                <SectionLabel>Social</SectionLabel>
                {socialLinks.slice(0, 5).map((s, i) => (
                  <Link
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between no-underline rounded-2xl px-4 py-3 transition-all duration-200 hover:scale-[1.01]"
                    style={{ backgroundColor: "#d6cfc0" }}
                  >
                    <span
                      className="text-[11px] font-semibold text-[#2d4a3e] truncate"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {s.label || s.url}
                    </span>
                    <ExternalLink
                      size={11}
                      style={{ color: "rgba(45,74,62,0.4)", flexShrink: 0 }}
                    />
                  </Link>
                ))}
              </div>
            )}

            {/* Booster submissions */}
            {submissions.length > 0 && (
              <div
                className="rounded-2xl p-5"
                style={{ backgroundColor: "#2d4a3e" }}
              >
                <SectionLabel>
                  <span style={{ color: "rgba(240,235,224,0.4)" }}>
                    Incubated at
                  </span>
                </SectionLabel>
                <div className="flex flex-col gap-2 mt-2">
                  {submissions.map((s) => (
                    <Link
                      key={s.id}
                      href={`/boosters/${boosterTypes[s.booster_id] ?? "idea"}/${s.booster_id}`}
                      className="text-[12px] text-[#f0ebe0]/70 no-underline hover:text-[#f0ebe0] transition-colors"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      → {boosterNames[s.booster_id] ?? "Booster"}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* ═══ CENTRE — detail table ════════════════════════════════════ */}
          <main className="flex flex-col gap-5">
            {/* Description card */}
            <div
              className="rounded-3xl p-7"
              style={{ backgroundColor: "#f5f2ea" }}
            >
              <SectionLabel>AI Generated Description</SectionLabel>
              <p
                className="text-[#2d4a3e]/75 leading-relaxed"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "clamp(14px, 1.4vw, 16px)",
                }}
              >
                {desc || "No description available yet."}
              </p>
            </div>

            {/* Gallery */}
            {screenshots.length > 0 && (
              <div
                className="rounded-3xl p-7"
                style={{ backgroundColor: "#f5f2ea" }}
              >
                <SectionLabel>Gallery</SectionLabel>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {screenshots.slice(0, 4).map((src, i) => (
                    <a
                      key={i}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-2xl overflow-hidden relative"
                      style={{
                        aspectRatio: "16/9",
                        backgroundColor: "#d6cfc0",
                      }}
                    >
                      <Image src={src} alt="" fill className="object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

          </main>

          {/* ═══ RIGHT — KB + features ═══════════════════════════════════ */}
          <aside className="sticky top-[81px] flex flex-col gap-4">
            {/* Features card */}
            {features.length > 0 && (
              <div
                className="rounded-3xl p-7"
                style={{ backgroundColor: "#f5f2ea" }}
              >
                <SectionLabel>Key Features</SectionLabel>
                <div className="border-t border-[#2d4a3e]/12 mt-3">
                  {features.slice(0, 8).map((f, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 py-3 border-b border-[#2d4a3e]/08"
                    >
                      <span
                        className="font-black text-[#2d4a3e]/18 leading-none shrink-0 mt-0.5"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 12,
                          letterSpacing: "-0.02em",
                          width: 20,
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p
                        className="text-[#2d4a3e]/70 text-sm leading-relaxed"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {f}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Knowledge base */}
            {(p.kb_sections?.length ?? 0) > 0 && (
              <div
                className="rounded-3xl p-7"
                style={{ backgroundColor: "#2d4a3e" }}
              >
                <p
                  className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#f0ebe0]/40 mb-4"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Knowledge Base
                </p>
                {typeof p.knowledge_base_chunks === "number" && (
                  <p
                    className="text-sm text-[#f0ebe0]/50 mb-4"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {p.knowledge_base_chunks} chunks indexed
                  </p>
                )}

                {/* Tab pills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(p.kb_sections as string[]).map((source) => {
                    const meta = KB_TABS[source] ?? {
                      label: source,
                      icon: FileText,
                    };
                    const Icon = meta.icon;
                    const isActive = kbActiveTab === source;
                    return (
                      <button
                        key={source}
                        type="button"
                        onClick={() => setKbActiveTab(isActive ? null : source)}
                        className="inline-flex items-center gap-1.5 rounded-full text-[9px] tracking-[0.12em] uppercase font-bold px-3.5 py-2 border-none cursor-pointer transition-all"
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          backgroundColor: isActive
                            ? "#d6cfc0"
                            : "rgba(240,235,224,0.1)",
                          color: isActive ? "#2d4a3e" : "rgba(240,235,224,0.5)",
                        }}
                      >
                        <Icon size={10} /> {meta.label}
                      </button>
                    );
                  })}
                </div>

                {/* Active tab content */}
                {kbActiveTab && (
                  <div
                    className="rounded-2xl p-5"
                    style={{
                      backgroundColor: "rgba(240,235,224,0.07)",
                      border: "1px solid rgba(240,235,224,0.08)",
                    }}
                  >
                    {kbActiveTab === "profile" && (
                      <p
                        className="text-[13px] text-[#f0ebe0]/70 leading-relaxed whitespace-pre-wrap"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {desc || "No description."}
                      </p>
                    )}

                    {kbActiveTab === "code" && (
                      <div className="flex flex-col gap-3">
                        {p.github_url && (
                          <Link
                            href={p.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 no-underline text-[#f0ebe0]/70 hover:text-[#f0ebe0] text-[12px]"
                            style={{ fontFamily: "Georgia, serif" }}
                          >
                            <Github size={13} /> {p.github_url}
                          </Link>
                        )}
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {tags.map((t) => (
                              <span
                                key={t}
                                className="text-[10px] rounded-lg px-2.5 py-1"
                                style={{
                                  backgroundColor: "rgba(240,235,224,0.1)",
                                  color: "rgba(240,235,224,0.6)",
                                  fontFamily: "Georgia, serif",
                                }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        {p.flattened_codebase && (
                          <div>
                            <p
                              className="text-[10px] text-[#f0ebe0]/35 mb-2"
                              style={{ fontFamily: "'Inter', sans-serif" }}
                            >
                              {`${(String(p.flattened_codebase).length / 1024).toFixed(1)} KB`}
                            </p>
                            <div
                              className="rounded-xl overflow-auto max-h-52"
                              style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
                            >
                              <pre className="p-4 text-[11px] text-[#f0ebe0]/60 whitespace-pre-wrap break-words font-mono">
                                {String(p.flattened_codebase).slice(0, 60_000)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {kbActiveTab === "demo" && (
                      <div className="flex flex-col gap-3">
                        {p.youtube_url && (
                          <Link
                            href={p.youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 no-underline text-[#f0ebe0]/70 hover:text-[#f0ebe0] text-[12px]"
                            style={{ fontFamily: "Georgia, serif" }}
                          >
                            <Video size={13} /> Watch demo
                          </Link>
                        )}
                        {features.length > 0 && (
                          <ul className="flex flex-col gap-1.5">
                            {features.slice(0, 5).map((f, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-[12px] text-[#f0ebe0]/60"
                                style={{ fontFamily: "Georgia, serif" }}
                              >
                                <span className="shrink-0 mt-0.5 opacity-40">
                                  →
                                </span>{" "}
                                {f}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {kbActiveTab === "theme" && (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          {[
                            { label: "Primary", value: p.primary_color },
                            { label: "Accent", value: p.accent_color },
                            { label: "Secondary", value: p.secondary_color },
                          ]
                            .filter((c) => c.value)
                            .map(({ label, value }) => (
                              <div
                                key={label}
                                className="flex flex-col items-center gap-1.5"
                              >
                                <span
                                  className="w-10 h-10 rounded-xl border border-[#f0ebe0]/15"
                                  style={{
                                    backgroundColor: String(value),
                                    display: "block",
                                  }}
                                />
                                <span
                                  className="text-[9px] tracking-widest uppercase text-[#f0ebe0]/40"
                                  style={{ fontFamily: "'Inter', sans-serif" }}
                                >
                                  {label}
                                </span>
                              </div>
                            ))}
                          {p.theme_label && (
                            <span
                              className="text-[11px] text-[#f0ebe0]/50 capitalize"
                              style={{ fontFamily: "Georgia, serif" }}
                            >
                              {String(p.theme_label).replace(/-/g, " ")}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tech stack (if no KB) */}
            {tags.length > 0 && !(p.kb_sections?.length ?? 0) && (
              <div
                className="rounded-2xl px-6 py-5"
                style={{ backgroundColor: "#2d4a3e" }}
              >
                <p
                  className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#f0ebe0]/40 mb-4"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Tech Stack
                </p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-lg px-3 py-1.5 text-[11px]"
                      style={{
                        fontFamily: "Georgia, serif",
                        backgroundColor: "rgba(214,207,192,0.1)",
                        color: "rgba(240,235,224,0.65)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* ── Floating share button ────────────────────────────────────── */}
      {project && (
        <button
          type="button"
          onClick={handleShare}
          disabled={socialLoading}
          className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full border-none cursor-pointer text-[10px] tracking-[0.18em] uppercase font-bold px-5 py-2.5 shadow-md hover:shadow-lg disabled:opacity-40"
          style={{
            fontFamily: "'Inter', sans-serif",
            backgroundColor: "#2d4a3e",
            color: "#f0ebe0",
          }}
        >
          {socialLoading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Share2 size={12} />
          )}
          <span>Share</span>
        </button>
      )}

      {/* ── AI agent lab modal ───────────────────────────────────────── */}
      {shareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end px-4"
          style={{
            backgroundColor: "rgba(45,74,62,0.4)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="w-full max-w-xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            style={{ backgroundColor: "#f0ebe0" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-[#2d4a3e]/15"
            >
              <div>
                <p
                  className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/45 mb-1"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  AI Agents
                </p>
                <h2
                  className="font-black text-[#2d4a3e] uppercase leading-tight"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 20,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Your Project Lab
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShareOpen(false);
                  setSocialResult(null);
                  setSocialLoading(false);
                  setActiveLabTab("social-copy");
                  setLabPrompt("");
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer"
                style={{
                  backgroundColor: "rgba(45,74,62,0.08)",
                  color: "#2d4a3e",
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-4 pb-3 border-b border-[#2d4a3e]/12">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "project-mentor", label: "Project Mentor" },
                  { key: "social-copy", label: "Social Copy" },
                  { key: "pitch-coach", label: "Pitch Coach" },
                  { key: "code-reviewer", label: "Code Reviewer" },
                ].map((tab) => {
                  const isActive = activeLabTab === tab.key;
                  const isEnabled = tab.key === "social-copy";
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() =>
                        isEnabled && setActiveLabTab(tab.key as typeof activeLabTab)
                      }
                      disabled={!isEnabled}
                      className="inline-flex items-center rounded-full px-3.5 py-1.5 text-[9px] tracking-[0.16em] uppercase font-bold border-none cursor-pointer disabled:cursor-not-allowed"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        backgroundColor: isActive
                          ? "#2d4a3e"
                          : "rgba(45,74,62,0.06)",
                        color: isActive ? "#f0ebe0" : "#2d4a3e",
                        opacity: isEnabled ? 1 : 0.4,
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col">
              {/* Description + suggestions */}
              <div className="px-6 pt-4 pb-3">
                <p
                  className="text-sm text-[#2d4a3e]/75 mb-3"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {activeLabTab === "social-copy"
                    ? "Sharpen your announcement and generate polished LinkedIn and X posts for this project."
                    : "Coming soon: additional agents to help you refine and ship your project faster."}
                </p>
                {activeLabTab === "social-copy" && (
                  <div>
                    <p
                      className="text-[10px] tracking-[0.18em] uppercase font-bold text-[#2d4a3e]/45 mb-2"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      Suggested
                    </p>
                    <div className="flex flex-col gap-2">
                      {[
                        "Announce this project launch.",
                        "Write a recap after winning a hackathon.",
                        "Share a milestone update for this project.",
                      ].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setLabPrompt(s)}
                          className="w-full text-left rounded-2xl px-4 py-2.5 border-none cursor-pointer"
                          style={{
                            backgroundColor: "rgba(214,207,192,0.8)",
                            color: "#2d4a3e",
                            fontFamily: "Georgia, serif",
                            fontSize: 13,
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Results area */}
              <div className="flex-1 overflow-y-auto px-6 pb-4">
                {activeLabTab === "social-copy" && (
                  <>
                    {socialLoading && !socialResult && (
                      <div className="h-full flex flex-col items-center justify-center gap-4">
                        <Loader2
                          size={22}
                          className="animate-spin"
                          style={{ color: "#2d4a3e" }}
                        />
                        <p
                          className="text-sm text-[#2d4a3e]/70"
                          style={{ fontFamily: "Georgia, serif" }}
                        >
                          Generating social posts for your project…
                        </p>
                      </div>
                    )}
                    {!socialLoading && !socialResult && (
                      <p
                        className="text-xs text-[#2d4a3e]/55"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        Start by picking a suggested question or typing your own prompt
                        below, then send it to generate posts.
                      </p>
                    )}
                    {socialResult && (
                      <div className="mt-3">
                        <SocialPanel
                          result={socialResult}
                          onClose={() => setSocialResult(null)}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Input row */}
              <div className="px-6 py-4 border-t border-[#2d4a3e]/12">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={labPrompt}
                    onChange={(e) => setLabPrompt(e.target.value)}
                    placeholder={
                      activeLabTab === "social-copy"
                        ? "Ask for social copy…"
                        : "This agent is coming soon."
                    }
                    disabled={activeLabTab !== "social-copy"}
                    className="flex-1 rounded-full px-4 py-2.5 text-sm border-none outline-none"
                    style={{
                      backgroundColor: "#e8e2d4",
                      color: "#2d4a3e",
                      fontFamily: "Georgia, serif",
                    }}
                  />
                  <button
                    type="button"
                    onClick={runSocialCopy}
                    disabled={
                      activeLabTab !== "social-copy" || socialLoading || !project
                    }
                    className="w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer disabled:opacity-40"
                    style={{
                      backgroundColor: "#2d4a3e",
                      color: "#f0ebe0",
                    }}
                  >
                    {socialLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Share2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Ticker ───────────────────────────────────────────────────── */}
      <div
        className="mt-16 overflow-hidden border-t border-[#2d4a3e]/10 py-3"
        style={{ backgroundColor: "#e8e2d4" }}
      >
        <div
          className="flex gap-10 whitespace-nowrap"
          style={{ animation: "ticker 28s linear infinite" }}
        >
          {[...Array(3)].map((_, ri) =>
            [
              p.name.toUpperCase(),
              "★",
              "BUILDER DASHBOARD",
              "★",
              "PROFILE CREATOR",
              "★",
            ].map((t, i) => (
              <span
                key={`${ri}-${i}`}
                className="text-[10px] tracking-[0.2em] uppercase font-bold shrink-0"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  color: t === "★" ? "#2d4a3e" : "rgba(45,74,62,0.4)",
                }}
              >
                {t}
              </span>
            )),
          )}
        </div>
      </div>

      {/* ── Edit modal ───────────────────────────────────────────────── */}
      {editing && (
        <EditModal
          form={editForm}
          onChange={(key, value) =>
            setEditForm((f) => ({ ...f, [key]: value }))
          }
          onSave={handleSave}
          onClose={() => setEditing(false)}
          saving={saving}
        />
      )}

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
