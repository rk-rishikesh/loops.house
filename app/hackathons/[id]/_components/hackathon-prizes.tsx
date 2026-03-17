"use client";

import { Trophy } from "lucide-react";
import type { StoredHackathon } from "@/lib/data-mappers";
import { FN, PX } from "./constants";

export function HackathonPrizesSection({ hackathon }: { hackathon: StoredHackathon }) {
  const h = hackathon;
  const hasTracks = (h.sponsor_tracks?.length ?? 0) > 0;
  const hasChallenges = (h.problem_statements?.length ?? 0) > 0;

  return (
    <div className="flex-1 overflow-y-auto px-14 py-14">
      <p
        className="font-black uppercase leading-none select-none mb-8"
        style={{
          fontFamily: PX,
          fontSize: "clamp(48px, 6vw, 80px)",
          letterSpacing: "-0.04em",
          lineHeight: 0.85,
          color: "#0F2C23",
        }}
      >
        PRIZES
      </p>

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={16} style={{ color: "#0F2C23" }} />
          <p
            className="text-[10px] tracking-[0.22em] uppercase font-bold"
            style={{ fontFamily: PX, color: "rgba(15,44,35,0.7)" }}
          >
            Prize Pool
          </p>
        </div>
        {h.bounty_pool_summary ? (
          <p
            className="font-black uppercase"
            style={{
              fontFamily: PX,
              fontSize: "clamp(28px, 4vw, 42px)",
              letterSpacing: "-0.02em",
              color: "#0F2C23",
            }}
          >
            {h.bounty_pool_summary}
          </p>
        ) : (
          <p
            className="text-sm leading-relaxed"
            style={{ fontFamily: FN, color: "rgba(15,44,35,0.7)" }}
          >
            Prize details will be announced soon.
          </p>
        )}
      </section>

      {hasChallenges && (
        <section className="mb-8">
          <p
            className="text-[10px] tracking-[0.22em] uppercase font-bold mb-3"
            style={{ fontFamily: PX, color: "rgba(15,44,35,0.7)" }}
          >
            Challenges
          </p>
          <div className="flex flex-col gap-3">
            {h.problem_statements.map((s, i) => (
              <div key={i} className="flex items-baseline gap-3">
                <span
                  className="font-black shrink-0"
                  style={{
                    fontFamily: PX,
                    fontSize: 11,
                    width: 22,
                    color: "rgba(15,44,35,0.45)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p
                  className="text-[13px] leading-relaxed flex-1"
                  style={{ fontFamily: FN, color: "rgba(15,44,35,0.85)" }}
                >
                  {s}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {hasTracks && (
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: "rgba(15,44,35,0.03)",
            border: "1px solid rgba(15,44,35,0.08)",
          }}
        >
          <p
            className="text-[9px] tracking-[0.2em] uppercase font-bold mb-5"
            style={{ fontFamily: PX, color: "rgba(15,44,35,0.6)" }}
          >
            Sponsor Tracks
          </p>
          <div className="flex flex-col gap-4">
            {h.sponsor_tracks!.map((t, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-xl px-4 py-3"
                style={{ backgroundColor: "rgba(15,44,35,0.02)" }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                  style={{ backgroundColor: "#0F2C23" }}
                />
                <div>
                  <p
                    className="text-[13px] font-bold"
                    style={{ fontFamily: PX, color: "rgba(15,44,35,0.85)" }}
                  >
                    {t.sponsor}
                  </p>
                  {t.track_description && (
                    <p
                      className="text-[12px] mt-1 leading-relaxed"
                      style={{ fontFamily: FN, color: "rgba(15,44,35,0.65)" }}
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

      {h.judging_criteria && h.judging_criteria.length > 0 && (
        <div
          className="rounded-2xl p-8 mt-6"
          style={{
            backgroundColor: "rgba(15,44,35,0.03)",
            border: "1px solid rgba(15,44,35,0.08)",
          }}
        >
          <p
            className="text-[9px] tracking-[0.2em] uppercase font-bold mb-5"
            style={{ fontFamily: PX, color: "rgba(15,44,35,0.6)" }}
          >
            Judging Criteria
          </p>
          <div className="flex flex-col gap-3">
            {h.judging_criteria.map((c, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-3 rounded-xl"
                style={{ backgroundColor: "rgba(15,44,35,0.02)" }}
              >
                <span
                  className="font-black shrink-0"
                  style={{
                    fontFamily: PX,
                    fontSize: 11,
                    width: 20,
                    color: "rgba(15,44,35,0.35)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <p
                    className="text-[12px] font-bold"
                    style={{ fontFamily: PX, color: "rgba(15,44,35,0.85)" }}
                  >
                    {c.name}
                  </p>
                  {c.description && (
                    <p
                      className="text-[11px] mt-0.5 leading-relaxed"
                      style={{ fontFamily: FN, color: "rgba(15,44,35,0.65)" }}
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
