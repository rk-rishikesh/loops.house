"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Loader2, MessageSquare, Calendar } from "lucide-react";
import { getBoosters, getBooster } from "@/lib/storage";

type Message = { role: "user" | "assistant"; content: string };

export default function IdeatePage() {
  const searchParams = useSearchParams();
  const boosterIdFromUrl = searchParams.get("booster_id");
  const [selectedBoosterId, setSelectedBoosterId] = useState<string | null>(boosterIdFromUrl);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const boosters = getBoosters();
  const selectedBooster = selectedBoosterId ? getBooster(selectedBoosterId) : null;

  useEffect(() => {
    if (boosterIdFromUrl && getBooster(boosterIdFromUrl)) {
      setSelectedBoosterId(boosterIdFromUrl);
    }
  }, [boosterIdFromUrl]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !selectedBooster) return;
    const userMessage = input.trim();
    setInput("");
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
            problem_statements: selectedBooster.problem_statements,
            sponsor_tracks: selectedBooster.sponsor_tracks,
            theme: selectedBooster.theme,
          },
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                assistantContent += parsed.text;
                setMessages((m) => {
                  const next = [...m];
                  next[next.length - 1] = { role: "assistant", content: assistantContent };
                  return next;
                });
              }
            } catch {
              // ignore
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Request failed"}. Please try again.` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link
        href="/builder"
        className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Ideation chat</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Refine your project idea with the mentor. No code — direction and ideas only.
      </p>

      <div className="mt-6 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Calendar className="w-4 h-4" />
          Which booster are you ideating for?
        </label>
        {boosters.length === 0 ? (
          <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
            No boosters in local storage. Add one from the{" "}
            <Link href="/host/boosters" className="underline hover:no-underline">Host dashboard</Link> to get problem statements and theme context, then return here.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select
              value={selectedBoosterId ?? ""}
              onChange={(e) => {
                const id = e.target.value || null;
                setSelectedBoosterId(id);
                if (id) setMessages([]);
              }}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white text-sm min-w-[200px]"
            >
              <option value="">Select a booster…</option>
              {boosters.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {selectedBooster && (
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Mentor will use this event’s problem statements, theme, and sponsor tracks.
              </span>
            )}
          </div>
        )}
      </div>

      {boosters.length > 0 && (
        <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden flex flex-col max-h-[calc(100vh-20rem)]">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm">Project mentor</span>
              {selectedBooster && (
                <span className="text-xs px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                  {selectedBooster.name}
                </span>
              )}
            </span>
          </div>
          {!selectedBoosterId ? (
            <div className="flex-1 p-8 text-center text-sm text-zinc-500 dark:text-zinc-400 min-h-[200px] flex items-center justify-center">
              Select a booster above to start the ideation chat. The mentor will refer only to that booster’s description and resources.
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
                {messages.length === 0 && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Describe your idea or ask how to make it fit <strong>{selectedBooster?.name}</strong>. Be specific about the problem you want to solve.
                  </p>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-violet-600 text-white"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="rounded-lg px-4 py-2 bg-zinc-100 dark:bg-zinc-800 flex items-center gap-2 text-sm text-zinc-500">
                      <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Your message…"
                  className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white text-sm"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="rounded-lg bg-violet-600 text-white p-2 hover:bg-violet-700 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
