export default function ProfileLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
      <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 overflow-hidden">
        <div className="h-28 bg-zinc-800" />
        <div className="p-6 -mt-12">
          <div className="h-24 w-24 rounded-full bg-zinc-800 border-4 border-zinc-950" />
          <div className="h-6 w-48 rounded bg-zinc-800 mt-4" />
          <div className="h-4 w-64 rounded bg-zinc-800 mt-2" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-zinc-900/50 border border-zinc-800/50" />
        ))}
      </div>
    </div>
  )
}
