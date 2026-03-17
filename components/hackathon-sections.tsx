import { ArrowUpRight, ExternalLink, FileText, Globe, Trophy, Zap } from "lucide-react";
import Image from "next/image";
import type { StoredHackathon } from "@/lib/data-mappers";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

function fmt(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parsePrizeSummaryBlocks(text: string): { title: string; currency?: string; amount?: number; description?: string }[] {
  const blocks = text
    .split(/\n\s*\n/g)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks.map((block) => {
    const [firstLineRaw, ...rest] = block.split("\n");
    const firstLine = (firstLineRaw ?? "").trim();
    const description = rest.join("\n").trim() || undefined;

    const parts = firstLine.split("—").map((p) => p.trim()).filter(Boolean);
    const title = parts[0] ?? firstLine;
    const rhs = parts[1] ?? "";
    const m = rhs.match(/\b([A-Z]{3})\b\s+([\d,]+(?:\.\d+)?)/);
    const currency = m?.[1];
    const amount = m?.[2] ? Number(m[2].replace(/,/g, "")) : undefined;

    return { title, currency, amount, description };
  });
}

/* ═══════════════════════════════════════════════════════════════════
   About / Info section
   ═══════════════════════════════════════════════════════════════════ */

export function HackathonAboutSection({
  hackathon: h,
  compact = false,
}: {
  hackathon: StoredHackathon;
  compact?: boolean;
}) {
  const hasResources = (h.technical_resources?.length ?? 0) > 0;
  const hasAboutMeta = !!h.theme || !!h.description || !!h.program_goal;
  const titleSize = compact ? "clamp(28px, 4vw, 48px)" : "clamp(46px, 6vw, 82px)";

  return (
    <div>
      <div className="relative">
        {/* Banner + Logo */}
        {h.banner_url && (
          <div
            className="rounded-2xl overflow-hidden mb-4"
            style={{ aspectRatio: "3/1", position: "relative" }}
          >
            <Image
              src={h.banner_url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
            />
            {h.logo_url && (
              <div
                className="z-10 overflow-hidden rounded-full"
                style={{
                  position: "absolute",
                  left: 12,
                  bottom: 12,
                  width: compact ? 56 : 72,
                  height: compact ? 56 : 72,
                }}
              >
                <Image src={h.logo_url} alt={h.name} fill className="object-cover" />
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-6">
          {!h.banner_url && h.logo_url && (
            <Image src={h.logo_url} alt={h.name} width={50} height={50} className="object-cover" />
          )}
          <h2
            className="font-black uppercase leading-[0.88]"
            style={{
              fontFamily: FN,
              fontSize: titleSize,
              letterSpacing: "-0.04em",
              color: "#0F2C23",
            }}
          >
            {h.name || "Untitled Program"}
          </h2>
        </div>
      </div>

      {/* Theme / Description / Program goal (card) */}
      {hasAboutMeta && (
        <div
          className="rounded-2xl p-6 mb-6"
          style={{
            backgroundColor: "rgba(15,44,35,0.03)",
            border: "1px solid rgba(15,44,35,0.08)",
          }}
        >
          {h.theme && (
            <div className="mb-5 last:mb-0">
              <p
                className="text-[15px] tracking-[0.16em] uppercase font-bold mb-2"
                style={{ fontFamily: FN, color: "rgba(15,44,35,0.5)" }}
              >
                Theme
              </p>
              <p className="text-[#0F2C23]/70 leading-relaxed" style={{ fontFamily: FN, fontSize: 13 }}>
                {h.theme}
              </p>
            </div>
          )}

          {h.description && (
            <div className="mb-5 last:mb-0">
              <p
                className="text-[15px] tracking-[0.16em] uppercase font-bold mb-2"
                style={{ fontFamily: FN, color: "rgba(15,44,35,0.5)" }}
              >
                Description
              </p>
              <p className="text-[#0F2C23]/70 leading-relaxed" style={{ fontFamily: FN, fontSize: 13 }}>
                {h.description}
              </p>
            </div>
          )}

          {h.program_goal && h.program_goal !== h.description && (
            <div className="mb-0">
              <p
                className="text-[15px] tracking-[0.16em] uppercase font-bold mb-2"
                style={{ fontFamily: FN, color: "rgba(15,44,35,0.5)" }}
              >
                Program goal
              </p>
              <p className="text-[#0F2C23]/65 leading-relaxed" style={{ fontFamily: FN, fontSize: 13 }}>
                {h.program_goal}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Links row */}
      {h.website_url && (
        <div className="flex flex-wrap gap-3 mb-6">
          <a
            href={h.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 no-underline transition-colors hover:bg-[#0F2C23]/8"
            style={{
              backgroundColor: "rgba(15,44,35,0.04)",
              border: "1px solid rgba(15,44,35,0.08)",
            }}
          >
            <Globe size={13} style={{ color: "rgba(15,44,35,0.5)" }} />
            <span
              className="text-xs font-medium truncate"
              style={{ fontFamily: FN, color: "#0F2C23", maxWidth: 200 }}
            >
              Website
            </span>
            <ExternalLink size={10} style={{ color: "rgba(15,44,35,0.3)" }} />
          </a>
        </div>
      )}

      {/* Technical resources */}
      {hasResources && (
        <div>
          <p
            className="text-[15px] tracking-[0.16em] uppercase font-bold mb-4"
            style={{ fontFamily: FN, color: "rgba(15,44,35,0.4)" }}
          >
            Resources
          </p>
          <div
            className="rounded-2xl p-6"
            style={{
              backgroundColor: "rgba(15,44,35,0.03)",
              border: "1px solid rgba(15,44,35,0.08)",
            }}
          >
            <div className="flex flex-col gap-2">
              {h.technical_resources!.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 no-underline transition-colors hover:bg-[rgba(15,44,35,0.04)]"
                  style={{ backgroundColor: "rgba(15,44,35,0.02)" }}
                >
                  <FileText size={12} style={{ color: "rgba(15,44,35,0.5)" }} />
                  <span
                    className="text-xs flex-1 truncate"
                    style={{ fontFamily: FN, color: "rgba(15,44,35,0.65)" }}
                  >
                    {r.description || r.url}
                  </span>
                  <ArrowUpRight size={10} style={{ color: "rgba(15,44,35,0.3)" }} />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Schedule section
   ═══════════════════════════════════════════════════════════════════ */

export function HackathonScheduleSection({ hackathon: h }: { hackathon: StoredHackathon }) {
  const rows = [
    ...(h.start_date ? [{ label: "Start date", value: fmt(h.start_date)! }] : []),
    ...(h.submission_deadline
      ? [{ label: "Submission deadline", value: fmt(h.submission_deadline)! }]
      : []),
    ...(h.judging_deadline ? [{ label: "Judging deadline", value: fmt(h.judging_deadline)! }] : []),
    ...(h.results_date ? [{ label: "Results", value: fmt(h.results_date)! }] : []),
  ];

  if (rows.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-10">
        <div className="w-8 h-8 rounded-full bg-[#0F2C23]/5 flex items-center justify-center text-[#0F2C23]">
          <Zap size={16} />
        </div>
        <h3 className="text-2xl font-black uppercase text-[#0F2C23]" style={{ fontFamily: FN }}>
          Timeline
        </h3>
      </div>

      <div className="p-10 rounded-[48px] bg-white border-2 border-[#0F2C23]/10 shadow-[0_20px_40px_-15px_rgba(15,44,35,0.05)]">
        <div className="space-y-8">
          {rows.map((r) => (
            <div key={r.label} className="relative pl-8">
              <div className="absolute left-[-5px] top-3 w-2 h-2 rounded-full bg-[#0F2C23]" />
              <h4 className="font-bold text-[#0F2C23] text-lg mb-1" style={{ fontFamily: FN }}>
                {r.label}
              </h4>
              <p className="text-sm text-[#0F2C23]/50 leading-relaxed" style={{ fontFamily: FN }}>
                {r.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Prizes & Challenges section
   ═══════════════════════════════════════════════════════════════════ */

export function HackathonPrizesSection({ hackathon: h }: { hackathon: StoredHackathon }) {
  const hasChallenges = (h.problem_statements?.length ?? 0) > 0;
  const hasTracks = (h.sponsor_tracks?.length ?? 0) > 0;
  const hasCriteria = (h.judging_criteria?.length ?? 0) > 0;
  const hasAnything = h.bounty_pool_summary || hasChallenges || hasTracks || hasCriteria;

  if (!hasAnything) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-10">
        <div className="w-8 h-8 rounded-full bg-[#0F2C23]/5 flex items-center justify-center text-[#0F2C23]">
          <Trophy size={16} />
        </div>
        <h3 className="text-2xl font-black uppercase text-[#0F2C23]" style={{ fontFamily: FN }}>
          Prizes
        </h3>
      </div>

      {h.bounty_pool_summary && (
        <div className="p-10 rounded-[48px] bg-white border-2 border-[#0F2C23]/10 shadow-[0_20px_40px_-15px_rgba(15,44,35,0.05)] mb-12">
          <div className="space-y-4">
            {parsePrizeSummaryBlocks(h.bounty_pool_summary).map((p, i) => (
              <div
                key={`${p.title}-${i}`}
                className="flex items-start justify-between gap-4 border-b border-[#0F2C23]/10 pb-4 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-bold text-[#0F2C23]" style={{ fontFamily: FN }}>
                    {p.title}
                  </p>
                  {p.description && (
                    <p
                      className="text-sm text-[#0F2C23]/55 leading-relaxed whitespace-pre-wrap"
                      style={{ fontFamily: FN }}
                    >
                      {p.description}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-black text-[#0F2C23]" style={{ fontFamily: FN }}>
                    {typeof p.amount === "number" && p.amount > 0 && p.currency
                      ? `${p.currency} ${p.amount.toLocaleString()}`
                      : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasTracks && (
        <div
          className="rounded-[48px] p-10 mb-12"
          style={{
            backgroundColor: "#fff",
            border: "2px solid rgba(15,44,35,0.10)",
            boxShadow: "0 20px 40px -15px rgba(15,44,35,0.05)",
          }}
        >
          <p
            className="text-xl font-black uppercase text-[#0F2C23] mb-8"
            style={{ fontFamily: FN }}
          >
            Sponsor Tracks
          </p>
          <div className="flex flex-col gap-4">
            {h.sponsor_tracks!.map((t, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-[32px] px-8 py-6 bg-white border border-[#0F2C23]/10"
              >
                <div>
                  <p
                    className="font-bold text-[#0F2C23] uppercase"
                    style={{ fontFamily: FN, fontSize: 15 }}
                  >
                    {t.sponsor}
                  </p>
                  {t.track_description && (
                    <p className="text-[#0F2C23]/55 mt-2 leading-relaxed" style={{ fontFamily: FN, fontSize: 13 }}>
                      {t.track_description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasCriteria && (
        <div className="mt-12">
          <div className="p-10 rounded-[48px] bg-[#E2FEA5] text-[#0F2C23] shadow-[0_30px_60px_-15px_rgba(226,254,165,0.4)] relative overflow-hidden">
            <div className="absolute -top-4 -right-4 opacity-5 rotate-12">
              <Trophy size={120} />
            </div>
            <div className="flex items-center gap-3 mb-8">
              <h3 className="text-xl font-black uppercase" style={{ fontFamily: FN }}>
                Judging Criteria
              </h3>
            </div>
            <div className="space-y-6">
              {h.judging_criteria!.map((c, i) => (
                <div
                  key={i}
                  className="border-b border-[#0F2C23]/10 pb-5 last:border-0 last:pb-0"
                >
                  <p className="text-[20px] font-black uppercase mb-2 tracking-tight" style={{ fontFamily: FN }}>
                    {c.name}
                  </p>
                  {c.description && (
                    <p className="text-[15px] opacity-70 leading-relaxed" style={{ fontFamily: FN }}>
                      {c.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function HackathonChallengesSection({ hackathon: h }: { hackathon: StoredHackathon }) {
  const hasChallenges = (h.problem_statements?.length ?? 0) > 0;
  if (!hasChallenges) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-10">
        <div className="w-8 h-8 rounded-full bg-[#0F2C23]/5 flex items-center justify-center text-[#0F2C23]">
          <Trophy size={16} />
        </div>
        <h3 className="text-2xl font-black uppercase text-[#0F2C23]" style={{ fontFamily: FN }}>
          Challenge Matrix
        </h3>
      </div>

      <div className="space-y-6">
        {h.problem_statements!.map((s, i) => (
          <div
            key={i}
            className="p-8 rounded-[32px] bg-white border border-[#0F2C23]/10 transition-all hover:border-[#0F2C23]/25 group"
          >
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-black text-[#0F2C23] uppercase text-lg leading-tight" style={{ fontFamily: FN }}>
                Challenge {String(i + 1).padStart(2, "0")}
              </h4>
              
            </div>
            <p className="text-[15px] text-[#0F2C23]/60 leading-relaxed" style={{ fontFamily: FN }}>
              {s}
            </p>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-4">
              <div className="h-px flex-1 bg-[#0F2C23]/5" />
              <span
                className="text-[9px] uppercase font-bold text-[#0F2C23]/25 tracking-widest"
                style={{ fontFamily: PX }}
              >
                Builder Focus
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
