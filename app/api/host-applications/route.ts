import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/supabase/middleware";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hostApplicationCreateSchema, hostApplicationReviewSchema } from "@/lib/validations/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST: Submit a host application (any authenticated user) */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  const body = await request.json();
  const parsed = hostApplicationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const { event_name, expected_participants, contact, description } = parsed.data;

  const { data, error } = await supabaseAdmin
    .from("host_applications")
    .insert({
      user_id: auth.user.id,
      event_name,
      expected_participants: expected_participants ?? null,
      contact: contact ?? null,
      description: description ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

/** GET: List host applications (own for builders, all for admins) */
export async function GET() {
  const auth = await requireAuth();
  if (!auth) return unauthorized();

  let query = supabaseAdmin
    .from("host_applications")
    .select("*, users!host_applications_user_id_fkey(email, display_name)")
    .order("created_at", { ascending: false });

  // Non-admins can only see their own applications
  if (auth.user.role !== "admin") {
    query = query.eq("user_id", auth.user.id);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/** PATCH: Approve or reject a host application (admin only) */
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(["admin"]);
  if (!auth) return unauthorized();

  const body = await request.json();
  const parsed = hostApplicationReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const { id, status: newStatus } = parsed.data;

  // Update application status
  const { data: app, error } = await supabaseAdmin
    .from("host_applications")
    .update({ status: newStatus, reviewed_by: auth.user.id })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If approved, elevate user to host role
  if (newStatus === "approved" && app) {
    await supabaseAdmin
      .from("users")
      .update({ role: "host" })
      .eq("id", app.user_id);
  }

  return NextResponse.json(app);
}
