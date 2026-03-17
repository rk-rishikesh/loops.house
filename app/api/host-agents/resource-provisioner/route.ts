import { type NextRequest, NextResponse } from "next/server";
import { generateAndPersistResources } from "@/lib/agents/resource-provisioner";
import type { StoredHackathon } from "@/lib/data-mappers";
import { requireAuth, unauthorized } from "@/lib/supabase/middleware";
import { checkRateLimit } from "../../lib/rate-limiter";

export async function POST(request: NextRequest) {
  const auth = await requireAuth((caps) => caps.isAdmin || caps.isEventCreator);
  if (!auth) return unauthorized();

  const rl = await checkRateLimit(`resource-prov:${auth.user.id}`, 5, 86400000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later.", remaining: rl.remaining, resetAt: rl.resetAt },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const hackathon = body?.hackathon as StoredHackathon | undefined;

    if (!hackathon || !hackathon.id || !hackathon.name) {
      return NextResponse.json({ error: "hackathon with id and name is required" }, { status: 400 });
    }

    const resources = await generateAndPersistResources(hackathon);

    return NextResponse.json({
      hackathon_id: hackathon.id,
      resources,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
