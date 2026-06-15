import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { resolveTenant, tenantContentWhere } from "@/lib/tenant"

export const metadata = { title: "Blog" }

export default async function TenantBlog({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: label } = await params
  const tenant = await resolveTenant(label)
  if (!tenant) notFound()

  const posts = await db.blogPost.findMany({
    where: { ...tenantContentWhere(tenant), status: "published" },
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, publishedAt: true },
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-white mb-6">Blog</h1>
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 py-16 text-center text-zinc-500">
          No posts yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {posts.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="group rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden transition-colors hover:border-zinc-700"
            >
              {p.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.coverImage} alt="" className="aspect-[16/9] w-full object-cover" />
              ) : (
                <div className="aspect-[16/9] w-full bg-gradient-to-br from-primary/15 to-zinc-900" />
              )}
              <div className="p-4">
                <h2 className="text-base font-semibold text-white group-hover:text-primary transition-colors">{p.title}</h2>
                {p.excerpt && <p className="mt-1 text-sm text-zinc-400 line-clamp-2">{p.excerpt}</p>}
                {p.publishedAt && (
                  <p className="mt-2 text-xs text-zinc-500">
                    {new Date(p.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
