"use client";

import { CalendarDays } from "lucide-react";
import type { StoredHackathon } from "@/lib/data-mappers";
import { PX, FN } from "./constants";

export function HackathonScheduleSection({ hackathon }: { hackathon: StoredHackathon }) {
  const h = hackathon;
  const hasAnyDate = h.start_date || h.submission_deadline || h.judging_deadline || h.results_date;
  const rows: { label: string; value: string }[] = [
    ...(h.start_date ? [{ label: "Start date", value: h.start_date }] : []),
    ...(h.submission_deadline
      ? [{ label: "Submission deadline", value: h.submission_deadline }]
      : []),
    ...(h.judging_deadline ? [{ label: "Judging deadline", value: h.judging_deadline }] : []),
    ...(h.results_date ? [{ label: "Results", value: h.results_date }] : []),
  ];

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
        SCHEDULE
      </p>
      {hasAnyDate ? (
        <div className="rounded-[28px] bg-transparent">
          <div className="px-2 py-2">
            <div
              className="rounded-[22px] px-10 py-6"
              style={{ backgroundColor: "rgba(248,255,232,0.9)" }}
            >
              {rows.map((r, idx) => (
                <div
                  key={r.label}
                  className="flex gap-5 py-4"
                  style={{ marginTop: idx === 0 ? 0 : 4 }}
                >
                  <div className="flex flex-col items-center pt-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: "#0F2C23" }}
                    />
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
                      className="m-0 uppercase font-black"
                      style={{
                        fontFamily: PX,
                        fontSize: 12,
                        letterSpacing: "0.12em",
                        color: "rgba(15,44,35,0.75)",
                      }}
                    >
                      {r.label}
                    </p>
                    <p
                      className="m-0 text-right"
                      style={{
                        fontFamily: FN,
                        fontSize: "clamp(14px, 1.4vw, 16px)",
                        letterSpacing: "0",
                        color: "rgba(15,44,35,0.85)",
                      }}
                    >
                      {r.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <CalendarDays size={24} style={{ color: "rgba(15,44,35,0.35)", marginBottom: 16 }} />
          <p
            className="text-sm text-center max-w-[360px]"
            style={{ fontFamily: FN, color: "rgba(15,44,35,0.55)" }}
          >
            Schedule details will be available soon.
          </p>
        </div>
      )}
    </div>
  );
}
