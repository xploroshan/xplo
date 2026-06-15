export default function EventDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 animate-pulse">
      <div className="h-4 w-28 rounded bg-zinc-800 mb-6" />
      <div className="h-[220px] sm:h-[300px] rounded-2xl bg-zinc-800 mb-8" />
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-zinc-900/50 border border-zinc-800/50" />
            ))}
          </div>
          <div className="h-40 rounded-2xl bg-zinc-900/50 border border-zinc-800/50" />
          <div className="h-56 rounded-2xl bg-zinc-900/50 border border-zinc-800/50" />
        </div>
        <div className="lg:w-80 shrink-0">
          <div className="h-72 rounded-2xl bg-zinc-900/50 border border-zinc-800/50" />
        </div>
      </div>
    </div>
  )
}
