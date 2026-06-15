import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sanitizeInput } from "@/lib/sanitize"
import { resolveTenant, tenantContentWhere, tenantOwnerAccess } from "@/lib/tenant"

const createBody = z.object({
  title: z.string().min(2).max(140),
  content: z.string().min(1).max(10_000),
  category: z.string().max(40).optional(),
  icon: z.string().max(40).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
})

export async function GET(_req: Request, { params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params
  const tenant = await resolveTenant(subdomain)
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const session = await auth()
  if (!(await tenantOwnerAccess(tenant, session?.user?.id, session?.user?.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const guidelines = await db.guideline.findMany({
    where: tenantContentWhere(tenant),
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  })
  return NextResponse.json({ guidelines })
}

export async function POST(req: Request, { params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params
  const tenant = await resolveTenant(subdomain)
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const session = await auth()
  if (!(await tenantOwnerAccess(tenant, session?.user?.id, session?.user?.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const parsed = createBody.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 })
  const d = parsed.data
  const guideline = await db.guideline.create({
    data: {
      ...tenantContentWhere(tenant),
      title: sanitizeInput(d.title),
      content: sanitizeInput(d.content),
      category: d.category ? sanitizeInput(d.category) : null,
      icon: d.icon ?? null,
      sortOrder: d.sortOrder ?? 0,
    },
    select: { id: true },
  })
  return NextResponse.json({ guideline }, { status: 201 })
}
