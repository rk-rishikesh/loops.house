"use client";

import { ArrowRight, Check, Code2, Loader2, Plus, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ProjectEditor } from "@/components/client/project-editor";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { submitProjectAction } from "@/lib/actions";
import type { StoredHackathon, StoredProject, StoredSubmission } from "@/lib/data-mappers";
import { FN, PX } from "./constants";

interface HackathonSubmitSectionProps {
  hackathonId: string;
  hackathon: StoredHackathon;
  projects: StoredProject[];
  submissions: StoredSubmission[];
  isAuthenticated: boolean;
}

export function HackathonSubmitSection({
  hackathonId,
  hackathon,
  projects,
  submissions,
  isAuthenticated,
}: HackathonSubmitSectionProps) {
  const mounted = useIsMounted();

  const userProjectIds = new Set(projects.map((p) => p.project_id));
  const hackathonSubmission = submissions.find(
    (s) => s.hackathon_id === hackathonId && userProjectIds.has(s.project_id),
  );
  const submittedProject =
    (hackathonSubmission && projects.find((p) => p.project_id === hackathonSubmission.project_id)) ??
    null;

  if (submittedProject) {
    const hackathonNames: Record<string, string> = { [hackathonId]: hackathon.name };
    const projectSubmissions = submissions.filter((s) => s.project_id === submittedProject.project_id);

    return (
      <div className="flex-1 overflow-y-auto">
        <ProjectEditor
          initialProject={submittedProject}
          initialSubmissions={projectSubmissions}
          initialHackathonNames={hackathonNames}
          projectId={submittedProject.project_id}
          backHref={`/hackathons/${hackathonId}#submit`}
          backLabel="Back to Submit"
          initialTeamMembers={[]}
        />
      </div>
    );
  }

  const submittedProjectIds = new Set(
    submissions.filter((s) => s.hackathon_id === hackathonId).map((s) => s.project_id),
  );
  const availableProjects = projects.filter((p) => !submittedProjectIds.has(p.project_id));

  return (
    <div className="flex-1 overflow-y-auto px-14 py-14">
      <p
        className="font-black uppercase leading-none select-none mb-3"
        style={{
          fontFamily: FN,
          fontSize: "clamp(48px, 6vw, 80px)",
          letterSpacing: "-0.04em",
          lineHeight: 0.85,
          color: "#0F2C23",
        }}
      >
        SUBMIT
      </p>
      <p
        className="text-sm leading-relaxed mb-10"
        style={{ fontFamily: FN, color: "rgba(15,44,35,0.55)" }}
      >
        Choose a project to submit to <strong style={{ color: "#0F2C23" }}>{hackathon.name}</strong>
      </p>

      {mounted && !isAuthenticated ? (
        <div
          className="rounded-[32px] border border-[#0F2C23]/10 px-10 py-14 flex flex-col items-center text-center"
          style={{ backgroundColor: "rgba(15,44,35,0.02)" }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
            style={{ backgroundColor: "rgba(15,44,35,0.06)" }}
          >
            <Send size={22} style={{ color: "rgba(15,44,35,0.3)" }} />
          </div>
          <p
            className="text-sm leading-relaxed max-w-[360px] mb-7"
            style={{ fontFamily: FN, color: "rgba(15,44,35,0.6)" }}
          >
            Sign in to submit your project to this hackathon.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full no-underline text-[11px] tracking-widest uppercase font-bold px-8 py-3.5 transition-transform hover:scale-[1.03]"
            style={{ backgroundColor: "#0F2C23", color: "#F8FFE8", fontFamily: PX }}
          >
            Sign In
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : availableProjects.length === 0 ? (
        <div
          className="rounded-[32px] border border-[#0F2C23]/10 px-10 py-14 flex flex-col items-center text-center"
          style={{ backgroundColor: "rgba(15,44,35,0.02)" }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
            style={{ backgroundColor: "rgba(15,44,35,0.06)" }}
          >
            <Code2 size={22} style={{ color: "rgba(15,44,35,0.3)" }} />
          </div>
          <p
            className="text-sm leading-relaxed max-w-[360px] mb-7"
            style={{ fontFamily: FN, color: "rgba(15,44,35,0.6)" }}
          >
            {projects.length === 0
              ? "You don\u2019t have any projects yet. Create one first, then come back to submit."
              : "All your projects have already been submitted to this hackathon."}
          </p>
          <Link
            href="/builder/new"
            className="inline-flex items-center gap-2 rounded-full no-underline text-[11px] tracking-widest uppercase font-bold px-8 py-3.5 transition-transform hover:scale-[1.03]"
            style={{ backgroundColor: "#0F2C23", color: "#F8FFE8", fontFamily: PX }}
          >
            <Plus size={14} />
            Create Project
          </Link>
        </div>
      ) : (
        <SubmitProjectPicker projects={availableProjects} hackathonId={hackathonId} />
      )}
    </div>
  );
}

function SubmitProjectPicker({
  projects,
  hackathonId,
}: {
  projects: StoredProject[];
  hackathonId: string;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedProject = projects.find((p) => p.project_id === selectedId);

  function handleSubmit() {
    if (!selectedProject) return;
    setSubmitError(null);
    startTransition(async () => {
      const result = await submitProjectAction(
        hackathonId,
        selectedProject.team_id ?? "",
        selectedProject.project_id,
      );
      if (!result.success) {
        setSubmitError(result.error ?? "Failed to submit");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <div
        className="rounded-[32px] border border-[#0F2C23]/10 bg-white/60 overflow-hidden px-6 py-6"
        style={{
          boxShadow: "0 20px 40px -15px rgba(15,44,35,0.05)",
        }}
      >
        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
        >
          <Link
            href="/builder/new"
            className="rounded-[32px] p-6 no-underline flex flex-col items-center justify-center gap-4 transition-all hover:scale-[1.01]"
            style={{
              border: "2px dashed rgba(15,44,35,0.15)",
              backgroundColor: "transparent",
              minHeight: 220,
            }}
          >
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center"
              style={{
                backgroundColor: "rgba(15,44,35,0.04)",
                border: "1px dashed rgba(15,44,35,0.18)",
              }}
            >
              <Plus size={18} style={{ color: "rgba(15,44,35,0.35)" }} />
            </div>
            <span
              className="text-[11px] tracking-widest uppercase font-bold"
              style={{ fontFamily: PX, color: "rgba(15,44,35,0.45)" }}
            >
              New Project
            </span>
          </Link>

          {projects.map((p) => {
            const active = selectedId === p.project_id;
            return (
              <button
                key={p.project_id}
                type="button"
                onClick={() => setSelectedId(p.project_id)}
                className="text-left rounded-[32px] p-6 transition-all cursor-pointer relative group"
                style={{
                  border: active ? "2px solid #0F2C23" : "1px solid rgba(15,44,35,0.12)",
                  backgroundColor: active ? "rgba(226,254,165,0.28)" : "rgba(15,44,35,0.02)",
                }}
              >
                {active && (
                  <div
                    className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#0F2C23" }}
                  >
                    <Check size={16} strokeWidth={3} style={{ color: "#E2FEA5" }} />
                  </div>
                )}

                <div className="flex flex-col items-center text-center gap-4 pt-2">
                  <div
                    className="w-24 h-24 rounded-3xl overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: "#0F2C23" }}
                  >
                    {p.logo_url ? (
                      <Image
                        src={p.logo_url}
                        alt={p.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Code2 size={30} style={{ color: "rgba(226,254,165,0.35)" }} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p
                      className="font-black uppercase leading-tight truncate"
                      style={{ fontFamily: FN, color: "#0F2C23", fontSize: 16 }}
                    >
                      {p.name}
                    </p>
                    {p.tagline && (
                      <p
                        className="text-sm leading-relaxed mt-2 line-clamp-2"
                        style={{
                          fontFamily: FN,
                          color: "rgba(15,44,35,0.6)",
                        }}
                      >
                        {p.tagline}
                      </p>
                    )}
                    {p.category && (
                      <span
                        className="inline-block mt-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                        style={{
                          fontFamily: PX,
                          backgroundColor: "rgba(15,44,35,0.06)",
                          color: "rgba(15,44,35,0.55)",
                        }}
                      >
                        {p.category}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {submitError && (
        <p className="text-xs mt-5" style={{ fontFamily: FN, color: "#dc3545" }}>
          {submitError}
        </p>
      )}

      <div className="mt-8">
        <button
          onClick={handleSubmit}
          disabled={!selectedId || isPending}
          className="inline-flex items-center justify-center gap-3 rounded-full text-[11px] tracking-widest uppercase font-bold px-10 py-4 transition-all hover:scale-[1.03] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
          style={{ backgroundColor: "#0F2C23", color: "#F8FFE8", fontFamily: PX }}
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {isPending ? "Submitting\u2026" : "Submit Project"}
        </button>
      </div>
    </div>
  );
}
