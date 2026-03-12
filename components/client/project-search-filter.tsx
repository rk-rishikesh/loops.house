"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Code2, ArrowUpRight, Search, X } from "lucide-react";
import type { StoredProject } from "@/lib/data-mappers";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

// ─── Category strip ─────────────────────────────────────────────────────────
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
      className="flex w-full border-t border-b border-[#0F2C23]"
      style={{ fontFamily: PX }}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="flex-1 min-w-0 py-3 text-[11px] tracking-[0.12em] uppercase font-bold text-[#0F2C23] cursor-pointer border-none border-r border-[#0F2C23] last:border-r-0 transition-colors"
            style={{
              backgroundColor: isSelected ? "#E2FEA5" : "#F8FFE8",
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
      className="inline-flex items-center justify-center rounded-full bg-[#0F2C23] text-[#F8FFE8] shrink-0 transition-transform duration-200"
    >
      <ArrowUpRight size={size * 0.38} />
    </span>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────
function ProjectRow({ project: p, index }: { project: StoredProject; index: number }) {
  return (
    <Link href={`/projects/${p.project_id}`} className="no-underline group">
      <div
        className="grid items-start py-7 border-b border-[#0F2C23]/12 transition-all duration-150 group-hover:bg-[#0F2C23]/[0.03] rounded-sm"
        style={{ gridTemplateColumns: "80px 1fr 1.6fr 56px", gap: "0 24px" }}
      >
        <p className="font-bold text-[#0F2C23] pt-0.5" style={{ fontFamily: PX, fontSize: "clamp(13px, 1.4vw, 15px)" }}>
          {String(index + 1).padStart(2, "0")}.
        </p>
        <div>
          <p className="font-semibold text-[#0F2C23] mb-1.5 leading-snug" style={{ fontFamily: PX, fontSize: "clamp(13px, 1.3vw, 15px)" }}>
            {p.name}
            {p.tagline && (
              <>
                <br />
                <span className="font-normal text-[#0F2C23]/50" style={{ fontFamily: FN, fontSize: "0.95em" }}>{p.tagline}</span>
              </>
            )}
          </p>
          {(p.category || (p.tech_stack_tags ?? []).length > 0) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {p.category && (
                <span className="text-[8px] tracking-[0.12em] uppercase font-bold px-2.5 py-1 rounded-sm" style={{ backgroundColor: "rgba(15,44,35,0.1)", color: "#0F2C23", fontFamily: PX }}>{p.category}</span>
              )}
              {(p.tech_stack_tags ?? []).slice(0, 3).map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-sm" style={{ backgroundColor: "rgba(15,44,35,0.06)", color: "rgba(15,44,35,0.55)", fontFamily: FN }}>{t}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-start gap-4">
          <p className="text-[#0F2C23]/50 leading-relaxed text-sm" style={{ fontFamily: FN }}>
            Open to chat and ask questions about the code. Each project has its own AI-powered assistant.
          </p>
        </div>
        <div className="flex justify-end pt-0.5">
          <ArrowCircle size={44} />
        </div>
      </div>
    </Link>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
export function ProjectSearchFilter({ projects }: { projects: StoredProject[] }) {
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
    <>
      {/* ── Filters ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 mb-6">
        {categories.length > 0 && (
          <CategoryStrip categories={categories} value={categoryFilter} onChange={setCategoryFilter} />
        )}

        {hasFilters && (
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#0F2C23]/45" style={{ fontFamily: FN }}>
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
            <button
              type="button"
              onClick={() => { setSearch(""); setCategoryFilter(""); }}
              className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase font-bold text-[#0F2C23]/40 hover:text-[#0F2C23] transition-colors bg-transparent border-none cursor-pointer"
              style={{ fontFamily: PX }}
            >
              <X size={10} /> Clear
            </button>
          </div>
        )}
      </div>

      {/* ── Search bar (passed to hero area via render prop pattern) ── */}
      <div className="relative w-full max-w-[300px]">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0F2C23]/35 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects\u2026"
          className="w-full pl-9 pr-8 py-2.5 rounded-sm bg-transparent text-[13px] text-[#0F2C23] placeholder-[#0F2C23]/35 outline-none transition-all"
          style={{ fontFamily: PX, border: "1.5px solid rgba(15,44,35,0.2)", letterSpacing: "0.01em" }}
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0F2C23]/40 hover:text-[#0F2C23] transition-colors">
            <X size={12} />
          </button>
        )}
      </div>

      {/* ── Table header ────────────────────────────────────────────── */}
      <div className="grid border-b border-t border-[#0F2C23]/20 py-3 mb-0 mt-6" style={{ gridTemplateColumns: "80px 1fr 1.6fr 56px", gap: "0 24px" }}>
        {["Number", "Chapter", "Description", "Page"].map((col) => (
          <p key={col} className="text-[11px] tracking-[0.12em] uppercase font-semibold text-[#0F2C23]/40" style={{ fontFamily: PX }}>{col}</p>
        ))}
      </div>

      {/* ── Table body ──────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center border-b border-[#0F2C23]/12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5" style={{ backgroundColor: "rgba(15,44,35,0.08)", color: "#0F2C23" }}>
            <Code2 size={20} />
          </div>
          <p className="font-bold text-[#0F2C23] mb-2" style={{ fontFamily: PX, fontSize: 15 }}>
            {hasFilters ? "No matches found." : "No projects yet."}
          </p>
          <p className="text-sm text-[#0F2C23]/50 mb-8 leading-relaxed" style={{ fontFamily: FN }}>
            {hasFilters ? "Try adjusting your search or filter." : "Create a project as a Builder to see it here."}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setSearch(""); setCategoryFilter(""); }}
              className="inline-flex items-center gap-2 rounded-full text-[#F8FFE8] text-[10px] tracking-widest uppercase font-bold px-6 py-3 border-none cursor-pointer"
              style={{ backgroundColor: "#0F2C23", fontFamily: PX }}
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
    </>
  );
}
