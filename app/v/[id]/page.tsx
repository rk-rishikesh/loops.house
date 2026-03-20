import { Code2, Github, Globe, Youtube } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { MobileBlockerBypass } from "@/components/client/mobile-blocker-bypass";
import { ViewerProjectDetail } from "@/components/client/viewer-project-detail";
import {
  getHackathonsByIdsServer,
  getProjectServer,
  getProjectSubmissionsServer,
} from "@/lib/server-data";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

export default async function ProjectLinktreePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const [project, submissions] = await Promise.all([
    getProjectServer(projectId),
    getProjectSubmissionsServer(projectId),
  ]);

  if (!project) {
    return (
      <div className="min-h-screen px-10 py-12" style={{ backgroundColor: "#F8FFE8" }}>
        <p className="mt-10 text-[#0F2C23]/50" style={{ fontFamily: FN }}>
          Project not found.
        </p>
      </div>
    );
  }

  const hackathonIds = [...new Set(submissions.map((s) => s.hackathon_id))];
  const hackathonMap = hackathonIds.length > 0 ? await getHackathonsByIdsServer(hackathonIds) : {};
  const hackathonNames: Record<string, string> = {};
  for (const [hId, h] of Object.entries(hackathonMap)) {
    hackathonNames[hId] = h.name;
  }

  const techTags = [project.category, ...(project.tech_stack_tags ?? [])].filter(
    Boolean,
  ) as string[];

  const description =
    project.refined_description || (project as { description?: string }).description || "";

  const images = [
    ...(project.logo_url ? [project.logo_url] : []),
    ...(project.screenshot_urls ?? []),
  ].filter((v): v is string => typeof v === "string" && v.length > 0);

  const links = [
    project.github_url
      ? { label: "GitHub", href: project.github_url, icon: <Github size={16} /> }
      : null,
    project.website_url
      ? { label: "Website", href: project.website_url, icon: <Globe size={16} /> }
      : null,
    project.youtube_url
      ? { label: "Demo", href: project.youtube_url, icon: <Youtube size={16} /> }
      : null,
    ...(project.social_links ?? []).map((l) => ({ label: l.label, href: l.url })),
    ...(project.additional_links ?? []).map((l) => ({ label: l.label, href: l.url })),
  ].filter((l): l is { label: string; href: string; icon?: ReactNode } => !!l && !!l.href);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FFE8" }}>
      <MobileBlockerBypass />

      <div className="md:hidden">
        <div className="px-6 pt-6">
          <Link href="/" className="no-underline inline-flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden">
              <Image src="/lightlogo.svg" alt="Loops" fill />
            </div>
          </Link>
        </div>

        <main className="px-6 pb-24 pt-10">
          <div className="mx-auto max-w-[520px]">
            <div
              className="rounded-[24px] border border-white/10 p-8"
              style={{
                backgroundColor: "rgba(15,44,35,0.03)",
                boxShadow: "0 20px 60px rgba(15,44,35,0.06)",
              }}
            >
              {/* Name + Tagline */}
              <div className="flex flex-col items-center text-center">
                <h1
                  className="font-black uppercase leading-[1.02]"
                  style={{
                    fontFamily: PX,
                    color: "#0F2C23",
                    fontSize: "clamp(20px, 3.2vw, 28px)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {project.name}
                </h1>
                <p
                  className="mt-3 leading-relaxed"
                  style={{ fontFamily: FN, color: "rgba(15,44,35,0.65)" }}
                >
                  {project.tagline || description || "Built on Loops."}
                </p>
              </div>

              {/* Techstack */}
              {techTags.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  {techTags.slice(0, 10).map((t) => (
                    <span
                      key={t}
                      className="text-[11px] font-bold px-3 py-1 rounded-full"
                      style={{
                        fontFamily: PX,
                        backgroundColor: "rgba(15,44,35,0.06)",
                        color: "rgba(15,44,35,0.75)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}

              {/* Description */}
              {description ? (
                <div
                  className="mt-6 text-sm leading-relaxed"
                  style={{ fontFamily: FN, color: "rgba(15,44,35,0.75)" }}
                >
                  {description}
                </div>
              ) : null}

              {/* Images */}
              {images.length > 0 ? (
                <div className="mt-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {images.slice(0, 6).map((src, idx) => (
                      <div
                        key={`${src}:${idx}`}
                        className="rounded-2xl overflow-hidden"
                        style={{
                          backgroundColor: "rgba(15,44,35,0.04)",
                          border: "1px solid rgba(15,44,35,0.06)",
                        }}
                      >
                        <Image
                          src={src}
                          alt={project.name}
                          width={240}
                          height={180}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Overview */}
              <div className="mt-8">
                <p
                  className="text-[9px] tracking-[0.2em] uppercase font-bold mb-3 text-center"
                  style={{ fontFamily: PX, color: "rgba(15,44,35,0.35)" }}
                >
                  Overview
                </p>

                {project.key_features && project.key_features.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {project.key_features.slice(0, 6).map((f) => (
                      <div
                        key={f}
                        className="rounded-2xl px-4 py-3"
                        style={{
                          backgroundColor: "rgba(15,44,35,0.06)",
                          border: "1px solid rgba(15,44,35,0.08)",
                        }}
                      >
                        <p
                          className="text-sm leading-relaxed"
                          style={{
                            fontFamily: FN,
                            color: "rgba(15,44,35,0.75)",
                          }}
                        >
                          {f}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    className="text-sm leading-relaxed text-center"
                    style={{
                      fontFamily: FN,
                      color: "rgba(15,44,35,0.55)",
                    }}
                  >
                    {description ? description.slice(0, 220) : "No overview yet."}
                  </p>
                )}
              </div>

              {/* Links */}
              <div className="mt-8">
                <p
                  className="text-[9px] tracking-[0.2em] uppercase font-bold mb-3 text-center"
                  style={{ fontFamily: PX, color: "rgba(15,44,35,0.35)" }}
                >
                  Links
                </p>

                {links.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {links.slice(0, 12).map((l) => (
                      <a
                        key={`${l.label}:${l.href}`}
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-2xl inline-flex items-center justify-between gap-4 px-5 py-3.5 no-underline border border-white/10 transition-transform hover:scale-[1.01]"
                        style={{
                          backgroundColor: "#0F2C23",
                          color: "#F8FFE8",
                          fontFamily: PX,
                          fontWeight: 900,
                          letterSpacing: "0.02em",
                        }}
                      >
                        <span className="inline-flex items-center gap-3">
                          {l.icon ? (
                            <span className="opacity-90">{l.icon}</span>
                          ) : (
                            <Code2 size={16} style={{ opacity: 0.7 }} />
                          )}
                          <span className="text-sm uppercase">{l.label}</span>
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.16em] opacity-80">
                          Open
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p
                    className="text-sm leading-relaxed text-center"
                    style={{ fontFamily: FN, color: "rgba(15,44,35,0.55)" }}
                  >
                    No links added yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <div className="hidden md:block pb-24">
        <ViewerProjectDetail
          project={project}
          projectId={projectId}
          submissions={submissions}
          hackathonNames={hackathonNames}
        />
      </div>

      <footer
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{
          backgroundColor: "#F8FFE8",
          borderTop: "1px solid rgba(15,44,35,0.10)",
        }}
      >
        <div className="max-w-[520px] mx-auto px-6 py-3 flex items-center justify-center">
          <span
            className="text-xs uppercase font-bold tracking-[0.16em]"
            style={{ fontFamily: PX, color: "rgba(15,44,35,0.7)" }}
          >
            Powered by{" "}
            <Link href="/" className="no-underline" style={{ color: "rgba(15,44,35,0.85)" }}>
              Loops House
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
