import { HostNav } from "@/components/host-nav";
import { getServerAuth } from "@/lib/server-auth";

export default async function HostLayout({
  children,
}: { children: React.ReactNode }) {
  const auth = await getServerAuth();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <HostNav role={auth?.role ?? null} />
      <main className="">{children}</main>
    </div>
  );
}
