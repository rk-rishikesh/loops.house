import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/supabase/middleware";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { adminRoleUpdateSchema } from "@/lib/validations/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET: Platform metrics + user list (admin only) */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(["admin"]);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") ?? "metrics";

  if (view === "metrics") {
    const [users, profiles, hackathons, submissions, pendingApps] =
      await Promise.all([
        supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("loops_profiles").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("hackathons").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("submissions").select("id", { count: "exact", head: true }),
        supabaseAdmin
          .from("host_applications")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);

    return NextResponse.json({
      total_users: users.count ?? 0,
      total_profiles: profiles.count ?? 0,
      total_hackathons: hackathons.count ?? 0,
      total_submissions: submissions.count ?? 0,
      pending_host_applications: pendingApps.count ?? 0,
    });
  }

  if (view === "users") {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id, email, display_name, role, oauth_provider, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    return NextResponse.json(data ?? []);
  }

  return NextResponse.json({ error: "Invalid view" }, { status: 400 });
}

/** PATCH: Update user role (admin only) */
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(["admin"]);
  if (!auth) return unauthorized();

  const body = await request.json();
  const parsed = adminRoleUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const { user_id, role } = parsed.data;

  const { data, error } = await supabaseAdmin
    .from("users")
    .update({ role })
    .eq("id", user_id)
    .select("id, email, display_name, role")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
