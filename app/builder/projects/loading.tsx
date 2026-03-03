export default function ProjectsLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-8 w-40 rounded bg-white/10" />
          <div className="h-10 w-32 rounded bg-white/10" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg bg-white/5 p-4">
              <div className="h-10 w-10 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded bg-white/10" />
                <div className="h-3 w-96 rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
