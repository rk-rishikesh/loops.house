export default function ProjectsLoading() {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: "#F8FFE8" }}>
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-8 w-40 rounded" style={{ backgroundColor: "rgba(15,44,35,0.08)" }} />
          <div className="h-10 w-32 rounded" style={{ backgroundColor: "rgba(15,44,35,0.08)" }} />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl p-4"
              style={{ backgroundColor: "rgba(15,44,35,0.04)" }}
            >
              <div
                className="h-10 w-10 rounded-full"
                style={{ backgroundColor: "rgba(15,44,35,0.08)" }}
              />
              <div className="flex-1 space-y-2">
                <div
                  className="h-4 w-48 rounded"
                  style={{ backgroundColor: "rgba(15,44,35,0.08)" }}
                />
                <div
                  className="h-3 w-96 rounded"
                  style={{ backgroundColor: "rgba(15,44,35,0.06)" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
