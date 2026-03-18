"use client";

import { ArrowUpRight, Loader2, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { publishHackathonAction } from "@/lib/actions";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

export function PublishHackathonBanner({ hackathonId }: { hackathonId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handlePublish() {
    setError(null);
    startTransition(async () => {
      const result = await publishHackathonAction(hackathonId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="mb-8">
      <div
        className="rounded-3xl p-7 flex items-center justify-between gap-6"
        style={{
          backgroundColor: "#0F2C23",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(226,254,165,0.1)" }}
          >
            <Rocket size={22} style={{ color: "#E2FEA5" }} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[8px] tracking-[0.16em] uppercase font-bold px-2 py-1 rounded-full"
                style={{
                  backgroundColor: "rgba(234,179,8,0.2)",
                  color: "#FDE047",
                  fontFamily: PX,
                }}
              >
                Draft
              </span>
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ fontFamily: FN, color: "rgba(248,255,232,0.7)" }}
            >
              This hackathon is not visible to builders yet. Publish it to make it live.
            </p>
            {error && (
              <p className="text-xs mt-1" style={{ fontFamily: FN, color: "#FCA5A5" }}>
                {error}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handlePublish}
          disabled={isPending}
          className="inline-flex items-center gap-0 rounded-full overflow-hidden border-none cursor-pointer transition-all duration-200 hover:shadow-md disabled:opacity-50 shrink-0"
          style={{ backgroundColor: "#E2FEA5" }}
        >
          <span
            className="pl-5 pr-3 py-3 text-[9px] tracking-[0.15em] uppercase font-bold text-[#0F2C23] flex items-center gap-2"
            style={{ fontFamily: PX }}
          >
            {isPending ? <Loader2 size={11} className="animate-spin" /> : <Rocket size={11} />}
            {isPending ? "Publishing..." : "Publish Now"}
          </span>
          <span
            className="w-8 h-8 flex items-center justify-center rounded-full m-1"
            style={{ backgroundColor: "#0F2C23" }}
          >
            <ArrowUpRight size={13} className="text-[#E2FEA5]" />
          </span>
        </button>
      </div>
    </div>
  );
}
