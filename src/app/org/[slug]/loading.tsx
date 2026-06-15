export default function OrgLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 animate-pulse">
      <div className="h-40 rounded-2xl bg-zinc-800 mb-6" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-zinc-900/50 border border-zinc-800/50" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-zinc-900/50 border border-zinc-800/50" />
    </div>
  )
}
