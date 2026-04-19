"use client";

import { CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import type { StoredHackathon } from "@/lib/data-mappers";
import { FN } from "./constants";

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

function getCountdown(iso?: string, nowMs = Date.now()) {
  if (!iso) return null;
  const targetMs = new Date(iso).getTime();
  if (Number.isNaN(targetMs)) return null;
  const diffMs = targetMs - nowMs;
  if (diffMs <= 0) return null;

  const totalMinutes = Math.floor(diffMs / 60000);
  return {
    days: Math.floor(totalMinutes / (60 * 24)),
    hours: Math.floor((totalMinutes % (60 * 24)) / 60),
    minutes: totalMinutes % 60,
  };
}

export function HackathonScheduleSection({
  hackathon,
}: {
  hackathon: StoredHackathon;
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const h = hackathon;
  const hasAnyDate =
    h.start_date ||
    h.submission_deadline ||
    h.judging_deadline ||
    h.results_date;
  const rows: { label: string; value: string; iso: string }[] = [
    ...(h.start_date
      ? [{ label: "Start date", value: fmt(h.start_date)!, iso: h.start_date }]
      : []),
    ...(h.submission_deadline
      ? [{
          label: "Submission deadline",
          value: fmt(h.submission_deadline)!,
          iso: h.submission_deadline,
        }]
      : []),
    ...(h.judging_deadline
      ? [{
          label: "Judging deadline",
          value: fmt(h.judging_deadline)!,
          iso: h.judging_deadline,
        }]
      : []),
    ...(h.results_date ? [{ label: "Results", value: fmt(h.results_date)!, iso: h.results_date }] : []),
  ];

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
        SCHEDULE
      </p>
      {hasAnyDate ? (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <h3
              className="text-xl font-black uppercase text-[#0F2C23]"
              style={{ fontFamily: FN }}
            >
              Timeline
            </h3>
            <div className="h-px flex-1 bg-[#0F2C23]/10" />
          </div>

          <div
            className="rounded-[32px] border border-[#0F2C23]/10 overflow-hidden"
            style={{
              backgroundColor: "rgba(15,44,35,0.04)",
              boxShadow: "0 20px 40px -15px rgba(15,44,35,0.06)",
            }}
          >
            <div className="px-8 py-6">
              {rows.map((r, idx) => (
                <div
                  key={r.label}
                  className="py-6 flex items-end justify-between gap-6"
                  style={{
                    borderBottom:
                      idx === rows.length - 1
                        ? "none"
                        : "1px solid rgba(15,44,35,0.10)",
                  }}
                >
                  <div>
                    <p
                      className="m-0 uppercase font-black"
                      style={{
                        fontFamily: FN,
                        fontSize: 12,
                        letterSpacing: "0.14em",
                        color: "rgba(15,44,35,0.55)",
                      }}
                    >
                      {r.label}
                    </p>
                    <p
                      className="mt-2 m-0 font-black text-[#0F2C23]"
                      style={{
                        fontFamily: FN,
                        fontSize: "clamp(18px, 2.1vw, 24px)",
                        letterSpacing: "-0.015em",
                        lineHeight: 1.08,
                      }}
                    >
                      {r.value}
                    </p>
                  </div>
                  {(() => {
                    const countdown = getCountdown(r.iso, nowMs);
                    if (!countdown) return null;
                    return (
                      <div
                        className="rounded-2xl px-4 py-2 text-right"
                        style={{
                          backgroundColor: "rgba(15,44,35,0.04)",
                          border: "1px solid rgba(15,44,35,0.1)",
                        }}
                      >
                        <p
                          className="m-0 leading-none font-black text-[#0F2C23]"
                          style={{ fontFamily: FN, fontSize: 18 }}
                        >
                          {countdown.days}d {String(countdown.hours).padStart(2, "0")}h{" "}
                          {String(countdown.minutes).padStart(2, "0")}m
                        </p>
                        <p
                          className="m-0 mt-1 uppercase font-bold tracking-[0.14em]"
                          style={{ fontFamily: FN, fontSize: 9, color: "rgba(15,44,35,0.45)" }}
                        >
                          Remaining
                        </p>
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <CalendarDays
            size={24}
            style={{ color: "rgba(15,44,35,0.35)", marginBottom: 16 }}
          />
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
