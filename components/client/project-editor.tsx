"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Code2,
  Video,
  Palette,
  Github,
  Globe,
  Youtube,
  Share2,
  Loader2,
  UserPlus,
  Trash2,
  Users,
  Pencil,
  Check,
} from "lucide-react";
import { saveProjectAction, addTeamMemberAction, removeTeamMemberAction } from "@/lib/actions";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { StoredProject, StoredSubmission } from "@/lib/data-mappers";
import type { TeamMemberInfo } from "@/lib/server-data";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

/* ─── Types ──────────────────────────────────────────────────────── */
const KB_TABS: Record<string, { label: string; icon: React.ElementType }> = {
  profile: { label: "Profile", icon: FileText },
  code: { label: "Code", icon: Code2 },
  demo: { label: "Demo", icon: Video },
  theme: { label: "Theme", icon: Palette },
};

/* ─── Arrow circle ───────────────────────────────────────────────── */
// function ArrowCircle({
//   size = 40,
//   inverted = false,
// }: {
//   size?: number;
//   inverted?: boolean;
// }) {
//   return (
//     <span
//       style={{ width: size, height: size }}
//       className={`inline-flex items-center justify-center rounded-full shrink-0 transition-all duration-200 ${
//         inverted ? "bg-[rgba(15,44,35,0.06)] text-[#0F2C23]" : "bg-[#0F2C23] text-[#F8FFE8]"
//       }`}
//     >
//       <ArrowUpRight size={Math.round(size * 0.4)} />
//     </span>
//   );
// }

/* ─── Section heading ────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[9px] tracking-[0.2em] uppercase font-bold mb-2"
      style={{ fontFamily: PX, color: "rgba(15,44,35,0.4)" }}
    >
      {children}
    </p>
  );
}

function PencilBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      style={{ backgroundColor: "rgba(15,44,35,0.08)" }}
    >
      <Pencil size={11} style={{ color: "#0F2C23" }} />
    </button>
  );
}

function InlineSaveCancel({
  onSave,
  onCancel,
  saving,
  disabled,
}: {
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 mt-3">
      <button
        type="button"
        onClick={onSave}
        disabled={saving || disabled}
        className="inline-flex items-center gap-1.5 text-[9px] tracking-[0.14em] uppercase font-bold px-3.5 py-2 rounded-full border-none cursor-pointer transition-all hover:opacity-90 disabled:opacity-40"
        style={{ fontFamily: PX, backgroundColor: "#0F2C23", color: "#F8FFE8" }}
      >
        {saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
        {saving ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-[9px] tracking-[0.14em] uppercase font-bold px-3.5 py-2 rounded-full cursor-pointer transition-all hover:opacity-70"
        style={{ fontFamily: PX, color: "#0F2C23", border: "1px solid rgba(15,44,35,0.2)", backgroundColor: "transparent" }}
      >
        Cancel
      </button>
    </div>
  );
}

/* ─── Table row ─────────────────────────────────────────────────── */
// function InfoRow({
//   label,
//   children,
// }: {
//   label: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <div
//       className="grid py-4 border-b border-[#0F2C23]/08"
//       style={{ gridTemplateColumns: "140px 1fr" }}
//     >
//       <p
//         className="text-[11px] tracking-[0.1em] uppercase font-semibold text-[#0F2C23]/40 pt-0.5"
//         style={{ fontFamily: PX }}
//       >
//         {label}
//       </p>
//       <div>{children}</div>
//     </div>
//   );
// }


/* ─── Page ────────────────────────────────────────────────────────── */
export function ProjectEditor({
  initialProject,
  initialSubmissions,
  initialBoosterNames,
  initialBoosterTypes,
  projectId,
  backHref,
  backLabel,
  initialTeamMembers = [],
  teamOwnerId,
  currentUserId,
}: {
  initialProject: StoredProject | null;
  initialSubmissions: StoredSubmission[];
  initialBoosterNames: Record<string, string>;
  initialBoosterTypes: Record<string, string>;
  projectId: string;
  backHref?: string;
  backLabel?: string;
  initialTeamMembers?: TeamMemberInfo[];
  teamOwnerId?: string | null;
  currentUserId?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [project, setProject] = useState<StoredProject | null | undefined>(
    initialProject,
  );
  const [submissions] = useState<StoredSubmission[]>(initialSubmissions);
  const [boosterNames] = useState<Record<string, string>>(initialBoosterNames);
  const [boosterTypes] = useState<Record<string, string>>(initialBoosterTypes);
  const [teamMembers, setTeamMembers] = useState<TeamMemberInfo[]>(initialTeamMembers);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberError, setMemberError] = useState<string | null>(null);
  const isOwner = currentUserId === teamOwnerId;
  const [kbActiveTab, setKbActiveTab] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialResult, setSocialResult] = useState<{
    linkedin_post?: string;
    twitter_post?: string;
    suggested_hashtags?: string[];
  } | null>(null);
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

  type EditSection = "hero" | "description" | "meta" | "links" | "logo" | null;
  const [editingSection, setEditingSection] = useState<EditSection>(null);

  const openSection = (section: NonNullable<EditSection>) => {
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
    setEditingSection(section);
  };

  const handleSave = () => {
    if (!project) return;
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
    startTransition(async () => {
      const result = await saveProjectAction(updated);
      if (result.success) {
        setProject(updated);
        setEditingSection(null);
        router.refresh();
      }
    });
  };

  const handleAddMember = () => {
    if (!project?.team_id || !memberEmail.trim()) return;
    setMemberError(null);
    startTransition(async () => {
      const result = await addTeamMemberAction(project.team_id!, memberEmail.trim());
      if (result.success) {
        setTeamMembers((prev) => [
          ...prev,
          {
            user_id: result.data.user_id,
            role: "member",
            email: result.data.email,
            display_name: result.data.display_name,
            avatar_url: null,
          },
        ]);
        setMemberEmail("");
        router.refresh();
      } else {
        setMemberError(result.error);
      }
    });
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
        style={{ backgroundColor: "#F8FFE8" }}
      >
        <Loader2
          size={18}
          className="animate-spin"
          style={{ color: "#0F2C23" }}
        />
      </div>
    );

  const effectiveBackHref = backHref ?? "/builder/projects";
  const effectiveBackLabel = backLabel ?? "Projects";

  if (project === null)
    return (
      <div
        className="min-h-screen px-10 py-12"
        style={{ backgroundColor: "#F8FFE8" }}
      >
        <Link
          href={effectiveBackHref}
          className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold text-[#0F2C23]/50 no-underline"
          style={{ fontFamily: PX }}
        >
          <ArrowLeft size={12} /> {effectiveBackLabel}
        </Link>
        <p
          className="mt-10 text-[#0F2C23]/50"
          style={{ fontFamily: FN }}
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
  // const additionalLinks = (p.additional_links ?? []) as {
  //   label: string;
  //   url: string;
  // }[];
  const screenshots = (p.screenshot_urls ?? []) as string[];
  const tags = (p.tech_stack_tags ?? []) as string[];
  const features = (p.key_features ?? []) as string[];
  const desc = String(
    p.refined_description ?? (p as { description?: string }).description ?? "",
  );
  type SectionView = "project" | "share";
  const [activeSection, setActiveSection] = useState<SectionView>("project");

  useEffect(() => {
    const read = () => {
      const h = window.location.hash.replace("#", "");
      if (!h) return;
      if (h === "public") {
        window.open(`/viewer/projects/${projectId}`, "_blank");
        history.replaceState(null, "", window.location.pathname);
        return;
      }
      if (h === "share") setActiveSection("share");
      else if (h === "edit") setActiveSection("project");
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [projectId]);

  const links = [
    { key: "github", href: p.github_url, icon: Github, label: "GitHub" },
    { key: "website", href: p.website_url, icon: Globe, label: "Website" },
    { key: "demo", href: p.youtube_url, icon: Youtube, label: "Demo" },
  ].filter((l) => l.href);

  const inlineInputStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: "rgba(15,44,35,0.06)",
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    fontFamily: FN,
    fontSize: 14,
    color: "#0F2C23",
    outline: "none",
  };

  /* ─── Share full-screen view ─────────────────────────────────── */
  if (activeSection === "share") {
    return (
      <div className="flex flex-col h-screen overflow-hidden p-4" style={{ backgroundColor: "#F8FFE8" }}>
        <div className="flex-1 rounded-[15px] overflow-hidden flex flex-col min-h-0" style={{ backgroundColor: "#0F2C23" }}>
          {/* Header bar */}
          <div className="shrink-0 flex items-center justify-between px-10 py-4" style={{ borderBottom: "1px solid rgba(226,254,165,0.06)" }}>
            <p className="text-[9px] tracking-[0.25em] uppercase font-bold" style={{ fontFamily: PX, color: "rgba(226,254,165,0.3)" }}>
              {p.name} — AI Lab
            </p>
            <div className="flex items-center gap-2">
              {[
                { key: "social-copy" as const, label: "Social Copy" },
                { key: "project-mentor" as const, label: "Mentor" },
                { key: "pitch-coach" as const, label: "Pitch" },
                { key: "code-reviewer" as const, label: "Code Review" },
              ].map((tab) => {
                const isActive = activeLabTab === tab.key;
                const isEnabled = tab.key === "social-copy";
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => isEnabled && setActiveLabTab(tab.key as typeof activeLabTab)}
                    disabled={!isEnabled}
                    className="inline-flex items-center gap-1.5 rounded-full border-none cursor-pointer px-3.5 py-1.5 text-[8px] tracking-[0.16em] uppercase font-bold disabled:cursor-not-allowed"
                    style={{
                      fontFamily: PX,
                      backgroundColor: isActive ? "#E2FEA5" : "rgba(226,254,165,0.06)",
                      color: isActive ? "#0F2C23" : "rgba(226,254,165,0.4)",
                      opacity: isEnabled ? 1 : 0.35,
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {!socialResult ? (
              <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-10 py-10">
                <p
                  className="font-black uppercase leading-none select-none text-center mb-5"
                  style={{ fontFamily: PX, fontSize: "clamp(48px, 6vw, 80px)", letterSpacing: "-0.04em", opacity: 0.04, lineHeight: 0.85, color: "#E2FEA5" }}
                >
                  AMPLIFY
                </p>
                <p className="text-sm leading-relaxed text-center max-w-[440px]" style={{ fontFamily: FN, color: "rgba(226,254,165,0.45)" }}>
                  Generate polished LinkedIn and X posts to announce your project. Pick a prompt or write your own.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-3 max-w-[560px] w-full">
                  {[
                    "Announce this project launch",
                    "Write a recap after winning a hackathon",
                    "Share a milestone update",
                    "Create a call for contributors",
                  ].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setLabPrompt(s)}
                      className="rounded-2xl px-4 py-3.5 text-left text-[12px] transition-all hover:scale-[1.01] flex items-start justify-between gap-3 border-none cursor-pointer"
                      style={{ fontFamily: FN, backgroundColor: "rgba(226,254,165,0.04)", color: "rgba(226,254,165,0.6)", border: "1px solid rgba(226,254,165,0.07)" }}
                    >
                      <span className="leading-snug">{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-10 py-8">
                {/* Generated posts */}
                <div className="max-w-[720px] mx-auto flex flex-col gap-6">
                  {socialResult.linkedin_post && (
                    <div className="rounded-2xl p-6" style={{ backgroundColor: "rgba(226,254,165,0.04)", border: "1px solid rgba(226,254,165,0.06)" }}>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[9px] tracking-[0.2em] uppercase font-bold" style={{ fontFamily: PX, color: "rgba(226,254,165,0.3)" }}>LinkedIn</p>
                        <button
                          type="button"
                          onClick={async () => { try { await navigator.clipboard.writeText(socialResult.linkedin_post!); } catch {} }}
                          className="text-[8px] tracking-[0.16em] uppercase font-bold px-3 py-1.5 rounded-full border-none cursor-pointer"
                          style={{ fontFamily: PX, backgroundColor: "rgba(226,254,165,0.08)", color: "rgba(226,254,165,0.5)" }}
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-sm leading-[1.85] whitespace-pre-wrap" style={{ fontFamily: FN, color: "rgba(226,254,165,0.65)" }}>
                        {socialResult.linkedin_post}
                      </p>
                    </div>
                  )}
                  {socialResult.twitter_post && !socialResult.twitter_post.startsWith("Error") && (
                    <div className="rounded-2xl p-6" style={{ backgroundColor: "rgba(226,254,165,0.04)", border: "1px solid rgba(226,254,165,0.06)" }}>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[9px] tracking-[0.2em] uppercase font-bold" style={{ fontFamily: PX, color: "rgba(226,254,165,0.3)" }}>X / Twitter</p>
                        <button
                          type="button"
                          onClick={async () => { try { await navigator.clipboard.writeText(socialResult.twitter_post!); } catch {} }}
                          className="text-[8px] tracking-[0.16em] uppercase font-bold px-3 py-1.5 rounded-full border-none cursor-pointer"
                          style={{ fontFamily: PX, backgroundColor: "rgba(226,254,165,0.08)", color: "rgba(226,254,165,0.5)" }}
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-sm leading-[1.85] whitespace-pre-wrap" style={{ fontFamily: FN, color: "rgba(226,254,165,0.65)" }}>
                        {socialResult.twitter_post}
                      </p>
                    </div>
                  )}
                  {socialResult.suggested_hashtags && socialResult.suggested_hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {socialResult.suggested_hashtags.map((h) => (
                        <span
                          key={h}
                          className="text-[10px] px-3 py-1.5 rounded-full"
                          style={{ backgroundColor: "rgba(226,254,165,0.08)", color: "rgba(226,254,165,0.5)", fontFamily: FN }}
                        >
                          #{h.replace(/^#/, "")}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setSocialResult(null)}
                    className="text-[9px] tracking-[0.16em] uppercase font-bold border-none bg-transparent cursor-pointer self-center mt-2"
                    style={{ fontFamily: PX, color: "rgba(226,254,165,0.3)" }}
                  >
                    Generate again
                  </button>
                </div>
              </div>
            )}

            {/* Input bar */}
            <form
              className="shrink-0 px-10 py-6"
              style={{ borderTop: "1px solid rgba(226,254,165,0.06)" }}
              onSubmit={(e) => { e.preventDefault(); void runSocialCopy(); }}
            >
              <div className="flex items-end gap-3">
                <input
                  type="text"
                  value={labPrompt}
                  onChange={(e) => setLabPrompt(e.target.value)}
                  placeholder="Describe the kind of post you want…"
                  disabled={socialLoading}
                  className="flex-1 outline-none rounded-2xl px-5 py-4 text-sm"
                  style={{ fontFamily: FN, backgroundColor: "rgba(226,254,165,0.04)", color: "#E2FEA5", border: "1px solid rgba(226,254,165,0.08)", lineHeight: 1.7 }}
                />
                <button
                  type="submit"
                  disabled={socialLoading || !project}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#E2FEA5" }}
                  title="Generate"
                >
                  {socialLoading ? (
                    <Loader2 size={16} className="animate-spin" style={{ color: "#0F2C23" }} />
                  ) : (
                    <Share2 size={16} style={{ color: "#0F2C23" }} />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FFE8" }}>
      <div className="px-10 py-8 max-w-[1400px] mx-auto">
        {/* ── Hero heading ─────────────────────────────────────────────── */}
        <div className="mb-12 group relative">
          {editingSection === "hero" ? (
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Project name"
                className="outline-none placeholder-[#0F2C23]/30 font-black uppercase"
                style={{ ...inlineInputStyle, fontFamily: PX, fontSize: "clamp(32px, 5vw, 64px)", letterSpacing: "-0.025em", padding: "12px 18px", lineHeight: 1 }}
              />
              <input
                type="text"
                value={editForm.tagline}
                onChange={(e) => setEditForm((f) => ({ ...f, tagline: e.target.value }))}
                placeholder="Tagline — one sentence that captures the essence…"
                className="outline-none placeholder-[#0F2C23]/30 text-right self-end max-w-[420px] w-full"
                style={{ ...inlineInputStyle, fontFamily: FN, fontSize: "clamp(14px, 1.5vw, 18px)" }}
              />
              <InlineSaveCancel onSave={handleSave} onCancel={() => setEditingSection(null)} saving={isPending} disabled={!editForm.name} />
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <h1
                  className="font-black text-[#0F2C23] leading-[0.88] uppercase"
                  style={{ fontFamily: PX, fontSize: "clamp(48px, 8vw, 120px)", letterSpacing: "-0.025em" }}
                >
                  {p.name}
                </h1>
                <div className="mt-3"><PencilBtn onClick={() => openSection("hero")} /></div>
              </div>
              {p.tagline && (
                <div className="flex justify-end mt-4">
                  <p className="text-[#0F2C23]/55 max-w-[420px] text-right leading-relaxed" style={{ fontFamily: FN, fontSize: "clamp(14px, 1.5vw, 18px)" }}>
                    {p.tagline}
                  </p>
                </div>
              )}
            </>
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
            <div className="group relative">
              <div
                className="w-full rounded-3xl overflow-hidden flex items-center justify-center relative"
                style={{ aspectRatio: "1/1", backgroundColor: "rgba(15,44,35,0.06)" }}
              >
                {p.logo_url ? (
                  <Image src={p.logo_url} alt={p.name} width={280} height={280} className="w-full h-full object-cover" />
                ) : (
                  <Code2 size={48} style={{ color: "#0F2C23", opacity: 0.22 }} />
                )}
                <div className="absolute top-3 right-3"><PencilBtn onClick={() => openSection("logo")} /></div>
              </div>
              {editingSection === "logo" && (
                <div className="mt-2">
                  <input
                    type="url"
                    value={editForm.logo_url}
                    onChange={(e) => setEditForm((f) => ({ ...f, logo_url: e.target.value }))}
                    placeholder="Paste logo URL…"
                    className="outline-none placeholder-[#0F2C23]/30"
                    style={inlineInputStyle}
                  />
                  <InlineSaveCancel onSave={handleSave} onCancel={() => setEditingSection(null)} saving={isPending} />
                </div>
              )}
            </div>

            {/* Category + tags */}
            <div className="group relative">
              {editingSection === "meta" ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#0F2C23]/45 mb-1.5" style={{ fontFamily: PX }}>Category</p>
                    <input type="text" value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. AI, FinTech, DevTool" className="outline-none placeholder-[#0F2C23]/30" style={inlineInputStyle} />
                  </div>
                  <div>
                    <p className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#0F2C23]/45 mb-1.5" style={{ fontFamily: PX }}>Tech Stack</p>
                    <input type="text" value={editForm.tech_stack_tags} onChange={(e) => setEditForm((f) => ({ ...f, tech_stack_tags: e.target.value }))} placeholder="React, TypeScript, Supabase" className="outline-none placeholder-[#0F2C23]/30" style={inlineInputStyle} />
                  </div>
                  <InlineSaveCancel onSave={handleSave} onCancel={() => setEditingSection(null)} saving={isPending} />
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <div className="flex flex-wrap gap-2 flex-1">
                    {p.category && (
                      <span className="text-[8px] tracking-[0.15em] uppercase font-bold px-3 py-1.5 rounded-sm" style={{ backgroundColor: "#0F2C23", color: "#F8FFE8", fontFamily: PX }}>
                        {p.category}
                      </span>
                    )}
                    {tags.slice(0, 5).map((t) => (
                      <span key={t} className="text-[9px] px-2.5 py-1 rounded-sm" style={{ backgroundColor: "rgba(15,44,35,0.08)", color: "#0F2C23", fontFamily: FN }}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <PencilBtn onClick={() => openSection("meta")} />
                </div>
              )}
            </div>

            {/* Link squares */}
            <div className="group relative">
              {editingSection === "links" ? (
                <div className="flex flex-col gap-3">
                  {[
                    { key: "github_url", label: "GitHub URL", placeholder: "https://github.com/…" },
                    { key: "website_url", label: "Website URL", placeholder: "https://…" },
                    { key: "youtube_url", label: "Demo URL", placeholder: "https://youtube.com/…" },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <p className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#0F2C23]/45 mb-1.5" style={{ fontFamily: PX }}>{label}</p>
                      <input type="url" value={editForm[key]} onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="outline-none placeholder-[#0F2C23]/30" style={inlineInputStyle} />
                    </div>
                  ))}
                  <InlineSaveCancel onSave={handleSave} onCancel={() => setEditingSection(null)} saving={isPending} />
                </div>
              ) : links.length > 0 ? (
                <div className="flex items-start gap-2">
                  <div
                    className="grid gap-3 flex-1"
                    style={{ gridTemplateColumns: `repeat(${Math.min(links.length, 3)}, 1fr)` }}
                  >
                    {links.map(({ key, href, icon: Icon, label }) => (
                      <Link key={key} href={href!} target="_blank" rel="noopener noreferrer" className="no-underline">
                        <div className="rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.03]" style={{ aspectRatio: "1/1", backgroundColor: "#0F2C23" }}>
                          <Icon size={24} style={{ color: "rgba(226,254,165,0.6)" }} />
                          <span className="text-[8px] tracking-[0.14em] uppercase font-bold" style={{ fontFamily: PX, color: "rgba(226,254,165,0.4)" }}>{label}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <PencilBtn onClick={() => openSection("links")} />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openSection("links")}
                  className="w-full rounded-2xl px-4 py-4 border-none cursor-pointer text-left flex items-center gap-2"
                  style={{ backgroundColor: "rgba(15,44,35,0.04)", color: "rgba(15,44,35,0.35)", fontFamily: PX, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" as const }}
                >
                  <Pencil size={11} /> Add links
                </button>
              )}
            </div>

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
                    style={{ backgroundColor: "rgba(15,44,35,0.06)" }}
                  >
                    <span
                      className="text-[11px] font-semibold text-[#0F2C23] truncate"
                      style={{ fontFamily: PX }}
                    >
                      {s.label || s.url}
                    </span>
                    <ExternalLink
                      size={11}
                      style={{ color: "rgba(15,44,35,0.4)", flexShrink: 0 }}
                    />
                  </Link>
                ))}
              </div>
            )}

            {/* Booster submissions */}
            {submissions.length > 0 && (
              <div
                className="rounded-2xl p-5"
                style={{ backgroundColor: "#0F2C23" }}
              >
                <SectionLabel>
                  <span style={{ color: "rgba(226,254,165,0.4)" }}>
                    Incubated at
                  </span>
                </SectionLabel>
                <div className="flex flex-col gap-2 mt-2">
                  {submissions.map((s) => (
                    <Link
                      key={s.id}
                      href={`/boosters/${boosterTypes[s.booster_id] ?? "idea"}/${s.booster_id}`}
                      className="text-[12px] text-[#F8FFE8]/70 no-underline hover:text-[#F8FFE8] transition-colors"
                      style={{ fontFamily: FN }}
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
              className="rounded-3xl p-7 group relative"
              style={{ backgroundColor: "rgba(15,44,35,0.04)" }}
            >
              {editingSection === "description" ? (
                <div>
                  <SectionLabel>Description</SectionLabel>
                  <textarea
                    rows={8}
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Describe your project…"
                    className="resize-none outline-none placeholder-[#0F2C23]/30"
                    style={{ ...inlineInputStyle, lineHeight: 1.7 }}
                  />
                  <InlineSaveCancel onSave={handleSave} onCancel={() => setEditingSection(null)} saving={isPending} />
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <SectionLabel>AI Generated Description</SectionLabel>
                    <PencilBtn onClick={() => openSection("description")} />
                  </div>
                  <p className="text-[#0F2C23]/75 leading-relaxed" style={{ fontFamily: FN, fontSize: "clamp(14px, 1.4vw, 16px)" }}>
                    {desc || "No description available yet."}
                  </p>
                </>
              )}
            </div>

            {/* Gallery */}
            {screenshots.length > 0 && (
              <div
                className="rounded-3xl p-7"
                style={{ backgroundColor: "rgba(15,44,35,0.04)" }}
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
                        backgroundColor: "rgba(15,44,35,0.06)",
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
                style={{ backgroundColor: "rgba(15,44,35,0.04)" }}
              >
                <SectionLabel>Key Features</SectionLabel>
                <div className="border-t border-[#0F2C23]/12 mt-3">
                  {features.slice(0, 8).map((f, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 py-3 border-b border-[#0F2C23]/08"
                    >
                      <span
                        className="font-black text-[#0F2C23]/18 leading-none shrink-0 mt-0.5"
                        style={{
                          fontFamily: PX,
                          fontSize: 12,
                          letterSpacing: "-0.02em",
                          width: 20,
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p
                        className="text-[#0F2C23]/70 text-sm leading-relaxed"
                        style={{ fontFamily: FN }}
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
                style={{ backgroundColor: "#0F2C23" }}
              >
                <p
                  className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#F8FFE8]/40 mb-4"
                  style={{ fontFamily: PX }}
                >
                  Knowledge Base
                </p>
                {typeof p.knowledge_base_chunks === "number" && (
                  <p
                    className="text-sm text-[#F8FFE8]/50 mb-4"
                    style={{ fontFamily: FN }}
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
                          fontFamily: PX,
                          backgroundColor: isActive
                            ? "rgba(15,44,35,0.06)"
                            : "rgba(226,254,165,0.1)",
                          color: isActive ? "#0F2C23" : "rgba(226,254,165,0.5)",
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
                      backgroundColor: "rgba(226,254,165,0.07)",
                      border: "1px solid rgba(226,254,165,0.08)",
                    }}
                  >
                    {kbActiveTab === "profile" && (
                      <p
                        className="text-[13px] text-[#F8FFE8]/70 leading-relaxed whitespace-pre-wrap"
                        style={{ fontFamily: FN }}
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
                            className="inline-flex items-center gap-1.5 no-underline text-[#F8FFE8]/70 hover:text-[#F8FFE8] text-[12px]"
                            style={{ fontFamily: FN }}
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
                                  backgroundColor: "rgba(226,254,165,0.1)",
                                  color: "rgba(226,254,165,0.6)",
                                  fontFamily: FN,
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
                              className="text-[10px] text-[#F8FFE8]/35 mb-2"
                              style={{ fontFamily: PX }}
                            >
                              {`${(String(p.flattened_codebase).length / 1024).toFixed(1)} KB`}
                            </p>
                            <div
                              className="rounded-xl overflow-auto max-h-52"
                              style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
                            >
                              <pre className="p-4 text-[11px] text-[#F8FFE8]/60 whitespace-pre-wrap break-words font-mono">
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
                            className="inline-flex items-center gap-1.5 no-underline text-[#F8FFE8]/70 hover:text-[#F8FFE8] text-[12px]"
                            style={{ fontFamily: FN }}
                          >
                            <Video size={13} /> Watch demo
                          </Link>
                        )}
                        {features.length > 0 && (
                          <ul className="flex flex-col gap-1.5">
                            {features.slice(0, 5).map((f, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-[12px] text-[#F8FFE8]/60"
                                style={{ fontFamily: FN }}
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
                                  className="w-10 h-10 rounded-xl border border-[#F8FFE8]/15"
                                  style={{
                                    backgroundColor: String(value),
                                    display: "block",
                                  }}
                                />
                                <span
                                  className="text-[9px] tracking-widest uppercase text-[#F8FFE8]/40"
                                  style={{ fontFamily: PX }}
                                >
                                  {label}
                                </span>
                              </div>
                            ))}
                          {p.theme_label && (
                            <span
                              className="text-[11px] text-[#F8FFE8]/50 capitalize"
                              style={{ fontFamily: FN }}
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
                style={{ backgroundColor: "#0F2C23" }}
              >
                <p
                  className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#F8FFE8]/40 mb-4"
                  style={{ fontFamily: PX }}
                >
                  Tech Stack
                </p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-lg px-3 py-1.5 text-[11px]"
                      style={{
                        fontFamily: FN,
                        backgroundColor: "rgba(15,44,35,0.1)",
                        color: "rgba(226,254,165,0.65)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Manage Team */}
            {p.team_id && (
              <div
                className="rounded-3xl p-7"
                style={{ backgroundColor: "rgba(15,44,35,0.04)" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Users size={13} style={{ color: "#0F2C23", opacity: 0.5 }} />
                  <SectionLabel>Team</SectionLabel>
                </div>

                {/* Member list */}
                <div className="border-t border-[#0F2C23]/12">
                  {teamMembers.map((m) => (
                    <div
                      key={m.user_id}
                      className="flex items-center justify-between py-3 border-b border-[#0F2C23]/08"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold uppercase"
                          style={{
                            backgroundColor: m.role === "owner" ? "#0F2C23" : "rgba(15,44,35,0.12)",
                            color: m.role === "owner" ? "#F8FFE8" : "#0F2C23",
                            fontFamily: PX,
                          }}
                        >
                          {(m.display_name || m.email)?.[0] ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="text-[12px] font-semibold text-[#0F2C23] truncate"
                            style={{ fontFamily: PX }}
                          >
                            {m.display_name || m.email}
                          </p>
                          {m.display_name && (
                            <p
                              className="text-[10px] text-[#0F2C23]/45 truncate"
                              style={{ fontFamily: FN }}
                            >
                              {m.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {m.role === "owner" && (
                          <span
                            className="text-[8px] tracking-[0.14em] uppercase font-bold px-2 py-1 rounded-sm"
                            style={{
                              backgroundColor: "#0F2C23",
                              color: "#F8FFE8",
                              fontFamily: PX,
                            }}
                          >
                            Owner
                          </span>
                        )}
                        {isOwner && m.role !== "owner" && (
                          <button
                            type="button"
                            onClick={() => {
                              startTransition(async () => {
                                const result = await removeTeamMemberAction(p.team_id!, m.user_id);
                                if (result.success) {
                                  setTeamMembers((prev) => prev.filter((x) => x.user_id !== m.user_id));
                                  router.refresh();
                                }
                              });
                            }}
                            disabled={isPending}
                            className="w-6 h-6 rounded-full flex items-center justify-center border-none cursor-pointer transition-all hover:bg-red-100 disabled:opacity-40"
                            style={{ backgroundColor: "rgba(15,44,35,0.06)", color: "#0F2C23" }}
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add member form (owner only) */}
                {isOwner && (
                  <div className="mt-4">
                    <p
                      className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#0F2C23]/45 mb-2"
                      style={{ fontFamily: PX }}
                    >
                      Add Member
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={memberEmail}
                        onChange={(e) => {
                          setMemberEmail(e.target.value);
                          setMemberError(null);
                        }}
                        placeholder="user@email.com"
                        className="flex-1 rounded-xl px-3 py-2 text-[13px] border-none outline-none placeholder-[#0F2C23]/30"
                        style={{
                          backgroundColor: "rgba(15,44,35,0.06)",
                          color: "#0F2C23",
                          fontFamily: FN,
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (!memberEmail.trim()) return;
                            handleAddMember();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddMember}
                        disabled={isPending || !memberEmail.trim()}
                        className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer transition-all hover:opacity-80 disabled:opacity-40"
                        style={{ backgroundColor: "#0F2C23", color: "#F8FFE8" }}
                      >
                        {isPending ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <UserPlus size={12} />
                        )}
                      </button>
                    </div>
                    {memberError && (
                      <p
                        className="text-[11px] mt-2 text-red-700/80"
                        style={{ fontFamily: FN }}
                      >
                        {memberError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>

    </div>
  );
}
