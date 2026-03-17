"use client";

import { ArrowUpRight, Loader2, Plus, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useIsMounted } from "@/hooks/use-is-mounted";
import type { StoredHackathon } from "@/lib/data-mappers";
import type { Message, SectionKey } from "./constants";
import { FN, PX, WATERMARKS } from "./constants";

interface HackathonChatSectionProps {
  section: Extract<SectionKey, "ideator" | "mentor">;
  hackathonId: string;
  hackathon: StoredHackathon;
  isAuthenticated: boolean;
}

export function HackathonChatSection({
  section,
  hackathonId,
  hackathon,
  isAuthenticated,
}: HackathonChatSectionProps) {
  const mounted = useIsMounted();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [draft]);

  const isIdeator = section === "ideator";
  const placeholder = isIdeator
    ? "Describe your idea or ask for help..."
    : "Ask your mentor anything...";

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
          hackathon_id: hackathonId,
          booster_context: {
            problem_statements: hackathon.problem_statements,
            sponsor_tracks: hackathon.sponsor_tracks,
            theme: hackathon.theme,
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

  function injectStarter(text: string) {
    setDraft(text);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }

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
            className="text-sm leading-relaxed text-center max-w-[440px]"
            style={{ fontFamily: FN, color: "rgba(226,254,165,0.45)" }}
          >
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
                style={{
                  fontFamily: FN,
                  backgroundColor: "rgba(226,254,165,0.04)",
                  color: "rgba(226,254,165,0.65)",
                  border: "1px solid rgba(226,254,165,0.08)",
                }}
              >
                <span className="leading-snug">{s}</span>
                <ArrowUpRight
                  size={10}
                  style={{ color: "rgba(226,254,165,0.2)", flexShrink: 0, marginTop: 2 }}
                />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-10 py-8 flex flex-col gap-5">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-1"
                  style={{ backgroundColor: "#E2FEA5" }}
                >
                  <Sparkles size={12} style={{ color: "#0F2C23" }} />
                </div>
              )}
              <div
                className="rounded-2xl px-5 py-4 max-w-[78%]"
                style={{
                  backgroundColor:
                    msg.role === "user" ? "rgba(226,254,165,0.12)" : "rgba(226,254,165,0.045)",
                  borderBottomRightRadius: msg.role === "user" ? 4 : 16,
                  borderBottomLeftRadius: msg.role === "assistant" ? 4 : 16,
                  border:
                    msg.role === "assistant"
                      ? "1px solid rgba(226,254,165,0.06)"
                      : "1px solid rgba(226,254,165,0.08)",
                }}
              >
                <p
                  className="text-sm leading-[1.85] whitespace-pre-wrap"
                  style={{
                    fontFamily: FN,
                    color: msg.role === "user" ? "#E2FEA5" : "rgba(226,254,165,0.65)",
                  }}
                >
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
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage(draft.trim());
        }}
      >
        {error && (
          <p
            className="mb-3 text-[12px]"
            style={{ fontFamily: FN, color: "rgba(226,254,165,0.6)" }}
          >
            {error}
          </p>
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
            style={{
              fontFamily: FN,
              backgroundColor: "rgba(226,254,165,0.035)",
              color: "#E2FEA5",
              border: "1px solid rgba(226,254,165,0.1)",
              lineHeight: 1.7,
            }}
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
