export default function BuilderBoostersLoading() {
  return (
    <div className="min-h-screen bg-[#1a1a2e] p-8">
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="mb-6 h-8 w-44 rounded bg-white/10" />
        <div className="mb-6 flex gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 w-28 rounded-full bg-white/10" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
