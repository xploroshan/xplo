import { NextResponse } from "next/server"
import { z } from "zod/v4"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sanitizeInput } from "@/lib/sanitize"
import { resolveTenant, tenantContentWhere, tenantOwnerAccess } from "@/lib/tenant"

const patchBody = z.object({
  title: z.string().min(2).max(140).optional(),
  excerpt: z.string().max(300).nullable().optional(),
  content: z.string().min(1).max(50_000).optional(),
  coverImage: z.string().url().nullable().optional(),
  tags: z.array(z.string().min(1).max(40)).max(10).optional(),
  status: z.enum(["draft", "published"]).optional(),
})

async function ownedPost(subdomain: string, id: string, userId?: string | null, role?: string | null) {
  const tenant = await resolveTenant(subdomain)
  if (!tenant) return { error: "notfound" as const }
  if (!(await tenantOwnerAccess(tenant, userId, role))) return { error: "forbidden" as const }
  const post = await db.blogPost.findFirst({ where: { id, ...tenantContentWhere(tenant) }, select: { id: true, status: true, publishedAt: true } })
  if (!post) return { error: "notfound" as const }
  return { post }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ subdomain: string; id: string }> }) {
  const { subdomain, id } = await params
  const session = await auth()
  const r = await ownedPost(subdomain, id, session?.user?.id, session?.user?.role)
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.error === "forbidden" ? 403 : 404 })

  const parsed = patchBody.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  const d = parsed.data
  const data: Record<string, unknown> = {}
  if (d.title !== undefined) data.title = sanitizeInput(d.title)
  if (d.excerpt !== undefined) data.excerpt = d.excerpt ? sanitizeInput(d.excerpt) : null
  if (d.content !== undefined) data.content = sanitizeInput(d.content)
  if (d.coverImage !== undefined) data.coverImage = d.coverImage
  if (d.tags !== undefined) data.tags = d.tags
  if (d.status !== undefined) {
    data.status = d.status
    // Stamp publishedAt the first time it goes live.
    if (d.status === "published" && !r.post.publishedAt) data.publishedAt = new Date()
  }

  await db.blogPost.update({ where: { id }, data })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ subdomain: string; id: string }> }) {
  const { subdomain, id } = await params
  const session = await auth()
  const r = await ownedPost(subdomain, id, session?.user?.id, session?.user?.role)
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.error === "forbidden" ? 403 : 404 })
  await db.blogPost.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
