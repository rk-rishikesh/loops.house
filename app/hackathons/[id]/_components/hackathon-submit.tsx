"use client";

import { ChevronDown, Loader2, Plus, Send, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ProjectEditor } from "@/components/client/project-editor";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { submitProjectAction } from "@/lib/actions";
import type { StoredHackathon, StoredProject, StoredSubmission } from "@/lib/data-mappers";
import { PX, FN } from "./constants";

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
    (hackathonSubmission &&
      projects.find((p) => p.project_id === hackathonSubmission.project_id)) ??
    null;

  if (submittedProject) {
    const hackathonNames: Record<string, string> = { [hackathonId]: hackathon.name };
    const projectSubmissions = submissions.filter(
      (s) => s.project_id === submittedProject.project_id,
    );

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
    <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-10">
      <p
        className="font-black uppercase leading-none select-none text-center mb-8"
        style={{
          fontFamily: PX,
          fontSize: "clamp(48px, 6vw, 80px)",
          letterSpacing: "-0.04em",
          opacity: 0.04,
          lineHeight: 0.85,
          color: "#E2FEA5",
        }}
      >
        SUBMIT
      </p>

      <div className="text-center max-w-[400px]">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: "rgba(226,254,165,0.06)" }}
        >
          <Users size={24} style={{ color: "rgba(226,254,165,0.3)" }} />
        </div>

        {mounted && !isAuthenticated ? (
          <>
            <p
              className="text-sm leading-relaxed mb-6"
              style={{ fontFamily: FN, color: "rgba(226,254,165,0.45)" }}
            >
              Sign in to submit your project to this hackathon.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full no-underline text-[10px] tracking-widest uppercase font-bold px-8 py-3.5 transition-transform hover:scale-[1.03]"
              style={{
                backgroundColor: "#E2FEA5",
                color: "#0F2C23",
                fontFamily: PX,
              }}
            >
              <Plus size={12} /> Sign in to Apply
            </Link>
          </>
        ) : availableProjects.length === 0 ? (
          <>
            <p
              className="text-sm leading-relaxed mb-6"
              style={{ fontFamily: FN, color: "rgba(226,254,165,0.45)" }}
            >
              {projects.length === 0
                ? "You don't have any projects yet. Create one first, then come back to submit."
                : "All your projects have already been submitted to this hackathon."}
            </p>
            <Link
              href="/builder/new"
              className="inline-flex items-center gap-2 rounded-full no-underline text-[10px] tracking-widest uppercase font-bold px-8 py-3.5 transition-transform hover:scale-[1.03]"
              style={{
                backgroundColor: "#E2FEA5",
                color: "#0F2C23",
                fontFamily: PX,
              }}
            >
              <Plus size={12} /> Create Project
            </Link>
          </>
        ) : (
          <>
            <SubmitProjectPicker projects={availableProjects} hackathonId={hackathonId} />
            <p
              className="mt-6 text-xs leading-relaxed"
              style={{ fontFamily: FN, color: "rgba(226,254,165,0.65)" }}
            >
              Want to start fresh?{" "}
              <Link
                href="/builder/new"
                className="underline font-semibold"
                style={{ color: "#E2FEA5" }}
              >
                Create a new project
              </Link>{" "}
              and then return here to submit.
            </p>
          </>
        )}
      </div>
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
    <div className="w-full">
      <p
        className="text-sm leading-relaxed mb-6"
        style={{ fontFamily: FN, color: "rgba(226,254,165,0.45)" }}
      >
        Select a project to submit to this hackathon.
      </p>

      <div className="relative mb-4">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full appearance-none rounded-xl px-4 py-3 pr-10 text-sm outline-none cursor-pointer"
          style={{
            fontFamily: FN,
            backgroundColor: "rgba(226,254,165,0.08)",
            color: "#E2FEA5",
            border: "1px solid rgba(226,254,165,0.15)",
          }}
        >
          <option value="" disabled>
            Choose a project…
          </option>
          {projects.map((p) => (
            <option key={p.project_id} value={p.project_id}>
              {p.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "rgba(226,254,165,0.4)" }}
        />
      </div>

      {submitError && (
        <p className="text-xs mb-3" style={{ fontFamily: FN, color: "#ff6b6b" }}>
          {submitError}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedId || isPending}
        className="inline-flex items-center gap-2 rounded-full text-[10px] tracking-widest uppercase font-bold px-8 py-3.5 transition-all hover:scale-[1.03] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{
          backgroundColor: "#E2FEA5",
          color: "#0F2C23",
          fontFamily: PX,
        }}
      >
        {isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
        {isPending ? "Submitting…" : "Submit Project"}
      </button>
    </div>
  );
}
