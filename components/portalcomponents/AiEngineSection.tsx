"use client";

import { Bot, ShieldCheck, Sparkles } from "lucide-react";
import { funnelSans } from "@/app/fonts";

const items = [
  {
    title: "Build\nwith Agents",
    copy: "Compose autonomous agents over hosted knowledge graphs. Ship workflows that solve real problems end-to-end.",
    Icon: Sparkles,
  },
  {
    title: "Prove Every\nAgent Run",
    copy: "Auto-generated traces for every agent execution. Track invocations, tool usage, and outputs in one timeline.",
    Icon: Bot,
  },
  {
    title: "Evaluated By\nAgents",
    copy: "Agent evaluators score technical execution and real-world usage. Human reviewers confirm the final verdict.",
    Icon: ShieldCheck,
  },
] as const;

export function AiEngineSection() {
  return (
    <section className="h-screen w-full bg-[#F8FFE8] px-3 py-3 md:px-6 md:py-4">
      <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col overflow-hidden rounded-[16px] bg-[#F8FFE8] px-4 py-6 md:px-8 md:py-8">
        <div className="ml-auto text-right">
          <h2
            className={`${funnelSans.className} text-[52px] font-bold uppercase tracking-[-0.02em] text-[#0F2C23]`}
            style={{ fontSize: "clamp(52px, 8vw, 64px)", lineHeight: 0.92 }}
          >
            MEET THE LOOPS
            <br />
            AI ENGINE
          </h2>
        </div>

        <div className="mt-auto grid gap-4 pb-2 md:grid-cols-3 md:gap-4">
          {items.map(({ title, copy, Icon }) => (
            <article
              key={title}
              className="rounded-[16px] border border-[#0F2C23]/16 bg-[#F8FFE8] p-6"
              style={{ borderRadius: 16 }}
            >
              <div className="flex items-start gap-4">
                <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#0F2C23]/85">
                  <Icon size={64} strokeWidth={2.2} />
                </span>

                <div className="min-w-0">
                  <p
                    className={`${funnelSans.className} whitespace-pre-line text-[clamp(2.2rem,3.5vw,3.8rem)] font-semibold tracking-[-0.02em] text-[#0F2C23]`}
                    style={{
                      fontSize: "clamp(34px, 3.6vw, 56px)",
                      lineHeight: 0.96,
                      margin: 0,
                    }}
                  >
                    {title}
                  </p>
                  <p
                    className={`${funnelSans.className} mt-4 max-w-[32ch] text-[17px] leading-[1.38] text-[#0F2C23]/74`}
                    style={{ fontSize: "clamp(16px, 1.25vw, 20px)" }}
                  >
                    {copy}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
