import { supabaseAdmin } from "@/lib/supabase/admin";
import { getServerAuth } from "@/lib/server-auth";
import { redirect } from "next/navigation";
import { UserRoleEditor } from "@/components/client/user-role-editor";

export default async function AdminUsersPage() {
  const auth = await getServerAuth();
  if (!auth || auth.role !== "admin") {
    redirect("/login");
  }

  const { data } = await supabaseAdmin
    .from("users")
    .select("id, email, display_name, role, oauth_provider, created_at")
    .order("created_at", { ascending: false });

  const users = (data ?? []).map((u) => ({
    id: u.id,
    email: u.email,
    display_name: u.display_name,
    role: u.role,
    oauth_provider: u.oauth_provider,
    created_at: u.created_at,
  }));

  return <UserRoleEditor users={users} />;
}
