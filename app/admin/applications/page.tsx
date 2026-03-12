import { getServerAuth } from "@/lib/server-auth";
import { redirect } from "next/navigation";

export default async function AdminApplicationsPage() {
  const auth = await getServerAuth();
  if (!auth || !auth.capabilities.isAdmin) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        Host Applications
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Host applications have been replaced by the invitation system. Users can
        now be invited as cohosts or judges directly from the hackathon
        management page.
      </p>
    </div>
  );
}
