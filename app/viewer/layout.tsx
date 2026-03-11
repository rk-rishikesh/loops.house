export default function ViewerLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="">{children}</main>
    </div>
  );
}
