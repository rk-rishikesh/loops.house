import { supabaseAdmin } from "@/lib/supabase/admin";

/** Delete all KB data for a project */
export async function deleteProjectKB(projectId: string): Promise<void> {
  await supabaseAdmin.from("knowledge_bases").delete().eq("project_id", projectId);
}
