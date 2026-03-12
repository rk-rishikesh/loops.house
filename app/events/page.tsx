import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, ArrowUpRight } from "lucide-react";
import { getServerAuth } from "@/lib/server-auth";

const PX = "var(--font-pixelify-sans), sans-serif";
const FN = "var(--font-funnel-sans), sans-serif";

function EventCard({
  href,
  label,
  roleLabel,
  description,
}: {
  href: string;
  label: string;
  roleLabel: string;
  description: string;
}) {
  return (
    <Link href={href} className="no-underline group block">
      <div
        className="rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-200 group-hover:scale-[1.015]"
        style={{ backgroundColor: "#163528" }}
      >
        <span
          className="absolute right-4 bottom-0 select-none pointer-events-none font-black"
          style={{
            fontFamily: PX,
            fontSize: "clamp(64px, 9vw, 120px)",
            letterSpacing: "-0.05em",
            lineHeight: 0.85,
            color: "rgba(226,254,165,0.04)",
          }}
        >
          {`{`}
          <br />
          {`}`}
        </span>

        <div className="flex justify-between items-center mb-6">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[9px] tracking-[0.2em] uppercase font-bold"
            style={{
              fontFamily: PX,
              backgroundColor: "rgba(226,254,165,0.08)",
              color: "rgba(226,254,165,0.7)",
            }}
          >
            <CalendarDays size={11} />
            {roleLabel}
          </div>
          <span
            className="w-10 h-10 flex items-center justify-center rounded-full"
            style={{ backgroundColor: "#E2FEA5" }}
          >
            <ArrowUpRight size={16} style={{ color: "#0F2C23" }} />
          </span>
        </div>

        <div>
          <h2
            className="font-black uppercase leading-tight"
            style={{
              fontFamily: PX,
              fontSize: "clamp(20px, 2.6vw, 30px)",
              letterSpacing: "-0.025em",
              color: "#E2FEA5",
            }}
          >
            {label}
          </h2>
          <p
            className="mt-2 text-sm leading-relaxed"
            style={{ fontFamily: FN, color: "rgba(226,254,165,0.6)" }}
          >
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default async function EventsPage() {
  const auth = await getServerAuth();
  if (!auth) {
    redirect("/login");
  }

  return (
    <div
      className="flex flex-col h-screen overflow-hidden p-4"
      style={{ backgroundColor: "#F8FFE8" }}
    >
      <div
        className="flex-1 flex flex-col rounded-[15px] overflow-hidden min-h-0"
        style={{ backgroundColor: "#0F2C23" }}
      >
        <header className="px-14 pt-10 pb-4 flex items-center justify-between">
          <div>
            <p
              className="text-[9px] tracking-[0.25em] uppercase font-bold mb-2"
              style={{ fontFamily: PX, color: "rgba(226,254,165,0.4)" }}
            >
              My Events
            </p>
            <h1
              className="font-black uppercase leading-[0.9]"
              style={{
                fontFamily: PX,
                fontSize: "clamp(34px, 5vw, 60px)",
                letterSpacing: "-0.03em",
                color: "#E2FEA5",
              }}
            >
              Builder, Host, Judge.
            </h1>
          </div>
        </header>

        <div
          className="px-14 pb-10 pt-4 grid gap-5"
          style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
        >
          <EventCard
            href="/builder"
            label="Builder Hub"
            roleLabel="Builder"
            description="Jump into your builder workspace to manage projects and submissions."
          />
          <EventCard
            href="/host"
            label="Host Dashboard"
            roleLabel="Host"
            description="View and manage the hackathons you are hosting, including submissions and judges."
          />
          <EventCard
            href="/projects"
            label="Judge & Viewer"
            roleLabel="Judge"
            description="Browse and review projects you are judging or following."
          />
        </div>
      </div>
    </div>
  );
}

