import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText, Lightbulb, Zap, DollarSign } from "lucide-react";
import { getBoostersServer } from "@/lib/server-data";
import type { BoosterType } from "@/lib/data-mappers";
import Image from "next/image";

const TYPES: BoosterType[] = ["idea", "momentum", "capital"];

const TYPE_META: Record<BoosterType, {
  label: string;
  tagline: string;
  icon: React.ElementType;
  index: string;
}> = {
  idea: {
    label: "Idea Boosters",
    tagline: "Validate before you scale.",
    icon: Lightbulb,
    index: "01",
  },
  momentum: {
    label: "Momentum Boosters",
    tagline: "Ship with conviction.",
    icon: Zap,
    index: "02",
  },
  capital: {
    label: "Capital Boosters",
    tagline: "Build for the long term.",
    icon: DollarSign,
    index: "03",
  },
};

export default async function BoosterTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type: rawType } = await params;
  const type = rawType?.toLowerCase() || "idea";
  const validType = TYPES.includes(type as BoosterType) ? (type as BoosterType) : "idea";
  const list = await getBoostersServer(validType);
  const meta = TYPE_META[validType];
  const TypeIcon = meta.icon;

  return (
    <main className="min-h-screen bg-cream">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav
        style={{
          borderBottom: "1px solid rgba(15,44,35,0.1)",
          padding: "0 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 60,
        }}
      >
        <Link
          href="/boosters"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontFamily: "'Press Start 2P', monospace", fontSize: 9,
            letterSpacing: "0.12em", color: "#3C574B", textDecoration: "none",
            opacity: 0.7,
          }}
        >
          <ArrowLeft size={13} /> Boosters
        </Link>

        <span
          style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: 8,
            letterSpacing: "0.15em", color: "#3C574B", opacity: 0.45,
          }}
        >
          {meta.index}
        </span>
      </nav>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 32px 0" }}>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div
          className="s1"
          style={{
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            gap: 24, marginBottom: 52, flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <span
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 44, height: 44, borderRadius: 4,
                  background: "#0F2C23", color: "#E2FEA5",
                }}
              >
                <TypeIcon size={20} />
              </span>
              <p
                style={{
                  fontFamily: "'Press Start 2P', monospace", fontSize: 9,
                  letterSpacing: "0.18em", color: "#3C574B", opacity: 0.55,
                }}
              >
                {meta.index} / 03
              </p>
            </div>

            <h1
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: "clamp(24px, 4.5vw, 50px)",
                color: "#0F2C23", lineHeight: 1.65,
                letterSpacing: "-0.01em", marginBottom: 14,
              }}
            >
              {meta.label}
            </h1>
            <p
              style={{
                fontFamily: "'DM Mono', monospace", fontSize: 15,
                color: "#3C574B", opacity: 0.7, lineHeight: 1.6,
              }}
            >
              {meta.tagline}
            </p>
          </div>

          <div style={{ flexShrink: 0, opacity: 0.85 }}>
            <Image
              src="/builder/woolCat.svg"
              alt="Loops mascot"
              width={110}
              height={110}
              unoptimized
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>

        {/* ── Type switcher tabs ─────────────────────────────────────────────── */}
        <div className="s2" style={{ display: "flex", gap: 8, marginBottom: 48, flexWrap: "wrap" }}>
          {TYPES.map((t) => {
            const Icon = TYPE_META[t].icon;
            return (
              <Link
                key={t}
                href={`/boosters/${t}`}
                className={`type-tab ${t === validType ? "active" : "inactive"}`}
              >
                <Icon size={13} />
                {TYPE_META[t].label.split(" ")[0]}
              </Link>
            );
          })}
        </div>

        {/* ── List ──────────────────────────────────────────────────────────── */}
        <div className="s3">
          {list.length === 0 ? (
            <div
              style={{
                padding: "64px 48px",
                border: "2px dashed rgba(15,44,35,0.15)",
                borderRadius: 4,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 56, height: 56, borderRadius: 4,
                  background: "rgba(15,44,35,0.06)", color: "#3C574B",
                  margin: "0 auto 24px",
                }}
              >
                <TypeIcon size={24} />
              </div>
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: "#0F2C23", letterSpacing: "0.08em", lineHeight: 1.8, marginBottom: 12 }}>
                No boosters yet.
              </p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#3C574B", opacity: 0.65, lineHeight: 1.7, marginBottom: 32 }}>
                Hosts can add boosters from the Host dashboard.
              </p>
              <Link
                href="/boosters"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "#0F2C23", color: "#E2FEA5",
                  fontFamily: "'Press Start 2P', monospace", fontSize: 9,
                  letterSpacing: "0.1em", padding: "12px 22px", borderRadius: 2,
                  textDecoration: "none",
                }}
              >
                <ArrowLeft size={12} /> All Boosters
              </Link>
            </div>
          ) : (
            <div>
              {list.map((b, idx) => (
                <Link
                  key={b.id}
                  href={`/boosters/${validType}/${b.id}`}
                  className="booster-list-row"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 22, minWidth: 0 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 700, color: "rgba(15,44,35,0.18)", letterSpacing: "0.2em", flexShrink: 0, lineHeight: 1 }}>
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "clamp(9px, 1.2vw, 12px)", color: "#0F2C23", letterSpacing: "0.06em", lineHeight: 1.7, marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {b.name}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                        {b.theme && (
                          <span style={{ display: "inline-block", background: "#E2FEA5", color: "#0F2C23", fontFamily: "'Press Start 2P', monospace", fontSize: 7, letterSpacing: "0.1em", padding: "4px 10px", borderRadius: 2 }}>
                            {b.theme}
                          </span>
                        )}
                        {b.problem_statements.length > 0 && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#3C574B", opacity: 0.6 }}>
                            <FileText size={12} />
                            {b.problem_statements.length} problem statement{b.problem_statements.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="row-arrow"><ArrowRight size={15} /></span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Count strip ─────────────────────────────────────────────────────── */}
        {list.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 32, paddingTop: 20, borderTop: "1px solid rgba(15,44,35,0.08)" }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#3C574B", opacity: 0.55 }}>
              {list.length} booster{list.length !== 1 ? "s" : ""} in this category
            </p>
            <Link
              href="/boosters"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'Press Start 2P', monospace", fontSize: 8, letterSpacing: "0.1em", color: "#3C574B", opacity: 0.55, textDecoration: "none" }}
            >
              <ArrowLeft size={11} /> All types
            </Link>
          </div>
        )}
      </div>

      {/* ── Ticker ──────────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 80, borderTop: "1px solid rgba(15,44,35,0.1)", background: "#0F2C23", overflow: "hidden", padding: "14px 0" }}>
        <div className="ticker-inner">
          {[...Array(2)].map((_, r) =>
            ["VALIDATE BEFORE YOU SCALE", "\u2726", "SHIP WITH CONVICTION", "\u2726", "BUILD FOR THE LONG TERM", "\u2726",
             "VALIDATE BEFORE YOU SCALE", "\u2726", "SHIP WITH CONVICTION", "\u2726", "BUILD FOR THE LONG TERM", "\u2726"].map((t, i) => (
              <span key={`${r}-${i}`} className={`tick ${t === "\u2726" ? "hi" : ""}`}>{t}</span>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
