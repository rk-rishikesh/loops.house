"use client";

import Image from "next/image";
import { PX, FN } from "./constants";

export function HackathonSpeakersSection() {
  const speakers = [
    { name: "Asha Verma", role: "AI Product Lead", img: "/dummy/speakers/one.png" },
    { name: "Noah Kim", role: "Founding Engineer", img: "/dummy/speakers/two.png" },
    { name: "Mira Patel", role: "Research Engineer", img: "/dummy/speakers/three.png" },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-14 py-14">
      <p
        className="font-black uppercase leading-none select-none mb-10"
        style={{
          fontFamily: PX,
          fontSize: "clamp(48px, 6vw, 80px)",
          letterSpacing: "-0.04em",
          lineHeight: 0.85,
          color: "#0F2C23",
        }}
      >
        SPEAKERS
      </p>

      <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        {speakers.map((s) => (
          <div
            key={s.name}
            className="rounded-3xl p-8"
            style={{
              backgroundColor: "rgba(15,44,35,0.02)",
              border: "1px solid rgba(15,44,35,0.06)",
            }}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div
                className="w-28 h-28 md:w-32 md:h-32 rounded-3xl overflow-hidden"
                style={{ backgroundColor: "#0F2C23" }}
              >
                <Image
                  src={s.img}
                  alt={s.name}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                  priority={false}
                />
              </div>

              <div className="min-w-0">
                <p
                  className="text-[9px] tracking-[0.22em] uppercase font-bold mb-2"
                  style={{ fontFamily: PX, color: "rgba(15,44,35,0.55)" }}
                >
                  Speaker
                </p>
                <p
                  className="font-black uppercase leading-tight"
                  style={{
                    fontFamily: PX,
                    fontSize: "clamp(18px, 2vw, 26px)",
                    letterSpacing: "-0.02em",
                    color: "#0F2C23",
                    margin: 0,
                  }}
                >
                  {s.name}
                </p>
                <p
                  className="mt-1 text-sm leading-relaxed"
                  style={{ fontFamily: FN, color: "rgba(15,44,35,0.7)" }}
                >
                  {s.role}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
