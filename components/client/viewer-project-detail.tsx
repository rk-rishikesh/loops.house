"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowUpRight,
  Code2,
  ExternalLink,
  Github,
  Globe,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  Send,
  X,
  Youtube,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { StoredProject, StoredSubmission } from "@/lib/data-mappers";
import { type ChatInputSchema, chatInputSchema } from "@/lib/validations/schemas";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

/* ─── Types ─────────────────────────────────────────────────────── */
type ChatMessage = { role: "user" | "assistant"; content: string };
type ChatState = "bubble" | "open" | "expanded";

/* ─── Helpers ────────────────────────────────────────────────────── */
function kbSnap(p: StoredProject) {
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
        try {
          await navigator.clipboard.writeText(text);
        } catch {}
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      style={{
        fontFamily: PX,
        fontSize: 8,
        letterSpacing: "0.12em",
        textTransform: "uppercase" as const,
        fontWeight: 700,
        color: "rgba(226,254,165,0.35)",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "2px 0",
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function MarkdownDark({ md }: { md: string }) {
  const fg = "rgba(226,254,165,0.82)";
  const fgBold = "#F8FFE8";
  const fgFaint = "rgba(226,254,165,0.35)";
  const accent = "#E2FEA5";
  const codeBg = "rgba(0,0,0,0.28)";
  const blockBg = "rgba(226,254,165,0.05)";
  const border = "rgba(226,254,165,0.1)";

  function inline(text: string, key: string | number): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    const re = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(``?([^`]+?)``?)|(\[([^\]]+)\]\(([^)]+)\))/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m.index > cursor)
        parts.push(
          <span key={`t${cursor}`} style={{ color: fg, fontFamily: FN, fontSize: 13 }}>
            {text.slice(cursor, m.index)}
          </span>,
        );
      if (m[1])
        parts.push(
          <strong
            key={`b${m.index}`}
            style={{ color: fgBold, fontFamily: PX, fontWeight: 800, fontSize: 13 }}
          >
            {m[2]}
          </strong>,
        );
      else if (m[3])
        parts.push(
          <em
            key={`i${m.index}`}
            style={{ color: fg, fontFamily: FN, fontStyle: "italic", fontSize: 13 }}
          >
            {m[4]}
          </em>,
        );
      else if (m[5])
        parts.push(
          <code
            key={`c${m.index}`}
            style={{
              fontFamily: "'SF Mono','Fira Code',monospace",
              fontSize: 11,
              color: accent,
              backgroundColor: codeBg,
              padding: "2px 6px",
              borderRadius: 5,
              letterSpacing: "-0.01em",
            }}
          >
            {m[6]}
          </code>,
        );
      else if (m[7])
        parts.push(
          <a
            key={`l${m.index}`}
            href={m[9]}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: accent,
              fontFamily: FN,
              fontSize: 13,
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            {m[8]}
          </a>,
        );
      cursor = m.index + m[0].length;
    }
    if (cursor < text.length)
      parts.push(
        <span key={`t${cursor}`} style={{ color: fg, fontFamily: FN, fontSize: 13 }}>
          {text.slice(cursor)}
        </span>,
      );
    return parts.length === 0 ? (
      <span key={key} style={{ color: fg, fontFamily: FN, fontSize: 13 }}>
        {text}
      </span>
    ) : (
      <span key={key}>{parts}</span>
    );
  }

  const lines = md.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed) {
      i++;
      continue;
    }

    /* fenced code block */
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      nodes.push(
        <div key={`code${i}`} style={{ marginBottom: 10 }}>
          {lang && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "rgba(0,0,0,0.4)",
                borderRadius: "8px 8px 0 0",
                padding: "4px 12px",
              }}
            >
              <span
                style={{
                  fontFamily: PX,
                  fontSize: 8,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase" as const,
                  fontWeight: 700,
                  color: fgFaint,
                }}
              >
                {lang}
              </span>
              <CopyCodeBtn text={codeLines.join("\n")} />
            </div>
          )}
          <pre
            style={{
              fontFamily: "'SF Mono','Fira Code','Consolas',monospace",
              fontSize: 11.5,
              lineHeight: 1.7,
              color: "rgba(226,254,165,0.75)",
              backgroundColor: codeBg,
              padding: "12px 14px",
              borderRadius: lang ? "0 0 8px 8px" : 8,
              overflowX: "auto",
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word" as const,
              border: `1px solid ${border}`,
              borderTop: lang ? "none" : undefined,
            }}
          >
            {codeLines.join("\n")}
          </pre>
        </div>,
      );
      continue;
    }

    /* blockquote */
    if (trimmed.startsWith("> ")) {
      const ql: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        ql.push(lines[i].trim().slice(2));
        i++;
      }
      nodes.push(
        <div
          key={`bq${i}`}
          style={{
            borderLeft: `3px solid ${accent}`,
            paddingLeft: 12,
            marginBottom: 8,
            opacity: 0.8,
          }}
        >
          {ql.map((l, qi) => (
            <p
              key={qi}
              style={{ fontFamily: FN, fontSize: 13, color: fg, lineHeight: 1.7, margin: 0 }}
            >
              {inline(l, qi)}
            </p>
          ))}
        </div>,
      );
      continue;
    }

    /* hr */
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      nodes.push(
        <hr
          key={`hr${i}`}
          style={{ border: "none", borderTop: `1px solid ${border}`, margin: "8px 0" }}
        />,
      );
      i++;
      continue;
    }

    /* headings */
    const hm = trimmed.match(/^(#{1,3})\s+(.+)/);
    if (hm) {
      const level = hm[1].length;
      const sizes = [17, 14, 13];
      nodes.push(
        <p
          key={`h${i}`}
          style={{
            fontFamily: PX,
            fontWeight: 900,
            fontSize: sizes[level - 1] ?? 13,
            color: fgBold,
            letterSpacing: level === 1 ? "-0.02em" : "-0.01em",
            textTransform: level === 1 ? ("uppercase" as const) : ("none" as const),
            marginBottom: 6,
            marginTop: i > 0 ? (level === 1 ? 12 : 8) : 0,
            lineHeight: 1.2,
          }}
        >
          {hm[2]}
        </p>,
      );
      i++;
      continue;
    }

    /* unordered list */
    if (/^[-*+]\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      nodes.push(
        <ul key={`ul${i}`} style={{ margin: "0 0 8px 0", padding: 0, listStyle: "none" }}>
          {items.map((item, ii) => (
            <li
              key={ii}
              style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}
            >
              <span
                style={{
                  color: accent,
                  fontWeight: 900,
                  fontSize: 11,
                  marginTop: 3,
                  flexShrink: 0,
                  opacity: 0.7,
                }}
              >
                →
              </span>
              <span style={{ fontFamily: FN, fontSize: 13, color: fg, lineHeight: 1.65 }}>
                {inline(item, ii)}
              </span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    /* ordered list */
    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ""));
        i++;
      }
      nodes.push(
        <ol key={`ol${i}`} style={{ margin: "0 0 8px 0", padding: 0, listStyle: "none" }}>
          {items.map((item, ii) => (
            <li
              key={ii}
              style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 5 }}
            >
              <span
                style={{
                  fontFamily: PX,
                  fontWeight: 900,
                  fontSize: 10,
                  color: fgBold,
                  opacity: 0.28,
                  width: 18,
                  flexShrink: 0,
                  marginTop: 2,
                  letterSpacing: "-0.01em",
                }}
              >
                {String(ii + 1).padStart(2, "0")}
              </span>
              <span style={{ fontFamily: FN, fontSize: 13, color: fg, lineHeight: 1.65 }}>
                {inline(item, ii)}
              </span>
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    /* emoji callout */
    const em = trimmed.match(/^([\u{1F300}-\u{1FFFF}]|[⚠✅❌💡🔥🚀⭐🎯✦◆])\s(.+)/u);
    if (em) {
      nodes.push(
        <div
          key={`em${i}`}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            backgroundColor: blockBg,
            borderRadius: 8,
            padding: "9px 12px",
            marginBottom: 7,
            border: `1px solid ${border}`,
          }}
        >
          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{em[1]}</span>
          <span style={{ fontFamily: FN, fontSize: 13, color: fg, lineHeight: 1.65 }}>
            {inline(em[2], i)}
          </span>
        </div>,
      );
      i++;
      continue;
    }

    /* paragraph */
    nodes.push(
      <p
        key={`p${i}`}
        style={{ fontFamily: FN, fontSize: 13, color: fg, lineHeight: 1.75, marginBottom: 7 }}
      >
        {inline(trimmed, i)}
      </p>,
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
        inverted ? "bg-[rgba(15,44,35,0.06)] text-[#0F2C23]" : "bg-[#0F2C23] text-[#F8FFE8]"
      }`}
    >
      <ArrowUpRight size={Math.round(size * 0.4)} />
    </span>
  );
}

/* ─── Accordion item ──────────────────────────────────────────────── */
function AccordionItem({
  index,
  title,
  body,
  isOpen,
  onToggle,
}: {
  index: number;
  title: string;
  body: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b" style={{ borderColor: "rgba(15,44,35,0.1)" }}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 py-[18px] text-left bg-transparent border-none cursor-pointer group"
      >
        {/* Index watermark */}
        <span
          className="shrink-0 font-black leading-none transition-opacity duration-200"
          style={{
            fontFamily: PX,
            fontSize: 13,
            color: isOpen ? "#0F2C23" : "rgba(15,44,35,0.2)",
            letterSpacing: "-0.02em",
            width: 24,
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        <span
          className="flex-1 font-semibold text-[#0F2C23] group-hover:opacity-70 transition-opacity"
          style={{ fontFamily: PX, fontSize: "clamp(13px, 1.3vw, 15px)" }}
        >
          {title}
        </span>

        <span
          className="shrink-0 transition-transform duration-200"
          style={{ color: "rgba(15,44,35,0.45)" }}
        >
          {isOpen ? <Minus size={15} /> : <Plus size={15} />}
        </span>
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? 280 : 0, opacity: isOpen ? 1 : 0 }}
      >
        <p
          className="pb-5 text-[#0F2C23]/55 leading-relaxed"
          style={{ fontFamily: FN, fontSize: 14, paddingLeft: 40 }}
        >
          {body}
        </p>
      </div>
    </div>
  );
}

/* ─── Link square button ──────────────────────────────────────────── */
function LinkSquare({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group no-underline flex flex-col items-center justify-center rounded-2xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
      style={{ backgroundColor: "#0F2C23", aspectRatio: "1/1" }}
    >
      <Icon size={26} style={{ color: "rgba(226,254,165,0.6)" }} />
      <span
        className="mt-2 text-[8px] tracking-[0.14em] uppercase font-bold text-[rgba(226,254,165,0.4)] group-hover:text-[rgba(226,254,165,0.7)] transition-colors"
        style={{ fontFamily: PX }}
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
        style={{ flex: 1, backgroundColor: "rgba(15,44,35,0.06)" }}
      >
        <div className="absolute top-4 right-4">
          <ArrowCircle size={48} />
        </div>
        <Code2 size={40} style={{ color: "#0F2C23", opacity: 0.18 }} />
        <p
          className="mt-3 text-[10px] tracking-[0.18em] uppercase font-bold text-[#0F2C23]/25"
          style={{ fontFamily: PX }}
        >
          No screenshots
        </p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="grid grid-cols-2 gap-3">
        {shots.slice(0, 6).map((src, i) => (
          <a
            key={i}
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl overflow-hidden relative"
            style={{ aspectRatio: "4/3", backgroundColor: "rgba(15,44,35,0.06)" }}
          >
            <Image
              src={src}
              alt={`${name} screenshot ${i + 1}`}
              fill
              className="object-cover"
            />
          </a>
        ))}
      </div>
    </div>
  );
}

/* ─── AI Chat Panel ───────────────────────────────────────────────── */
function AIChatPanel({
  project,
  state,
  onClose,
  onToggleExpand,
}: {
  project: StoredProject;
  state: ChatState;
  onClose: () => void;
  onToggleExpand: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatForm = useForm<ChatInputSchema>({ resolver: zodResolver(chatInputSchema) });

  const handleSend = chatForm.handleSubmit(async (data) => {
    const msg = data.message;
    chatForm.reset();
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/viewer-agents/project-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: project.project_id,
          message: msg,
          conversation_history: messages,
          project: kbSnap(project),
        }),
      });
      if (!res.ok || !res.body) throw new Error("Chat failed");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let acc = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const chunk = line.slice(6);
          if (chunk === "[DONE]") continue;
          try {
            const p = JSON.parse(chunk);
            if (p.text) {
              acc += p.text;
              setMessages((m) => {
                const n = [...m];
                n[n.length - 1] = { role: "assistant", content: acc };
                return n;
              });
            }
          } catch {}
        }
      }
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Error: ${e instanceof Error ? e.message : "failed"}` },
      ]);
    } finally {
      setLoading(false);
    }
  });

  const isExp = state === "expanded";

  return (
    <div
      className="fixed bottom-6 right-6 z-300 flex flex-col overflow-hidden shadow-2xl"
      style={{
        width: isExp ? "min(640px, 92vw)" : "min(400px, 92vw)",
        height: isExp ? "min(680px, 86vh)" : "min(520px, 76vh)",
        backgroundColor: "#0F2C23",
        borderRadius: 24,
        transition:
          "width 0.32s cubic-bezier(0.22,1,0.36,1), height 0.32s cubic-bezier(0.22,1,0.36,1)",
        boxShadow: "0 28px 72px rgba(15,44,35,0.38), 0 0 0 1px rgba(226,254,165,0.12)",
      }}
    >
      {/* Header – single Project Chat */}
      <div
        className="shrink-0 flex w-full items-center justify-between px-4 py-2.5"
        style={{
          fontFamily: PX,
          borderBottom: "1px solid rgba(226,254,165,0.12)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "rgba(226,254,165,0.14)",
              boxShadow: "0 0 0 1px rgba(226,254,165,0.22)",
            }}
          >
            <span
              className="text-[9px] font-black tracking-[0.22em] uppercase"
              style={{ fontFamily: PX, color: "#0F2C23" }}
            >
              AI
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span
              className="text-[9px] tracking-[0.2em] uppercase font-bold"
              style={{ color: "rgba(226,254,165,0.78)" }}
            >
              Project Chat
            </span>
            <span
              className="truncate text-[11px] mt-0.5"
              style={{
                fontFamily: FN,
                color: "rgba(226,254,165,0.92)",
              }}
            >
              {project.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleExpand}
            className="w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors"
            style={{ color: "rgba(226,254,165,0.6)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#F8FFE8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(226,254,165,0.6)";
            }}
          >
            {isExp ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors"
            style={{ color: "rgba(226,254,165,0.6)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#F8FFE8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(226,254,165,0.6)";
            }}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Single Project Chat */}
      <>
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="flex flex-col gap-2 pt-1">
                <p
                  className="text-[12px] text-[#F8FFE8]/38 leading-relaxed mb-2"
                  style={{ fontFamily: FN }}
                >
                  Ask anything — I have full context of this project.
                </p>
                {[
                  "How does auth work?",
                  "What's the tech stack?",
                  "Walk me through the key features.",
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => chatForm.setValue("message", q)}
                    className="text-left rounded-xl px-4 py-2.5 text-[12px] cursor-pointer border-none transition-all"
                    style={{
                      fontFamily: FN,
                      backgroundColor: "rgba(226,254,165,0.06)",
                      color: "rgba(226,254,165,0.45)",
                      border: "1px solid rgba(226,254,165,0.1)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        "rgba(226,254,165,0.12)";
                      (e.currentTarget as HTMLButtonElement).style.color = "rgba(226,254,165,0.82)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        "rgba(226,254,165,0.06)";
                      (e.currentTarget as HTMLButtonElement).style.color = "rgba(226,254,165,0.45)";
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {messages.length > 0 && (
              <div className="flex flex-col gap-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <div
                    className="max-w-[85%] px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap wrap-break-word"
                    style={{
                      fontFamily: FN,
                      borderRadius: "18px 18px 4px 18px",
                      backgroundColor: "rgba(226,254,165,0.08)",
                      color: "#F8FFE8",
                    }}
                  >
                    {msg.content || <span style={{ opacity: 0.4 }}>▮</span>}
                  </div>
                    ) : (
                      <div
                        className="max-w-[88%] px-4 py-3"
                        style={{
                          borderRadius: "18px 18px 18px 4px",
                          backgroundColor: "rgba(226,254,165,0.08)",
                        }}
                      >
                        {msg.content ? (
                          <MarkdownDark md={msg.content} />
                        ) : (
                          <span style={{ opacity: 0.4, color: "#F8FFE8" }}>▮</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {loading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex">
                <div
                  className="px-4 py-3 rounded-[18px] rounded-bl-[4px] flex gap-1.5 items-center"
                  style={{ backgroundColor: "rgba(226,254,165,0.08)" }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{
                        backgroundColor: "rgba(226,254,165,0.5)",
                        animation: `dotBounce 1s ${i * 0.15}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form
            onSubmit={handleSend}
            className="flex gap-2 px-4 py-3 shrink-0"
            style={{ borderTop: "1px solid rgba(226,254,165,0.08)" }}
          >
            <input
              type="text"
              {...chatForm.register("message")}
              placeholder="Ask about the project…"
              disabled={loading}
              autoComplete="off"
              className="flex-1 rounded-xl px-4 py-2.5 text-[13px] outline-none transition-all"
              style={{
                fontFamily: FN,
                backgroundColor: "rgba(226,254,165,0.07)",
                border: "1px solid rgba(226,254,165,0.13)",
                color: "#F8FFE8",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(226,254,165,0.35)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(226,254,165,0.13)")}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-10 h-10 rounded-xl flex items-center justify-center border-none cursor-pointer shrink-0 transition-colors"
              style={{
                backgroundColor: loading ? "rgba(226,254,165,0.2)" : "#E2FEA5",
                color: "#0F2C23",
              }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </form>
      </>
    </div>
  );
}

/* ─── AI Bubble ───────────────────────────────────────────────────── */
function AIBubble({ onClick, hasMessages }: { onClick: () => void; hasMessages: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open AI project chat"
      className="fixed bottom-6 right-6 z-300 w-14 h-14 rounded-full flex items-center justify-center border-none cursor-pointer transition-all duration-200 hover:scale-110"
      style={{
        backgroundColor: "#0F2C23",
        boxShadow: "0 8px 32px rgba(15,44,35,0.38)",
        border: "2px solid rgba(226,254,165,0.18)",
      }}
    >
      <span
        className="text-xs font-black tracking-[0.22em] uppercase"
        style={{ fontFamily: PX, color: "#F8FFE8" }}
      >
        AI
      </span>
      {hasMessages && (
        <span
          className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: "#E2FEA5", border: "2px solid #0F2C23" }}
        />
      )}
    </button>
  );
}

/* ─── Component ──────────────────────────────────────────────────── */
export function ViewerProjectDetail({
  project,
  submissions = [],
  hackathonNames = {},
}: {
  project: StoredProject | null;
  projectId: string;
  submissions?: StoredSubmission[];
  hackathonNames?: Record<string, string>;
}) {
  const [chatState, setChatState] = useState<ChatState>("bubble");
  const [chatMsgs] = useState<ChatMessage[]>([]);
  const [openWhyIndex, setOpenWhyIndex] = useState<number | null>(0);
  const [descExpanded, setDescExpanded] = useState(false);

  if (!project)
    return (
      <div className="min-h-screen px-10 py-12" style={{ backgroundColor: "#F8FFE8" }}>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold text-[#0F2C23]/50 hover:text-[#0F2C23] transition-colors no-underline"
          style={{ fontFamily: PX }}
        >
          <ArrowLeft size={12} /> Explore
        </Link>
        <p className="mt-10 text-[#0F2C23]/50" style={{ fontFamily: FN }}>
          Project not found.
        </p>
      </div>
    );

  const p = project;
  const shots = (p.screenshot_urls ?? []) as string[];
  const socials = (p.social_links ?? []) as { label: string; url: string }[];
  const features = (p.key_features ?? []) as string[];
  const tags = (p.tech_stack_tags ?? []) as string[];
  const desc = String(p.refined_description ?? (p as { description?: string }).description ?? "");

  const links = [
    { key: "github", href: p.github_url, icon: Github, label: "GitHub" },
    { key: "website", href: p.website_url, icon: Globe, label: "Website" },
    { key: "demo", href: p.youtube_url, icon: Youtube, label: "Demo" },
  ].filter((l) => l.href);

  /* ─── Why Choose items: features → social → description chunks ─── */
  const whyItems: { title: string; body: string }[] =
    features.length > 0
      ? features.map((f) => {
          const idx = f.indexOf(":");
          const rawTitle = (idx >= 0 ? f.slice(0, idx) : f).trim();
          const title = rawTitle.length > 58 ? `${rawTitle.slice(0, 58)}…` : rawTitle;
          const body = (idx >= 0 ? f.slice(idx + 1) : f).trim();
          return { title, body };
        })
      : desc
          .split(". ")
          .filter((s) => s.trim().length > 20)
          .slice(0, 6)
          .map((s) => ({
            title: s.trim().length > 55 ? `${s.trim().slice(0, 55)}…` : s.trim(),
            body: s.trim() + (s.trim().endsWith(".") ? "" : "."),
          }));

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FFE8" }}>
      {/* ── Three-column body ─────────────────────────────────────── */}
      <div
        className="grid items-start px-7 py-8 gap-5"
        style={{ gridTemplateColumns: "300px 1fr 360px", minHeight: "calc(100vh - 65px)" }}
      >
        {/* ══ LEFT — profile sidebar ══════════════════════════════ */}
        <aside className="sticky top-0 flex flex-col gap-5">
          {/* Logo square */}
          <div
            className="w-full rounded-3xl overflow-hidden flex items-center justify-center"
            style={{ aspectRatio: "1/1", backgroundColor: "rgba(15,44,35,0.06)" }}
          >
            {p.logo_url ? (
              <Image
                src={p.logo_url}
                alt={p.name}
                width={300}
                height={300}
                className="w-full h-full object-cover"
              />
            ) : (
              <Code2 size={52} style={{ color: "#0F2C23", opacity: 0.25 }} />
            )}
          </div>

          {/* Name */}
          <div>
            <h1
              className="font-black text-[#0F2C23] leading-[0.9] uppercase mb-3"
              style={{
                fontFamily: PX,
                fontSize: "clamp(20px, 2.8vw, 30px)",
                letterSpacing: "-0.02em",
              }}
            >
              {p.name}
            </h1>
            <p className="text-[#0F2C23]/55 leading-relaxed text-sm" style={{ fontFamily: FN }}>
              {p.tagline || desc.slice(0, 130) || "No tagline."}
            </p>
          </div>

          {/* Category + tech tags */}
          <div className="flex flex-wrap gap-2">
            {p.category && (
              <span
                className="text-[8px] tracking-[0.15em] uppercase font-bold px-3 py-1.5 rounded-sm"
                style={{ backgroundColor: "#0F2C23", color: "#F8FFE8", fontFamily: PX }}
              >
                {p.category}
              </span>
            )}
            {tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="text-[9px] px-2.5 py-1 rounded-sm"
                style={{ backgroundColor: "rgba(15,44,35,0.08)", color: "#0F2C23", fontFamily: FN }}
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
                  style={{ backgroundColor: "rgba(15,44,35,0.06)" }}
                >
                  <span
                    className="text-[11px] font-semibold text-[#0F2C23] truncate"
                    style={{ fontFamily: PX }}
                  >
                    {s.label || s.url}
                  </span>
                  <ExternalLink size={12} style={{ color: "rgba(15,44,35,0.35)", flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          )}

          {/* Hackathon participations */}
          {submissions.length > 0 && (
            <div className="rounded-2xl p-5" style={{ backgroundColor: "#0F2C23" }}>
              <span
                className="text-[10px] font-bold uppercase tracking-[0.15em]"
                style={{ fontFamily: PX, color: "rgba(226,254,165,0.4)" }}
              >
                Incubated at
              </span>
              <div className="flex flex-col gap-2 mt-2">
                {submissions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/hackathons/${s.hackathon_id}`}
                    className="text-[12px] text-[#F8FFE8]/70 no-underline hover:text-[#F8FFE8] transition-colors"
                    style={{ fontFamily: FN }}
                  >
                    → {hackathonNames[s.hackathon_id] ?? "Hackathon"}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ══ CENTRE — gallery ════════════════════════════════════ */}
        <div>
          <main className="flex flex-col gap-5 mb-4">
            {/* Description card */}
            <div
              className="rounded-3xl p-7"
              style={{
                backgroundColor: "rgba(15,44,35,0.04)",
                minHeight: 180,
              }}
            >
              {/* <SectionLabel>Description</SectionLabel> */}
              {desc ? (
                <>
                  <p
                    className="text-[#0F2C23]/75 leading-relaxed whitespace-pre-wrap"
                    style={{
                      fontFamily: FN,
                      fontSize: "clamp(14px, 1.4vw, 16px)",
                      maxHeight: descExpanded ? "none" : 230,
                      overflow: descExpanded ? "visible" : "hidden",
                    }}
                  >
                    {desc}
                  </p>
                  {desc.length > 260 && (
                    <button
                      type="button"
                      onClick={() => setDescExpanded((v) => !v)}
                      className="mt-3 ml-auto text-[10px] tracking-[0.18em] uppercase font-bold border-none cursor-pointer px-0 py-0 flex items-center justify-end"
                      style={{
                        fontFamily: PX,
                        color: "#0F2C23",
                        background: "transparent",
                      }}
                    >
                      {descExpanded ? "Read less" : "Read more"}
                    </button>
                  )}
                </>
              ) : (
                <p
                  className="text-[#0F2C23]/75 leading-relaxed whitespace-pre-wrap"
                  style={{
                    fontFamily: FN,
                    fontSize: "clamp(14px, 1.4vw, 16px)",
                  }}
                >
                  <span className="font-semibold italic">No description available yet.</span>
                </p>
              )}
            </div>
          </main>
          <GalleryColumn shots={shots} name={p.name} />
        </div>

        {/* ══ RIGHT — Why Choose + tech stack ═════════════════════ */}
        <aside className="sticky top-0 flex flex-col gap-4">
          {/* Why Choose card */}
          <div
            className="rounded-3xl p-7 flex flex-col"
            style={{
              backgroundColor: "rgba(15,44,35,0.04)",
              minHeight: "calc(100vh - 65px)",
            }}
          >
            {/* Header */}
            <div className="mb-5">
              <p
                className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/35 mb-2"
                style={{ fontFamily: PX }}
              >
                Overview
              </p>
              <h2
                className="font-black text-[#0F2C23] leading-[0.9] uppercase mb-3"
                style={{
                  fontFamily: PX,
                  fontSize: "clamp(18px, 2.2vw, 26px)",
                  letterSpacing: "-0.02em",
                }}
              >
                Why Choose
                <br />
                {p.name}
              </h2>
            </div>

            {/* Accordion */}
            <div
              className="border-t flex-1 overflow-y-auto pr-1 why-choose-scroll"
              style={{ borderColor: "rgba(15,44,35,0.1)", scrollbarWidth: "none" }}
            >
              {whyItems.length > 0 ? (
                whyItems.map((item, i) => (
                  <AccordionItem
                    key={i}
                    index={i}
                    title={item.title}
                    body={item.body}
                    isOpen={openWhyIndex === i}
                    onToggle={() =>
                      setOpenWhyIndex((curr) => (curr === i ? null : i))
                    }
                  />
                ))
              ) : (
                <div className="py-10 text-center">
                  <p className="text-[#0F2C23]/35 text-sm" style={{ fontFamily: FN }}>
                    No features listed yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* External links card — if more than 3 socials */}
          {socials.length > 3 && (
            <div
              className="rounded-2xl px-6 py-5"
              style={{ backgroundColor: "rgba(15,44,35,0.06)" }}
            >
              <p
                className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#0F2C23]/40 mb-4"
                style={{ fontFamily: PX }}
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
                    className="flex items-center justify-between no-underline rounded-xl px-3 py-2.5 transition-colors hover:bg-[#0F2C23]/05"
                    style={{ backgroundColor: "rgba(15,44,35,0.06)" }}
                  >
                    <span
                      className="text-[11px] font-semibold text-[#0F2C23] truncate"
                      style={{ fontFamily: PX }}
                    >
                      {s.label || s.url}
                    </span>
                    <ExternalLink
                      size={11}
                      style={{ color: "rgba(15,44,35,0.35)", flexShrink: 0 }}
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
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
          onToggleExpand={() => setChatState((s) => (s === "expanded" ? "open" : "expanded"))}
        />
      )}

      <style>{`
        .why-choose-scroll::-webkit-scrollbar {
          display: none;
        }
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
