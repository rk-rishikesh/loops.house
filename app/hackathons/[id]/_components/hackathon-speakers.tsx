"use client";

import Image from "next/image";
import type { StoredSpeaker } from "@/lib/data-mappers";
import { PX, FN } from "./constants";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function HackathonSpeakersSection({
  speakers,
}: {
  speakers: StoredSpeaker[];
}) {
  if (!speakers || speakers.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-14 py-14">
        <p
          className="font-black uppercase leading-none select-none mb-10"
          style={{
            fontFamily: FN,
            fontSize: "clamp(48px, 6vw, 80px)",
            letterSpacing: "-0.04em",
            lineHeight: 0.85,
            color: "#0F2C23",
          }}
        >
          SPEAKERS
        </p>
        <div
          className="rounded-3xl p-10"
          style={{
            backgroundColor: "rgba(15,44,35,0.02)",
            border: "1px solid rgba(15,44,35,0.06)",
          }}
        >
          <p
            className="text-sm leading-relaxed"
            style={{ fontFamily: FN, color: "rgba(15,44,35,0.65)" }}
          >
            No speakers have been added yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-14 py-14">
      <p
        className="font-black uppercase leading-none select-none mb-10"
        style={{
          fontFamily: FN,
          fontSize: "clamp(48px, 6vw, 80px)",
          letterSpacing: "-0.04em",
          lineHeight: 0.85,
          color: "#0F2C23",
        }}
      >
        SPEAKERS
      </p>

      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
      >
        {speakers.map((s) => (
          <div key={s.id} className="rounded-3xl p-8">
            <div className="flex flex-col items-center text-center gap-4">
              <div
                className="w-28 h-28 md:w-32 md:h-32 rounded-3xl overflow-hidden"
                style={{ backgroundColor: "#0F2C23" }}
              >
                {s.image_url ? (
                  <Image
                    src={s.image_url}
                    alt={s.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                    priority={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span
                      className="font-black uppercase"
                      style={{
                        fontFamily: PX,
                        color: "#E2FEA5",
                        fontSize: 28,
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {initials(s.name)}
                    </span>
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p
                  className="font-black uppercase leading-tight"
                  style={{
                    fontFamily: FN,
                    fontSize: "clamp(18px, 2vw, 26px)",
                    letterSpacing: "-0.02em",
                    color: "#0F2C23",
                    margin: 0,
                  }}
                >
                  {s.name}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
