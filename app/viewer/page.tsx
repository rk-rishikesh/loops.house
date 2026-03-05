"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Code2, ArrowLeft, ArrowUpRight, Search, X } from "lucide-react";
import { useProjects } from "@/lib/queries";
import type { StoredProject } from "@/lib/storage";

// ─── Category strip (horizontal bar, all categories visible) ───────────────────
function CategoryStrip({
  categories,
  value,
  onChange,
}: {
  categories: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const options = [{ value: "", label: "All categories" }, ...categories.map((c) => ({ value: c, label: c }))];

  return (
    <div
      className="flex w-full border-t border-b border-[#1a1a1a]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="flex-1 min-w-0 py-3 text-[11px] tracking-[0.12em] uppercase font-bold text-[#1a1a1a] cursor-pointer border-none border-r border-[#1a1a1a] last:border-r-0 transition-colors"
            style={{
              backgroundColor: isSelected ? "#d9d2c2" : "#e8e2d4",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Arrow circle ─────────────────────────────────────────────────────────────
function ArrowCircle({ size = 44 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-flex items-center justify-center rounded-full bg-[#2d4a3e] text-[#f0ebe0] shrink-0 transition-transform duration-200"
    >
      <ArrowUpRight size={size * 0.38} />
    </span>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────
function ProjectRow({ project: p, index }: { project: StoredProject; index: number }) {
  return (
    <Link
      href={`/viewer/projects/${p.project_id}`}
      className="no-underline group"
    >
      <div
        className="grid items-start py-7 border-b border-[#2d4a3e]/12 transition-all duration-150 group-hover:bg-[#2d4a3e]/[0.03] rounded-sm"
        style={{
          gridTemplateColumns: "80px 1fr 1.6fr 56px",
          gap: "0 24px",
        }}
      >
        {/* Number */}
        <p
          className="font-bold text-[#2d4a3e] pt-0.5"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(13px, 1.4vw, 15px)",
          }}
        >
          {String(index + 1).padStart(2, "0")}.
        </p>

        {/* Chapter — name + tagline */}
        <div>
          <p
            className="font-semibold text-[#2d4a3e] mb-1.5 leading-snug"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(13px, 1.3vw, 15px)",
            }}
          >
            {p.name}
          </p>
          {/* Tags */}
          {(p.category || (p.tech_stack_tags ?? []).length > 0) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {p.category && (
                <span
                  className="text-[8px] tracking-[0.12em] uppercase font-bold px-2.5 py-1 rounded-sm"
                  style={{
                    backgroundColor: "rgba(45,74,62,0.1)",
                    color: "#2d4a3e",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {p.category}
                </span>
              )}
              {(p.tech_stack_tags ?? []).slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="text-[10px] px-2 py-0.5 rounded-sm"
                  style={{
                    backgroundColor: "rgba(45,74,62,0.06)",
                    color: "rgba(45,74,62,0.55)",
                    fontFamily: "Georgia, serif",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Description — logo + chat hint */}
        <div className="flex items-start gap-4">
          <p
            className="max-w-xl text-[#2d4a3e]/50 leading-relaxed text-sm"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {p.tagline}
          </p>
        </div>

        {/* Page / Arrow */}
        <div className="flex justify-end pt-0.5 pr-3">
          <ArrowCircle size={44} />
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div
      className="grid py-7 border-b border-[#2d4a3e]/10 animate-pulse"
      style={{ gridTemplateColumns: "80px 1fr 1.6fr 56px", gap: "0 24px" }}
    >
      <div className="h-4 w-8 rounded bg-[#2d4a3e]/08" />
      <div>
        <div className="h-4 w-36 rounded bg-[#2d4a3e]/08 mb-2" />
        <div className="h-3 w-24 rounded bg-[#2d4a3e]/05" />
      </div>
      <div className="h-3 w-full rounded bg-[#2d4a3e]/05" />
      <div className="w-11 h-11 rounded-full bg-[#2d4a3e]/07 ml-auto" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ViewerPage() {
  const { data: projects = [], isLoading: loading } = useProjects();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const categories = useMemo(() => {
    const cats = new Set<string>();
    projects.forEach((p) => { if (p.category) cats.add(p.category); });
    return Array.from(cats).sort();
  }, [projects]);

  const filtered = useMemo(() => {
    let result = projects;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.tagline ?? "").toLowerCase().includes(q)
      );
    }
    if (categoryFilter) {
      result = result.filter((p) => p.category === categoryFilter);
    }
    return result;
  }, [projects, search, categoryFilter]);

  const hasFilters = search || categoryFilter;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f0ebe0" }}>

      {/* ── Top strip nav ───────────────────────────────────────────────────── */}
      <div className="pt-0">
        <div
          className="flex w-full items-stretch border-t border-b border-[#1a1a1a] text-[10px] tracking-[0.18em] uppercase font-bold text-[#1a1a1a]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <Link
            href="/"
            className="w-[240px] max-w-xs px-10 py-8 flex items-center justify-start border-r border-[#1a1a1a] no-underline hover:bg-[#e1dbcf]"
          >
            <span className="flex items-center gap-2">
              <ArrowLeft size={11} />
              <span>Portal</span>
            </span>
          </Link>
          <div className="flex-1 min-w-0 py-8 flex items-center justify-center border-r border-[#1a1a1a]">
            <span>Loops Repository</span>
          </div>
          
        </div>
      </div>

      <div className="px-10 pt-10 pb-24">

        {/* ── Hero heading — large editorial stacked ───────────────────────── */}
        <div className="mb-16 flex flex-row justify-between">
          <h1
            className="font-black text-[#2d4a3e] leading-[0.88] uppercase"
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: "clamp(60px, 10vw, 148px)",
              letterSpacing: "-0.025em",
            }}
          >
            PROJECTS
            <br />
            REPOSITORY
          </h1>

          {/* Subheading — right aligned, below the fold of the big type */}
          <div className="flex justify-end">
            <div className="flex flex-col">
              <p
                className="text-[#2d4a3e]/55 max-w-[380px] text-right leading-relaxed"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "clamp(15px, 1.6vw, 19px)",
                }}
              >
                Open any project to chat and ask questions about the code.
              </p>
              {/* Search bar — full width below */}
              <div className="relative w-full max-w-[300px] mt-4 ml-auto">
                <Search
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2d4a3e]/45 pointer-events-none"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search projects…"
                  className="w-full pl-9 pr-8 py-2.5 rounded-full text-[13px] text-[#2d4a3e] placeholder-[#2d4a3e]/40 outline-none transition-all border border-[#2d4a3e]/25 bg-[#e8e2d4]/60 focus:bg-[#e8e2d4] focus:border-[#2d4a3e]/45"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    letterSpacing: "0.02em",
                  }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-sm text-[#2d4a3e]/45 hover:text-[#2d4a3e] hover:bg-[#2d4a3e]/10 transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              
              </div>
              {hasFilters && (
                <div className="flex items-center gap-3 pt-2 ml-auto">
                  <span
                    className="text-[11px] text-[#2d4a3e]/45"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {filtered.length} RESULT{filtered.length !== 1 ? "S" : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setSearch(""); setCategoryFilter(""); }}
                    className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-[#2d4a3e]/40 hover:text-[#2d4a3e] transition-colors bg-transparent border-none cursor-pointer"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    <X size={10} /> CLEAR
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Filters: category strip + search bar (stacked) ─────────────────── */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Category strip — full width horizontal bar */}
          {categories.length > 0 && (
            <CategoryStrip categories={categories} value={categoryFilter} onChange={setCategoryFilter} />
          )}




        </div>

        {/* ── Table header ────────────────────────────────────────────────── */}
        <div
          className="grid border-b border-t border-[#2d4a3e]/20 py-3 mb-0"
          style={{ gridTemplateColumns: "80px 1fr 1.6fr 56px", gap: "0 24px" }}
        >
          {["Number", "Chapter", "Description", "Page"].map((col) => (
            <p
              key={col}
              className="text-[11px] tracking-[0.12em] uppercase font-semibold text-[#2d4a3e]/40"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {col}
            </p>
          ))}
        </div>

        {/* ── Table body ──────────────────────────────────────────────────── */}
        {loading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center border-b border-[#2d4a3e]/12">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5"
              style={{ backgroundColor: "rgba(45,74,62,0.08)", color: "#2d4a3e" }}
            >
              <Code2 size={20} />
            </div>
            <p
              className="font-bold text-[#2d4a3e] mb-2"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: 15 }}
            >
              {hasFilters ? "No matches found." : "No projects yet."}
            </p>
            <p
              className="text-sm text-[#2d4a3e]/50 mb-8 leading-relaxed"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {hasFilters
                ? "Try adjusting your search or filter."
                : "Create a project as a Builder to see it here."
              }
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={() => { setSearch(""); setCategoryFilter(""); }}
                className="inline-flex items-center gap-2 rounded-full text-[#f0ebe0] text-[10px] tracking-widest uppercase font-bold px-6 py-3 border-none cursor-pointer"
                style={{ backgroundColor: "#2d4a3e", fontFamily: "'Inter', sans-serif" }}
              >
                <X size={10} /> Clear filters
              </button>
            )}
          </div>
        ) : (
          filtered.map((p, idx) => (
            <ProjectRow key={p.project_id} project={p} index={idx} />
          ))
        )}
      </div>

      {/* ── Ticker ──────────────────────────────────────────────────────────── */}
      <div
        className="overflow-hidden border-t border-[#2d4a3e]/10 py-3"
        style={{ backgroundColor: "#e8e2d4" }}
      >
        <div
          className="flex gap-10 whitespace-nowrap"
          style={{ animation: "ticker 28s linear infinite" }}
        >
          {[...Array(3)].map((_, ri) =>
            ["ALL PROJECTS", "★", "CHAT & ASK CODE", "★", "OPEN SOURCE BUILDERS", "★"].map((t, i) => (
              <span
                key={`${ri}-${i}`}
                className="text-[10px] tracking-[0.2em] uppercase font-bold shrink-0"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  color: t === "★" ? "#2d4a3e" : "rgba(45,74,62,0.4)",
                }}
              >
                {t}
              </span>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0%  { transform: translateX(0); }
          100%{ transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}