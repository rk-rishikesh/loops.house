export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FFE8" }}>
      <main>{children}</main>
    </div>
  );
}
