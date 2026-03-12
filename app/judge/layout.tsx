export default function JudgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <main>{children}</main>
    </div>
  );
}
