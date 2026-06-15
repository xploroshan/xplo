export default function MessagesLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-pulse space-y-3">
      <div className="h-6 w-40 rounded bg-zinc-800 mb-4" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-3">
          <div className="h-10 w-10 rounded-full bg-zinc-800 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded bg-zinc-800" />
            <div className="h-3 w-2/3 rounded bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  )
}
