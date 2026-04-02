export default function OrganizerLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="h-24 w-24 rounded-full bg-zinc-800" />
        <div className="flex-1 space-y-3">
          <div className="h-7 w-48 rounded bg-zinc-800" />
          <div className="h-4 w-32 rounded bg-zinc-800" />
          <div className="h-4 w-72 rounded bg-zinc-800" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-4 gap-4 mt-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="h-6 w-12 rounded bg-zinc-800 mx-auto mb-2" />
            <div className="h-3 w-20 rounded bg-zinc-800 mx-auto" />
          </div>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-4 mt-10 mb-6 border-b border-zinc-800 pb-3">
        <div className="h-4 w-32 rounded bg-zinc-800" />
        <div className="h-4 w-24 rounded bg-zinc-800" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="h-5 w-48 rounded bg-zinc-800 mb-3" />
            <div className="h-4 w-36 rounded bg-zinc-800 mb-2" />
            <div className="h-4 w-28 rounded bg-zinc-800 mb-4" />
            <div className="h-2 w-full rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  )
}
