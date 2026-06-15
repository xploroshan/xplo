import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sanitizeInput } from "@/lib/sanitize"
import { resolveTenant, tenantContentWhere, tenantOwnerAccess } from "@/lib/tenant"

const patchBody = z.object({
  title: z.string().min(2).max(140).optional(),
  content: z.string().min(1).max(10_000).optional(),
  category: z.string().max(40).nullable().optional(),
  icon: z.string().max(40).nullable().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
})

async function owned(subdomain: string, id: string, userId?: string | null, role?: string | null) {
  const tenant = await resolveTenant(subdomain)
  if (!tenant) return { error: "notfound" as const }
  if (!(await tenantOwnerAccess(tenant, userId, role))) return { error: "forbidden" as const }
  const g = await db.guideline.findFirst({ where: { id, ...tenantContentWhere(tenant) }, select: { id: true } })
  if (!g) return { error: "notfound" as const }
  return { ok: true as const }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ subdomain: string; id: string }> }) {
  const { subdomain, id } = await params
  const session = await auth()
  const r = await owned(subdomain, id, session?.user?.id, session?.user?.role)
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.error === "forbidden" ? 403 : 404 })

  const parsed = patchBody.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  const d = parsed.data
  const data: Record<string, unknown> = {}
  if (d.title !== undefined) data.title = sanitizeInput(d.title)
  if (d.content !== undefined) data.content = sanitizeInput(d.content)
  if (d.category !== undefined) data.category = d.category ? sanitizeInput(d.category) : null
  if (d.icon !== undefined) data.icon = d.icon
  if (d.sortOrder !== undefined) data.sortOrder = d.sortOrder

  await db.guideline.update({ where: { id }, data })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ subdomain: string; id: string }> }) {
  const { subdomain, id } = await params
  const session = await auth()
  const r = await owned(subdomain, id, session?.user?.id, session?.user?.role)
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.error === "forbidden" ? 403 : 404 })
  await db.guideline.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
