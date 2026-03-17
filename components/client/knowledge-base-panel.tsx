"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, X } from "lucide-react";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

export const KB_STEPS = ["code-reader", "demo-reader", "theme-reader", "knowledge-base"] as const;
export type KBStepStatus = "pending" | "started" | "done" | "failed" | "skipped";

interface ProgressPanelProps {
  progress: Record<string, KBStepStatus>;
  errors: Record<string, string>;
}

export function KnowledgeBasePanel({ progress, errors: pErrors }: ProgressPanelProps) {
  const friendlyLabel: Record<(typeof KB_STEPS)[number], string> = {
    "code-reader": "Code Reader",
    "demo-reader": "Demo Reader",
    "theme-reader": "Theme Reader",
    "knowledge-base": "Knowledge Graph",
  };
  const statusByStep = KB_STEPS.map((step) => ({
    step,
    status: progress[step] ?? "pending",
    error: pErrors[step],
  }));
  const runningCount = statusByStep.filter((s) => s.status === "started").length;

  return (
    <section className="w-full">
      <div className="grid gap-8 lg:grid-cols-[1.4fr,1fr]">
        {/* Left: Progress List */}
        <div className="flex flex-col gap-8 py-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span
                className="px-2 py-0.5 rounded bg-[#0F2C23] text-[#E2FEA5] text-[9px] font-black tracking-widest uppercase"
                style={{ fontFamily: PX }}
              >
                Knowledge Graph
              </span>
              <div className="h-[1px] flex-1 bg-[#0F2C23]/10" />
            </div>
            <h2
              className="font-black uppercase leading-[0.9] text-[#0F2C23]"
              style={{
                fontFamily: PX,
                fontSize: "clamp(32px, 4vw, 52px)",
                letterSpacing: "-0.04em",
              }}
            >
              Building Project
              <br />
              Intelligence.
            </h2>
            <p
              className="text-sm leading-relaxed max-w-xl text-[#0F2C23]/60"
              style={{ fontFamily: FN }}
            >
              Our multi-agent system is currently processing your codebase. We&apos;re mapping
              dependencies, analyzing user flows, and indexing visual context into a high-fidelity
              knowledge graph.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {statusByStep.map((entry, idx) => {
              const status = entry.status;
              const isDone = status === "done";
              const isStarted = status === "started";
              const isFailed = status === "failed";

              return (
                <motion.div
                  key={entry.step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative flex items-start gap-5 p-5 rounded-3xl border border-[#0F2C23]/10 transition-all duration-300"
                  style={{
                    backgroundColor: isStarted ? "rgba(15, 44, 35, 0.05)" : "transparent",
                    boxShadow: isStarted ? "0 10px 30px -10px rgba(15, 44, 35, 0.08)" : "none",
                  }}
                >
                  <div className="relative shrink-0 mt-1">
                    {isDone ? (
                      <div className="w-8 h-8 rounded-full bg-[#E2FEA5] flex items-center justify-center">
                        <Check size={16} className="text-[#0F2C23] stroke-[3]" />
                      </div>
                    ) : isStarted ? (
                      <div className="w-8 h-8 rounded-full bg-[#0F2C23] flex items-center justify-center">
                        <Loader2 size={16} className="text-[#E2FEA5] animate-spin" />
                      </div>
                    ) : isFailed ? (
                      <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                        <X size={16} className="text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full border border-[#0F2C23]/10 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0F2C23]/20" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className="font-bold text-[15px] text-[#0F2C23]"
                        style={{ fontFamily: PX }}
                      >
                        {friendlyLabel[entry.step]}
                      </h3>
                      <span
                        className="text-[9px] font-black uppercase tracking-widest text-[#0F2C23]/40"
                        style={{ fontFamily: PX }}
                      >
                        {status === "done"
                          ? "Verified"
                          : status === "started"
                            ? "Processing"
                            : status === "failed"
                              ? "Interrupt"
                              : "Pending"}
                      </span>
                    </div>
                    <p
                      className="text-[12px] leading-relaxed text-[#0F2C23]/50"
                      style={{ fontFamily: FN }}
                    >
                      {isFailed ? (
                        entry.error
                      ) : (
                        <>
                          {idx === 0 && "Cloning repository and executing deep AST traversal."}
                          {idx === 1 &&
                            "Analyzing demo frames to identify core product archetypes."}
                          {idx === 2 &&
                            "Extracting design tokens and high-level component hierarchy."}
                          {idx === 3 && "Warping context windows into the vector knowledge base."}
                        </>
                      )}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: Agent Control Center */}
        {/* <div className="flex flex-col gap-6 py-4">
          <div
            className="flex-1 rounded-[40px] p-8 flex flex-col gap-8 relative overflow-hidden"
            style={{ backgroundColor: "#0F2C23" }}
          >
            <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <p
                  className="text-[10px] font-black uppercase tracking-[0.3em] text-[#E2FEA5]/40"
                  style={{ fontFamily: PX }}
                >
                  Live Telemetry
                </p>
                <div className="flex gap-1.5">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      className="w-1 h-1 rounded-full bg-[#E2FEA5]"
                    />
                  ))}
                </div>
              </div>
              <div className="flex-1 bg-black/20 rounded-3xl p-6 font-mono text-[11px] leading-relaxed border border-white/5 overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {statusByStep.map((entry) => {
                    if (entry.status === "pending" && !runningCount) return null;
                    return (
                      <motion.div
                        key={`${entry.step}-${entry.status}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3 mb-2"
                      >
                        <span className="text-[#E2FEA5]/40">
                          [
                          {new Date().toLocaleTimeString([], {
                            hour12: false,
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                          ]
                        </span>
                        <span
                          className="text-[#E2FEA5] font-bold uppercase tracking-tighter"
                          style={{ fontSize: 9 }}
                        >
                          {entry.step.replace("-", "_")}
                        </span>
                        <span className="text-[#F8FFE8]/80">
                          {entry.status === "done" && "execution_complete. context_synced."}
                          {entry.status === "started" &&
                            "establishing_handshake. streaming_data..."}
                          {entry.status === "failed" && "fatal_error. check_logs."}
                          {entry.status === "pending" && "awaiting_allocation..."}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            <p
              className="relative z-10 text-[9px] text-center font-black uppercase tracking-[0.25em] text-[#E2FEA5]/30"
              style={{ fontFamily: PX }}
            >
              Encryption Layer: AES-256 / Protocol: SSH-v2
            </p>
          </div>
        </div> */}
      </div>
    </section>
  );
}
