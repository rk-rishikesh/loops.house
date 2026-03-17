import { ArrowUpRight, ExternalLink, FileText, Globe, Trophy } from "lucide-react";
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
  const titleSize = compact ? "clamp(28px, 4vw, 48px)" : "clamp(46px, 6vw, 82px)";

  return (
    <div>
      <div className="relative">
        {/* Banner + Logo */}
        {h.banner_url && (
          <div
            className="rounded-2xl overflow-hidden"
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
            className="font-black uppercase leading-[0.92]"
            style={{
              fontFamily: PX,
              fontSize: titleSize,
              letterSpacing: "-0.04em",
              color: "#0F2C23",
            }}
          >
            {h.name || "Untitled Program"}
          </h2>
        </div>
        {h.theme && (
          <p
            className="mt-2 text-base leading-relaxed"
            style={{ fontFamily: FN, color: "rgba(15,44,35,0.65)" }}
          >
            {h.theme}
          </p>
        )}
      </div>
      {/* Description / Goal */}
      {(h.description || h.program_goal) && (
        <div className="mb-6">
          {h.description && (
            <p
              className="text-sm leading-[1.8] mb-3"
              style={{ fontFamily: FN, color: "rgba(15,44,35,0.6)" }}
            >
              {h.description}
            </p>
          )}
          {h.program_goal && h.program_goal !== h.description && (
            <p
              className="text-sm leading-[1.8]"
              style={{ fontFamily: FN, color: "rgba(15,44,35,0.5)" }}
            >
              {h.program_goal}
            </p>
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
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: "rgba(15,44,35,0.03)",
            border: "1px solid rgba(15,44,35,0.08)",
          }}
        >
          <p
            className="text-[10px] tracking-[0.16em] uppercase font-bold mb-4"
            style={{ fontFamily: PX, color: "rgba(15,44,35,0.4)" }}
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
      <p
        className="text-[10px] tracking-[0.22em] uppercase font-bold mb-6"
        style={{ fontFamily: PX, color: "rgba(15,44,35,0.5)" }}
      >
        Schedule
      </p>
      <div
        className="rounded-[22px] px-10 py-6"
        style={{ backgroundColor: "rgba(248,255,232,0.9)" }}
      >
        {rows.map((r, idx) => (
          <div key={r.label} className="flex gap-5 py-4">
            <div className="flex flex-col items-center pt-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#0F2C23" }} />
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
            <div className="flex-1 flex items-baseline justify-between gap-6">
              <p
                className="text-[#0F2C23]/60 uppercase font-bold"
                style={{ fontFamily: PX, fontSize: 12, letterSpacing: "0.12em" }}
              >
                {r.label}
              </p>
              <p
                className="text-[#0F2C23] font-medium"
                style={{ fontFamily: FN, fontSize: "clamp(14px, 1.4vw, 16px)" }}
              >
                {r.value}
              </p>
            </div>
          </div>
        ))}
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
      <p
        className="text-[10px] tracking-[0.22em] uppercase font-bold mb-6"
        style={{ fontFamily: PX, color: "rgba(15,44,35,0.5)" }}
      >
        Prizes + Challenges
      </p>

      {h.bounty_pool_summary && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} style={{ color: "#0F2C23" }} />
            <p
              className="text-[10px] tracking-[0.16em] uppercase font-bold"
              style={{ fontFamily: PX, color: "rgba(15,44,35,0.5)" }}
            >
              Prize Pool
            </p>
          </div>
          <p
            className="font-black text-[#0F2C23] leading-none"
            style={{
              fontFamily: PX,
              fontSize: "clamp(28px, 4vw, 42px)",
              letterSpacing: "-0.03em",
            }}
          >
            {h.bounty_pool_summary}
          </p>
        </div>
      )}

      {hasChallenges && (
        <div className="mb-8">
          <p
            className="text-[10px] tracking-[0.16em] uppercase font-bold mb-4"
            style={{ fontFamily: PX, color: "rgba(15,44,35,0.5)" }}
          >
            Challenges
          </p>
          <div className="flex flex-col gap-3">
            {h.problem_statements!.map((s, i) => (
              <div key={i} className="flex items-baseline gap-3">
                <span
                  className="font-black text-[#0F2C23]/20 leading-none shrink-0"
                  style={{ fontFamily: PX, fontSize: 11, width: 22 }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p
                  className="text-[#0F2C23]/70 leading-relaxed"
                  style={{ fontFamily: FN, fontSize: 13 }}
                >
                  {s}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasTracks && (
        <div
          className="rounded-2xl p-8 mb-6"
          style={{
            backgroundColor: "rgba(15,44,35,0.03)",
            border: "1px solid rgba(15,44,35,0.08)",
          }}
        >
          <p
            className="text-[10px] tracking-[0.16em] uppercase font-bold mb-4"
            style={{ fontFamily: PX, color: "rgba(15,44,35,0.5)" }}
          >
            Sponsor Tracks
          </p>
          <div className="flex flex-col gap-4">
            {h.sponsor_tracks!.map((t, i) => (
              <div key={i} className="flex items-start gap-4 rounded-xl px-4 py-3">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                  style={{ backgroundColor: "#0F2C23" }}
                />
                <div>
                  <p
                    className="font-bold text-[#0F2C23] uppercase"
                    style={{ fontFamily: PX, fontSize: 13 }}
                  >
                    {t.sponsor}
                  </p>
                  {t.track_description && (
                    <p className="text-[#0F2C23]/55 mt-1" style={{ fontFamily: FN, fontSize: 12 }}>
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
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: "rgba(15,44,35,0.03)",
            border: "1px solid rgba(15,44,35,0.08)",
          }}
        >
          <p
            className="text-[10px] tracking-[0.16em] uppercase font-bold mb-4"
            style={{ fontFamily: PX, color: "rgba(15,44,35,0.5)" }}
          >
            Judging Criteria
          </p>
          <div className="flex flex-col gap-3">
            {h.judging_criteria!.map((c, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl">
                <span
                  className="font-black text-[#0F2C23]/20 leading-none shrink-0 mt-0.5"
                  style={{ fontFamily: PX, fontSize: 11, width: 20 }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <p
                    className="font-bold text-[#0F2C23] uppercase"
                    style={{ fontFamily: PX, fontSize: 12 }}
                  >
                    {c.name}
                  </p>
                  {c.description && (
                    <p
                      className="text-[#0F2C23]/50 mt-0.5"
                      style={{ fontFamily: FN, fontSize: 11 }}
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
    </div>
  );
}
