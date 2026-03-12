import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/supabase/middleware";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";

export async function POST(request: NextRequest) {
  const auth = await requireAuth((caps) => caps.isAdmin || caps.isEventCreator || caps.isJudge);
  if (!auth) return unauthorized();

  try {
    const body = await request.json();
    const { project_id, hackathon_id, ai_score, human_evaluation, status } = body;

    if (!project_id || !hackathon_id) {
      return NextResponse.json(
        { error: "project_id and hackathon_id are required" },
        { status: 400 },
      );
    }

    // ── AI score save (one-time, immutable after first save) ──
    if (ai_score !== undefined) {
      // Check if already evaluated
      const { data: existing } = await supabaseAdmin
        .from("submissions")
        .select("id, ai_evaluated_at")
        .eq("project_id", project_id)
        .eq("hackathon_id", hackathon_id)
        .maybeSingle();

      if (existing?.ai_evaluated_at) {
        return NextResponse.json(
          { error: "AI evaluation already exists and cannot be overridden" },
          { status: 409 },
        );
      }

      const updates = {
        ai_score: ai_score as Json,
        ai_evaluated_at: new Date().toISOString(),
        ...(status ? { status } : {}),
      };

      if (existing) {
        const { data, error } = await supabaseAdmin
          .from("submissions")
          .update(updates)
          .eq("id", existing.id)
          .select()
          .single();
        if (error) {
          console.error("[save-evaluation] AI save error:", error.message);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, submission: data });
      }

      // No submission row — create one
      const { data: profile } = await supabaseAdmin
        .from("loops_profiles")
        .select("team_id")
        .eq("id", project_id)
        .single();

      if (!profile?.team_id) {
        return NextResponse.json(
          { error: "Project has no team — cannot create submission" },
          { status: 404 },
        );
      }

      const { data, error } = await supabaseAdmin
        .from("submissions")
        .upsert(
          {
            hackathon_id,
            project_id,
            team_id: profile.team_id,
            ...updates,
          },
          { onConflict: "hackathon_id,project_id" },
        )
        .select()
        .single();

      if (error) {
        console.error("[save-evaluation] AI upsert error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, submission: data });
    }

    // ── Human evaluation save (per-judge) ──
    if (human_evaluation !== undefined) {
      const judgeId = auth.user.id;

      // Get the submission id
      const { data: submission } = await supabaseAdmin
        .from("submissions")
        .select("id")
        .eq("project_id", project_id)
        .eq("hackathon_id", hackathon_id)
        .maybeSingle();

      if (!submission) {
        return NextResponse.json(
          { error: "No submission found for this project/hackathon" },
          { status: 404 },
        );
      }

      // Verify user is a judge for this hackathon
      const { data: judgeRow } = await supabaseAdmin
        .from("hackathon_judges")
        .select("user_id")
        .eq("hackathon_id", hackathon_id)
        .eq("user_id", judgeId)
        .maybeSingle();

      if (!judgeRow) {
        return NextResponse.json(
          { error: "You are not a judge for this hackathon" },
          { status: 403 },
        );
      }

      const { scores, remarks, overall_notes, overall_score } = human_evaluation;

      const { data, error } = await supabaseAdmin
        .from("human_evaluations")
        .upsert(
          {
            submission_id: submission.id,
            judge_id: judgeId,
            hackathon_id,
            scores: (scores ?? {}) as Json,
            remarks: (remarks ?? {}) as Json,
            overall_notes: overall_notes ?? null,
            overall_score: overall_score ?? 0,
          },
          { onConflict: "submission_id,judge_id" },
        )
        .select()
        .single();

      if (error) {
        console.error("[save-evaluation] Human eval error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, human_evaluation: data });
    }

    return NextResponse.json(
      { error: "No ai_score or human_evaluation provided" },
      { status: 400 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("[save-evaluation] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
