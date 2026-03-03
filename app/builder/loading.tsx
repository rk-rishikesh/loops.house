export default function BuilderLoading() {
  return (
    <div className="min-h-screen bg-[#1a1a2e] p-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mb-8 h-10 w-48 rounded bg-white/10" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-lg bg-white/5" />
          ))}
        </div>
        <div className="mt-8 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
