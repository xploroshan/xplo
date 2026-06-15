import { NextResponse } from "next/server"
import { z } from "zod/v4"
import slugify from "slugify"
import { nanoid } from "nanoid"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sanitizeInput } from "@/lib/sanitize"
import { rateLimit } from "@/lib/rate-limit"
import { resolveTenant, tenantContentWhere, tenantOwnerAccess } from "@/lib/tenant"

const createBody = z.object({
  title: z.string().min(2).max(140),
  excerpt: z.string().max(300).optional(),
  content: z.string().min(1).max(50_000),
  coverImage: z.string().url().nullable().optional(),
  tags: z.array(z.string().min(1).max(40)).max(10).optional(),
  status: z.enum(["draft", "published"]).default("draft"),
})

// Owner-only list (includes drafts). Public reads happen in the microsite page.
export async function GET(_req: Request, { params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params
  const tenant = await resolveTenant(subdomain)
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const session = await auth()
  if (!(await tenantOwnerAccess(tenant, session?.user?.id, session?.user?.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const posts = await db.blogPost.findMany({
    where: tenantContentWhere(tenant),
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, slug: true, excerpt: true, status: true, coverImage: true, publishedAt: true, updatedAt: true },
  })
  return NextResponse.json({ posts })
}

export async function POST(req: Request, { params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params
  const tenant = await resolveTenant(subdomain)
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const session = await auth()
  if (!(await tenantOwnerAccess(tenant, session?.user?.id, session?.user?.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { success } = await rateLimit(`blog:${session!.user!.id}`, 30, 60 * 60 * 1000)
  if (!success) return NextResponse.json({ error: "Too many posts. Try later." }, { status: 429 })

  const parsed = createBody.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 })
  }
  const d = parsed.data
  const owner = tenantContentWhere(tenant)

  // Slug unique within this tenant.
  const base = slugify(d.title, { lower: true, strict: true }).slice(0, 60) || "post"
  let slug = base
  if (await db.blogPost.findFirst({ where: { ...owner, slug }, select: { id: true } })) {
    slug = `${base}-${nanoid(6).toLowerCase()}`
  }

  const post = await db.blogPost.create({
    data: {
      ...owner,
      title: sanitizeInput(d.title),
      slug,
      excerpt: d.excerpt ? sanitizeInput(d.excerpt) : null,
      content: sanitizeInput(d.content),
      coverImage: d.coverImage ?? null,
      tags: d.tags ?? [],
      status: d.status,
      publishedAt: d.status === "published" ? new Date() : null,
      authorId: session!.user!.id,
    },
    select: { id: true, slug: true },
  })
  return NextResponse.json({ post }, { status: 201 })
}
