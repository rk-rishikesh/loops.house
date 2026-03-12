import { supabaseAdmin } from "@/lib/supabase/admin";
import { getServerAuth } from "@/lib/server-auth";
import { redirect } from "next/navigation";
import { UserRoleEditor } from "@/components/client/user-role-editor";

export default async function AdminUsersPage() {
  const auth = await getServerAuth();
  if (!auth || !auth.capabilities.isAdmin) {
    redirect("/login");
  }

  const { data } = await supabaseAdmin
    .from("users")
    .select("id, email, display_name, is_admin, is_event_creator, oauth_provider, created_at")
    .order("created_at", { ascending: false });

  return <UserRoleEditor users={data ?? []} />;
}
