import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/supabase/middleware";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { judgeInviteCreateSchema, judgeInviteAcceptSchema } from "@/lib/validations/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST: Invite a judge to a booster (host or admin only) */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(["host", "admin"]);
  if (!auth) return unauthorized();

  const body = await request.json();
  const parsed = judgeInviteCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const { booster_id, judge_email, assigned_tracks } = parsed.data;

  // Verify the host owns this booster
  const { data: booster } = await supabaseAdmin
    .from("boosters")
    .select("host_id")
    .eq("id", booster_id)
    .single();

  if (!booster || (booster.host_id !== auth.user.id && auth.user.role !== "admin")) {
    return NextResponse.json({ error: "Not authorized for this booster" }, { status: 403 });
  }

  // Look up judge by email
  const { data: judgeUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", judge_email)
    .single();

  if (!judgeUser) {
    return NextResponse.json(
      { error: "No user found with that email. They must sign up first." },
      { status: 404 },
    );
  }

  // Create invite
  const { data, error } = await supabaseAdmin
    .from("judge_invites")
    .insert({
      booster_id,
      judge_user_id: judgeUser.id,
      invited_by: auth.user.id,
      assigned_tracks: assigned_tracks ?? [],
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "This judge is already invited to this booster" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Atomically elevate user to judge role if they're currently a builder/viewer
  await supabaseAdmin
    .from("users")
    .update({ role: "judge" })
    .eq("id", judgeUser.id)
    .in("role", ["builder", "viewer"]);

  return NextResponse.json(data, { status: 201 });
}

/** GET: List judge invites for a booster (host) or for the current user (judge) */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  const { searchParams } = new URL(request.url);
  const boosterId = searchParams.get("booster_id");

  if (boosterId) {
    // Verify the requester owns this booster (or is admin)
    const { data: booster } = await supabaseAdmin
      .from("boosters")
      .select("host_id")
      .eq("id", boosterId)
      .single();

    if (!booster || (booster.host_id !== auth.user.id && auth.user.role !== "admin")) {
      return NextResponse.json({ error: "Not authorized for this booster" }, { status: 403 });
    }

    const { data } = await supabaseAdmin
      .from("judge_invites")
      .select("*, users!judge_invites_judge_user_id_fkey(email, display_name)")
      .eq("booster_id", boosterId)
      .order("created_at", { ascending: false });
    return NextResponse.json(data ?? []);
  }

  // Judge viewing their own invites
  const { data } = await supabaseAdmin
    .from("judge_invites")
    .select("*, boosters(name, booster_type)")
    .eq("judge_user_id", auth.user.id)
    .order("created_at", { ascending: false });
  return NextResponse.json(data ?? []);
}

/** PATCH: Accept a judge invite */
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  const body = await request.json();
  const parsed = judgeInviteAcceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const { id } = parsed.data;

  const { data, error } = await supabaseAdmin
    .from("judge_invites")
    .update({ accepted: true })
    .eq("id", id)
    .eq("judge_user_id", auth.user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
