export default function HostLoading() {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: "#F8FFE8" }}>
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="mb-8 h-10 w-56 rounded" style={{ backgroundColor: "rgba(15,44,35,0.08)" }} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl" style={{ backgroundColor: "rgba(15,44,35,0.05)" }} />
          ))}
        </div>
        <div className="mt-8 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl" style={{ backgroundColor: "rgba(15,44,35,0.04)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
