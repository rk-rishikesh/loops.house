export default function AdminLoading() {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: "#F8FFE8" }}>
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="mb-8 h-10 w-48 rounded" style={{ backgroundColor: "rgba(15,44,35,0.08)" }} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl" style={{ backgroundColor: "rgba(15,44,35,0.05)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
