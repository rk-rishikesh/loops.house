"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { Send, Loader2, Sparkles, Zap, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBooster } from "@/lib/queries";
import { ideateInputSchema, type IdeateInputSchema } from "@/lib/validations/schemas";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

type Message = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Help me fit my idea to this booster's theme",
  "What kind of projects win programs like this?",
  "I have a rough idea — let's sharpen it",
  "Which problem statement should I tackle?",
];

/* ─────────────────────────────────────────────────────────────────── */

function IdeatePageContent() {
  const params      = useParams<{ type: string; id: string }>();
  const boosterId   = (params?.id   as string) ?? null;

  const [messages,  setMessages]  = useState<Message[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { data: booster } = useBooster(boosterId ?? "");

  const { register, handleSubmit, reset, setValue, watch } = useForm<IdeateInputSchema>({
    resolver: zodResolver(ideateInputSchema),
  });

  const currentMessage = watch("message") ?? "";

  /* auto-resize textarea */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
    setCharCount(currentMessage.length);
  }, [currentMessage]);

  /* ── Send ─────────────────────────────────────────────────────── */
  const onSubmit = handleSubmit(async (data) => {
    if (!booster || loading) return;
    const userMessage = data.message.trim();
    if (!userMessage) return;
    reset();
    setMessages((m) => [...m, { role: "user", content: userMessage }]);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/builder-agents/project-ideator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversation_history: messages,
          booster_context: {
            problem_statements: booster.problem_statements,
            sponsor_tracks:     booster.sponsor_tracks,
            theme:              booster.theme,
          },
        }),
      });

      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Request failed");
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", content = "";
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
          } catch { /* ignore */ }
        }
      }
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMessages((m) => [...m, { role: "assistant", content: "Something went wrong — please try again." }]);
    } finally {
      setLoading(false);
    }
  });

  function injectStarter(text: string) {
    setValue("message", text);
    textareaRef.current?.focus();
  }

  /* ── Loading ──────────────────────────────────────────────────── */
  if (!booster) {
    return (
      <div className="min-h-screen flex" style={{ backgroundColor: "#F8FFE8" }}>
        <div className="w-[300px] shrink-0 animate-pulse" style={{ backgroundColor: "#0F2C23" }} />
        <div className="flex-1 p-10 animate-pulse space-y-4">
          <div className="h-4 w-28 rounded bg-[#0F2C23]/10" />
          <div className="h-48 rounded-3xl bg-[#0F2C23]/06" />
          <div className="h-32 rounded-3xl bg-[#0F2C23]/04" />
        </div>
      </div>
    );
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: "#F8FFE8" }}>

      {/* ══ SPLIT LAYOUT — fills remaining height exactly ════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: dark editorial context canvas ──────────────────── */}
        <div
          className="shrink-0 flex flex-col overflow-y-auto"
          style={{ width: 300, backgroundColor: "#0F2C23", borderRight: "1px solid rgba(226,254,165,0.06)" }}
        >
          {/* Booster identity */}
          <div className="px-7 pt-8 pb-6" style={{ borderBottom: "1px solid rgba(226,254,165,0.07)" }}>
            <p className="text-[9px] tracking-[0.22em] uppercase font-bold text-[#F8FFE8]/30 mb-2"
              style={{ fontFamily: PX }}>
              Ideating for
            </p>
            <h2 className="font-black text-[#F8FFE8] uppercase leading-[0.88] mb-2"
              style={{ fontFamily: PX, fontSize: "clamp(17px, 2vw, 24px)", letterSpacing: "-0.025em" }}>
              {booster.name}
            </h2>
            {booster.theme && (
              <p className="text-[#F8FFE8]/40 text-[11px] leading-snug mt-2" style={{ fontFamily: FN }}>
                {booster.theme}
              </p>
            )}
          </div>

          {/* Challenges — each one is clickable to inject a prompt */}
          {booster.problem_statements.length > 0 && (
            <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(226,254,165,0.07)" }}>
              <p className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#F8FFE8]/25 mb-3 px-2"
                style={{ fontFamily: PX }}>
                {booster.problem_statements.length} Challenge{booster.problem_statements.length !== 1 ? "s" : ""}
              </p>
              <div className="flex flex-col gap-1">
                {booster.problem_statements.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => injectStarter(`Let's work on challenge ${i + 1}: "${s.slice(0, 55)}…"`)}
                    className="group flex items-start gap-2.5 text-left w-full bg-transparent border-none cursor-pointer rounded-xl px-3 py-2.5 transition-colors"
                    style={{ outline: "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(226,254,165,0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <span className="font-black text-[#F8FFE8]/18 shrink-0 mt-0.5"
                      style={{ fontFamily: PX, fontSize: 10, width: 18 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-[11px] text-[#F8FFE8]/45 leading-snug flex-1"
                      style={{ fontFamily: FN }}>
                      {s.slice(0, 70)}{s.length > 70 ? "…" : ""}
                    </p>
                    <ChevronRight size={9} style={{ color: "rgba(226,254,165,0.15)", flexShrink: 0, marginTop: 2 }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sponsor tracks */}
          {(booster.sponsor_tracks?.length ?? 0) > 0 && (
            <div className="px-7 py-5" style={{ borderBottom: "1px solid rgba(226,254,165,0.07)" }}>
              <p className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#F8FFE8]/25 mb-3"
                style={{ fontFamily: PX }}>
                Sponsor Tracks
              </p>
              {booster.sponsor_tracks!.map((t, i) => (
                <div key={i} className="flex items-center gap-2 mb-2 last:mb-0">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "#4caf7d" }} />
                  <p className="text-[11px] font-semibold text-[#F8FFE8]/50"
                    style={{ fontFamily: PX }}>
                    {t.sponsor}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: chat ───────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Empty state */}
          {isEmpty && (
            <div className="flex-1 flex flex-col items-center justify-center px-12 pb-4">
              {/* Watermark heading */}
              <p
                className="font-black text-[#0F2C23] uppercase leading-none select-none mb-0 text-center"
                style={{
                  fontFamily: PX,
                  fontSize: "clamp(60px, 12vw, 140px)",
                  letterSpacing: "-0.04em",
                  opacity: 0.04,
                  lineHeight: 0.85,
                  marginBottom: "-0.2em",
                }}
              >
                IDEATE
              </p>

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#0F2C23" }}>
                  <Sparkles size={19} style={{ color: "#E2FEA5" }} />
                </div>
                <h2 className="font-black text-[#0F2C23] uppercase text-center leading-[0.88] mb-3"
                  style={{ fontFamily: PX, fontSize: "clamp(22px, 2.8vw, 34px)", letterSpacing: "-0.025em" }}>
                  Shape Your Idea.
                </h2>
                <p className="text-[#0F2C23]/42 text-sm text-center max-w-[340px] leading-relaxed mb-9"
                  style={{ fontFamily: FN }}>
                  Tell the AI mentor your concept — it will help you sharpen it and match it to the challenges on the left.
                </p>

                <div className="grid grid-cols-2 gap-2.5 w-full max-w-[520px]">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => injectStarter(s)}
                      className="rounded-2xl px-4 py-3.5 text-left text-[12px] transition-all hover:scale-[1.02] flex items-start justify-between gap-3"
                      style={{
                        fontFamily: FN,
                        backgroundColor: "rgba(15,44,35,0.04)",
                        color: "rgba(15,44,35,0.65)",
                        border: "1px solid rgba(15,44,35,0.09)",
                      }}
                    >
                      <span className="leading-snug">{s}</span>
                      <ChevronRight size={11} style={{ color: "rgba(15,44,35,0.22)", flexShrink: 0, marginTop: 2 }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {!isEmpty && (
            <div className="flex-1 overflow-y-auto px-10 py-8 flex flex-col gap-5">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>

                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-1"
                      style={{ backgroundColor: "#0F2C23" }}>
                      <Sparkles size={12} style={{ color: "#E2FEA5" }} />
                    </div>
                  )}

                  <div
                    className="rounded-2xl px-5 py-4 max-w-[72%]"
                    style={{
                      backgroundColor: msg.role === "user" ? "#0F2C23" : "rgba(15,44,35,0.04)",
                      borderBottomRightRadius: msg.role === "user"      ? 4 : 16,
                      borderBottomLeftRadius:  msg.role === "assistant" ? 4 : 16,
                    }}
                  >
                    <p className="text-sm leading-[1.85] whitespace-pre-wrap"
                      style={{ fontFamily: FN, color: msg.role === "user" ? "#F8FFE8" : "#0F2C23" }}>
                      {msg.content}
                    </p>
                  </div>

                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-1"
                      style={{ backgroundColor: "rgba(15,44,35,0.1)" }}>
                      <Zap size={12} style={{ color: "#0F2C23" }} />
                    </div>
                  )}
                </div>
              ))}

              {/* Thinking dots */}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#0F2C23" }}>
                    <Sparkles size={12} style={{ color: "#E2FEA5" }} />
                  </div>
                  <div className="rounded-2xl px-5 py-4 flex items-center gap-2"
                    style={{ backgroundColor: "rgba(15,44,35,0.04)", borderBottomLeftRadius: 4 }}>
                    <span className="flex gap-1">
                      {[0, 1, 2].map((n) => (
                        <span key={n} className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: "#0F2C23", opacity: 0.35,
                            animation: `blink 1.2s ease-in-out ${n * 0.22}s infinite` }} />
                      ))}
                    </span>
                    <p className="text-[11px] text-[#0F2C23]/40" style={{ fontFamily: FN }}>Thinking…</p>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="px-10 text-xs text-red-600/55 mb-1" style={{ fontFamily: FN }}>
              ⚠ {error}
            </p>
          )}

          {/* ── Input ──────────────────────────────────────────────── */}
          <div className="shrink-0 px-10 pb-8 pt-3">
            <form
              onSubmit={onSubmit}
              className="flex items-end gap-3 rounded-3xl px-6 py-4"
              style={{
                backgroundColor: "rgba(15,44,35,0.04)",
                border: "1.5px solid rgba(15,44,35,0.11)",
                boxShadow: "0 2px 12px rgba(15,44,35,0.05)",
              }}
            >
              <textarea
                {...register("message")}
                ref={(el) => {
                  register("message").ref(el);
                  (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
                }}
                placeholder="Describe your idea or ask the mentor…"
                rows={1}
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); }
                }}
                className="flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none"
                style={{ fontFamily: FN, minHeight: 22, maxHeight: 120, color: "#0F2C23" }}
              />
              <div className="flex items-center gap-2 shrink-0">
                {charCount > 0 && (
                  <span className="text-[8px] font-bold tabular-nums"
                    style={{ fontFamily: PX, color: "rgba(15,44,35,0.18)" }}>
                    {charCount}
                  </span>
                )}
                <button
                  type="submit"
                  disabled={loading || !currentMessage.trim()}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl transition-all disabled:opacity-28 hover:scale-105 active:scale-95"
                  style={{ backgroundColor: "#0F2C23" }}
                >
                  {loading
                    ? <Loader2 size={15} className="animate-spin" style={{ color: "#F8FFE8" }} />
                    : <Send size={15} style={{ color: "#F8FFE8" }} />
                  }
                </button>
              </div>
            </form>
            <p className="text-center text-[8px] tracking-widest uppercase font-bold mt-2.5"
              style={{ fontFamily: PX, color: "rgba(15,44,35,0.18)" }}>
              Enter to send · Shift+Enter new line · ideas only, no code
            </p>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes blink  { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.85; } }
        textarea::placeholder { color: rgba(15,44,35,0.32); }
      `}</style>
    </div>
  );
}

export default function BoosterIdeatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F8FFE8" }}>
        <Loader2 size={18} className="animate-spin" style={{ color: "rgba(15,44,35,0.3)" }} />
      </div>
    }>
      <IdeatePageContent />
    </Suspense>
  );
}