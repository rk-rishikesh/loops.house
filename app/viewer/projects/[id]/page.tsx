"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Code2, MessageSquare, Send, Loader2 } from "lucide-react";
import type { StoredProject } from "@/lib/storage";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useProject } from "@/lib/queries";
import { codeQuerySchema, chatInputSchema, type CodeQuerySchema, type ChatInputSchema } from "@/lib/validations/schemas";

type ChatMessage = { role: "user" | "assistant"; content: string };

function projectKbSnapshot(p: StoredProject) {
  return {
    name: p.name,
    tagline: p.tagline,
    refined_description: p.refined_description,
    description: (p as { description?: string }).description,
    key_features: p.key_features,
    tech_stack_tags: p.tech_stack_tags,
    category: p.category,
    flattened_codebase: p.flattened_codebase,
  };
}

export default function ViewerProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { data: project, isLoading, isError } = useProject(projectId);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const codeQueryForm = useForm<CodeQuerySchema>({
    resolver: zodResolver(codeQuerySchema),
  });

  const chatForm = useForm<ChatInputSchema>({
    resolver: zodResolver(chatInputSchema),
  });

  const codeQueryMutation = useMutation({
    mutationFn: async (data: CodeQuerySchema): Promise<{ answer: string }> => {
      const body: { project_id: string; question: string; project?: ReturnType<typeof projectKbSnapshot> } = {
        project_id: projectId,
        question: data.question,
      };
      if (project) body.project = projectKbSnapshot(project);
      const res = await fetch("/api/viewer-agents/code-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Query failed");
      return json as { answer: string };
    },
  });

  const handleChatSend = chatForm.handleSubmit(async (data) => {
    const userMsg = data.message;
    chatForm.reset();
    setChatMessages((m) => [...m, { role: "user", content: userMsg }]);
    setChatLoading(true);
    try {
      const chatBody: {
        project_id: string;
        message: string;
        conversation_history: ChatMessage[];
        project?: ReturnType<typeof projectKbSnapshot>;
      } = {
        project_id: projectId,
        message: userMsg,
        conversation_history: chatMessages,
      };
      if (project) chatBody.project = projectKbSnapshot(project);
      const res = await fetch("/api/viewer-agents/project-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chatBody),
      });
      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Chat failed");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";
      setChatMessages((m) => [...m, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const chunk = line.slice(6);
            if (chunk === "[DONE]") continue;
            try {
              const parsed = JSON.parse(chunk);
              if (parsed.text) {
                assistantContent += parsed.text;
                setChatMessages((m) => {
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
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (e) {
      setChatMessages((m) => [
        ...m,
        { role: "assistant", content: `Error: ${e instanceof Error ? e.message : "Request failed"}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  });

  if (isLoading) {
    return (
      <div>
        <Link href="/viewer" className="text-emerald-600 hover:underline">← Back to store</Link>
        <p className="mt-4 text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (isError || project === null) {
    return (
      <div>
        <Link href="/viewer" className="text-emerald-600 hover:underline">← Back to store</Link>
        <p className="mt-4 text-zinc-500">Project not found. It may only exist on another device.</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div>
        <Link href="/viewer" className="text-emerald-600 hover:underline">← Back to store</Link>
        <p className="mt-4 text-zinc-500">Loading…</p>
      </div>
    );
  }

  const p = project as StoredProject;
  const screenshots = (p.screenshot_urls ?? []) as string[];
  const socialLinks = (p.social_links ?? []) as { label: string; url: string }[];
  const additionalLinks = (p.additional_links ?? []) as { label: string; url: string }[];

  return (
    <div className="max-w-6xl mx-auto pb-12 px-4 sm:px-6">
      <Link
        href="/viewer"
        className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to store
      </Link>

      {/* Viewer bento profile grid (read‑only) */}
      <section className="rounded-3xl bg-[#EBECE7] p-2 sm:p-3 mb-8">
        <div className="rounded-3xl bg-[#20332b] text-[#ECEEE5] p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-4 auto-rows-[120px]">
            {/* Logo */}
            <div className="col-span-2 sm:col-span-1 row-span-2 rounded-2xl bg-[#1a2922] flex items-center justify-center">
              {p.logo_url ? (
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-[#ECEEE5]/30 bg-[#141d19]">
                  <Image src={p.logo_url} alt={`${p.name} logo`} fill className="object-contain" />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#141d19] flex items-center justify-center">
                  <Code2 className="w-8 h-8 text-[#ECEEE5]/80" />
                </div>
              )}
            </div>

            {/* Project name */}
            <div className="col-span-2 sm:col-span-2 row-span-1 rounded-2xl bg-[#1a2922] px-4 py-3 flex items-center">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#ECEEE5]/60">
                  Project name
                </p>
                <p className="mt-2 text-xl sm:text-2xl font-semibold tracking-tight">
                  {p.name}
                </p>
              </div>
            </div>

            {/* Tagline */}
            <div className="col-span-2 sm:col-span-1 row-span-1 rounded-2xl bg-[#1a2922] px-4 py-3 flex items-center">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#ECEEE5]/60">
                  Tagline
                </p>
                <p className="mt-2 text-sm leading-snug text-[#ECEEE5]/90">
                  {p.tagline
                    ? p.tagline
                    : String(p.refined_description ?? (p as any).description ?? "")
                        .trim()
                        .slice(0, 120) || "No tagline yet"}
                </p>
              </div>
            </div>

            {/* Category & Team (ID only) */}
            <div className="col-span-2 sm:col-span-1 row-span-1 rounded-2xl bg-[#1a2922] px-4 py-3 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#ECEEE5]/60">
                  Category
                </p>
                <p className="mt-2 text-sm font-medium text-[#ECEEE5]/90">
                  {p.category ? String(p.category) : "Uncategorized"}
                </p>
              </div>
              <div className="mt-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#ECEEE5]/60">
                  Team
                </p>
                <p className="mt-1 text-xs text-[#ECEEE5]/80">
                  {p.team_id ? `Team ID: ${p.team_id}` : "No team linked"}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="col-span-4 sm:col-span-2 row-span-2 rounded-2xl bg-[#1a2922] px-4 py-4 flex flex-col">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#ECEEE5]/60">
                AI generated description
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#ECEEE5]/90 whitespace-pre-wrap line-clamp-[10]">
                {String(p.refined_description ?? (p as any).description ?? "") ||
                  "No description available yet for this project."}
              </p>
            </div>

            {/* Image gallery (optional) */}
            <div className="col-span-4 sm:col-span-2 row-span-2 rounded-2xl bg-[#1a2922] px-4 py-4 flex flex-col">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#ECEEE5]/60">
                Gallery
              </p>
              {screenshots.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
                  {screenshots.slice(0, 4).map((src, i) => (
                    <a
                      key={i}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-video rounded-xl overflow-hidden border border-[#ECEEE5]/20 bg-[#141d19]"
                    >
                      <Image src={src} alt="" fill className="object-cover" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-[#ECEEE5]/70">No screenshots added yet.</p>
              )}
            </div>

            {/* Tech stack */}
            <div className="col-span-4 sm:col-span-2 row-span-1 rounded-2xl bg-[#1a2922] px-4 py-3 flex flex-col">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#ECEEE5]/60">
                Tech stack
              </p>
              {(p.tech_stack_tags?.length ?? 0) > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(p.tech_stack_tags ?? []).map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-full bg-[#ECEEE5]/10 text-[11px] font-medium text-[#ECEEE5]"
                    >
                      {String(t)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-[#ECEEE5]/70">No tech stack tagged yet.</p>
              )}
            </div>

            {/* Links cluster */}
            <div className="col-span-4 sm:col-span-2 row-span-2 rounded-2xl bg-[#1a2922] px-4 py-4 flex flex-col">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#ECEEE5]/60">
                Links
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* GitHub */}
                <div className="rounded-xl bg-[#141d19] px-3 py-2 flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-[#ECEEE5]/60">
                    GitHub
                  </span>
                  {p.github_url ? (
                    <Link
                      href={p.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-[#ECEEE5]/90 underline underline-offset-2 break-all"
                    >
                      {p.github_url}
                    </Link>
                  ) : (
                    <span className="mt-1 text-[#ECEEE5]/60">Not provided</span>
                  )}
                </div>

                {/* Website */}
                <div className="rounded-xl bg-[#141d19] px-3 py-2 flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-[#ECEEE5]/60">
                    Website
                  </span>
                  {p.website_url ? (
                    <Link
                      href={p.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-[#ECEEE5]/90 underline underline-offset-2 break-all"
                    >
                      {p.website_url}
                    </Link>
                  ) : (
                    <span className="mt-1 text-[#ECEEE5]/60">Not provided</span>
                  )}
                </div>

                {/* YouTube */}
                <div className="rounded-xl bg-[#141d19] px-3 py-2 flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-[#ECEEE5]/60">
                    YouTube demo
                  </span>
                  {p.youtube_url ? (
                    <Link
                      href={p.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-[#ECEEE5]/90 underline underline-offset-2 break-all"
                    >
                      {p.youtube_url}
                    </Link>
                  ) : (
                    <span className="mt-1 text-[#ECEEE5]/60">Not provided</span>
                  )}
                </div>

                {/* Social */}
                <div className="rounded-xl bg-[#141d19] px-3 py-2 flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-[#ECEEE5]/60">
                    Social
                  </span>
                  {socialLinks.length > 0 ? (
                    <div className="mt-1 space-y-1">
                      {socialLinks.slice(0, 3).map((s, idx) => (
                        <Link
                          key={idx}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[#ECEEE5]/90 underline underline-offset-2 truncate"
                        >
                          {s.label || s.url}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <span className="mt-1 text-[#ECEEE5]/60">No social links</span>
                  )}
                </div>

                {/* Additional links */}
                <div className="rounded-xl bg-[#141d19] px-3 py-2 flex flex-col justify-between sm:col-span-2">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-[#ECEEE5]/60">
                    Additional links
                  </span>
                  {additionalLinks.length > 0 ? (
                    <div className="mt-1 space-y-1">
                      {additionalLinks.slice(0, 4).map((a, idx) => (
                        <Link
                          key={idx}
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[#ECEEE5]/90 underline underline-offset-2 truncate"
                        >
                          {a.label || a.url}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <span className="mt-1 text-[#ECEEE5]/60">None yet</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Code query section */}
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <Code2 className="w-5 h-5" />
            <span className="font-medium">Ask about the code</span>
          </div>
          <div className="p-4">
            <form onSubmit={codeQueryForm.handleSubmit((data) => codeQueryMutation.mutate(data))} className="flex gap-2">
              <input
                type="text"
                {...codeQueryForm.register("question")}
                placeholder="e.g. How is auth implemented?"
                className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white text-sm"
                disabled={codeQueryMutation.isPending}
              />
              <button
                type="submit"
                disabled={codeQueryMutation.isPending}
                className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
              >
                {codeQueryMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Ask
              </button>
            </form>
            {codeQueryMutation.isError && (
              <div className="mt-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-sm text-red-600 dark:text-red-400">
                {codeQueryMutation.error.message}
              </div>
            )}
            {codeQueryMutation.data && (
              <div className="mt-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {codeQueryMutation.data.answer}
              </div>
            )}
          </div>
        </section>

        {/* Chat section */}
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden flex flex-col max-h-[500px]">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Chat with project</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
            {chatMessages.length === 0 && (
              <p className="text-sm text-zinc-500">Ask anything about this project. Answers are based on its profile and code.</p>
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg px-3 py-2 bg-zinc-100 dark:bg-zinc-800 flex items-center gap-2 text-sm text-zinc-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> …
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
          <form onSubmit={handleChatSend} className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
            <input
              type="text"
              {...chatForm.register("message")}
              placeholder="Message…"
              className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-white text-sm"
              disabled={chatLoading}
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="rounded-lg bg-emerald-600 text-white p-2 hover:bg-emerald-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
