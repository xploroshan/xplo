import Link from "next/link"
import { notFound } from "next/navigation"
import { Newspaper, ShieldCheck, ArrowLeft } from "lucide-react"
import { auth } from "@/lib/auth"
import { resolveTenant, tenantOwnerAccess } from "@/lib/tenant"

export const metadata = { title: "Manage" }

export default async function ManageHub({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: label } = await params
  const tenant = await resolveTenant(label)
  if (!tenant) notFound()
  const session = await auth()
  if (!(await tenantOwnerAccess(tenant, session?.user?.id, session?.user?.role))) notFound()

  const tiles = [
    { href: "/manage/blog", label: "Blog", desc: "Write and publish posts", icon: Newspaper },
    { href: "/manage/guidelines", label: "Guidelines", desc: "Rules & safety info", icon: ShieldCheck },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to site
      </Link>
      <h1 className="text-2xl font-bold text-white mb-6">Manage {tenant.name}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 hover:border-primary/40 transition-colors">
            <t.icon className="h-6 w-6 text-primary mb-3" />
            <p className="text-sm font-semibold text-white">{t.label}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{t.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
