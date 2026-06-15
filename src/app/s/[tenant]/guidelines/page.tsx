import { notFound } from "next/navigation"
import { ShieldCheck } from "lucide-react"
import { db } from "@/lib/db"
import { resolveTenant, tenantContentWhere } from "@/lib/tenant"

export const metadata = { title: "Guidelines" }

export default async function TenantGuidelines({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: label } = await params
  const tenant = await resolveTenant(label)
  if (!tenant) notFound()

  const guidelines = await db.guideline.findMany({
    where: tenantContentWhere(tenant),
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  })

  // Group by category, preserving order.
  const groups = new Map<string, typeof guidelines>()
  for (const g of guidelines) {
    const key = g.category || "General"
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(g)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-white mb-6">
        <ShieldCheck className="h-6 w-6 text-primary" /> Guidelines
      </h1>
      {guidelines.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 py-16 text-center text-zinc-500">
          No guidelines posted yet.
        </div>
      ) : (
        <div className="space-y-8">
          {[...groups.entries()].map(([category, items]) => (
            <section key={category}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">{category}</h2>
              <div className="space-y-3">
                {items.map((g) => (
                  <div key={g.id} className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5">
                    <h3 className="text-base font-semibold text-white">{g.title}</h3>
                    <p className="mt-1.5 text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{g.content}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
