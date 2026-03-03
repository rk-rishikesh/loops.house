export default function ViewerLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mb-6 h-10 w-64 rounded bg-white/10" />
        <div className="mb-6 h-12 rounded-lg bg-white/5" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 rounded bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
