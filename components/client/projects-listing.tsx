"use client";

import { ArrowUpRight, Code2, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { StoredProject } from "@/lib/storage";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

// ─── Category strip (horizontal bar, all categories visible) ───────────────────
// function CategoryStrip({
//   categories,
//   value,
//   onChange,
// }: {
//   categories: string[];
//   value: string;
//   onChange: (v: string) => void;
// }) {
//   const options = [
//     { value: "", label: "All categories" },
//     ...categories.map((c) => ({ value: c, label: c })),
//   ];

//   return (
//     <div className="flex w-full border-t border-b border-[#0F2C23]" style={{ fontFamily: PX }}>
//       {options.map((opt) => {
//         const isSelected = opt.value === value;
//         return (
//           <button
//             key={opt.value}
//             type="button"
//             onClick={() => onChange(opt.value)}
//             className="flex-1 min-w-0 py-3 text-[11px] tracking-[0.12em] uppercase font-bold text-[#0F2C23] cursor-pointer border-none border-r border-[#0F2C23] last:border-r-0 transition-colors"
//             style={{
//               backgroundColor: isSelected ? "rgba(15,44,35,0.1)" : "#F8FFE8",
//             }}
//           >
//             {opt.label}
//           </button>
//         );
//       })}
//     </div>
//   );
// }

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
        className="grid items-start py-7 border-b rounded-sm transition-all duration-150 group-hover:bg-[rgba(15,44,35,0.03)]"
        style={{
          gridTemplateColumns: "80px 1fr 1.6fr 56px",
          gap: "0 24px",
          borderColor: "rgba(15,44,35,0.12)",
        }}
      >
        {/* Number */}
        <p
          className="font-bold text-[#0F2C23] pt-0.5"
          style={{
            fontFamily: PX,
            fontSize: "clamp(13px, 1.4vw, 15px)",
          }}
        >
          {String(index + 1).padStart(2, "0")}.
        </p>

        {/* Chapter — name + tagline */}
        <div>
          <p
            className="font-semibold text-[#0F2C23] mb-1.5 leading-snug"
            style={{
              fontFamily: PX,
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
                    backgroundColor: "rgba(15,44,35,0.1)",
                    color: "#0F2C23",
                    fontFamily: PX,
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
                    backgroundColor: "rgba(15,44,35,0.06)",
                    color: "rgba(15,44,35,0.55)",
                    fontFamily: FN,
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
            className="max-w-xl leading-relaxed text-sm"
            style={{ fontFamily: FN, color: "rgba(15,44,35,0.5)" }}
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

// ─── Projects Listing ─────────────────────────────────────────────────────────
export default function ProjectsListing({ projects }: { projects: StoredProject[] }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const filtered = useMemo(() => {
    let result = projects;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.tagline ?? "").toLowerCase().includes(q),
      );
    }
    if (categoryFilter) {
      result = result.filter((p) => p.category === categoryFilter);
    }
    return result;
  }, [projects, search, categoryFilter]);

  const hasFilters = search || categoryFilter;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FFE8" }}>
      <div className="px-10 pt-10 pb-24">
        {/* ── Hero heading — large editorial stacked ───────────────────────── */}
        <div className="mb-16 flex flex-row justify-between">
          <h1
            className="font-black text-[#0F2C23] leading-[0.88] uppercase"
            style={{
              fontFamily: PX,
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
                className="max-w-[380px] text-right leading-relaxed"
                style={{
                  fontFamily: FN,
                  fontSize: "clamp(15px, 1.6vw, 19px)",
                  color: "rgba(15,44,35,0.55)",
                }}
              >
                Open any project to chat and ask questions about the code.
              </p>
              {/* Search bar — full width below */}
              <div className="relative w-full max-w-[300px] mt-4 ml-auto">
                <Search
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "rgba(15,44,35,0.45)" }}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search projects…"
                  className="w-full pl-9 pr-8 py-2.5 rounded-full text-[13px] outline-none transition-all border border-[rgba(15,44,35,0.25)] focus:border-[rgba(15,44,35,0.45)] text-[#0F2C23] placeholder:text-[rgba(15,44,35,0.4)]"
                  style={{
                    fontFamily: PX,
                    letterSpacing: "0.02em",
                    backgroundColor: "rgba(15,44,35,0.1)",
                  }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-sm text-[rgba(15,44,35,0.45)] hover:text-[#0F2C23] hover:bg-[rgba(15,44,35,0.1)] transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              {hasFilters && (
                <div className="flex items-center gap-3 pt-2 ml-auto">
                  <span
                    className="text-[11px]"
                    style={{ fontFamily: PX, color: "rgba(15,44,35,0.45)" }}
                  >
                    {filtered.length} RESULT{filtered.length !== 1 ? "S" : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setCategoryFilter("");
                    }}
                    className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase transition-colors bg-transparent border-none cursor-pointer text-[rgba(15,44,35,0.4)] hover:text-[#0F2C23]"
                    style={{ fontFamily: PX }}
                  >
                    <X size={10} /> CLEAR
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Filters: category strip + search bar (stacked) ─────────────────── */}
        {/* <div className="flex flex-col gap-4 mb-6">
          {categories.length > 0 && (
            <CategoryStrip
              categories={categories}
              value={categoryFilter}
              onChange={setCategoryFilter}
            />
          )}
        </div> */}

        {/* ── Table header ────────────────────────────────────────────────── */}
        <div
          className="grid border-b border-t py-3 mb-0"
          style={{
            gridTemplateColumns: "80px 1fr 1.6fr 56px",
            gap: "0 24px",
            borderColor: "rgba(15,44,35,0.2)",
          }}
        >
          {["Number", "Chapter", "Description", "Page"].map((col) => (
            <p
              key={col}
              className="text-[11px] tracking-[0.12em] uppercase font-semibold"
              style={{ fontFamily: PX, color: "rgba(15,44,35,0.4)" }}
            >
              {col}
            </p>
          ))}
        </div>

        {/* ── Table body ──────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div
            className="py-20 text-center border-b"
            style={{ borderColor: "rgba(15,44,35,0.12)" }}
          >
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5"
              style={{ backgroundColor: "rgba(15,44,35,0.08)", color: "#0F2C23" }}
            >
              <Code2 size={20} />
            </div>
            <p className="font-bold text-[#0F2C23] mb-2" style={{ fontFamily: PX, fontSize: 15 }}>
              {hasFilters ? "No matches found." : "No projects yet."}
            </p>
            <p
              className="text-sm mb-8 leading-relaxed"
              style={{ fontFamily: FN, color: "rgba(15,44,35,0.5)" }}
            >
              {hasFilters
                ? "Try adjusting your search or filter."
                : "Create a project as a Builder to see it here."}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("");
                }}
                className="inline-flex items-center gap-2 rounded-full text-[#F8FFE8] text-[10px] tracking-widest uppercase font-bold px-6 py-3 border-none cursor-pointer"
                style={{ backgroundColor: "#0F2C23", fontFamily: PX }}
              >
                <X size={10} /> Clear filters
              </button>
            )}
          </div>
        ) : (
          filtered.map((p, idx) => <ProjectRow key={p.project_id} project={p} index={idx} />)
        )}
      </div>
    </div>
  );
}
