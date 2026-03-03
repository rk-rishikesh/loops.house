export default function JudgingLoading() {
  return (
    <div className="min-h-screen bg-[#f0ebe0] p-8">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="mb-8 h-10 w-48 rounded bg-[#2d4a3e]/10" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-[#2d4a3e]/5" />
            ))}
          </div>
          <div className="h-64 rounded-lg bg-[#2d4a3e]/5" />
        </div>
      </div>
    </div>
  );
}
