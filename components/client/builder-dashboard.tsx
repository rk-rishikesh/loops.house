"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, TrendingUp, DollarSign, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import type { StoredBooster, BoosterType } from "@/lib/data-mappers";
import { LogoutButton } from "@/components/logout-button";
import { useIsMounted } from "@/hooks/use-is-mounted";

// ─── Booster meta ─────────────────────────────────────────────────────────────
const BOOSTER_META: Record<
  BoosterType,
  { icon: React.ReactNode; label: string; index: string }
> = {
  idea: { icon: <Zap size={15} />, label: "Idea Booster", index: "01" },
  momentum: {
    icon: <TrendingUp size={15} />,
    label: "Momentum Booster",
    index: "02",
  },
  capital: {
    icon: <DollarSign size={15} />,
    label: "Capital Booster",
    index: "03",
  },
};

function ArrowCircle({
  dark = false,
  size = 40,
}: {
  dark?: boolean;
  size?: number;
}) {
  return (
    <span
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center rounded-full shrink-0 ${dark ? "bg-[#2d4a3e] text-[#f5f0e8]" : "bg-[#2d4a3e] text-[#f5f0e8]"}`}
    >
      <ArrowUpRight size={size * 0.4} />
    </span>
  );
}

function SlideIn({
  children,
  active,
}: {
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <div
      className="transition-all duration-400 ease-out"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : "translateY(16px)",
        pointerEvents: active ? "auto" : "none",
      }}
    >
      {children}
    </div>
  );
}

export function BuilderDashboard({
  allBoosters,
}: {
  allBoosters: StoredBooster[];
}) {
  const router = useRouter();
  const mounted = useIsMounted();
  const [navHighlightIndex, setNavHighlightIndex] = useState(0);
  const [activeBoosterType, setActiveBoosterType] =
    useState<BoosterType>("idea");

  const boosters = allBoosters.filter(
    (b) => (b.booster_type ?? "idea") === activeBoosterType,
  );

  useEffect(() => {
    const id = setInterval(
      () => setNavHighlightIndex((i) => (i + 1) % 5),
      2200,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-full bg-[#f0ebe0] font-sans">
      <div className="absolute top-6 right-8 z-50">
        <LogoutButton />
      </div>
      {/* ── Top strip nav ───────────────────────────────────────────────────── */}
      <div className="px-10 pt-8">
        <div
          className="flex w-full border-t border-b border-[#1a1a1a] text-[10px] tracking-[0.18em] uppercase font-bold text-[#1a1a1a]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex-1 min-w-0 py-4 flex items-center justify-center border-r border-[#1a1a1a] bg-transparent hover:bg-[#e1dbcf] cursor-pointer"
          >
            <span>Portal</span>
          </button>
          <button
            type="button"
            className="flex-1 min-w-0 py-4 flex items-center justify-center border-r border-[#1a1a1a] bg-transparent cursor-default"
          >
            <span>Builder Hub</span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/builder/boosters")}
            className="flex-1 min-w-0 py-4 flex items-center justify-center border-r border-[#1a1a1a] bg-transparent hover:bg-[#e1dbcf] cursor-pointer"
          >
            <span>Boosters</span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/builder/projects")}
            className="flex-1 min-w-0 py-4 flex items-center justify-center bg-transparent hover:bg-[#e1dbcf] cursor-pointer"
          >
            <span>Projects</span>
          </button>
        </div>
      </div>

      <SlideIn active={mounted}>
        <div className="relative min-h-screen overflow-hidden flex flex-col">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none select-none">
            <div className="pl-16">
              <h1
                className="text-[clamp(80px,11vw,160px)] font-extrabold leading-[0.9] tracking-tight text-[#1a1a1a]"
                style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
              >
                Build
              </h1>
            </div>
            <div className="pb-12 pr-16 flex justify-end">
              <h1
                className="text-[clamp(80px,11vw,160px)] font-extrabold leading-[0.9] tracking-tight text-[#1a1a1a]"
                style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
              >
                Ship.
              </h1>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-12 gap-5 px-16 py-16 min-h-[520px] items-center">
            <div className="col-span-3 self-center mt-20">
              <p
                className="text-[#1a1a1a]/60 text-sm leading-relaxed max-w-[220px]"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Loops House is home for builders—validate ideas, gain momentum,
                and connect with capital. Your dashboard to projects, boosters,
                and teams.
              </p>
            </div>

            <div className="col-span-4 col-start-5 self-center top-12 relative">
              <div
                className="rounded-2xl p-10 shadow-xl"
                style={{ backgroundColor: "#d6cfc0" }}
              >
                {(["idea", "momentum", "capital"] as BoosterType[]).map(
                  (type) => {
                    const meta = BOOSTER_META[type];
                    const active = type === activeBoosterType;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setActiveBoosterType(type)}
                        className="w-full flex items-center justify-between py-4 group cursor-pointer bg-transparent border-none text-left"
                      >
                        <div className="flex items-center gap-6">
                          <span
                            className="text-[#2d4a3e] font-black leading-none"
                            style={{
                              fontSize: "clamp(30px, 4vw, 44px)",
                              fontFamily: "'Inter', sans-serif",
                              letterSpacing: "-0.02em",
                              opacity: active ? 1 : 0.4,
                            }}
                          >
                            {meta.index}
                          </span>
                          <div>
                            <p
                              className="text-[10px] tracking-[0.18em] uppercase font-semibold leading-none mb-1"
                              style={{
                                fontFamily: "'Inter', sans-serif",
                                color: active
                                  ? "#2d4a3e"
                                  : "rgba(45,74,62,0.6)",
                              }}
                            >
                              {type.toUpperCase()}
                            </p>
                            <p
                              className="text-[10px] tracking-[0.18em] uppercase font-semibold leading-none"
                              style={{
                                fontFamily: "'Inter', sans-serif",
                                color: active
                                  ? "#2d4a3e"
                                  : "rgba(45,74,62,0.4)",
                              }}
                            >
                              BOOSTER
                            </p>
                          </div>
                        </div>
                        <Link href={`/builder/boosters/${type}`}>
                          <ArrowCircle />
                        </Link>
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <div className="col-span-3 col-start-10 self-start mt-24">
              <nav className="mb-10">
                {[
                  { label: "Dashboard", href: "/builder" },
                  { label: "My Projects", href: "/builder/projects" },
                  { label: "Boosters", href: "/builder/boosters" },
                  { label: "My Teams", href: "/builder/teams" },
                  { label: "Residency", href: "/builder/teams" },
                ].map((item, i) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => router.push(item.href)}
                    className="w-full text-left text-lg font-semibold leading-[1.7] cursor-pointer hover:text-[#1a1a1a] transition-colors duration-300 border-none bg-transparent p-0"
                    style={{
                      color: i === navHighlightIndex ? "#1a1a1a" : "#1a1a1a40",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              <button
                type="button"
                onClick={() => router.push("/builder/projects")}
                className="flex items-center gap-0 rounded-full overflow-hidden cursor-pointer border-none mb-6 shadow-sm hover:shadow-md transition-shadow"
                style={{ backgroundColor: "#2d4a3e" }}
              >
                <span className="px-6 py-3 text-[11px] tracking-[0.18em] uppercase font-bold text-[#f0ebe0]">
                  Project Hub
                </span>
                <span className="w-10 h-10 flex items-center justify-center bg-[#d6cfc0] rounded-full m-1">
                  <ArrowUpRight size={14} className="text-[#2d4a3e]" />
                </span>
              </button>

              <p
                className="text-xs text-[#1a1a1a]/50 leading-relaxed max-w-[200px]"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Your command center for projects, boosters, and teams.
              </p>
            </div>

            <div className="col-span-3 self-end">
              <button
                type="button"
                onClick={() => router.push("/builder/teams")}
                className="rounded-2xl w-[180px] h-[180px] flex flex-col cursor-pointer border-none text-left hover:scale-[1.02] transition-transform"
                style={{ backgroundColor: "#c5bd9e" }}
              >
                <Image
                  alt=""
                  width={190}
                  height={190}
                  src="/residency/cats.png"
                  className="-top-8 relative flex justify-end"
                />
                <div className="flex flex-row justify-between align-middle items-center">
                  <p className="text-[24px] tracking-[0.2em] uppercase font-bold text-[#f0ebe0]">
                    Residency
                  </p>
                  <div className="flex justify-center">
                    <ArrowCircle size={24} />
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <section className="px-16 pb-20">
          <div className="flex items-baseline justify-between gap-4 flex-wrap mb-4">
            <h2
              className="font-black text-[#2d4a3e] uppercase"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "clamp(20px, 3vw, 30px)",
                letterSpacing: "-0.02em",
              }}
            >
              Active Boosters
            </h2>
            <div className="flex gap-2">
              {(["idea", "momentum", "capital"] as BoosterType[]).map(
                (type) => {
                  const active = type === activeBoosterType;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setActiveBoosterType(type)}
                      className={`px-3 py-1.5 text-[10px] tracking-[0.18em] uppercase font-bold rounded-full border cursor-pointer transition-colors ${active ? "bg-[#2d4a3e] text-[#f0ebe0] border-[#2d4a3e]" : "bg-transparent text-[#2d4a3e] border-[#2d4a3e]/30 hover:border-[#2d4a3e]"}`}
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {type}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {boosters.length === 0 ? (
            <div
              className="rounded-2xl px-8 py-6 border border-dashed border-[#2d4a3e]/30 text-sm text-[#2d4a3e]/70"
              style={{
                backgroundColor: "#e8e2d4",
                fontFamily: "Georgia, serif",
              }}
            >
              No boosters of this type yet. Hosts can create new programs from
              the Host dashboard.
            </div>
          ) : (
            <ul className="mt-4 space-y-3 max-w-3xl">
              {boosters.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/builder/boosters/${activeBoosterType}/${b.id}`}
                    className="no-underline group block"
                  >
                    <div
                      className="rounded-2xl px-6 py-5 flex items-center justify-between gap-4 transition-all duration-150 group-hover:scale-[1.01]"
                      style={{ backgroundColor: "#d6cfc0" }}
                    >
                      <div className="min-w-0">
                        <p
                          className="text-[11px] tracking-[0.18em] uppercase font-bold text-[#2d4a3e]/70 mb-1"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          {BOOSTER_META[activeBoosterType].label}
                        </p>
                        <p
                          className="font-semibold text-[#2d4a3e] truncate"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 15,
                          }}
                        >
                          {b.name}
                        </p>
                        {b.theme && (
                          <p
                            className="mt-1 text-xs text-[#2d4a3e]/70 truncate"
                            style={{ fontFamily: "Georgia, serif" }}
                          >
                            {b.theme}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            router.push(
                              `/builder/boosters/${activeBoosterType}/${b.id}/submit`,
                            );
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#2d4a3e] text-[#f0ebe0] px-4 py-1.5 text-[10px] tracking-[0.16em] uppercase font-bold border-none cursor-pointer"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          Apply
                        </button>
                        <ArrowCircle size={34} />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </SlideIn>
    </div>
  );
}
