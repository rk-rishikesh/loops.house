"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useProjects, useTeams } from "@/lib/queries";
import { getBoosters, type StoredBooster, type BoosterType } from "@/lib/storage";
import Image from "next/image";

function CardSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
          <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-800 rounded" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-7 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
        <div className="h-7 w-28 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
      </div>
    </div>
  );
}

export default function ProjectHubPage() {
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: teams = [], isLoading: loadingTeams } = useTeams();
  const loading = loadingProjects || loadingTeams;
  const [section, setSection] = useState<"home" | "projects" | "teams" | "boosters">("home");
  const [boosterType, setBoosterType] = useState<BoosterType>("idea");
  const [boosters, setBoosters] = useState<StoredBooster[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const list = await getBoosters();
      if (active) setBoosters(list);
    })();
    return () => {
      active = false;
    };
  }, []);

  const boostersForType = boosters.filter((b) => (b.booster_type ?? "idea") === boosterType);

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between">
        {section !== "home" && (
          <button
            type="button"
            onClick={() => setSection("home")}
            className="text-sm text-zinc-600 dark:text-zinc-300 hover:underline"
          >
            <Image
              src="/builder/back.svg"
              alt="Back to sections"
              width={24}
              height={24}
              unoptimized
            />
          </button>
        )}
      </div>

      {section === "home" && (
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Left hero text */}
          <div className="flex-1 flex items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.35em] text-zinc-300 uppercase">
                Builder hub
              </p>
              <h2 className="mt-3 text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-zinc-900 dark:text-zinc-50">
                BOOST
                <br />
                YOUR
                <br />
                PROJECT
              </h2>
            </div>
          </div>

          {/* Right cards */}
          <div className="flex-[1.4] grid gap-4 grid-cols-1 lg:grid-cols-2 lg:grid-rows-3 lg:h-[580px]">
            {/* Boosters – tall card spanning full height */}
            <div
              className="relative col-span-1 row-span-3 rounded-3xl bg-[#20332b] text-[#ECEEE5] p-6 lg:p-8 flex flex-col justify-between hover:bg-[#1a2922] transition-colors"
            >
              <div className="mt-6">
                <div className="rounded-4xl text-[#ECEEE5] divide-y divide-[#ECEEE5]/25">
                  {(
                    [
                      ["idea", "Idea booster"],
                      ["momentum", "Momentum booster"],
                      ["capital", "Capital booster"],
                    ] as [BoosterType, string][]
                  ).map(([type, label], index) => {
                    const active = boosterType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setBoosterType(type);
                          setSection("boosters");
                        }}
                        className={`w-full flex items-center justify-between gap-4 py-4 ${
                          active ? "opacity-100" : "opacity-70 hover:opacity-100"
                        } transition-opacity`}
                      >
                        <div className="flex items-baseline gap-4">
                          <span className="text-2xl font-extrabold tracking-[0.25em]">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="text-xs uppercase tracking-[0.18em] text-[#ECEEE5]">
                            {label}
                          </span>
                        </div>
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ECEEE5] text-[#20332b]">
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-8 flex justify-center">
                  <img
                    src="/builder/woolCat.svg"
                    alt="Loops House builder mascot"
                    className="h-40 w-auto opacity-90"
                  />
                </div>
              </div>
            </div>

            {/* Projects card */}
            <button
              type="button"
              onClick={() => setSection("projects")}
              className="relative rounded-3xl bg-[#20332b] text-[#ECEEE5] p-6 lg:p-8 flex flex-col justify-between hover:bg-[#1a2922] transition-colors col-span-1 row-span-2"
            >
              <span className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ECEEE5] text-[#20332b]">
                <ArrowRight className="w-4 h-4" />
              </span>
              <div className="mt-4 flex-1 flex items-center justify-center">
                <span className="text-sm tracking-[0.2em] uppercase">Projects</span>
              </div>
            </button>

            {/* My teams card */}
            <button
              type="button"
              onClick={() => setSection("teams")}
              className="relative rounded-3xl bg-[#20332b] text-[#ECEEE5] p-6 lg:p-8 flex flex-col justify-between hover:bg-[#1a2922] transition-colors col-span-1 row-span-1"
            >
              <span className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ECEEE5] text-[#20332b]">
                <ArrowRight className="w-4 h-4" />
              </span>
              <div className="mt-4 flex-1 flex items-center justify-center">
                <span className="text-sm tracking-[0.2em] uppercase">My teams</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {section === "projects" && (
        <>
          <section className="mt-4">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : projects.length === 0 ? (
              <div className="py-10 px-6 rounded-3xl border border-zinc-800 bg-[#20332b] text-center text-[#20332b]">
                <Sparkles className="w-10 h-10 mx-auto text-[#A1AA97]" />
                <p className="mt-3 text-sm">No projects yet.</p>
                <Link
                  href="/builder/new"
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#20332b]/50 px-4 py-1.5 text-xs uppercase tracking-[0.18em] hover:bg-[#20332b] hover:text-[#20332b] transition-colors"
                >
                  <PlusCircle className="w-3 h-3" />
                  Create new project
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-24 lg:flex-row top-8 relative">
                {/* Left: numbered project list */}
                <div className="flex-1">
                  <div className="space-y-4 max-h-[515px] overflow-y-auto pr-2 no-scrollbar">
                    {projects.map((p, idx) => (
                      <div key={p.project_id} className="space-y-8">
                        <Link
                          href={`/builder/projects/${p.project_id}`}
                          className="flex items-center justify-between gap-4 text-left group"
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-3xl font-extrabold tracking-[0.25em] text-[#20332b]">
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                            <div className="flex flex-col">
                              <span className="text-xs uppercase tracking-[0.18em] text-[#20332b]">
                                {p.name}
                              </span>
                              {p.tagline && (
                                <span className="text-[11px] text-[#727a69] line-clamp-1">
                                  {p.tagline}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ECEEE5] text-[#20332b] group-hover:bg-white transition-colors">
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        </Link>
                        {idx !== projects.length - 1 && (
                          <div className="h-px w-full bg-[#ECEEE5]/30" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: create new project card */}
                <div className="w-full lg:w-1/3">
                  <Link
                    href="/builder/new"
                    className="relative block h-[515px] rounded-3xl bg-[#20332b] text-[#ECEEE5] p-6 lg:p-8 hover:bg-[#1a2922] transition-colors"
                  >
                    <Image
                      src="/builder/flower.svg"
                      alt="Decorative flower"
                      width={40}
                      height={40}
                      unoptimized
                      className="absolute -left-14 top-6 h-24 w-24"
                    />
                    <div className="flex h-full items-center justify-center">
                      <span className="text-xs uppercase tracking-[0.2em]">
                        Create new project
                      </span>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </section>

          <section className="mt-6">
            <button
              type="button"
              onClick={() => setSection("teams")}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#ECEEE5]/80 hover:text-white"
            >
              <Users className="w-4 h-4" /> Manage teams
            </button>
          </section>
        </>
      )}

      {section === "teams" && (
        <section className="pt-2">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Manage teams</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              href="/builder/teams"
              className="flex items-center gap-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-sky-500 hover:bg-sky-50/30 dark:hover:bg-sky-900/10 transition-colors group"
            >
              <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
                <Users className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-zinc-900 dark:text-white">My teams</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {teams.length === 0 ? "No teams yet" : `${teams.length} team${teams.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-sky-500 shrink-0" />
            </Link>
            <Link
              href="/builder/teams"
              className="flex items-center gap-4 p-5 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-sky-500 hover:bg-sky-50/30 dark:hover:bg-sky-900/10 transition-colors group"
            >
              <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-zinc-900 dark:text-white">Create new team</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Add a team, then create projects under it.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-sky-500 shrink-0" />
            </Link>
          </div>
        </section>
      )}

      {section === "boosters" && (
        <section className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Boosters
            </h2>

          </div>

          {boostersForType.length === 0 ? (
            <div className="py-8 px-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
              <Sparkles className="w-8 h-8 mx-auto text-zinc-400" />
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                No boosters of this type yet. Ask a host to create one.
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                You&apos;ll see idea, momentum, or capital boosters here once they exist in this browser.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {boostersForType.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                >
                  <h3 className="font-semibold text-zinc-900 dark:text-white">{b.name}</h3>
                  {b.theme && (
                    <p className="mt-1 text-xs uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      {b.theme}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {(b.problem_statements ?? []).length} problem statements ·{" "}
                    {(b.booster_type ?? "idea")}
                  </p>
                  <Link
                    href={`/boosters/${b.booster_type ?? "idea"}/${b.id}`}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    View booster
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
