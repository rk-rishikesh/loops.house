"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Loader2,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ImageUpload, MultiImageUpload } from "@/components/client/image-upload";
import { saveTeamAction } from "@/lib/actions";
import type { StoredTeam } from "@/lib/data-mappers";
import { useSaveProject } from "@/lib/queries";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

// ─── Types ────────────────────────────────────────────────────────────────────
const STEPS = ["code-reader", "demo-reader", "theme-reader", "knowledge-base"] as const;
type StepStatus = "pending" | "started" | "done" | "failed" | "skipped";

// Stricter builder profile schema (all key links required, richer description)
const builderProfileSchema = z.object({
  team_id: z.string().optional(),
  name: z.string().min(1, "Project name is required"),
  description: z
    .string()
    .min(80, "Please add a more detailed description (at least 80 characters)."),
  github_url: z.string().url("GitHub URL must be a valid link"),
  youtube_url: z.string().url("YouTube URL must be a valid link"),
  logo_url: z.string().url("Logo URL must be a valid link"),
  website_url: z
    .string()
    .min(1, "Website URL is required")
    .refine(
      (val) => /^https?:\/\//i.test(val) || /^www\./i.test(val),
      "Website URL must be a valid link",
    ),
  screenshot_urls: z.string().optional(),
  social_links: z.string().optional(),
  hackathon_id: z.string().optional(),
});
type BuilderProfileInput = z.infer<typeof builderProfileSchema>;

// ─── Custom dropdown ──────────────────────────────────────────────────────────
function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Select…",
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full max-w-lg">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-200 border-none cursor-pointer"
        style={{
          backgroundColor: open ? "#0F2C23" : "rgba(15,44,35,0.06)",
          color: open ? "#F8FFE8" : selected ? "#0F2C23" : "rgba(15,44,35,0.55)",
        }}
      >
        <span className="font-semibold text-base" style={{ fontFamily: PX }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            color: open ? "#F8FFE8" : "rgba(15,44,35,0.7)",
          }}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 z-50 mt-1 rounded-2xl overflow-hidden shadow-xl"
          style={{ backgroundColor: "#0F2C23" }}
        >
          {options.map((opt, i) => {
            const isSel = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left cursor-pointer border-none transition-colors duration-100"
                style={{
                  fontFamily: FN,
                  fontSize: 14,
                  color: isSel ? "#F8FFE8" : "rgba(226,254,165,0.75)",
                  backgroundColor: isSel ? "rgba(226,254,165,0.16)" : "transparent",
                  borderBottom:
                    i < options.length - 1 ? "1px solid rgba(226,254,165,0.16)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isSel)
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "rgba(226,254,165,0.1)";
                }}
                onMouseLeave={(e) => {
                  if (!isSel)
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
              >
                {opt.label}
                {isSel && <Check size={13} style={{ color: "#F8FFE8" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Progress panel ───────────────────────────────────────────────────────────
function ProgressPanel({
  progress,
  errors: pErrors,
}: {
  progress: Record<string, StepStatus>;
  errors: Record<string, string>;
}) {
  const friendlyLabel: Record<(typeof STEPS)[number], string> = {
    "code-reader": "Code Reader",
    "demo-reader": "Demo Reader",
    "theme-reader": "Theme Reader",
    "knowledge-base": "Knowledge Graph",
  };
  const statusByStep = STEPS.map((step) => ({
    step,
    status: progress[step] ?? "pending",
    error: pErrors[step],
  }));
  const runningCount = statusByStep.filter((s) => s.status === "started").length;

  return (
    <section className="h-full w-full">
      <div
        className="h-full grid gap-10 lg:grid-cols-[1.35fr,1fr]"
        style={{
          backgroundColor: "#F8FFE8",
        }}
      >
        <div
          className="px-0 py-2 md:py-4 flex flex-col gap-6"
        >
          <div>
            <p
              className="text-[10px] tracking-[0.28em] uppercase font-bold mb-3"
              style={{ fontFamily: PX, color: "rgba(15,44,35,0.6)" }}
            >
              Builder Agents Runtime
            </p>
            <h2
              className="font-black uppercase leading-[0.95] mb-3"
              style={{
                fontFamily: PX,
                fontSize: "clamp(30px, 3.6vw, 40px)",
                letterSpacing: "-0.04em",
                color: "#0F2C23",
              }}
            >
              Creating your project intelligence graph.
            </h2>
            <p
              className="text-sm leading-relaxed max-w-xl"
              style={{ fontFamily: FN, color: "rgba(15,44,35,0.75)" }}
            >
              Real-time orchestration is active. Sub-agents are parsing your repo, demo, and visual
              identity, then wiring everything into a searchable context for Ideator and Mentor.
            </p>
          </div>

          <div className="mt-1 flex flex-col gap-3">
            {statusByStep.map((entry, idx) => {
              const status = entry.status;
              const hasError = status === "failed" && Boolean(entry.error);

              const statusLabel =
                status === "done"
                  ? "Complete"
                  : status === "failed"
                    ? "Error"
                    : status === "started"
                      ? "In progress"
                      : status === "skipped"
                        ? "Skipped"
                        : "Queued";

              return (
                <motion.div
                  key={entry.step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, delay: idx * 0.06 }}
                  className="flex items-start gap-3 rounded-2xl px-3 py-2.5"
                  style={{
                    backgroundColor:
                      status === "done"
                        ? "rgba(15,44,35,0.04)"
                        : status === "started"
                          ? "rgba(15,44,35,0.03)"
                          : "transparent",
                  }}
                >
                  <span className="shrink-0 mt-0.5 w-5 flex justify-center">
                    {status === "done" && <Check size={15} style={{ color: "#0F2C23" }} />}
                    {status === "failed" && <X size={15} style={{ color: "#c0392b" }} />}
                    {status === "skipped" && (
                      <Minus size={15} style={{ color: "rgba(15,44,35,0.4)" }} />
                    )}
                    {status === "started" && (
                      <Loader2 size={15} className="animate-spin" style={{ color: "#0F2C23" }} />
                    )}
                    {status === "pending" && (
                      <span
                        className="block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: "rgba(15,44,35,0.25)" }}
                      />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p
                        className="text-[13px] font-semibold truncate"
                        style={{ fontFamily: FN, color: "#0F2C23" }}
                      >
                        {friendlyLabel[entry.step]}
                      </p>
                      <span
                        className="text-[9px] px-2 py-0.5 rounded-full uppercase tracking-[0.18em]"
                        style={{
                          fontFamily: PX,
                          color:
                            status === "done"
                              ? "#F8FFE8"
                              : status === "failed"
                                ? "#c0392b"
                                : "rgba(15,44,35,0.8)",
                          backgroundColor:
                            status === "done"
                              ? "#0F2C23"
                              : status === "failed"
                                ? "rgba(192,57,43,0.12)"
                                : "rgba(15,44,35,0.06)",
                        }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    {hasError ? (
                      <p
                        className="text-[11px] leading-snug wrap-break-word"
                        style={{ fontFamily: FN, color: "#c0392b" }}
                      >
                        {entry.error}
                      </p>
                    ) : (
                      <p
                        className="text-[11px] leading-snug opacity-80"
                        style={{ fontFamily: FN, color: "rgba(15,44,35,0.75)" }}
                      >
                        {idx === 0 && "Authenticating with GitHub and flattening the repository."}
                        {idx === 1 &&
                          "Streaming your demo video to capture features, narrative, and key moments."}
                        {idx === 2 &&
                          "Sampling your logo and screenshots to infer palette and visual language."}
                        {idx === 3 &&
                          "Writing vectors to the knowledge base so agents can query your project."}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="px-0 py-2 md:py-4 flex flex-col justify-between gap-6">
          <div>
            <p
              className="text-[10px] tracking-[0.22em] uppercase font-bold mb-2"
              style={{ fontFamily: PX, color: "rgba(15,44,35,0.6)" }}
            >
              Agent Communication
            </p>
            <div
              className="rounded-2xl overflow-hidden mb-4"
              style={{
                backgroundColor: "rgba(15,44,35,0.03)",
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: "rgba(226,254,165,0.18)" }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-flex w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: "#0F2C23" }}
                  />
                  <span
                    className="text-[11px] uppercase tracking-[0.18em]"
                    style={{ fontFamily: PX, color: "rgba(15,44,35,0.85)" }}
                  >
                    Live stream
                  </span>
                </div>
                <span
                  className="text-[10px]"
                  style={{ fontFamily: FN, color: "rgba(15,44,35,0.6)" }}
                >
                  {runningCount > 0 ? `${runningCount} active agent(s)` : "Awaiting next event"}
                </span>
              </div>
              <div className="px-4 py-3 text-[11px] leading-relaxed space-y-1.5 min-h-[145px]">
                <AnimatePresence mode="popLayout">
                  {statusByStep.map((entry) => {
                    const status = entry.status;
                    const label = friendlyLabel[entry.step];
                    return (
                      <motion.p
                        key={`${entry.step}-${status}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.22 }}
                        className="flex items-start gap-2"
                        style={{ fontFamily: FN, color: "rgba(15,44,35,0.8)" }}
                      >
                        <motion.span
                          className="mt-0.5 inline-flex w-1.5 h-1.5 rounded-full"
                          animate={
                            status === "started"
                              ? { scale: [1, 1.5, 1], opacity: [0.55, 1, 0.55] }
                              : { scale: 1, opacity: 1 }
                          }
                          transition={{ duration: 1.2, repeat: status === "started" ? Infinity : 0 }}
                          style={{
                            backgroundColor:
                              status === "done"
                                ? "#0F2C23"
                                : status === "failed"
                                  ? "#c0392b"
                                  : status === "started"
                                    ? "rgba(15,44,35,0.85)"
                                    : "rgba(15,44,35,0.35)",
                          }}
                        />
                        <span className="flex-1">
                          <span className="font-semibold">{label}</span>
                          <span className="opacity-80">
                            {status === "done" && " — synced."}
                            {status === "started" && " — exchanging context packets…"}
                            {status === "pending" && " — waiting in queue…"}
                            {status === "failed" && " — encountered an upstream error."}
                          </span>
                        </span>
                      </motion.p>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            <div
              className="rounded-2xl p-4"
              style={{
                backgroundColor: "rgba(15,44,35,0.03)",
              }}
            >
              <p
                className="text-[10px] tracking-[0.18em] uppercase mb-3"
                style={{ fontFamily: PX, color: "rgba(226,254,165,0.75)" }}
              >
                Agent topology
              </p>
              <div className="relative h-[190px]">
                {[
                  { id: "code-reader", x: "10%", y: "24%" },
                  { id: "demo-reader", x: "66%", y: "24%" },
                  { id: "theme-reader", x: "10%", y: "66%" },
                  { id: "knowledge-base", x: "66%", y: "66%" },
                ].map((node) => {
                  const state = progress[node.id as (typeof STEPS)[number]] ?? "pending";
                  return (
                    <motion.div
                      key={node.id}
                      className="absolute rounded-xl px-2.5 py-2 text-[9px] uppercase tracking-[0.14em]"
                      animate={
                        state === "started"
                          ? { scale: [1, 1.04, 1], boxShadow: ["0 0 0 rgba(0,0,0,0)", "0 0 24px rgba(226,254,165,0.22)", "0 0 0 rgba(0,0,0,0)"] }
                          : { scale: 1 }
                      }
                      transition={{ duration: 1.3, repeat: state === "started" ? Infinity : 0 }}
                      style={{
                        left: node.x,
                        top: node.y,
                        transform: "translate(-50%, -50%)",
                        fontFamily: PX,
                        color: state === "done" ? "#06140F" : "#E2FEA5",
                        backgroundColor:
                          state === "done" ? "#E2FEA5" : "rgba(226,254,165,0.14)",
                        border: "none",
                      }}
                    >
                      {friendlyLabel[node.id as (typeof STEPS)[number]]}
                    </motion.div>
                  );
                })}
                <motion.div
                  className="absolute h-px left-[10%] right-[34%] top-[24%]"
                  animate={{ opacity: [0.25, 0.75, 0.25] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  style={{ backgroundColor: "rgba(226,254,165,0.45)" }}
                />
                <motion.div
                  className="absolute h-px left-[10%] right-[34%] top-[66%]"
                  animate={{ opacity: [0.25, 0.75, 0.25] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: 0.35 }}
                  style={{ backgroundColor: "rgba(226,254,165,0.45)" }}
                />
                <motion.div
                  className="absolute w-px top-[24%] bottom-[34%] left-[66%]"
                  animate={{ opacity: [0.25, 0.75, 0.25] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: 0.55 }}
                  style={{ backgroundColor: "rgba(226,254,165,0.45)" }}
                />
              </div>
            </div>
          </div>

          <p
            className="text-[10px] tracking-[0.2em] uppercase"
            style={{ fontFamily: PX, color: "rgba(15,44,35,0.6)" }}
          >
            You&apos;ll be redirected to your new Builder profile as soon as this run completes.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface NewProfileFormProps {
  teams: StoredTeam[];
  userId: string;
  initialTeamId?: string;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function NewProfileForm({ teams, userId: _userId, initialTeamId }: NewProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState<Record<string, StepStatus>>({});
  const [progressErrors, setProgressErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [animDir, setAnimDir] = useState<1 | -1>(1);
  const [animKey, setAnimKey] = useState(0);
  const hasAppliedDefaults = useRef(false);
  const [screenshotFiles, setScreenshotFiles] = useState<string[]>([]);
  const [showIntro, setShowIntro] = useState(true);

  const saveProjectMutation = useSaveProject();

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    control,
    formState: { errors, isValid },
    watch,
  } = useForm<BuilderProfileInput>({
    resolver: zodResolver(builderProfileSchema),
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
    },
  });

  useEffect(() => {
    if (hasAppliedDefaults.current) return;
    const validUrlTeam =
      initialTeamId && teams.some((t) => t.id === initialTeamId) ? initialTeamId : null;
    if (!validUrlTeam) return;
    reset((prev) => ({
      ...prev,
      team_id: validUrlTeam,
    }));
    hasAppliedDefaults.current = true;
  }, [initialTeamId, teams, reset]);

  const FORM_STEPS: {
    key: keyof BuilderProfileInput;
    label: string;
    sub: string;
    optional?: boolean;
    placeholder?: string;
    type?: string;
    multiline?: boolean;
    upload?: "logo" | "screenshots";
  }[] = [
    {
      key: "name",
      label: "Name your project.",
      sub: "A great name is memorable and clear.",
      placeholder: "My awesome project…",
    },
    {
      key: "description",
      label: "Describe what it does.",
      sub: "A few sentences about what makes it special.",
      placeholder: "A platform that helps teams…",
      multiline: true,
    },
    {
      key: "github_url",
      label: "Where's the code?",
      sub: "Link your GitHub repository.",
      placeholder: "https://github.com/user/repo",
      type: "url",
    },
    {
      key: "youtube_url",
      label: "Got a demo video?",
      sub: "Paste your YouTube demo link.",
      placeholder: "https://youtube.com/watch?v=…",
      type: "url",
    },
    {
      key: "logo_url",
      label: "Upload a logo.",
      sub: "Show off your brand identity.",
      upload: "logo",
    },
    {
      key: "screenshot_urls",
      label: "Any screenshots?",
      sub: "Upload images that show what you built.",
      upload: "screenshots",
    },
    {
      key: "website_url",
      label: "Where can people find it?",
      sub: "Your live project URL.",
      placeholder: "https://myproject.com",
      type: "url",
    },
    {
      key: "social_links",
      label: "Social links to share?",
      sub: "Format: Label, URL — one per line.",
      optional: true,
      placeholder: "Twitter, https://twitter.com/…",
      multiline: true,
    },
    ...(teams.length > 0
      ? [
          {
            key: "team_id" as keyof BuilderProfileInput,
            label: "Assign to an existing team?",
            sub: "Or we\u2019ll auto-create one for you.",
            optional: true,
          },
        ]
      : []),
    // TODO: Hackathon linking removed — submissions handle hackathon association now.
    // Future: add policy to prevent >1 submission per user per hackathon.
    // Tracking algorithm: get all user teams → get team projects → check if any
    // team→project already has a submission for that hackathon before allowing a new one.
  ];

  const totalSteps = FORM_STEPS.length;
  const activeStep = FORM_STEPS[Math.min(currentStep, totalSteps - 1)];
  const isLastStep = currentStep === totalSteps - 1;
  const projectName = watch("name");

  const navigateTo = (next: number, dir: 1 | -1) => {
    setAnimDir(dir);
    setAnimKey((k) => k + 1);
    setCurrentStep(next);
  };

  const handleNext = async () => {
    if (!activeStep) return;
    // Enforce screenshot requirement on the screenshots step before moving on
    if (activeStep.upload === "screenshots" && screenshotFiles.length < 4) {
      setError("Please upload at least 4 screenshots of your project.");
      return;
    }
    setError(null);
    const ok = await trigger(activeStep.key);
    if (!ok && !activeStep.optional) return;
    if (currentStep < totalSteps - 1) navigateTo(currentStep + 1, 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) navigateTo(currentStep - 1, -1);
  };

  const onSubmit = useCallback(
    async (data: BuilderProfileInput) => {
      setError(null);
      setProgressErrors({});
      setLoading(true);
      STEPS.forEach((s) => setProgress((p) => ({ ...p, [s]: "pending" })));

      // Enforce at least 4 screenshots
      if (screenshotFiles.length < 4) {
        setError("Please upload at least 4 screenshots of your project.");
        setLoading(false);
        return;
      }

      // Auto-create team if none selected
      let resolvedTeamId = data.team_id;
      if (!resolvedTeamId) {
        const teamName = `${data.name}(Team)`;
        const result = await saveTeamAction({ name: teamName });
        if (!result.success) {
          setError(result.error || "Failed to auto-create team");
          setLoading(false);
          return;
        }
        resolvedTeamId = result.data.id;
      }

      const screenshotUrls = screenshotFiles.length > 0 ? screenshotFiles : undefined;
      const socialLinks = data.social_links
        ? data.social_links
            .split("\n")
            .map((line) => {
              const trimmed = line.trim();
              if (!trimmed) return null;
              const comma = trimmed.indexOf(",");
              if (comma > 0)
                return {
                  label: trimmed.slice(0, comma).trim(),
                  url: trimmed.slice(comma + 1).trim(),
                };
              return { label: trimmed, url: trimmed };
            })
            .filter((x): x is { label: string; url: string } => x !== null && Boolean(x.url))
        : undefined;

      try {
        const res = await fetch("/api/builder-agents/profile-creator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            team_id: resolvedTeamId,
            screenshot_urls: screenshotUrls,
            social_links: socialLinks,
          }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || json.message || "Profile creation failed");
        }
        if (!res.body) throw new Error("No response body");

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
              if (typeof parsed.message === "string") serverError = parsed.message;
              if (typeof parsed.step === "string") {
                const status = (
                  ["done", "failed", "skipped"].includes(parsed.status as string)
                    ? parsed.status
                    : "started"
                ) as StepStatus;
                setProgress((p) => ({ ...p, [parsed.step as string]: status }));
                if (parsed.status === "failed" && typeof parsed.error === "string")
                  setProgressErrors((e) => ({
                    ...e,
                    [parsed.step as string]: parsed.error as string,
                  }));
              }
              if (currentEvent === "complete" && typeof parsed.project_id === "string")
                lastComplete = parsed;
              if (
                currentEvent === "flattened_codebase" &&
                lastComplete &&
                parsed.project_id === lastComplete.project_id &&
                typeof parsed.flattened_codebase === "string"
              )
                lastComplete = { ...lastComplete, flattened_codebase: parsed.flattened_codebase };
            } catch {
              /* ignore */
            }
          }
        }

        if (serverError && !lastComplete) throw new Error(serverError);
        if (lastComplete && typeof lastComplete.project_id === "string") {
          await saveProjectMutation.mutateAsync({
            ...lastComplete,
            team_id: resolvedTeamId,
            created_at: new Date().toISOString(),
          } as import("@/lib/storage").StoredProject);
          router.push(`/builder/projects/${lastComplete.project_id}`);
          return;
        }
        throw new Error(serverError || "No profile data received.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [router, saveProjectMutation, screenshotFiles],
  );

  const inputBase: React.CSSProperties = {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "rgba(15,44,35,0.06)",
    border: "none",
    borderRadius: 16,
    padding: "18px 22px",
    fontFamily: FN,
    fontSize: 16,
    color: "#0F2C23",
    outline: "none",
    transition: "background-color 0.2s ease",
    letterSpacing: "0.01em",
  };

  const animStyle: React.CSSProperties = {
    animation: `${animDir > 0 ? "slideUpIn" : "slideDownIn"} 0.38s cubic-bezier(0.22,1,0.36,1) both`,
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F8FFE8" }}>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1">
        {/* LEFT — form / intro */}
        <main className="flex-1 flex flex-col justify-center px-10 md:px-20 lg:px-32 py-16">
          {loading ? (
            <div className="h-full min-h-[70vh] flex items-stretch">
              <ProgressPanel progress={progress} errors={progressErrors} />
            </div>
          ) : showIntro ? (
            <section className="max-w-5xl mx-auto">
              <h1
                className="text-center font-black text-[#0F2C23] mb-3"
                style={{
                  fontFamily: PX,
                  fontSize: "clamp(28px, 3.4vw, 40px)",
                  letterSpacing: "-0.02em",
                }}
              >
                How profile creator works
              </h1>
              <p
                className="text-center mb-12"
                style={{
                  fontFamily: FN,
                  fontSize: 13,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(15,44,35,0.55)",
                }}
              >
                Your project pipeline from raw links to an AI-ready knowledge graph.
              </p>

              <div className="grid gap-6 md:grid-cols-4">
                {/* Step 1 */}
                <div className="flex flex-col items-center text-center gap-3">
                  <div
                    className="w-full rounded-2xl border"
                    style={{
                      borderColor: "rgba(15,44,35,0.12)",
                      backgroundColor: "#FFFFFF",
                      height: 120,
                    }}
                  />
                  <div>
                    <p
                      className="text-sm font-semibold mb-1"
                      style={{ fontFamily: FN, color: "#0F2C23" }}
                    >
                      Feed the project.
                    </p>
                    <p
                      className="text-[12px] leading-relaxed"
                      style={{ fontFamily: FN, color: "rgba(15,44,35,0.7)" }}
                    >
                      Drop your links, repo, logo, screenshots, and social handles.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center text-center gap-3">
                  <div
                    className="w-full rounded-2xl border"
                    style={{
                      borderColor: "rgba(15,44,35,0.12)",
                      backgroundColor: "#FFFFFF",
                      height: 120,
                    }}
                  />
                  <div>
                    <p
                      className="text-sm font-semibold mb-1"
                      style={{ fontFamily: FN, color: "#0F2C23" }}
                    >
                      Build the graph.
                    </p>
                    <p
                      className="text-[12px] leading-relaxed"
                      style={{ fontFamily: FN, color: "rgba(15,44,35,0.7)" }}
                    >
                      Profile creator crawls your repo & links to build a knowledge graph.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center text-center gap-3">
                  <div
                    className="w-full rounded-2xl border"
                    style={{
                      borderColor: "rgba(15,44,35,0.12)",
                      backgroundColor: "#FFFFFF",
                      height: 120,
                    }}
                  />
                  <div>
                    <p
                      className="text-sm font-semibold mb-1"
                      style={{ fontFamily: FN, color: "#0F2C23" }}
                    >
                      Ideator agent spins up.
                    </p>
                    <p
                      className="text-[12px] leading-relaxed"
                      style={{ fontFamily: FN, color: "rgba(15,44,35,0.7)" }}
                    >
                      Use the Ideator to riff on ideas, positioning, and tracks to target.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex flex-col items-center text-center gap-3">
                  <div
                    className="w-full rounded-2xl border"
                    style={{
                      borderColor: "rgba(15,44,35,0.12)",
                      backgroundColor: "#FFFFFF",
                      height: 120,
                    }}
                  />
                  <div>
                    <p
                      className="text-sm font-semibold mb-1"
                      style={{ fontFamily: FN, color: "#0F2C23" }}
                    >
                      Mentor agent unlocks.
                    </p>
                    <p
                      className="text-[12px] leading-relaxed"
                      style={{ fontFamily: FN, color: "rgba(15,44,35,0.7)" }}
                    >
                      Once saved, Mentor can answer code questions and help you ship.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowIntro(false)}
                  className="inline-flex items-center gap-2 rounded-full border-none cursor-pointer text-[10px] tracking-widest uppercase font-bold px-8 py-3"
                  style={{
                    fontFamily: PX,
                    backgroundColor: "#0F2C23",
                    color: "#F8FFE8",
                  }}
                >
                 Create Project <ArrowRight size={12} />
                </button>
              </div>
            </section>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step header */}
              <div key={`hdr-${animKey}`} style={{ ...animStyle, marginBottom: 40 }}>
                <div className="flex items-center gap-3 mb-5">
                  <span
                    className="font-black leading-none"
                    style={{
                      fontFamily: PX,
                      fontSize: "clamp(40px, 6vw, 72px)",
                      letterSpacing: "-0.03em",
                      color: "rgba(15,44,35,0.2)",
                    }}
                  >
                    {String(currentStep + 1).padStart(2, "0")}
                  </span>
                </div>
                <h1
                  className="font-black text-[#0F2C23] leading-[0.9] uppercase mb-4"
                  style={{
                    fontFamily: PX,
                    fontSize: "clamp(28px, 4.5vw, 56px)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {activeStep?.label}
                </h1>
                <p
                  className="leading-relaxed"
                  style={{
                    fontFamily: FN,
                    fontSize: "clamp(14px, 1.4vw, 16px)",
                    color: "rgba(15,44,35,0.6)",
                  }}
                >
                  {activeStep?.sub}
                </p>
              </div>

              {/* Input */}
              <div key={`inp-${animKey}`} style={{ ...animStyle, animationDelay: "0.06s" }}>
                {/* team_id — optional, only shown when user has teams */}
                {activeStep?.key === "team_id" && teams.length > 0 && (
                  <Controller
                    name="team_id"
                    control={control}
                    render={({ field }) => (
                      <CustomDropdown
                        options={[
                          { value: "", label: `Auto-create: ${projectName || "Project"}(Team)` },
                          ...teams.map((t) => ({ value: t.id, label: t.name })),
                        ]}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder={`Auto-create: ${projectName || "Project"}(Team)`}
                      />
                    )}
                  />
                )}

                {/* Upload inputs */}
                {activeStep?.upload === "logo" && (
                  <Controller
                    name="logo_url"
                    control={control}
                    render={({ field }) => (
                      <ImageUpload
                        value={field.value}
                        onChange={field.onChange}
                        variant="square"
                        placeholder="Upload logo"
                      />
                    )}
                  />
                )}

                {activeStep?.upload === "screenshots" && (
                  <MultiImageUpload
                    value={screenshotFiles}
                    onChange={(urls) => setScreenshotFiles(urls)}
                    max={10}
                    placeholder="Upload screenshots"
                  />
                )}

                {/* Social links — compact rows with add button */}
                {activeStep?.key === "social_links" && (
                  <Controller
                    name="social_links"
                    control={control}
                    render={({ field }) => {
                      const items = (field.value ?? "").split("\n");
                      if (items.length === 0) items.push("");

                      const updateItem = (index: number, value: string) => {
                        const next = [...items];
                        next[index] = value;
                        field.onChange(next.join("\n"));
                      };

                      const addItem = () => {
                        field.onChange([...items, ""].join("\n"));
                      };

                      const removeItem = (index: number) => {
                        const next = items.filter((_, i) => i !== index);
                        field.onChange((next.length ? next : [""]).join("\n"));
                      };

                      return (
                        <div className="flex flex-col gap-3">
                          {items.map((val, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={val}
                                onChange={(e) => updateItem(idx, e.target.value)}
                                placeholder="Label, https://link.com/…"
                                className="outline-none placeholder-[#2d4a3e]/30"
                                style={{
                                  ...inputBase,
                                  maxWidth: 420,
                                  paddingTop: 12,
                                  paddingBottom: 12,
                                  fontSize: 14,
                                }}
                                onFocus={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "rgba(15,44,35,0.1)")
                                }
                                onBlur={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "rgba(15,44,35,0.06)")
                                }
                              />
                              {items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeItem(idx)}
                                  className="flex items-center justify-center rounded-full border-none cursor-pointer"
                                  style={{
                                    width: 26,
                                    height: 26,
                                    backgroundColor: "rgba(15,44,35,0.06)",
                                    color: "rgba(15,44,35,0.7)",
                                  }}
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={addItem}
                            className="inline-flex items-center justify-center gap-2 border-none cursor-pointer text-[10px] tracking-widest uppercase font-bold mt-1"
                            style={{
                              fontFamily: PX,
                              width: "100%",
                              maxWidth: 420,
                              borderRadius: 16,
                              paddingTop: 12,
                              paddingBottom: 12,
                              backgroundColor: "rgba(15,44,35,0.06)",
                              color: "#0F2C23",
                            }}
                          >
                            <Plus size={12} /> Add link
                          </button>
                        </div>
                      );
                    }}
                  />
                )}

                {/* Text / URL inputs */}
                {activeStep?.key !== "team_id" &&
                  activeStep?.key !== "social_links" &&
                  !activeStep?.upload &&
                  (activeStep?.multiline ? (
                    <textarea
                      rows={4}
                      placeholder={activeStep.placeholder}
                      {...register(activeStep.key)}
                      className="resize-none outline-none placeholder-[#2d4a3e]/30"
                      style={{ ...inputBase, fontFamily: FN, lineHeight: 1.7 }}
                      onFocus={(e) =>
                        (e.currentTarget.style.backgroundColor = "rgba(15,44,35,0.1)")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.backgroundColor = "rgba(15,44,35,0.06)")
                      }
                    />
                  ) : (
                    <input
                      type={activeStep?.type ?? "text"}
                      placeholder={activeStep?.placeholder}
                      {...register(activeStep!.key)}
                      className="outline-none placeholder-[#2d4a3e]/30"
                      style={inputBase}
                      onFocus={(e) =>
                        (e.currentTarget.style.backgroundColor = "rgba(15,44,35,0.1)")
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.backgroundColor = "rgba(15,44,35,0.06)")
                      }
                    />
                  ))}

                {/* Field error */}
                {activeStep?.key && errors[activeStep.key] && (
                  <p
                    className="mt-2 text-sm"
                    style={{ fontFamily: FN, color: "#c0392b" }}
                  >
                    {errors[activeStep.key]?.message as string}
                  </p>
                )}

                {/* Error */}
                {error && !loading && (
                  <p
                    className="mt-4 text-sm"
                    style={{ fontFamily: FN, color: "#c0392b" }}
                  >
                    {error}
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div
                key={`btn-${animKey}`}
                className="flex items-center gap-4 mt-12 flex-wrap"
                style={{ ...animStyle, animationDelay: "0.12s" }}
              >
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-full cursor-pointer transition-all duration-200 hover:opacity-70 text-[10px] tracking-widest uppercase font-bold px-5 py-3"
                    style={{
                      backgroundColor: "transparent",
                      color: "#0F2C23",
                      border: "1.5px solid rgba(15,44,35,0.25)",
                      fontFamily: PX,
                    }}
                  >
                    <ArrowLeft size={11} /> Back
                  </button>
                )}

                {!isLastStep ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-full border-none cursor-pointer transition-all duration-200 hover:opacity-90 text-[10px] tracking-widest uppercase font-bold px-7 py-3"
                    style={{
                      backgroundColor: "#0F2C23",
                      color: "#F8FFE8",
                      fontFamily: PX,
                    }}
                  >
                    Continue <ArrowRight size={12} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || !isValid}
                    className="inline-flex items-center gap-2 rounded-full border-none cursor-pointer transition-all duration-200 hover:opacity-90 disabled:opacity-40 text-[10px] tracking-widest uppercase font-bold px-7 py-3"
                    style={{
                      backgroundColor: "#0F2C23",
                      color: "#F8FFE8",
                      fontFamily: PX,
                    }}
                  >
                    {loading && <Loader2 size={12} className="animate-spin" />}
                    {loading ? "Creating…" : "Create Profile"}
                  </button>
                )}
              </div>
            </form>
          )}
        </main>

        {/* RIGHT — decorative sidebar (only during questions) */}
        {!showIntro && !loading && (
          <aside
            className="hidden lg:flex w-[360px] shrink-0 flex-col justify-between p-10 relative overflow-hidden"
            style={{ backgroundColor: "#0F2C23" }}
          >
            {/* Dot grid texture */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(226,254,165,0.10) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />

            {/* Big faint step number */}
            <div className="relative z-10">
              <p
                className="font-black leading-none"
                style={{
                  fontFamily: PX,
                  fontSize: 100,
                  letterSpacing: "-0.04em",
                  color: "rgba(226,254,165,0.12)",
                }}
              >
                {String(currentStep + 1).padStart(2, "0")}
              </p>
              <p
                className="text-[10px] tracking-[0.2em] uppercase font-bold mt-2"
                style={{ fontFamily: PX, color: "rgba(226,254,165,0.45)" }}
              >
                of {String(totalSteps).padStart(2, "0")} steps
              </p>
            </div>

            {/* Step preview list */}
            <div className="relative z-10 flex flex-col gap-2.5">
              {FORM_STEPS.slice(Math.max(0, currentStep - 1), currentStep + 5).map((step, i) => {
                const absIdx = Math.max(0, currentStep - 1) + i;
                const isCur = absIdx === currentStep;
                const isPast = absIdx < currentStep;
                return (
                  <div
                    key={step.key}
                    className="flex items-center gap-3 transition-all duration-300"
                    style={{ opacity: isCur ? 1 : isPast ? 0.35 : 0.18 }}
                  >
                    {isPast ? (
                      <Check size={11} style={{ color: "#E2FEA5", flexShrink: 0 }} />
                    ) : (
                      <div
                        className="rounded-full shrink-0"
                        style={{
                          width: isCur ? 8 : 6,
                          height: isCur ? 8 : 6,
                          backgroundColor: isCur ? "#E2FEA5" : "rgba(226,254,165,0.45)",
                        }}
                      />
                    )}
                    <p
                      className="truncate"
                      style={{
                        fontFamily: isCur ? PX : FN,
                        fontSize: isCur ? 13 : 12,
                        fontWeight: isCur ? 700 : 400,
                        color: isCur ? "#F8FFE8" : "rgba(226,254,165,0.75)",
                      }}
                    >
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Bottom label + arrow */}
            <div className="relative z-10 flex items-end justify-between">
              <p
                className="text-[9px] tracking-[0.18em] uppercase font-bold"
                style={{ fontFamily: PX, color: "rgba(226,254,165,0.4)" }}
              >
                Create Profile
              </p>
              <span
                className="inline-flex items-center justify-center rounded-full"
                style={{ width: 40, height: 40, backgroundColor: "#E2FEA5" }}
              >
                <ArrowUpRight size={16} style={{ color: "#0F2C23" }} />
              </span>
            </div>
          </aside>
        )}
      </div>

      <style>{`
        @keyframes slideUpIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDownIn {
          from { opacity: 0; transform: translateY(-18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        textarea::placeholder, input::placeholder { color: rgba(15,44,35,0.4); }
      `}</style>
    </div>
  );
}
