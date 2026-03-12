import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAuth, unauthorized } from "@/lib/supabase/middleware";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const adminToggleSchema = z.object({
  user_id: z.string().uuid(),
  field: z.enum(["is_admin", "is_event_creator"]),
  value: z.boolean(),
});

/** GET: Platform metrics + user list (admin only) */
export async function GET(request: NextRequest) {
  const auth = await requireAuth((u) => u.isAdmin);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") ?? "metrics";

  if (view === "metrics") {
    const [users, profiles, hackathons, submissions, pendingInvitations] = await Promise.all([
      supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("loops_profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("hackathons").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("submissions").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("invitations")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    return NextResponse.json({
      total_users: users.count ?? 0,
      total_profiles: profiles.count ?? 0,
      total_hackathons: hackathons.count ?? 0,
      total_submissions: submissions.count ?? 0,
      pending_invitations: pendingInvitations.count ?? 0,
    });
  }

  if (view === "users") {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id, email, display_name, is_admin, is_event_creator, oauth_provider, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    return NextResponse.json(data ?? []);
  }

  return NextResponse.json({ error: "Invalid view" }, { status: 400 });
}

/** PATCH: Toggle is_admin or is_event_creator for a user (admin only) */
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth((u) => u.isAdmin);
  if (!auth) return unauthorized();

  const body = await request.json();
  const parsed = adminToggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { user_id, field, value } = parsed.data;

  const { data, error } = await supabaseAdmin
    .from("users")
    .update({ [field]: value })
    .eq("id", user_id)
    .select("id, email, display_name, is_admin, is_event_creator")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
