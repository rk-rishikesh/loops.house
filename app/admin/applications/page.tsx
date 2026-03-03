import { supabaseAdmin } from "@/lib/supabase/admin";
import { getServerAuth } from "@/lib/server-auth";
import { redirect } from "next/navigation";
import { ApplicationReviewActions } from "@/components/client/application-review-actions";

export default async function AdminApplicationsPage() {
  const auth = await getServerAuth();
  if (!auth || auth.role !== "admin") {
    redirect("/login");
  }

  const { data } = await supabaseAdmin
    .from("host_applications")
    .select("*, users(email, display_name)")
    .order("created_at", { ascending: false });

  const apps = (data ?? []).map((a) => ({
    id: a.id,
    user_id: a.user_id,
    booster_type: a.booster_type,
    event_name: a.event_name,
    expected_participants: a.expected_participants,
    contact: a.contact,
    description: a.description,
    status: a.status as "pending" | "approved" | "rejected",
    reviewed_by: a.reviewed_by,
    created_at: a.created_at,
    users: a.users as unknown as { email: string; display_name: string | null } | undefined,
  }));

  return <ApplicationReviewActions apps={apps} />;
}
