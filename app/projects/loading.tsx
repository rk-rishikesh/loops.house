export default function ViewerLoading() {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: "#F8FFE8" }}>
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mb-6 h-10 w-64 rounded" style={{ backgroundColor: "rgba(15,44,35,0.08)" }} />
        <div className="mb-6 h-12 rounded-xl" style={{ backgroundColor: "rgba(15,44,35,0.05)" }} />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl" style={{ backgroundColor: "rgba(15,44,35,0.04)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
