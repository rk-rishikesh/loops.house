import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type HostAppRow = Database["public"]["Tables"]["host_applications"]["Row"];
type HostAppInsert = Database["public"]["Tables"]["host_applications"]["Insert"];

const supabase = createClient();

export async function getHostApplications(
  userId?: string,
): Promise<HostAppRow[]> {
  let query = supabase
    .from("host_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (userId) query = query.eq("user_id", userId);
  const { data } = await query;
  return data ?? [];
}

export async function getHostApplication(
  id: string,
): Promise<HostAppRow | null> {
  const { data } = await supabase
    .from("host_applications")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function submitHostApplication(
  application: HostAppInsert,
): Promise<HostAppRow | null> {
  const { data } = await supabase
    .from("host_applications")
    .insert(application)
    .select()
    .single();
  return data;
}

export async function getPendingApplications(): Promise<HostAppRow[]> {
  const { data } = await supabase
    .from("host_applications")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  return data ?? [];
}
