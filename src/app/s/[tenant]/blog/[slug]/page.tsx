import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { db } from "@/lib/db"
import { resolveTenant, tenantContentWhere } from "@/lib/tenant"

interface Props {
  params: Promise<{ tenant: string; slug: string }>
}

async function getPost(label: string, slug: string) {
  const tenant = await resolveTenant(label)
  if (!tenant) return null
  const post = await db.blogPost.findFirst({
    where: { ...tenantContentWhere(tenant), slug, status: "published" },
    select: { title: true, excerpt: true, content: true, coverImage: true, tags: true, publishedAt: true },
  })
  return post ? { tenant, post } : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenant: label, slug } = await params
  const r = await getPost(label, slug)
  if (!r) return { title: "Post not found" }
  return { title: r.post.title, description: r.post.excerpt ?? undefined }
}

export default async function TenantBlogPost({ params }: Props) {
  const { tenant: label, slug } = await params
  const r = await getPost(label, slug)
  if (!r) notFound()
  const { post } = r

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4" /> All posts
      </Link>
      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverImage} alt="" className="aspect-[16/9] w-full rounded-2xl object-cover mb-6" />
      )}
      <h1 className="text-3xl font-bold text-white">{post.title}</h1>
      {post.publishedAt && (
        <p className="mt-2 text-sm text-zinc-500">
          {new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      )}
      <div className="mt-6 text-[15px] leading-relaxed text-zinc-300 whitespace-pre-line">{post.content}</div>
      {post.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <span key={t} className="rounded-full bg-zinc-800/60 px-3 py-1 text-xs text-zinc-400">#{t}</span>
          ))}
        </div>
      )}
    </article>
  )
}
