"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  FileText,
  Trophy,
  Plus,
  Send,
  Loader2,
  Sparkles,
  CalendarDays,
  Users,
  ChevronDown,
} from "lucide-react";
import type {
  StoredHackathon,
  StoredProject,
  StoredSubmission,
} from "@/lib/data-mappers";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { ProjectEditor } from "@/components/client/project-editor";
import { submitProjectAction } from "@/lib/actions";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

type SectionKey = "ideator" | "mentor" | "info" | "speakers" | "schedule" | "prizes" | "submit";
type Message = { role: "user" | "assistant"; content: string };

interface BuilderHackathonDetailProps {
  hackathonId: string;
  hackathon: StoredHackathon | null;
  projects: StoredProject[];
  submissions: StoredSubmission[];
  isAuthenticated: boolean;
}

export function BuilderHackathonDetail({
  hackathonId,
  hackathon,
  projects,
  submissions,
  isAuthenticated,
}: BuilderHackathonDetailProps) {
  const mounted = useIsMounted();

  const [section, setSection] = useState<SectionKey>("info");

  const [ideatorMessages, setIdeatorMessages] = useState<Message[]>([]);
  const [mentorMessages, setMentorMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Find the submission for THIS hackathon that belongs to one of the user's projects.
  // submissions contains ALL submissions for the hackathon (RLS is public-read),
  // so we must cross-reference against the user's own projects.
  const userProjectIds = new Set(projects.map((p) => p.project_id));
  const hackathonSubmission = submissions.find(
    (s) => s.hackathon_id === hackathonId && userProjectIds.has(s.project_id),
  );
  const submittedProject =
    (hackathonSubmission && projects.find((p) => p.project_id === hackathonSubmission.project_id)) ?? null;

  useEffect(() => {
    const read = () => {
      const h = (window.location.hash.replace("#", "") || "info") as SectionKey;
      const valid: SectionKey[] = ["ideator", "mentor", "info", "speakers", "schedule", "prizes", "submit"];
      setSection(valid.includes(h) ? h : "info");
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [draft]);

  if (hackathon === null) {
    return (
      <div className="flex flex-col h-screen overflow-hidden p-4" style={{ backgroundColor: "#F8FFE8" }}>
        <div className="flex-1 rounded-[15px] flex items-center justify-center" style={{ backgroundColor: "#0F2C23" }}>
          <p style={{ fontFamily: FN, color: "rgba(226,254,165,0.5)" }}>Opportunity not found.</p>
        </div>
      </div>
    );
  }

  const h: StoredHackathon = hackathon;
  const hasResources = (h.technical_resources?.length ?? 0) > 0;
  const hasTracks = (h.sponsor_tracks?.length ?? 0) > 0;
  const hasChallenges = (h.problem_statements?.length ?? 0) > 0;

  const messages = section === "ideator" ? ideatorMessages : mentorMessages;
  const setMessages = section === "ideator" ? setIdeatorMessages : setMentorMessages;

  function injectStarter(text: string) {
    setDraft(text);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }

  async function sendMessage(userMessage: string) {
    if (!userMessage || loading) return;
    setError(null);
    setDraft("");
    setMessages((m) => [...m, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/builder-agents/project-ideator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversation_history: messages,
          booster_context: {
            problem_statements: h.problem_statements,
            sponsor_tracks: h.sponsor_tracks,
            theme: h.theme,
          },
          agent: section === "mentor" ? "developer" : "ideator",
        }),
      });

      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let content = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const chunk = line.slice(6);
          if (chunk === "[DONE]") continue;
          try {
            const parsed = JSON.parse(chunk);
            if (parsed.text) {
              content += parsed.text;
              setMessages((m) => {
                const next = [...m];
                next[next.length - 1] = { role: "assistant", content };
                return next;
              });
            }
          } catch {
            // ignore
          }
        }
      }
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Something went wrong — please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  /* ─── Section watermarks ─────────────────────────────────────── */
  const WATERMARKS: Record<SectionKey, string> = {
    ideator: "IDEATE",
    mentor: "MENTOR",
    info: "INFO",
    speakers: "SPEAKERS",
    schedule: "SCHEDULE",
    prizes: "PRIZES",
    submit: "SUBMIT",
  };

  const SECTION_META: Record<
    SectionKey,
    { label: string; accent: string; accentFaint: string; panelBg: string; panelBorder: string }
  > = {
    ideator: {
      label: "Ideator",
      accent: "#E2FEA5",
      accentFaint: "rgba(226,254,165,0.35)",
      panelBg: "rgba(226,254,165,0.04)",
      panelBorder: "1px solid rgba(226,254,165,0.06)",
    },
    mentor: {
      label: "Mentor",
      accent: "#E2FEA5",
      accentFaint: "rgba(226,254,165,0.35)",
      panelBg: "rgba(226,254,165,0.04)",
      panelBorder: "1px solid rgba(226,254,165,0.06)",
    },
    info: {
      label: "About",
      accent: "#E2FEA5",
      accentFaint: "rgba(226,254,165,0.35)",
      panelBg: "rgba(60,87,75,0.55)",
      panelBorder: "1px solid rgba(226,254,165,0.06)",
    },
    speakers: {
      label: "Speakers",
      accent: "#E2FEA5",
      accentFaint: "rgba(226,254,165,0.35)",
      panelBg: "rgba(60,87,75,0.55)",
      panelBorder: "1px solid rgba(226,254,165,0.06)",
    },
    schedule: {
      label: "Schedule",
      accent: "#E2FEA5",
      accentFaint: "rgba(226,254,165,0.35)",
      panelBg: "rgba(226,254,165,0.04)",
      panelBorder: "1px solid rgba(226,254,165,0.06)",
    },
    prizes: {
      label: "Prizes + Challenges",
      accent: "#E2FEA5",
      accentFaint: "rgba(226,254,165,0.35)",
      panelBg: "rgba(226,254,165,0.04)",
      panelBorder: "1px solid rgba(226,254,165,0.06)",
    },
    submit: {
      label: "Submit",
      accent: "#E2FEA5",
      accentFaint: "rgba(226,254,165,0.35)",
      panelBg: "rgba(60,87,75,0.55)",
      panelBorder: "1px solid rgba(226,254,165,0.06)",
    },
  };

  function renderTopBar() {
    const m = SECTION_META[section];
    return (
      <div
        className="shrink-0 flex items-center justify-between px-10 py-4"
        style={{ borderBottom: "1px solid rgba(226,254,165,0.06)" }}
      >
        <p
          className="text-[9px] tracking-[0.25em] uppercase font-bold"
          style={{ fontFamily: PX, color: "rgba(226,254,165,0.3)" }}
        >
          {m.label} — {h.name}
        </p>
        <p
          className="text-[9px] tracking-[0.18em] uppercase font-bold"
          style={{ fontFamily: PX, color: "rgba(226,254,165,0.2)" }}
        >
          {WATERMARKS[section]}
        </p>
      </div>
    );
  }

  /* ─── Chat view (shared between Ideator & Mentor) ──────────── */
  function renderChat() {
    const isIdeator = section === "ideator";
    const placeholder = isIdeator ? "Describe your idea or ask for help..." : "Ask your mentor anything...";

    if (mounted && !isAuthenticated) {
      return (
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-10">
          <p
            className="font-black uppercase leading-none select-none text-center mb-6"
            style={{
              fontFamily: PX,
              fontSize: "clamp(48px, 6vw, 80px)",
              letterSpacing: "-0.04em",
              opacity: 0.04,
              lineHeight: 0.85,
              color: "#E2FEA5",
            }}
          >
            {WATERMARKS[section]}
          </p>
          <p
            className="text-sm leading-relaxed text-center max-w-[420px] mb-6"
            style={{ fontFamily: FN, color: "rgba(226,254,165,0.45)" }}
          >
            Sign in to use {isIdeator ? "Ideator" : "Mentor"} for this hackathon.
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
            <Plus size={12} /> Sign in
          </Link>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {messages.length === 0 ? (
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-10 py-10">
            <p
              className="font-black uppercase leading-none select-none text-center mb-5"
              style={{ fontFamily: PX, fontSize: "clamp(48px, 6vw, 80px)", letterSpacing: "-0.04em", opacity: 0.04, lineHeight: 0.85, color: "#E2FEA5" }}
            >
              {WATERMARKS[section]}
            </p>
            <p className="text-sm leading-relaxed text-center max-w-[440px]" style={{ fontFamily: FN, color: "rgba(226,254,165,0.45)" }}>
              {isIdeator
                ? "Start with your idea. The Ideator will sharpen it, map it to the challenges, and outline next steps."
                : "Your AI Mentor can guide you through technical decisions, architecture, and implementation strategy."}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 max-w-[560px] w-full">
              {(isIdeator
                ? [
                    "I have a rough idea — help me sharpen it",
                    "Which challenge should I tackle?",
                    "Turn this into an MVP plan",
                    "What stack would you recommend?",
                  ]
                : [
                    "Review my architecture approach",
                    "How should I structure my project?",
                    "Help me with the technical writeup",
                    "What are the judging criteria?",
                  ]
              ).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => injectStarter(s)}
                  className="rounded-2xl px-4 py-3.5 text-left text-[12px] transition-all hover:scale-[1.01] flex items-start justify-between gap-3 border-none cursor-pointer"
                  style={{ fontFamily: FN, backgroundColor: "rgba(226,254,165,0.04)", color: "rgba(226,254,165,0.65)", border: "1px solid rgba(226,254,165,0.08)" }}
                >
                  <span className="leading-snug">{s}</span>
                  <ArrowUpRight size={10} style={{ color: "rgba(226,254,165,0.2)", flexShrink: 0, marginTop: 2 }} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-10 py-8 flex flex-col gap-5">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-1" style={{ backgroundColor: "#E2FEA5" }}>
                    <Sparkles size={12} style={{ color: "#0F2C23" }} />
                  </div>
                )}
                <div
                  className="rounded-2xl px-5 py-4 max-w-[78%]"
                  style={{
                    backgroundColor: msg.role === "user" ? "rgba(226,254,165,0.12)" : "rgba(226,254,165,0.045)",
                    borderBottomRightRadius: msg.role === "user" ? 4 : 16,
                    borderBottomLeftRadius: msg.role === "assistant" ? 4 : 16,
                    border: msg.role === "assistant" ? "1px solid rgba(226,254,165,0.06)" : "1px solid rgba(226,254,165,0.08)",
                  }}
                >
                  <p className="text-sm leading-[1.85] whitespace-pre-wrap" style={{ fontFamily: FN, color: msg.role === "user" ? "#E2FEA5" : "rgba(226,254,165,0.65)" }}>
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Input bar */}
        <form
          className="shrink-0 px-10 py-6"
          style={{ borderTop: "1px solid rgba(226,254,165,0.06)" }}
          onSubmit={(e) => { e.preventDefault(); void sendMessage(draft.trim()); }}
        >
          {error && (
            <p className="mb-3 text-[12px]" style={{ fontFamily: FN, color: "rgba(226,254,165,0.6)" }}>{error}</p>
          )}
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              rows={1}
              disabled={loading}
              className="flex-1 resize-none outline-none rounded-2xl px-5 py-4 text-sm"
              style={{ fontFamily: FN, backgroundColor: "rgba(226,254,165,0.035)", color: "#E2FEA5", border: "1px solid rgba(226,254,165,0.1)", lineHeight: 1.7 }}
            />
            <button
              type="submit"
              disabled={loading || !draft.trim()}
              className="w-12 h-12 rounded-2xl flex items-center justify-center border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#E2FEA5" }}
              title="Send"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" style={{ color: "#0F2C23" }} />
              ) : (
                <Send size={16} style={{ color: "#0F2C23" }} />
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* ─── Info view ─────────────────────────────────────────────── */
  function renderInfo() {
    return (
      <div className="flex-1 overflow-y-auto px-14 py-14">
        <div className="grid gap-10" style={{ gridTemplateColumns: "1.2fr 0.8fr" }}>
          {/* Left: Hero title + description */}
          <div className="rounded-2xl p-10" style={{ backgroundColor: "#F8FFE8" }}>
            <p
              className="text-[9px] tracking-[0.25em] uppercase font-bold mb-3"
              style={{ fontFamily: PX, color: "rgba(15,44,35,0.55)" }}
            >
              About the hackathon
            </p>
            <h1
              className="font-black uppercase leading-[0.86] mb-5"
              style={{
                fontFamily: PX,
                fontSize: "clamp(46px, 6vw, 82px)",
                letterSpacing: "-0.04em",
                color: "#0F2C23",
              }}
            >
              {h.name}
            </h1>
            {h.theme && (
              <p
                className="mt-2 text-base leading-[1.9]"
                style={{ fontFamily: FN, color: "#0F2C23" }}
              >
                {h.theme}
              </p>
            )}
            {h.program_goal && (
              <p
                className="mt-4 text-sm leading-[1.9] max-w-[640px]"
                style={{ fontFamily: FN, color: "#0F2C23" }}
              >
                {h.program_goal}
              </p>
            )}
          </div>

          {/* Right: AI feature CTAs */}
          <div className="flex flex-col gap-4">
            <div
              className="relative rounded-2xl px-6 py-5 overflow-hidden"
              style={{ backgroundColor: "#F8FFE8" }}
            >
              <p
                className="absolute right-4 top-3 text-[9px] tracking-[0.25em] uppercase font-bold"
                style={{ fontFamily: PX, color: "rgba(15,44,35,0.15)" }}
              >
                IDEATOR
              </p>
              <p
                className="text-[10px] tracking-[0.18em] uppercase font-bold mb-2"
                style={{ fontFamily: PX, color: "#0F2C23" }}
              >
                AI idea partner
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ fontFamily: FN, color: "#0F2C23" }}
              >
                Use the <span className="font-semibold">Ideator agent</span> to brainstorm concepts,
                map them to challenges, and shape a clear project plan.
              </p>
            </div>

            <div
              className="relative rounded-2xl px-6 py-5 overflow-hidden"
              style={{ backgroundColor: "#F8FFE8" }}
            >
              <p
                className="absolute right-4 top-3 text-[9px] tracking-[0.25em] uppercase font-bold"
                style={{ fontFamily: PX, color: "rgba(15,44,35,0.15)" }}
              >
                MENTOR
              </p>
              <p
                className="text-[10px] tracking-[0.18em] uppercase font-bold mb-2"
                style={{ fontFamily: PX, color: "#0F2C23" }}
              >
                AI build mentor
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ fontFamily: FN, color: "#0F2C23" }}
              >
                Switch to the <span className="font-semibold">Mentor agent</span> for architecture
                reviews, implementation guidance, and polish before you submit.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Speakers view ─────────────────────────────────────────── */
  function renderSpeakers() {
    const speakers = [
      {
        name: "Asha Verma",
        role: "AI Product Lead",
        img: "/dummy/speakers/one.png",
      },
      {
        name: "Noah Kim",
        role: "Founding Engineer",
        img: "/dummy/speakers/two.png",
      },
      {
        name: "Mira Patel",
        role: "Research Engineer",
        img: "/dummy/speakers/three.png",
      },
    ];

    return (
      <div className="flex-1 overflow-y-auto px-14 py-14">
        <p
          className="font-black uppercase leading-none select-none mb-10"
          style={{
            fontFamily: PX,
            fontSize: "clamp(48px, 6vw, 80px)",
            letterSpacing: "-0.04em",
            lineHeight: 0.85,
            color: "#0F2C23",
          }}
        >
          SPEAKERS
        </p>

        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
        >
          {speakers.map((s) => (
            <div
              key={s.name}
              className="rounded-3xl p-8"
              style={{
                backgroundColor: "rgba(15,44,35,0.02)",
                border: "1px solid rgba(15,44,35,0.06)",
              }}
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div
                  className="w-28 h-28 md:w-32 md:h-32 rounded-3xl overflow-hidden"
                  style={{ backgroundColor: "#0F2C23" }}
                >
                  <Image
                    src={s.img}
                    alt={s.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                    priority={false}
                  />
                </div>

                <div className="min-w-0">
                  <p
                    className="text-[9px] tracking-[0.22em] uppercase font-bold mb-2"
                    style={{ fontFamily: PX, color: "rgba(15,44,35,0.55)" }}
                  >
                    Speaker
                  </p>
                  <p
                    className="font-black uppercase leading-tight"
                    style={{
                      fontFamily: PX,
                      fontSize: "clamp(18px, 2vw, 26px)",
                      letterSpacing: "-0.02em",
                      color: "#0F2C23",
                      margin: 0,
                    }}
                  >
                    {s.name}
                  </p>
                  <p
                    className="mt-1 text-sm leading-relaxed"
                    style={{ fontFamily: FN, color: "rgba(15,44,35,0.7)" }}
                  >
                    {s.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ─── Schedule view ─────────────────────────────────────────── */
  function renderSchedule() {
    const hasAnyDate = h.start_date || h.submission_deadline || h.judging_deadline || h.results_date;
    const rows: { label: string; value: string }[] = [
      ...(h.start_date ? [{ label: "Start date", value: h.start_date }] : []),
      ...(h.submission_deadline ? [{ label: "Submission deadline", value: h.submission_deadline }] : []),
      ...(h.judging_deadline ? [{ label: "Judging deadline", value: h.judging_deadline }] : []),
      ...(h.results_date ? [{ label: "Results", value: h.results_date }] : []),
    ];

    return (
      <div className="flex-1 overflow-y-auto px-14 py-14">
        <p
          className="font-black uppercase leading-none select-none mb-8"
          style={{
            fontFamily: PX,
            fontSize: "clamp(48px, 6vw, 80px)",
            letterSpacing: "-0.04em",
            lineHeight: 0.85,
            color: "#0F2C23",
          }}
        >
          SCHEDULE
        </p>
        {hasAnyDate ? (
          <div className="rounded-[28px] bg-transparent">
            <div className="px-2 py-2">
              <div
                className="rounded-[22px] px-10 py-6"
                style={{
                  backgroundColor: "rgba(248,255,232,0.9)",
                }}
              >
                {rows.map((r, idx) => (
                  <div
                    key={r.label}
                    className="flex gap-5 py-4"
                    style={{
                      marginTop: idx === 0 ? 0 : 4,
                    }}
                  >
                    {/* Timeline rail */}
                    <div className="flex flex-col items-center pt-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: "#0F2C23",
                        }}
                      />
                      {idx !== rows.length - 1 && (
                        <span
                          style={{
                            width: 1,
                            flex: 1,
                            background:
                              "linear-gradient(to bottom, rgba(15,44,35,0.2), rgba(15,44,35,0.04))",
                            marginTop: 6,
                          }}
                        />
                      )}
                    </div>

                    {/* Text block */}
                    <div className="flex-1 flex items-baseline justify-between gap-6">
                      <p
                        className="m-0 uppercase font-black"
                        style={{
                          fontFamily: PX,
                          fontSize: 12,
                          letterSpacing: "0.12em",
                          color: "rgba(15,44,35,0.75)",
                        }}
                      >
                        {r.label}
                      </p>
                      <p
                        className="m-0 text-right"
                        style={{
                          fontFamily: FN,
                          fontSize: "clamp(14px, 1.4vw, 16px)",
                          letterSpacing: "0",
                          color: "rgba(15,44,35,0.85)",
                        }}
                      >
                        {r.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <CalendarDays
              size={24}
              style={{ color: "rgba(15,44,35,0.35)", marginBottom: 16 }}
            />
            <p
              className="text-sm text-center max-w-[360px]"
              style={{ fontFamily: FN, color: "rgba(15,44,35,0.55)" }}
            >
              Schedule details will be available soon.
            </p>
          </div>
        )}
      </div>
    );
  }

  /* ─── Prizes view ──────────────────────────────────────────── */
  function renderPrizes() {
    return (
      <div className="flex-1 overflow-y-auto px-14 py-14">
        <p
          className="font-black uppercase leading-none select-none mb-8"
          style={{
            fontFamily: PX,
            fontSize: "clamp(48px, 6vw, 80px)",
            letterSpacing: "-0.04em",
            lineHeight: 0.85,
            color: "#0F2C23",
          }}
        >
          PRIZES
        </p>

        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} style={{ color: "#0F2C23" }} />
            <p
              className="text-[10px] tracking-[0.22em] uppercase font-bold"
              style={{ fontFamily: PX, color: "rgba(15,44,35,0.7)" }}
            >
              Prize Pool
            </p>
          </div>
          {h.bounty_pool_summary ? (
            <p
              className="font-black uppercase"
              style={{
                fontFamily: PX,
                fontSize: "clamp(28px, 4vw, 42px)",
                letterSpacing: "-0.02em",
                color: "#0F2C23",
              }}
            >
              {h.bounty_pool_summary}
            </p>
          ) : (
            <p
              className="text-sm leading-relaxed"
              style={{ fontFamily: FN, color: "rgba(15,44,35,0.7)" }}
            >
              Prize details will be announced soon.
            </p>
          )}
        </section>

        {hasChallenges && (
          <section className="mb-8">
            <p
              className="text-[10px] tracking-[0.22em] uppercase font-bold mb-3"
              style={{ fontFamily: PX, color: "rgba(15,44,35,0.7)" }}
            >
              Challenges
            </p>
            <div className="flex flex-col gap-3">
              {h.problem_statements.map((s, i) => (
                <div key={i} className="flex items-baseline gap-3">
                  <span
                    className="font-black shrink-0"
                    style={{
                      fontFamily: PX,
                      fontSize: 11,
                      width: 22,
                      color: "rgba(15,44,35,0.45)",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p
                    className="text-[13px] leading-relaxed flex-1"
                    style={{ fontFamily: FN, color: "rgba(15,44,35,0.85)" }}
                  >
                    {s}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {hasResources && (
          <div
            className="rounded-2xl p-8 mb-6"
            style={{
              backgroundColor: "rgba(15,44,35,0.03)",
              border: "1px solid rgba(15,44,35,0.08)",
            }}
          >
            <p
              className="text-[9px] tracking-[0.2em] uppercase font-bold mb-5"
              style={{ fontFamily: PX, color: "rgba(15,44,35,0.6)" }}
            >
              Resources
            </p>
            <div className="flex flex-col gap-2">
              {h.technical_resources!.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 no-underline rounded-xl px-4 py-3 transition-colors"
                  style={{
                    backgroundColor: "rgba(15,44,35,0.02)",
                    border: "1px solid rgba(15,44,35,0.07)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(15,44,35,0.04)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(15,44,35,0.02)")
                  }
                >
                  <FileText
                    size={12}
                    style={{ color: "rgba(15,44,35,0.6)", flexShrink: 0 }}
                  />
                  <span
                    className="text-[12px] truncate"
                    style={{
                      fontFamily: FN,
                      color: "rgba(15,44,35,0.8)",
                    }}
                  >
                    {r.description || r.url}
                  </span>
                  <ArrowUpRight
                    size={10}
                    style={{
                      color: "rgba(15,44,35,0.35)",
                      flexShrink: 0,
                      marginLeft: "auto",
                    }}
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {hasTracks && (
          <div
            className="rounded-2xl p-8"
            style={{
              backgroundColor: "rgba(15,44,35,0.03)",
              border: "1px solid rgba(15,44,35,0.08)",
            }}
          >
            <p
              className="text-[9px] tracking-[0.2em] uppercase font-bold mb-5"
              style={{ fontFamily: PX, color: "rgba(15,44,35,0.6)" }}
            >
              Sponsor Tracks
            </p>
            <div className="flex flex-col gap-4">
              {h.sponsor_tracks!.map((t, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 rounded-xl px-4 py-3"
                  style={{ backgroundColor: "rgba(15,44,35,0.02)" }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                    style={{ backgroundColor: "#0F2C23" }}
                  />
                  <div>
                    <p
                      className="text-[13px] font-bold"
                      style={{
                        fontFamily: PX,
                        color: "rgba(15,44,35,0.85)",
                      }}
                    >
                      {t.sponsor}
                    </p>
                    {t.track_description && (
                      <p
                        className="text-[12px] mt-1 leading-relaxed"
                        style={{
                          fontFamily: FN,
                          color: "rgba(15,44,35,0.65)",
                        }}
                      >
                        {t.track_description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {h.judging_criteria && h.judging_criteria.length > 0 && (
          <div
            className="rounded-2xl p-8 mt-6"
            style={{
              backgroundColor: "rgba(15,44,35,0.03)",
              border: "1px solid rgba(15,44,35,0.08)",
            }}
          >
            <p
              className="text-[9px] tracking-[0.2em] uppercase font-bold mb-5"
              style={{ fontFamily: PX, color: "rgba(15,44,35,0.6)" }}
            >
              Judging Criteria
            </p>
            <div className="flex flex-col gap-3">
              {h.judging_criteria.map((c, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl"
                  style={{ backgroundColor: "rgba(15,44,35,0.02)" }}
                >
                  <span
                    className="font-black shrink-0"
                    style={{
                      fontFamily: PX,
                      fontSize: 11,
                      width: 20,
                      color: "rgba(15,44,35,0.35)",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <p
                      className="text-[12px] font-bold"
                      style={{
                        fontFamily: PX,
                        color: "rgba(15,44,35,0.85)",
                      }}
                    >
                      {c.name}
                    </p>
                    {c.description && (
                      <p
                        className="text-[11px] mt-0.5 leading-relaxed"
                        style={{
                          fontFamily: FN,
                          color: "rgba(15,44,35,0.65)",
                        }}
                      >
                        {c.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prize pool empty-state is handled in the section above. */}
      </div>
    );
  }

  /* ─── Submit view ──────────────────────────────────────────── */
  function renderSubmit() {
    if (submittedProject) {
      const hackathonNames: Record<string, string> = { [hackathonId]: h.name };
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

    // Already-submitted project IDs for this hackathon (to filter them out)
    const submittedProjectIds = new Set(
      submissions
        .filter((s) => s.hackathon_id === hackathonId)
        .map((s) => s.project_id),
    );
    const availableProjects = projects.filter(
      (p) => !submittedProjectIds.has(p.project_id),
    );

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
              <SubmitProjectPicker
                projects={availableProjects}
                hackathonId={hackathonId}
              />
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

  /* ─── Render ────────────────────────────────────────────────── */
  const SECTION_RENDERER: Record<SectionKey, () => React.JSX.Element> = {
    ideator: renderChat,
    mentor: renderChat,
    info: renderInfo,
    speakers: renderSpeakers,
    schedule: renderSchedule,
    prizes: renderPrizes,
    submit: renderSubmit,
  };

  const SIMPLE_SECTIONS: SectionKey[] = ["info", "speakers", "schedule", "prizes"];

  // For info/speakers/schedule/prizes, let the content live directly on the light page
  // similar to the /hackathons listing (no dark rounded container).
  if (SIMPLE_SECTIONS.includes(section)) {
    return (
      <main
        className="min-h-screen"
        style={{ backgroundColor: "#F8FFE8" }}
      >
        {SECTION_RENDERER[section]()}
      </main>
    );
  }

  // For ideator / mentor / submit we keep the dark container layout for now.
  return (
    <div
      className="flex flex-col h-screen overflow-hidden p-4"
      style={{ backgroundColor: "#F8FFE8" }}
    >
      <div
        className="flex-1 rounded-[15px] overflow-hidden flex flex-col min-h-0"
        style={{ backgroundColor: "#0F2C23" }}
      >
        {section !== "submit" && renderTopBar()}
        {SECTION_RENDERER[section]()}
      </div>
    </div>
  );
}

/* ─── Submit Project Picker ─────────────────────────────────── */

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

      {/* Dropdown */}
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
        <p
          className="text-xs mb-3"
          style={{ fontFamily: FN, color: "#ff6b6b" }}
        >
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
        {isPending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Send size={12} />
        )}
        {isPending ? "Submitting…" : "Submit Project"}
      </button>
    </div>
  );
}
