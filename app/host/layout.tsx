export default async function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* <HostNav role={auth?.role ?? null} /> */}
      <main className="">{children}</main>
    </div>
  );
}
