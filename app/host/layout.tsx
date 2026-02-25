import { HostNav } from "@/components/host-nav";

export default function HostLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <HostNav />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
