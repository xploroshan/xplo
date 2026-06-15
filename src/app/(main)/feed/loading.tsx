export default function FeedLoading() {
  return (
    <div className="max-w-xl mx-auto px-4 py-6 animate-pulse space-y-5">
      <div className="flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 w-16 rounded-full bg-zinc-800 shrink-0" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-zinc-800" />
            <div className="h-4 w-32 rounded bg-zinc-800" />
          </div>
          <div className="h-48 rounded-xl bg-zinc-800" />
          <div className="h-3 w-2/3 rounded bg-zinc-800" />
        </div>
      ))}
    </div>
  )
}
