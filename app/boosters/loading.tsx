export default function BoostersLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="mb-8 h-12 w-72 rounded bg-white/10" />
        <div className="space-y-16">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-8">
              <div className="h-64 flex-1 rounded-lg bg-white/5" />
              <div className="h-64 w-80 rounded-lg bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
