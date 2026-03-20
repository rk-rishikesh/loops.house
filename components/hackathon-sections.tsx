import {
  ArrowUpRight,
  ExternalLink,
  FileText,
  Globe,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import type { StoredHackathon } from "@/lib/data-mappers";

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

function parsePrizeSummaryBlocks(text: string): {
  title: string;
  currency?: string;
  amount?: number;
  description?: string;
}[] {
  const blocks = text
    .split(/\n\s*\n/g)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks.map((block) => {
    const [firstLineRaw, ...rest] = block.split("\n");
    const firstLine = (firstLineRaw ?? "").trim();
    const description = rest.join("\n").trim() || undefined;

    const parts = firstLine
      .split("—")
      .map((p) => p.trim())
      .filter(Boolean);
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

  const titleSize = compact
    ? "clamp(28px, 4.5vw, 44px)"
    : "clamp(34px, 5.2vw, 62px)";
  const hasBanner = !!h.banner_url;
  const hasLogo = !!h.logo_url;

  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      {/* Banner + Brand Hero Block */}
      <div className="relative">
        {h.banner_url ? (
          <div className="relative group">
            {/* Banner */}
            <div className="relative rounded-[32px] sm:rounded-[48px] border-4 border-[#0F2C23]/5 shadow-2xl bg-[#0F2C23]/5 overflow-hidden">
              <div
                className="relative w-full overflow-hidden"
                style={{ aspectRatio: "21/9" }}
              >
                <Image
                  src={h.banner_url}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  priority
                  sizes="(max-width: 768px) 100vw, 1200px"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#0F2C23]/60 via-[#0F2C23]/20 to-transparent" />
              </div>
            </div>
          </div>
        ) : (
          h.logo_url && (
            <div className="flex items-center gap-6 mb-8">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-2 border-[#0F2C23]/10 bg-white p-1 shadow-lg">
                <div className="relative w-full h-full rounded-2xl overflow-hidden">
                  <Image
                    src={h.logo_url}
                    alt={h.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Title & Tagline & Actions Row */}
      <div className={hasBanner ? "pt-10 sm:pt-14" : ""}>
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-5 min-w-0">
            {hasLogo && (
              <div className={hasBanner ? "-mt-10 sm:-mt-14" : ""}>
                <div className="relative w-20 h-20 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-white p-1">
                  <div className="relative w-full h-full rounded-2xl overflow-hidden">
                    <Image
                      src={h.logo_url!}
                      alt={h.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="min-w-0">
              <h1
                className="font-black uppercase tracking-tighter text-[#0F2C23]"
                style={{ fontFamily: FN, fontSize: titleSize, lineHeight: 0.9 }}
              >
                {h.name || "Untitled Program"}
              </h1>
              {h.theme && (
                <p
                  className="mt-2 text-base sm:text-lg font-bold text-[#0F2C23]/55 italic tracking-tight"
                  style={{ fontFamily: FN }}
                >
                  "{h.theme}"
                </p>
              )}
            </div>
          </div>

          {h.website_url && (
            <a
              href={h.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 group flex items-center gap-3 rounded-full px-7 py-3 bg-[#0F2C23] text-white hover:bg-[#0F2C23]/90 transition-all shadow-[0_10px_30px_-10px_rgba(15,44,35,0.35)] hover:-translate-y-0.5 active:scale-95"
              style={{ textDecoration: "none" }}
            >
              <Globe
                size={16}
                className="opacity-70 group-hover:rotate-12 transition-transform duration-500"
              />
              <span
                className="font-bold text-[11px] tracking-[0.2em] uppercase"
                style={{ fontFamily: FN }}
              >
                Visit Website
              </span>
              <ExternalLink
                size={14}
                className="opacity-30 group-hover:opacity-100 transition-opacity"
              />
            </a>
          )}
        </div>
      </div>

      {/* Program Details Section */}
      {(h.description || h.program_goal) && (
        <div className="flex flex-col gap-12 sm:gap-20">
          {h.description && (
            <div className="flex flex-col gap-6 max-w-4xl">
              <div className="flex items-center gap-4">
                <h3
                  className="text-xl font-black uppercase text-[#0F2C23]"
                  style={{ fontFamily: FN }}
                >
                  Description
                </h3>
                <div className="h-px flex-1 bg-[#0F2C23]/10" />
              </div>
              <p
                className="text-[#0F2C23]/70 leading-relaxed text-lg sm:text-xl font-medium"
                style={{ fontFamily: FN }}
              >
                {h.description}
              </p>
            </div>
          )}

          {h.program_goal && h.program_goal !== h.description && (
            <div className="flex flex-col gap-6 max-w-4xl">
              <div className="flex items-center gap-4">
                <h3
                  className="text-xl font-black uppercase text-[#0F2C23]"
                  style={{ fontFamily: FN }}
                >
                  Program Goal
                </h3>
                <div className="h-px flex-1 bg-[#0F2C23]/10" />
              </div>
              <p
                className="text-[#0F2C23]/70 leading-relaxed text-lg sm:text-xl font-medium"
                style={{ fontFamily: FN }}
              >
                {h.program_goal}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Technical Resources Section */}
      {hasResources && (
        <div className="flex flex-col gap-10">
          <div className="flex items-center gap-4">
            <h3
              className="text-xl font-black uppercase text-[#0F2C23]"
              style={{ fontFamily: FN }}
            >
              Technical Resources
            </h3>
            <div className="h-px flex-1 bg-[#0F2C23]/10" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {h.technical_resources!.map((r, i) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-start gap-4 p-7 rounded-[32px] bg-[#0F2C23] border border-[#E2FEA5]/10 shadow-sm hover:shadow-xl hover:border-[#E2FEA5]/20 transition-all duration-300 relative overflow-hidden"
              >
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#E2FEA5]/12 rounded-bl-[100px] transition-all group-hover:w-full group-hover:h-full group-hover:rounded-none duration-500" />

                <div className="relative z-10 flex items-center justify-between w-full">
                  <div className="w-12 h-12 rounded-2xl bg-[#E2FEA5]/10 flex items-center justify-center text-[#F8FFE8] group-hover:bg-[#E2FEA5] group-hover:text-[#0F2C23] group-hover:scale-110 transition-all duration-500">
                    <FileText size={20} />
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="text-[#E2FEA5]/30 group-hover:text-[#E2FEA5] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all"
                  />
                </div>

                <div className="relative z-10 mt-2">
                  <p
                    className="text-[14px] font-bold text-[#F8FFE8]/80 leading-snug group-hover:text-[#F8FFE8] transition-colors"
                    style={{ fontFamily: FN }}
                  >
                    {r.description || r.url}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Schedule section
   ═══════════════════════════════════════════════════════════════════ */

export function HackathonScheduleSection({
  hackathon: h,
}: {
  hackathon: StoredHackathon;
}) {
  const rows = [
    ...(h.start_date
      ? [{ label: "Start date", value: fmt(h.start_date)! }]
      : []),
    ...(h.submission_deadline
      ? [{ label: "Submission deadline", value: fmt(h.submission_deadline)! }]
      : []),
    ...(h.judging_deadline
      ? [{ label: "Judging deadline", value: fmt(h.judging_deadline)! }]
      : []),
    ...(h.results_date
      ? [{ label: "Results", value: fmt(h.results_date)! }]
      : []),
  ];

  if (rows.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <h3
          className="text-xl font-black uppercase text-[#0F2C23]"
          style={{ fontFamily: FN }}
        >
          Timeline
        </h3>
        <div className="h-px flex-1 bg-[#0F2C23]/10" />
      </div>

      <div className="p-10 rounded-[48px] bg-[#0F2C23] border border-[#E2FEA5]/10 shadow-[0_20px_40px_-15px_rgba(15,44,35,0.25)]">
        <div className="space-y-6">
          {rows.map((r) => (
            <div key={r.label} className="relative pl-8 pr-6">
              {/* Soft row decoration (absolute so alignment stays stable) */}
              <div className="absolute inset-0 -z-10 rounded-2xl bg-[#E2FEA5]/4 border border-[#E2FEA5]/10" />
              {/* Timeline dot */}
              <div className="absolute left-[-5px] top-3 w-2 h-2 rounded-full bg-[#E2FEA5] shadow-[0_0_0_4px_rgba(226,254,165,0.06)]" />
              <h4
                className="font-black text-[#F8FFE8] text-[16px] mb-1 leading-snug uppercase"
                style={{ fontFamily: FN }}
              >
                {r.label}
              </h4>
              <p
                className="text-[14px] text-[#E2FEA5]/60 leading-relaxed font-medium"
                style={{ fontFamily: FN }}
              >
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

export function HackathonPrizesSection({
  hackathon: h,
}: {
  hackathon: StoredHackathon;
}) {
  const hasChallenges = (h.problem_statements?.length ?? 0) > 0;
  const hasTracks = (h.sponsor_tracks?.length ?? 0) > 0;
  const hasCriteria = (h.judging_criteria?.length ?? 0) > 0;
  const hasAnything =
    h.bounty_pool_summary || hasChallenges || hasTracks || hasCriteria;

  if (!hasAnything) return null;

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <h3
          className="text-xl font-black uppercase text-[#0F2C23]"
          style={{ fontFamily: FN }}
        >
          Prizes
        </h3>
        <div className="h-px flex-1 bg-[#0F2C23]/10" />
      </div>

      {h.bounty_pool_summary && (
        <div className="p-10 rounded-[48px] bg-white border-2 border-[#0F2C23]/10 shadow-[0_20px_40px_-15px_rgba(15,44,35,0.05)] mb-12">
          <div className="space-y-4">
            {parsePrizeSummaryBlocks(h.bounty_pool_summary).map((p, i) => (
              <div
                key={`${p.title}-${i}`}
                className="flex items-start justify-between gap-4 border-b py-4 border-[#0F2C23]/10 last:border-0"
              >
                <div className="min-w-0">
                  <p
                    className="font-bold text-[#0F2C23]"
                    style={{ fontFamily: FN }}
                  >
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
                  <p
                    className="font-black text-[#0F2C23]"
                    style={{ fontFamily: FN }}
                  >
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
                    <p
                      className="text-[#0F2C23]/55 mt-2 leading-relaxed"
                      style={{ fontFamily: FN, fontSize: 13 }}
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

      {hasCriteria && (
        <div className="mt-12">
          <div className="p-10 rounded-[48px] bg-[#E2FEA5] text-[#0F2C23] shadow-[0_30px_60px_-15px_rgba(226,254,165,0.4)] relative overflow-hidden">
            <div className="absolute -top-4 -right-4 opacity-5 rotate-12">
              <Trophy size={120} />
            </div>
            <div className="flex items-center gap-3 mb-8">
              <h3
                className="text-xl font-black uppercase"
                style={{ fontFamily: FN }}
              >
                Judging Criteria
              </h3>
            </div>
            <div className="space-y-6">
              {h.judging_criteria!.map((c, i) => (
                <div
                  key={i}
                  className="border-b border-[#0F2C23]/10 pb-5 last:border-0 last:pb-0"
                >
                  <p
                    className="text-[20px] font-black uppercase mb-2 tracking-tight"
                    style={{ fontFamily: FN }}
                  >
                    {c.name}
                  </p>
                  {c.description && (
                    <p
                      className="text-[15px] opacity-70 leading-relaxed"
                      style={{ fontFamily: FN }}
                    >
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

export function HackathonChallengesSection({
  hackathon: h,
}: {
  hackathon: StoredHackathon;
}) {
  const hasChallenges = (h.problem_statements?.length ?? 0) > 0;
  if (!hasChallenges) return null;

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <h3
          className="text-xl font-black uppercase text-[#0F2C23]"
          style={{ fontFamily: FN }}
        >
          Challenge Statements
        </h3>
        <div className="h-px flex-1 bg-[#0F2C23]/10" />
      </div>
      <div className="space-y-6">
        {h.problem_statements!.map((s, i) => (
          <div
            key={i}
            className="p-8 rounded-[32px] bg-white border border-[#0F2C23]/10 transition-all hover:border-[#0F2C23]/25 group"
          >
            <div className="flex justify-between items-start mb-4">
              <h4
                className="font-black text-[#0F2C23] uppercase text-lg leading-tight"
                style={{ fontFamily: FN }}
              >
                Challenge {String(i + 1).padStart(2, "0")}
              </h4>
            </div>
            <p
              className="text-[15px] text-[#0F2C23]/60 leading-relaxed"
              style={{ fontFamily: FN }}
            >
              {s}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
