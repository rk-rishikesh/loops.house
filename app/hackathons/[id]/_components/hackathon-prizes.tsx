"use client";

import { Gavel, Trophy } from "lucide-react";
import type { StoredHackathon } from "@/lib/data-mappers";
import { FN } from "./constants";

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

export function HackathonPrizesSection({ hackathon }: { hackathon: StoredHackathon }) {
  const h = hackathon;
  const hasTracks = (h.sponsor_tracks?.length ?? 0) > 0;
  const hasChallenges = (h.problem_statements?.length ?? 0) > 0;
  const hasCriteria = (h.judging_criteria?.length ?? 0) > 0;

  return (
    <div className="flex-1 overflow-y-auto px-14 py-14">
      <p
        className="font-black uppercase leading-none select-none mb-8"
        style={{
          fontFamily: FN,
          fontSize: "clamp(48px, 6vw, 80px)",
          letterSpacing: "-0.04em",
          lineHeight: 0.85,
          color: "#0F2C23",
        }}
      >
        PRIZES
      </p>

      {/* Prize Pool */}
      <section className="mb-10">
        <div className="flex items-center gap-4 mb-6">
          <h3 className="text-xl font-black uppercase text-[#0F2C23]" style={{ fontFamily: FN }}>
            Prize Pool
          </h3>
          <div className="h-px flex-1 bg-[#0F2C23]/10" />
        </div>

        {h.bounty_pool_summary ? (
          <div
            className="rounded-[32px] border border-[#0F2C23]/10 overflow-hidden"
            style={{
              backgroundColor: "rgba(15,44,35,0.04)",
              boxShadow: "0 20px 40px -15px rgba(15,44,35,0.06)",
            }}
          >
            <div className="px-8 py-6">
              <div className="flex items-center gap-2 mb-5">
                <Trophy size={16} style={{ color: "#0F2C23" }} />
                <p
                  className="m-0 font-bold uppercase tracking-[0.14em] text-[#0F2C23]/55"
                  style={{ fontFamily: FN, fontSize: 12 }}
                >
                  Prize Breakdown
                </p>
              </div>

              <div className="space-y-4">
                {parsePrizeSummaryBlocks(h.bounty_pool_summary).map((p, i) => (
                  <div
                    key={`${p.title}-${i}`}
                    className="flex items-start justify-between gap-6 border-b border-[#0F2C23]/10 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="m-0 font-black text-[#0F2C23]" style={{ fontFamily: FN, fontSize: 16 }}>
                        {p.title}
                      </p>
                      {p.description && (
                        <p
                          className="mt-2 mb-2 text-sm leading-relaxed text-[#0F2C23]/60 whitespace-pre-wrap"
                          style={{ fontFamily: FN }}
                        >
                          {p.description}
                        </p>
                      )}
                    </div>
                    <p
                      className="m-0 shrink-0 font-black text-[#0F2C23]"
                      style={{ fontFamily: FN, fontSize: "clamp(18px, 2.1vw, 24px)", lineHeight: 1.08 }}
                    >
                      {typeof p.amount === "number" && p.amount > 0 && p.currency
                        ? `${p.currency} ${p.amount.toLocaleString()}`
                        : "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p
            className="text-sm leading-relaxed"
            style={{ fontFamily: FN, color: "rgba(15,44,35,0.7)" }}
          >
            Prize details will be announced soon.
          </p>
        )}
      </section>

      {/* Challenges */}
      {hasChallenges && (
        <section className="mb-10">
          <div className="flex items-center gap-4 mb-6">
            <h3 className="text-xl font-black uppercase text-[#0F2C23]" style={{ fontFamily: FN }}>
              Challenges
            </h3>
            <div className="h-px flex-1 bg-[#0F2C23]/10" />
          </div>

          <div className="space-y-4">
            {h.problem_statements.map((s, i) => (
              <div
                key={i}
                className="rounded-[32px] px-7 py-6"
                style={{
                  backgroundColor: "#0F2C23",
                  boxShadow: "0 20px 40px -18px rgba(15,44,35,0.20)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <p
                    className="m-0 uppercase font-black tracking-[0.14em]"
                    style={{ fontFamily: FN, fontSize: 12, color: "rgba(248,255,232,0.55)" }}
                  >
                    Challenge {String(i + 1).padStart(2, "0")}
                  </p>
                </div>
                <p
                  className="mt-3 mb-0 text-[15px] leading-relaxed"
                  style={{ fontFamily: FN, color: "rgba(248,255,232,0.78)" }}
                >
                  {s}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sponsor Tracks */}
      {hasTracks && (
        <section className="mb-10">
          <div className="flex items-center gap-4 mb-6">
            <h3 className="text-xl font-black uppercase text-[#0F2C23]" style={{ fontFamily: FN }}>
              Sponsor Tracks
            </h3>
            <div className="h-px flex-1 bg-[#0F2C23]/10" />
          </div>

          <div
            className="rounded-[32px] border border-[#0F2C23]/10"
            style={{
              backgroundColor: "rgba(15,44,35,0.04)",
              boxShadow: "0 20px 40px -15px rgba(15,44,35,0.06)",
            }}
          >
            <div className="px-8 py-6">
              <div className="flex flex-col gap-4">
                {h.sponsor_tracks!.map((t, i) => (
                  <div
                    key={i}
                    className="rounded-2xl px-6 py-5 border border-[#0F2C23]/10"
                    style={{ backgroundColor: "rgba(255,255,255,0.55)" }}
                  >
                    <p className="m-0 font-black uppercase text-[#0F2C23]" style={{ fontFamily: FN, fontSize: 14 }}>
                      {t.sponsor}
                    </p>
                    {t.track_description && (
                      <p
                        className="mt-2 mb-0 text-[13px] leading-relaxed text-[#0F2C23]/60"
                        style={{ fontFamily: FN }}
                      >
                        {t.track_description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Judging Criteria */}
      {hasCriteria && (
        <section className="mb-6">
          <div className="p-10 rounded-[48px] bg-[#E2FEA5] text-[#0F2C23] shadow-[0_30px_60px_-15px_rgba(226,254,165,0.4)] relative overflow-hidden">
            <div className="absolute -top-4 -right-4 opacity-5 rotate-12">
              <Trophy size={120} />
            </div>
            <div className="flex items-center gap-3 mb-8">
              <Gavel size={20} />
              <h3 className="text-xl font-black uppercase" style={{ fontFamily: FN }}>
                Judging Criteria
              </h3>
              <div className="h-px flex-1 bg-[#0F2C23]/15" />
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
        </section>
      )}
    </div>
  );
}
