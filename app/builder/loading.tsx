export default function BuilderLoading() {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: "#F8FFE8" }}>
      <div className="mx-auto max-w-7xl animate-pulse">
        <div
          className="mb-8 h-10 w-48 rounded"
          style={{ backgroundColor: "rgba(15,44,35,0.08)" }}
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-2xl"
              style={{ backgroundColor: "rgba(15,44,35,0.05)" }}
            />
          ))}
        </div>
        <div className="mt-8 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-xl"
              style={{ backgroundColor: "rgba(15,44,35,0.04)" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
