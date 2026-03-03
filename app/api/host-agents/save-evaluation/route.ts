import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/supabase/middleware";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Json, Database } from "@/lib/supabase/types";

type SubmissionUpdate = Database["public"]["Tables"]["submissions"]["Update"];
type SubmissionInsert = Database["public"]["Tables"]["submissions"]["Insert"];

export async function POST(request: NextRequest) {
  const auth = await requireAuth(["host", "judge", "admin"]);
  if (!auth) return unauthorized();

  try {
    const body = await request.json();
    const { project_id, booster_id, ai_score, human_score, status } = body;

    if (!project_id || !booster_id) {
      return NextResponse.json(
        { error: "project_id and booster_id are required" },
        { status: 400 },
      );
    }

    const updates: SubmissionUpdate = {};
    if (ai_score !== undefined) updates.ai_score = ai_score as Json;
    if (human_score !== undefined) updates.human_score = human_score as Json;
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("submissions")
      .update(updates)
      .eq("project_id", project_id)
      .eq("booster_id", booster_id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[save-evaluation] DB error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      // No submission row exists — fall back to upsert
      const { data: profile } = await supabaseAdmin
        .from("loops_profiles")
        .select("team_id")
        .eq("id", project_id)
        .single();

      if (!profile?.team_id) {
        return NextResponse.json(
          { error: "No submission found and project has no team — cannot create one" },
          { status: 404 },
        );
      }

      const upsertPayload: SubmissionInsert = {
        booster_id,
        project_id,
        team_id: profile.team_id,
        ...updates,
      };
      const { data: upserted, error: upsertError } = await supabaseAdmin
        .from("submissions")
        .upsert(upsertPayload, { onConflict: "booster_id,project_id" })
        .select()
        .single();

      if (upsertError) {
        console.error("[save-evaluation] Upsert fallback failed:", upsertError.message);
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, submission: upserted });
    }

    return NextResponse.json({ success: true, submission: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("[save-evaluation] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
