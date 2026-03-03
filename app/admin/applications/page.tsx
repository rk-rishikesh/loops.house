import { supabaseAdmin } from "@/lib/supabase/admin";
import { getServerAuth } from "@/lib/server-auth";
import { redirect } from "next/navigation";
import { ApplicationReviewActions } from "@/components/client/application-review-actions";
import type { HostAppWithUser } from "@/lib/data-mappers";

export default async function AdminApplicationsPage() {
  const auth = await getServerAuth();
  if (!auth || auth.role !== "admin") {
    redirect("/login");
  }

  const { data } = await supabaseAdmin
    .from("host_applications")
    .select("*, users!host_applications_user_id_fkey(email, display_name)")
    .order("created_at", { ascending: false });

  const apps = (data ?? []) as unknown as HostAppWithUser[];

  return <ApplicationReviewActions apps={apps} />;
}
