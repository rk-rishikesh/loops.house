import { FileText, FolderOpen, Mail, Rocket, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminDashboardPage() {
  const auth = await getServerAuth();
  if (!auth || !auth.capabilities.isAdmin) {
    redirect("/login");
  }

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

  const metrics = {
    total_users: users.count ?? 0,
    total_profiles: profiles.count ?? 0,
    total_hackathons: hackathons.count ?? 0,
    total_submissions: submissions.count ?? 0,
    pending_invitations: pendingInvitations.count ?? 0,
  };

  const cards = [
    { label: "Total Users", value: metrics.total_users, icon: Users, color: "text-blue-600" },
    {
      label: "Loops Profiles",
      value: metrics.total_profiles,
      icon: FolderOpen,
      color: "text-violet-600",
    },
    { label: "Hackathons", value: metrics.total_hackathons, icon: Rocket, color: "text-amber-600" },
    {
      label: "Submissions",
      value: metrics.total_submissions,
      icon: FileText,
      color: "text-green-600",
    },
    {
      label: "Pending Invitations",
      value: metrics.pending_invitations,
      icon: Mail,
      color: "text-red-600",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-8">
        Platform Overview
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`w-5 h-5 ${card.color}`} />
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                {card.label}
              </span>
            </div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
