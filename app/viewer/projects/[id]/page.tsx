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

  return (
    <div>
      <Link
        href="/viewer"
        className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to store
      </Link>

      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {project.logo_url ? (
          <Image src={project.logo_url} alt="" width={64} height={64} className="w-16 h-16 rounded-xl object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Code2 className="w-8 h-8 text-emerald-600" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{project.name}</h1>
          {project.tagline && (
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">{project.tagline}</p>
          )}
          {project.category && (
            <span className="mt-2 inline-block text-sm px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {project.category}
            </span>
          )}
        </div>
      </div>

      {project.refined_description && (
        <div className="mb-8 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">About</h2>
          <p className="mt-2 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{project.refined_description}</p>
        </div>
      )}

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
