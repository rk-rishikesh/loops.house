export default function HostLoading() {
  return (
    <div className="min-h-screen bg-[#f0ebe0] p-8">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="mb-8 h-10 w-56 rounded bg-[#2d4a3e]/10" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-[#2d4a3e]/5" />
          ))}
        </div>
        <div className="mt-8 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded bg-[#2d4a3e]/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
