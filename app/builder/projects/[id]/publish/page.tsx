import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server-auth";
import { getProjectServer } from "@/lib/server-data";

export const metadata: Metadata = {
  title: "Publish Project - Loops",
};

export default async function PublishProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await getServerAuth();
  if (!auth) redirect("/login");

  const { id: projectId } = await params;

  const project = await getProjectServer(projectId);

  return (
    <div className="min-h-[calc(100vh-32px)] px-10 py-12">
      <div className="max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-3 no-underline">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden">
            <Image src="/lightlogo.svg" alt="Loops" fill />
          </div>
        </Link>

        <h1
          className="mt-8 font-black uppercase"
          style={{
            fontFamily: "var(--font-funnel-sans), sans-serif",
            color: "#0F2C23",
            fontSize: "clamp(22px, 3vw, 34px)",
            letterSpacing: "-0.02em",
          }}
        >
          Publish project
        </h1>

        {project ? (
          <>
            <p
              className="mt-3 leading-relaxed"
              style={{
                fontFamily: "var(--font-funnel-sans), sans-serif",
                color: "rgba(15,44,35,0.65)",
              }}
            >
              Your public linktree view will be available at{" "}
              <span
                style={{
                  fontFamily:
                    "var(--font-pixelify-sans), sans-serif",
                  color: "#0F2C23",
                  fontWeight: 800,
                }}
              >
                /v/{projectId}
              </span>
              .
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link
                href={`/v/${projectId}`}
                className="inline-flex items-center justify-center rounded-2xl px-6 py-3.5 no-underline border border-white/10 shadow-sm"
                style={{
                  backgroundColor: "#0F2C23",
                  color: "#F8FFE8",
                  fontFamily: "var(--font-pixelify-sans), sans-serif",
                  letterSpacing: "0.02em",
                  fontWeight: 900,
                }}
              >
                Publish
              </Link>

              <Link
                href={`/builder/projects/${projectId}`}
                className="inline-flex items-center justify-center rounded-2xl px-6 py-3.5 no-underline border border-white/10"
                style={{
                  backgroundColor: "rgba(15,44,35,0.06)",
                  color: "#0F2C23",
                  fontFamily: "var(--font-pixelify-sans), sans-serif",
                  letterSpacing: "0.02em",
                  fontWeight: 900,
                }}
              >
                Back to editor
              </Link>
            </div>
          </>
        ) : (
          <p
            className="mt-6"
            style={{ fontFamily: "var(--font-funnel-sans), sans-serif", color: "#0F2C23" }}
          >
            Project not found.
          </p>
        )}
      </div>
    </div>
  );
}

