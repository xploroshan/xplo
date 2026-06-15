export default function EventsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-8 w-56 rounded bg-zinc-800 mb-2" />
      <div className="h-4 w-72 rounded bg-zinc-800 mb-8" />
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-full bg-zinc-800" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 overflow-hidden">
            <div className="aspect-[16/10] bg-zinc-800" />
            <div className="p-4 space-y-3">
              <div className="h-4 w-3/4 rounded bg-zinc-800" />
              <div className="h-3 w-1/2 rounded bg-zinc-800" />
              <div className="h-1.5 w-full rounded bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
