"use client";

import { CalendarDays, X } from "lucide-react";
import { useEffect } from "react";
import type { StoredHackathon } from "@/lib/data-mappers";
import {
  HackathonAboutSection,
  HackathonChallengesSection,
  HackathonPrizesSection,
  HackathonScheduleSection,
} from "@/components/hackathon-sections";

const FN = "var(--font-funnel-sans), sans-serif";

export function HackathonPreviewModal({
  hackathon,
  onClose,
}: {
  hackathon: StoredHackathon;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const isEmpty =
    !hackathon.name &&
    !hackathon.theme &&
    !hackathon.start_date &&
    !hackathon.bounty_pool_summary;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center"
      style={{ backgroundColor: "rgba(15,44,35,0.6)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-4xl mx-4 rounded-3xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "#F8FFE8", maxHeight: "90vh" }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b"
          style={{
            backgroundColor: "rgba(248,255,232,0.95)",
            backdropFilter: "blur(12px)",
            borderColor: "rgba(15,44,35,0.1)",
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="text-[8px] tracking-[0.2em] uppercase font-bold px-2 py-1 rounded-full"
              style={{
                backgroundColor: "rgba(15,44,35,0.08)",
                color: "#0F2C23",
                fontFamily: FN,
              }}
            >
              Preview
            </span>
            <p className="text-xs text-[#0F2C23]/50" style={{ fontFamily: FN }}>
              This is the hackathon information that would be displayed to the builders
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors hover:bg-[#0F2C23]/10"
            style={{ backgroundColor: "rgba(15,44,35,0.05)" }}
          >
            <X size={16} className="text-[#0F2C23]" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-8 py-10" style={{ maxHeight: "calc(90vh - 56px)" }}>
          {isEmpty ? (
            <div className="py-20 text-center">
              <CalendarDays size={32} className="mx-auto mb-4 text-[#0F2C23]/20" />
              <p className="text-sm text-[#0F2C23]/40" style={{ fontFamily: FN }}>
                Fill in the form to see a preview here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              <HackathonAboutSection hackathon={hackathon} compact />
              <HackathonScheduleSection hackathon={hackathon} />
              <HackathonPrizesSection hackathon={hackathon} />
              <HackathonChallengesSection hackathon={hackathon} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
