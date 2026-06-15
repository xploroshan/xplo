import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Compass } from "lucide-react"
import { resolveTenant } from "@/lib/tenant"
import { hexToHslTriplet } from "@/lib/color"
import { APP_NAME } from "@/lib/constants"
import { TenantNav } from "@/components/site/tenant-nav"

interface Props {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenant: label } = await params
  const tenant = await resolveTenant(label)
  if (!tenant) return { title: "Site not found" }
  return {
    title: { default: tenant.name, template: `%s · ${tenant.name}` },
    description: tenant.tagline || tenant.description || `${tenant.name} on ${APP_NAME}`,
  }
}

export default async function TenantLayout({ children, params }: Props) {
  const { tenant: label } = await params
  const tenant = await resolveTenant(label)
  if (!tenant) notFound()

  // Per-tenant theme: override the shared CSS tokens for this subtree.
  const triplet = hexToHslTriplet(tenant.themeColor)
  const themeVars = triplet
    ? ({
        "--primary": triplet,
        "--ring": triplet,
        "--accent": triplet,
        "--chart-1": triplet,
      } as React.CSSProperties)
    : undefined

  return (
    <div style={themeVars} className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Branded header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            {tenant.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logo} alt="" className="h-9 w-9 rounded-xl object-cover shrink-0" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary shrink-0">
                <Compass className="h-5 w-5" />
              </span>
            )}
            <span className="text-lg font-bold text-white truncate">{tenant.name}</span>
          </Link>
          <TenantNav />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer — keeps the platform attribution + a link back to HYKRZ. */}
      <footer className="border-t border-zinc-800/60 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-zinc-500">
          <span>© {new Date().getFullYear()} {tenant.name}</span>
          <a href={process.env.NEXT_PUBLIC_APP_URL || "https://hykrz.com"} className="hover:text-zinc-300 transition-colors">
            Powered by {APP_NAME}
          </a>
        </div>
      </footer>
    </div>
  )
}
