"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, ArrowUpRight, Code2, Github, Globe, Youtube,
  ExternalLink, Plus, Minus, Loader2, Send, X, Minimize2, Maximize2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import type { StoredProject } from "@/lib/data-mappers";
import {
  codeQuerySchema, chatInputSchema,
  type CodeQuerySchema, type ChatInputSchema,
} from "@/lib/validations/schemas";

/* ─── Types ─────────────────────────────────────────────────────── */
type ChatMessage = { role: "user" | "assistant"; content: string };
type ChatState   = "bubble" | "open" | "expanded";
type ChatTab     = "chat" | "code";

/* ─── Helpers ────────────────────────────────────────────────────── */
function kbSnap(p: StoredProject) {
  return {
    name: p.name, tagline: p.tagline,
    refined_description: p.refined_description,
    description: (p as { description?: string }).description,
    key_features: p.key_features, tech_stack_tags: p.tech_stack_tags,
    category: p.category, flattened_codebase: p.flattened_codebase,
  };
}

/* ══════════════════════════════════════════════════════════════════════
   MARKDOWN RENDERER — dark variant.
   Used in exactly two places:
     1. Assistant chat bubbles (Chat tab)
     2. Code answer block (Code tab)
   Nothing else in this file is changed.
══════════════════════════════════════════════════════════════════════ */
function CopyCodeBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); } catch {}
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      style={{
        fontFamily: "'Inter', sans-serif", fontSize: 8, letterSpacing: "0.12em",
        textTransform: "uppercase" as const, fontWeight: 700,
        color: "rgba(240,235,224,0.35)", background: "transparent",
        border: "none", cursor: "pointer", padding: "2px 0",
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function MarkdownDark({ md }: { md: string }) {
  const fg      = "rgba(240,235,224,0.82)";
  const fgBold  = "#f0ebe0";
  const fgFaint = "rgba(240,235,224,0.35)";
  const accent  = "#4caf7d";
  const codeBg  = "rgba(0,0,0,0.28)";
  const blockBg = "rgba(240,235,224,0.05)";
  const border  = "rgba(240,235,224,0.1)";

  function inline(text: string, key: string | number): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    const re = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(``?([^`]+?)``?)|(\[([^\]]+)\]\(([^)]+)\))/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m.index > cursor)
        parts.push(<span key={`t${cursor}`} style={{ color: fg, fontFamily: "Georgia, serif", fontSize: 13 }}>{text.slice(cursor, m.index)}</span>);
      if (m[1])
        parts.push(<strong key={`b${m.index}`} style={{ color: fgBold, fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 13 }}>{m[2]}</strong>);
      else if (m[3])
        parts.push(<em key={`i${m.index}`} style={{ color: fg, fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 13 }}>{m[4]}</em>);
      else if (m[5])
        parts.push(
          <code key={`c${m.index}`} style={{
            fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 11,
            color: accent, backgroundColor: codeBg,
            padding: "2px 6px", borderRadius: 5, letterSpacing: "-0.01em",
          }}>{m[6]}</code>
        );
      else if (m[7])
        parts.push(
          <a key={`l${m.index}`} href={m[9]} target="_blank" rel="noopener noreferrer"
            style={{ color: accent, fontFamily: "Georgia, serif", fontSize: 13, textDecoration: "underline", textUnderlineOffset: 3 }}>
            {m[8]}
          </a>
        );
      cursor = m.index + m[0].length;
    }
    if (cursor < text.length)
      parts.push(<span key={`t${cursor}`} style={{ color: fg, fontFamily: "Georgia, serif", fontSize: 13 }}>{text.slice(cursor)}</span>);
    return parts.length === 0
      ? <span key={key} style={{ color: fg, fontFamily: "Georgia, serif", fontSize: 13 }}>{text}</span>
      : <span key={key}>{parts}</span>;
  }

  const lines = md.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw     = lines[i];
    const trimmed = raw.trim();
    if (!trimmed) { i++; continue; }

    /* fenced code block */
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) { codeLines.push(lines[i]); i++; }
      i++;
      nodes.push(
        <div key={`code${i}`} style={{ marginBottom: 10 }}>
          {lang && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(0,0,0,0.4)", borderRadius: "8px 8px 0 0", padding: "4px 12px" }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase" as const, fontWeight: 700, color: fgFaint }}>{lang}</span>
              <CopyCodeBtn text={codeLines.join("\n")} />
            </div>
          )}
          <pre style={{
            fontFamily: "'SF Mono','Fira Code','Consolas',monospace", fontSize: 11.5,
            lineHeight: 1.7, color: "rgba(240,235,224,0.75)",
            backgroundColor: codeBg, padding: "12px 14px",
            borderRadius: lang ? "0 0 8px 8px" : 8,
            overflowX: "auto", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" as const,
            border: `1px solid ${border}`, borderTop: lang ? "none" : undefined,
          }}>
            {codeLines.join("\n")}
          </pre>
        </div>
      );
      continue;
    }

    /* blockquote */
    if (trimmed.startsWith("> ")) {
      const ql: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) { ql.push(lines[i].trim().slice(2)); i++; }
      nodes.push(
        <div key={`bq${i}`} style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 12, marginBottom: 8, opacity: 0.8 }}>
          {ql.map((l, qi) => <p key={qi} style={{ fontFamily: "Georgia, serif", fontSize: 13, color: fg, lineHeight: 1.7, margin: 0 }}>{inline(l, qi)}</p>)}
        </div>
      );
      continue;
    }

    /* hr */
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      nodes.push(<hr key={`hr${i}`} style={{ border: "none", borderTop: `1px solid ${border}`, margin: "8px 0" }} />);
      i++; continue;
    }

    /* headings */
    const hm = trimmed.match(/^(#{1,3})\s+(.+)/);
    if (hm) {
      const level = hm[1].length;
      const sizes = [17, 14, 13];
      nodes.push(
        <p key={`h${i}`} style={{
          fontFamily: "'Inter', sans-serif", fontWeight: 900,
          fontSize: sizes[level - 1] ?? 13, color: fgBold,
          letterSpacing: level === 1 ? "-0.02em" : "-0.01em",
          textTransform: level === 1 ? "uppercase" as const : "none" as const,
          marginBottom: 6, marginTop: i > 0 ? (level === 1 ? 12 : 8) : 0, lineHeight: 1.2,
        }}>{hm[2]}</p>
      );
      i++; continue;
    }

    /* unordered list */
    if (/^[-*+]\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i].trim())) { items.push(lines[i].trim().slice(2)); i++; }
      nodes.push(
        <ul key={`ul${i}`} style={{ margin: "0 0 8px 0", padding: 0, listStyle: "none" }}>
          {items.map((item, ii) => (
            <li key={ii} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
              <span style={{ color: accent, fontWeight: 900, fontSize: 11, marginTop: 3, flexShrink: 0, opacity: 0.7 }}>→</span>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 13, color: fg, lineHeight: 1.65 }}>{inline(item, ii)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    /* ordered list */
    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+\.\s/, "")); i++; }
      nodes.push(
        <ol key={`ol${i}`} style={{ margin: "0 0 8px 0", padding: 0, listStyle: "none" }}>
          {items.map((item, ii) => (
            <li key={ii} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 5 }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 10, color: fgBold, opacity: 0.28, width: 18, flexShrink: 0, marginTop: 2, letterSpacing: "-0.01em" }}>
                {String(ii + 1).padStart(2, "0")}
              </span>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 13, color: fg, lineHeight: 1.65 }}>{inline(item, ii)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    /* emoji callout */
    const em = trimmed.match(/^([\u{1F300}-\u{1FFFF}]|[⚠✅❌💡🔥🚀⭐🎯✦◆])\s(.+)/u);
    if (em) {
      nodes.push(
        <div key={`em${i}`} style={{ display: "flex", alignItems: "flex-start", gap: 10, backgroundColor: blockBg, borderRadius: 8, padding: "9px 12px", marginBottom: 7, border: `1px solid ${border}` }}>
          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{em[1]}</span>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 13, color: fg, lineHeight: 1.65 }}>{inline(em[2], i)}</span>
        </div>
      );
      i++; continue;
    }

    /* paragraph */
    nodes.push(
      <p key={`p${i}`} style={{ fontFamily: "Georgia, serif", fontSize: 13, color: fg, lineHeight: 1.75, marginBottom: 7 }}>
        {inline(trimmed, i)}
      </p>
    );
    i++;
  }

  return <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>{nodes}</div>;
}

/* ─── Arrow circle ───────────────────────────────────────────────── */
function ArrowCircle({ size = 44, inverted = false }: { size?: number; inverted?: boolean }) {
  return (
    <span
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center rounded-full shrink-0 transition-all duration-200 ${
        inverted ? "bg-[#d6cfc0] text-[#2d4a3e]" : "bg-[#2d4a3e] text-[#f0ebe0]"
      }`}
    >
      <ArrowUpRight size={Math.round(size * 0.4)} />
    </span>
  );
}

/* ─── Accordion item ──────────────────────────────────────────────── */
function AccordionItem({
  index, title, body,
}: { index: number; title: string; body: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b" style={{ borderColor: "rgba(45,74,62,0.1)" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 py-[18px] text-left bg-transparent border-none cursor-pointer group"
      >
        {/* Index watermark */}
        <span
          className="shrink-0 font-black leading-none transition-opacity duration-200"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: open ? "#2d4a3e" : "rgba(45,74,62,0.2)",
            letterSpacing: "-0.02em",
            width: 24,
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        <span
          className="flex-1 font-semibold text-[#2d4a3e] group-hover:opacity-70 transition-opacity"
          style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(13px, 1.3vw, 15px)" }}
        >
          {title}
        </span>

        <span className="shrink-0 transition-transform duration-200" style={{ color: "rgba(45,74,62,0.45)" }}>
          {open ? <Minus size={15} /> : <Plus size={15} />}
        </span>
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? 280 : 0, opacity: open ? 1 : 0 }}
      >
        <p
          className="pb-5 text-[#2d4a3e]/55 leading-relaxed"
          style={{ fontFamily: "Georgia, serif", fontSize: 14, paddingLeft: 40 }}
        >
          {body}
        </p>
      </div>
    </div>
  );
}

/* ─── Link square button ──────────────────────────────────────────── */
function LinkSquare({
  href, icon: Icon, label,
}: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group no-underline flex flex-col items-center justify-center rounded-2xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
      style={{ backgroundColor: "#2d4a3e", aspectRatio: "1/1" }}
    >
      <Icon size={26} style={{ color: "#d6cfc0" }} />
      <span
        className="mt-2 text-[8px] tracking-[0.14em] uppercase font-bold text-[#d6cfc0]/50 group-hover:text-[#d6cfc0]/80 transition-colors"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {label}
      </span>
    </Link>
  );
}

/* ─── Gallery centre column ───────────────────────────────────────── */
function GalleryColumn({ shots, name }: { shots: string[]; name: string }) {
  if (shots.length === 0) {
    return (
      <div
        className="w-full rounded-3xl flex flex-col items-center justify-center relative"
        style={{ flex: 1, backgroundColor: "#d6cfc0" }}
      >
        <div className="absolute top-4 right-4">
          <ArrowCircle size={48} />
        </div>
        <Code2 size={40} style={{ color: "#2d4a3e", opacity: 0.18 }} />
        <p
          className="mt-3 text-[10px] tracking-[0.18em] uppercase font-bold text-[#2d4a3e]/25"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          No screenshots
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Hero shot — tall 3:4 */}
      <div
        className="w-full rounded-3xl overflow-hidden relative shrink-0"
        style={{ aspectRatio: "3/4", backgroundColor: "#d6cfc0" }}
      >
        <Image src={shots[0]} alt={`${name} screenshot`} fill className="object-cover" />
        <div className="absolute top-4 right-4">
          <ArrowCircle size={48} />
        </div>
      </div>

      {/* Thumbnail row */}
      {shots.length > 1 && (
        <div className="grid grid-cols-2 gap-3">
          {shots.slice(1, 5).map((src, i) => (
            <a
              key={i}
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl overflow-hidden relative"
              style={{ aspectRatio: "16/9", backgroundColor: "#d6cfc0" }}
            >
              <Image src={src} alt={`${name} screenshot ${i + 2}`} fill className="object-cover" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── AI Chat Panel ───────────────────────────────────────────────── */
function AIChatPanel({
  project, state, onClose, onToggleExpand,
}: {
  project: StoredProject; state: ChatState;
  onClose: () => void; onToggleExpand: () => void;
}) {
  const [tab, setTab]           = useState<ChatTab>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const chatForm = useForm<ChatInputSchema>({ resolver: zodResolver(chatInputSchema) });
  const codeForm = useForm<CodeQuerySchema>({ resolver: zodResolver(codeQuerySchema) });

  const codeMutation = useMutation({
    mutationFn: async (data: CodeQuerySchema): Promise<{ answer: string }> => {
      const res = await fetch("/api/viewer-agents/code-query", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: project.project_id, question: data.question, project: kbSnap(project) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Query failed");
      return json;
    },
  });

  const handleSend = chatForm.handleSubmit(async (data) => {
    const msg = data.message; chatForm.reset();
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/viewer-agents/project-chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: project.project_id, message: msg, conversation_history: messages, project: kbSnap(project) }),
      });
      if (!res.ok || !res.body) throw new Error("Chat failed");
      const reader = res.body.getReader(); const dec = new TextDecoder();
      let buf = ""; let acc = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const chunk = line.slice(6); if (chunk === "[DONE]") continue;
          try { const p = JSON.parse(chunk); if (p.text) { acc += p.text; setMessages((m) => { const n = [...m]; n[n.length - 1] = { role: "assistant", content: acc }; return n; }); } } catch {}
        }
      }
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${e instanceof Error ? e.message : "failed"}` }]);
    } finally { setLoading(false); }
  });

  const isExp = state === "expanded";

  return (
    <div
      className="fixed bottom-6 right-6 z-300 flex flex-col overflow-hidden shadow-2xl"
      style={{
        width: isExp ? "min(640px, 92vw)" : "min(400px, 92vw)",
        height: isExp ? "min(680px, 86vh)" : "min(520px, 76vh)",
        backgroundColor: "#2d4a3e",
        borderRadius: 24,
        transition: "width 0.32s cubic-bezier(0.22,1,0.36,1), height 0.32s cubic-bezier(0.22,1,0.36,1)",
        boxShadow: "0 28px 72px rgba(45,74,62,0.38), 0 0 0 1px rgba(214,207,192,0.12)",
      }}
    >
      {/* Header */}
      <div
        className="shrink-0 flex w-full items-stretch text-[9px] tracking-[0.16em] uppercase font-bold text-[#f0ebe0]"
        style={{
          fontFamily: "'Inter', sans-serif",
          borderBottom: "1px solid rgba(240,235,224,0.1)",
        }}
      >
        {/* Left: Chat / Code tabs */}
        <div
          className="w-[150px] max-w-[45%] flex items-stretch"
          style={{ borderRight: "1px solid rgba(240,235,224,0.12)" }}
        >
          {(["chat", "code"] as ChatTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="flex-1 min-w-0 px-6 py-4 border-none cursor-pointer transition-all"
              style={{
                backgroundColor:
                  tab === t ? "#d6cfc0" : "rgba(240,235,224,0.06)",
                color: tab === t ? "#2d4a3e" : "rgba(240,235,224,0.55)",
              }}
            >
              {t === "chat" ? "Chat" : "Code"}
            </button>
          ))}
        </div>

        {/* Middle: project name */}
        <div
          className="flex-1 min-w-0 px-4 flex items-center justify-center"
          style={{ borderRight: "1px solid rgba(240,235,224,0.12)" }}
        >
          <span className="truncate">{project.name}</span>
        </div>

        {/* Right: window controls */}
        <div className="flex items-center justify-end gap-1.5 px-3">
          {/* Minimize / maximize */}
          <button
            type="button"
            onClick={onToggleExpand}
            className="w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors"
            style={{ color: "rgba(240,235,224,0.5)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#f0ebe0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(240,235,224,0.5)";
            }}
          >
            {(isExp ? <Minimize2 size={12} /> : <Maximize2 size={12} />)}
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors"
            style={{ color: "rgba(240,235,224,0.5)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#f0ebe0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(240,235,224,0.5)";
            }}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Chat */}
      {tab === "chat" && (
        <>
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="flex flex-col gap-2 pt-1">
                <p className="text-[12px] text-[#f0ebe0]/38 leading-relaxed mb-2" style={{ fontFamily: "Georgia, serif" }}>
                  Ask anything — I have full context of this project.
                </p>
                {["How does auth work?", "What's the tech stack?", "Walk me through the key features."].map((q) => (
                  <button
                    key={q} type="button" onClick={() => chatForm.setValue("message", q)}
                    className="text-left rounded-xl px-4 py-2.5 text-[12px] cursor-pointer border-none transition-all"
                    style={{ fontFamily: "Georgia, serif", backgroundColor: "rgba(240,235,224,0.06)", color: "rgba(240,235,224,0.45)", border: "1px solid rgba(240,235,224,0.1)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(240,235,224,0.12)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(240,235,224,0.82)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(240,235,224,0.06)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(240,235,224,0.45)"; }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "user" ? (
                  /* user bubble — unchanged */
                  <div
                    className="max-w-[85%] px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words"
                    style={{
                      fontFamily: "Georgia, serif",
                      borderRadius: "18px 18px 4px 18px",
                      backgroundColor: "#d6cfc0",
                      color: "#2d4a3e",
                    }}
                  >
                    {msg.content || <span style={{ opacity: 0.4 }}>▮</span>}
                  </div>
                ) : (
                  /* ★ CHANGE 1 OF 2 — assistant bubble now renders markdown */
                  <div
                    className="max-w-[88%] px-4 py-3"
                    style={{
                      borderRadius: "18px 18px 18px 4px",
                      backgroundColor: "rgba(240,235,224,0.08)",
                    }}
                  >
                    {msg.content
                      ? <MarkdownDark md={msg.content} />
                      : <span style={{ opacity: 0.4, color: "#f0ebe0" }}>▮</span>
                    }
                  </div>
                )}
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex">
                <div className="px-4 py-3 rounded-[18px] rounded-bl-[4px] flex gap-1.5 items-center" style={{ backgroundColor: "rgba(240,235,224,0.08)" }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "rgba(240,235,224,0.5)", animation: `dotBounce 1s ${i * 0.15}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSend} className="flex gap-2 px-4 py-3 shrink-0" style={{ borderTop: "1px solid rgba(240,235,224,0.08)" }}>
            <input
              type="text" {...chatForm.register("message")}
              placeholder="Ask about the project…" disabled={loading} autoComplete="off"
              className="flex-1 rounded-xl px-4 py-2.5 text-[13px] outline-none transition-all"
              style={{ fontFamily: "Georgia, serif", backgroundColor: "rgba(240,235,224,0.07)", border: "1px solid rgba(240,235,224,0.13)", color: "#f0ebe0" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(240,235,224,0.35)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(240,235,224,0.13)")}
            />
            <button
              type="submit" disabled={loading}
              className="w-10 h-10 rounded-xl flex items-center justify-center border-none cursor-pointer shrink-0 transition-colors"
              style={{ backgroundColor: loading ? "rgba(214,207,192,0.2)" : "#d6cfc0", color: "#2d4a3e" }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </form>
        </>
      )}

      {/* Code */}
      {tab === "code" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top: helper text */}
          <div className="px-5 py-4 shrink-0">
            <p
              className="text-[12px] text-[#f0ebe0]/38 leading-relaxed"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Ask a technical question about the codebase.
            </p>
          </div>

          {/* Middle: scrollable answer area */}
          <div className="flex-1 overflow-y-auto px-5 pb-3">
            {codeMutation.isPending && (
              <div className="flex items-center gap-2 py-2">
                <Loader2
                  size={12}
                  className="animate-spin"
                  style={{ color: "#d6cfc0" }}
                />
                <span
                  className="text-[12px] text-[#f0ebe0]/38"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Analysing codebase…
                </span>
              </div>
            )}
            {/* ★ CHANGE 2 OF 2 — code answer now renders markdown */}
            {codeMutation.data && (
              <div
                className="rounded-xl px-4 py-4"
                style={{
                  backgroundColor: "rgba(240,235,224,0.07)",
                  border: "1px solid rgba(240,235,224,0.1)",
                }}
              >
                <MarkdownDark md={codeMutation.data.answer} />
              </div>
            )}
            {codeMutation.isError && (
              <p
                className="text-[12px] pt-2"
                style={{ fontFamily: "Georgia, serif", color: "#ff8080" }}
              >
                {codeMutation.error.message}
              </p>
            )}
          </div>

          {/* Bottom: input form */}
          <form
            onSubmit={codeForm.handleSubmit((d) => codeMutation.mutate(d))}
            className="flex gap-2 px-5 py-3 shrink-0"
            style={{ borderTop: "1px solid rgba(240,235,224,0.08)" }}
          >
            <input
              type="text"
              {...codeForm.register("question")}
              placeholder="How is auth implemented?"
              disabled={codeMutation.isPending}
              className="flex-1 rounded-xl px-4 py-2.5 text-[13px] outline-none"
              style={{
                fontFamily: "Georgia, serif",
                backgroundColor: "rgba(240,235,224,0.07)",
                border: "1px solid rgba(240,235,224,0.13)",
                color: "#f0ebe0",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor =
                  "rgba(240,235,224,0.35)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor =
                  "rgba(240,235,224,0.13)")
              }
            />
            <button
              type="submit"
              disabled={codeMutation.isPending}
              className="px-4 rounded-xl border-none cursor-pointer text-[9px] tracking-widest uppercase font-bold flex items-center gap-1.5 shrink-0"
              style={{
                fontFamily: "'Inter', sans-serif",
                backgroundColor: "#d6cfc0",
                color: "#2d4a3e",
              }}
            >
              {codeMutation.isPending && (
                <Loader2 size={11} className="animate-spin" />
              )}
              Ask
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/* ─── AI Bubble ───────────────────────────────────────────────────── */
function AIBubble({ onClick, hasMessages }: { onClick: () => void; hasMessages: boolean }) {
  return (
    <>
      <button
        type="button" onClick={onClick}
        className="fixed bottom-6 right-6 z-300 w-14 h-14 rounded-full flex items-center justify-center border-none cursor-pointer transition-all duration-200 hover:scale-110"
        style={{ backgroundColor: "#2d4a3e", boxShadow: "0 8px 32px rgba(45,74,62,0.38)", border: "2px solid rgba(214,207,192,0.18)" }}
      >
        <Image src="/whiteLogo.png" alt="Loops" width={22} height={22} />
        {hasMessages && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#d6cfc0", border: "2px solid #2d4a3e" }} />
        )}
      </button>
    </>
  );
}

/* ─── Component ──────────────────────────────────────────────────── */
export function ViewerProjectDetail({
  project
}: {
  project: StoredProject | null;
  projectId: string;
}) {
  const [chatState, setChatState] = useState<ChatState>("bubble");
  const [chatMsgs]                = useState<ChatMessage[]>([]);

  if (!project) return (
    <div className="min-h-screen px-10 py-12" style={{ backgroundColor: "#f0ebe0" }}>
      <Link href="/viewer" className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold text-[#2d4a3e]/50 hover:text-[#2d4a3e] transition-colors no-underline" style={{ fontFamily: "'Inter', sans-serif" }}>
        <ArrowLeft size={12} /> Explore
      </Link>
      <p className="mt-10 text-[#2d4a3e]/50" style={{ fontFamily: "Georgia, serif" }}>Project not found.</p>
    </div>
  );

  const p       = project;
  const shots   = (p.screenshot_urls ?? []) as string[];
  const socials = (p.social_links    ?? []) as { label: string; url: string }[];
  const features = (p.key_features   ?? []) as string[];
  console.log(features)
  const tags    = (p.tech_stack_tags ?? []) as string[];
  const desc    = String(p.refined_description ?? (p as { description?: string }).description ?? "");

  const links = [
    { key: "github",  href: p.github_url,  icon: Github,  label: "GitHub"  },
    { key: "website", href: p.website_url, icon: Globe,   label: "Website" },
    { key: "demo",    href: p.youtube_url, icon: Youtube, label: "Demo"    },
  ].filter((l) => l.href);

  /* ─── Why Choose items: features → social → description chunks ─── */
  const whyItems: { title: string; body: string }[] = features.length > 0
    ? features.map((f) => {
        const idx = f.indexOf(":");
        const rawTitle = (idx >= 0 ? f.slice(0, idx) : f).trim();
        const title = rawTitle.length > 58 ? rawTitle.slice(0, 58) + "…" : rawTitle;
        const body = (idx >= 0 ? f.slice(idx + 1) : f).trim();
        return { title, body };
      })
    : desc
        .split(". ")
        .filter((s) => s.trim().length > 20)
        .slice(0, 6)
        .map((s) => ({
          title: (s.trim().length > 55 ? s.trim().slice(0, 55) + "…" : s.trim()),
          body: s.trim() + (s.trim().endsWith(".") ? "" : "."),
        }));

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>

      {/* ── Nav ───────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50" style={{ backgroundColor: "#f0ebe0" }}>
        <div
          className="flex w-full items-stretch border-t border-b border-[#1a1a1a] text-[10px] tracking-[0.18em] uppercase font-bold text-[#1a1a1a]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {/* Left: back to explore */}
          <Link
            href="/viewer"
            className="w-[240px] max-w-xs px-10 py-8 flex items-center justify-start border-r border-[#1a1a1a] no-underline hover:bg-[#e1dbcf]"
          >
            <span className="flex items-center gap-2">
              <ArrowLeft size={11} />
              <span>Explore</span>
            </span>
          </Link>

          {/* Right: project name */}
          <div className="flex-1 min-w-0 py-8 flex items-center justify-end px-10">
            <span>{p.name}</span>
          </div>
        </div>
      </div>

      {/* ── Three-column body ─────────────────────────────────────── */}
      <div
        className="grid items-start px-7 py-8 gap-5"
        style={{ gridTemplateColumns: "300px 1fr 360px", minHeight: "calc(100vh - 65px)" }}
      >

        {/* ══ LEFT — profile sidebar ══════════════════════════════ */}
        <aside className="sticky top-[81px] flex flex-col gap-5">

          {/* Logo square */}
          <div
            className="w-full rounded-3xl overflow-hidden flex items-center justify-center"
            style={{ aspectRatio: "1/1", backgroundColor: "#d6cfc0" }}
          >
            {p.logo_url ? (
              <Image src={p.logo_url} alt={p.name} width={300} height={300} className="w-full h-full object-cover" />
            ) : (
              <Code2 size={52} style={{ color: "#2d4a3e", opacity: 0.25 }} />
            )}
          </div>

          {/* Name */}
          <div>
            <h1
              className="font-black text-[#2d4a3e] leading-[0.9] uppercase mb-3"
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: "clamp(20px, 2.8vw, 30px)",
                letterSpacing: "-0.02em",
              }}
            >
              {p.name}
            </h1>
            <p
              className="text-[#2d4a3e]/55 leading-relaxed text-sm"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {p.tagline || desc.slice(0, 130) || "No tagline."}
            </p>
          </div>

          {/* Category + tech tags */}
          <div className="flex flex-wrap gap-2">
            {p.category && (
              <span
                className="text-[8px] tracking-[0.15em] uppercase font-bold px-3 py-1.5 rounded-sm"
                style={{ backgroundColor: "#2d4a3e", color: "#f0ebe0", fontFamily: "'Inter', sans-serif" }}
              >
                {p.category}
              </span>
            )}
            {tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="text-[9px] px-2.5 py-1 rounded-sm"
                style={{ backgroundColor: "rgba(45,74,62,0.08)", color: "#2d4a3e", fontFamily: "Georgia, serif" }}
              >
                {t}
              </span>
            ))}
          </div>

          {/* Link squares */}
          {links.length > 0 && (
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${Math.min(links.length, 3)}, 1fr)` }}
            >
              {links.map(({ key, href, icon: Icon, label }) => (
                <LinkSquare key={key} href={href!} icon={Icon} label={label} />
              ))}
            </div>
          )}

          {/* Social links — pill rows */}
          {socials.length > 0 && (
            <div className="flex flex-col gap-2">
              {socials.slice(0, 5).map((s, i) => (
                <Link
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between no-underline rounded-2xl px-4 py-3 transition-all duration-200 hover:scale-[1.01] group"
                  style={{ backgroundColor: "#d6cfc0" }}
                >
                  <span
                    className="text-[11px] font-semibold text-[#2d4a3e] truncate"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {s.label || s.url}
                  </span>
                  <ExternalLink size={12} style={{ color: "rgba(45,74,62,0.35)", flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          )}
        </aside>

        {/* ══ CENTRE — gallery ════════════════════════════════════ */}
        <div>
        <main className="flex flex-col gap-5 mb-4">
            {/* Description card */}
            <div
              className="rounded-3xl p-7"
              style={{ backgroundColor: "#f5f2ea" }}
            >
              {/* <SectionLabel>Description</SectionLabel> */}
              <p
                className="text-[#2d4a3e]/75 leading-relaxed whitespace-pre-wrap"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "clamp(14px, 1.4vw, 16px)",
                }}
              >
                {desc ? (
                  desc
                ) : (
                  <span className="font-semibold italic">
                    No description available yet.
                  </span>
                )}
              </p>
            </div>

            {/* Gallery */}
            {/* {screenshots.length > 0 && (
              <div className="mt-4 w-full">
                <div className="grid grid-cols-2 gap-3 w-full">
                  {screenshots.slice(0, 4).map((src, i) => (
                    <a
                      key={i}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative block overflow-hidden rounded-2xl"
                      style={{ aspectRatio: "4 / 3" }}
                    >
                      <Image
                        src={src}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )} */}

          </main>
          <GalleryColumn shots={shots} name={p.name} />
        </div>


        {/* ══ RIGHT — Why Choose + tech stack ═════════════════════ */}
        <aside className="sticky top-[81px] flex flex-col gap-4">

          {/* Why Choose card */}
          <div className="rounded-3xl p-7" style={{ backgroundColor: "#f5f2ea" }}>

            {/* Header */}
            <div className="mb-5">
              <p
                className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/35 mb-2"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Overview
              </p>
              <h2
                className="font-black text-[#2d4a3e] leading-[0.9] uppercase mb-3"
                style={{
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: "clamp(18px, 2.2vw, 26px)",
                  letterSpacing: "-0.02em",
                }}
              >
                Why Choose<br />{p.name}
              </h2>
            </div>

            {/* Accordion */}
            <div className="border-t" style={{ borderColor: "rgba(45,74,62,0.1)" }}>
              {whyItems.length > 0 ? (
                whyItems.map((item, i) => (
                  <AccordionItem key={i} index={i} title={item.title} body={item.body} />
                ))
              ) : (
                <div className="py-10 text-center">
                  <p className="text-[#2d4a3e]/35 text-sm" style={{ fontFamily: "Georgia, serif" }}>
                    No features listed yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* External links card — if more than 3 socials */}
          {socials.length > 3 && (
            <div className="rounded-2xl px-6 py-5" style={{ backgroundColor: "#d6cfc0" }}>
              <p
                className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#2d4a3e]/40 mb-4"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                More Links
              </p>
              <div className="flex flex-col gap-2">
                {socials.slice(3, 7).map((s, i) => (
                  <Link
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between no-underline rounded-xl px-3 py-2.5 transition-colors hover:bg-[#2d4a3e]/05"
                    style={{ backgroundColor: "rgba(45,74,62,0.06)" }}
                  >
                    <span className="text-[11px] font-semibold text-[#2d4a3e] truncate" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {s.label || s.url}
                    </span>
                    <ExternalLink size={11} style={{ color: "rgba(45,74,62,0.35)", flexShrink: 0 }} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── Ticker ───────────────────────────────────────────────── */}
      <div className="overflow-hidden border-t border-[#2d4a3e]/10 py-3" style={{ backgroundColor: "#e8e2d4" }}>
        <div className="flex gap-10 whitespace-nowrap" style={{ animation: "ticker 28s linear infinite" }}>
          {[...Array(3)].map((_, ri) =>
            [p.name.toUpperCase(), "★", "AI POWERED", "★", "OPEN SOURCE", "★"].map((t, i) => (
              <span
                key={`${ri}-${i}`}
                className="text-[10px] tracking-[0.2em] uppercase font-bold shrink-0"
                style={{ fontFamily: "'Inter', sans-serif", color: t === "★" ? "#2d4a3e" : "rgba(45,74,62,0.4)" }}
              >
                {t}
              </span>
            ))
          )}
        </div>
      </div>

      {/* ── AI Chat ───────────────────────────────────────────────── */}
      {chatState === "bubble" && (
        <AIBubble onClick={() => setChatState("open")} hasMessages={chatMsgs.length > 0} />
      )}
      {(chatState === "open" || chatState === "expanded") && (
        <AIChatPanel
          project={p}
          state={chatState}
          onClose={() => setChatState("bubble")}
          onToggleExpand={() => setChatState((s) => s === "expanded" ? "open" : "expanded")}
        />
      )}

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes slideInLabel {
          from { opacity: 0; transform: translateX(8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}