export default function HackathonsLoading() {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: "#F8FFE8" }}>
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="mb-8 h-12 w-72 rounded" style={{ backgroundColor: "rgba(15,44,35,0.08)" }} />
        <div className="space-y-16">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-8">
              <div className="h-64 flex-1 rounded-2xl" style={{ backgroundColor: "rgba(15,44,35,0.05)" }} />
              <div className="h-64 w-80 rounded-2xl" style={{ backgroundColor: "rgba(15,44,35,0.05)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
