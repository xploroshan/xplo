import Link from "next/link"
import { LayoutGrid } from "lucide-react"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { POST_SELECT, presentPost } from "@/lib/posts"
import { PostCard } from "@/components/feed/post-card"
import { PostComposer } from "@/components/feed/post-composer"
import { StoriesStrip, type StoryGroup } from "@/components/feed/stories-strip"

export const metadata = { title: "Feed — HYKRZ" }

interface PageProps {
  searchParams: Promise<{ tab?: string; tag?: string }>
}

export default async function FeedPage({ searchParams }: PageProps) {
  const { tab, tag } = await searchParams
  const session = await auth()
  const me = session?.user?.id ?? null
  const following = tab === "following" && !!me

  // Posts
  const where: Record<string, unknown> = { visibility: "public", isStory: false }
  if (tag) where.hashtags = { has: tag.toLowerCase() }
  if (following) {
    const follows = await db.follow.findMany({
      where: { followerId: me! },
      select: { followingId: true },
    })
    where.userId = { in: [...follows.map((f) => f.followingId), me!] }
  }
  const posts = await db.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 30,
    select: POST_SELECT,
  })

  // Active stories (24h), grouped by author.
  const stories = await db.post.findMany({
    where: { isStory: true, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "asc" },
    take: 60,
    select: {
      id: true,
      content: true,
      images: true,
      createdAt: true,
      user: { select: { id: true, name: true, image: true } },
    },
  })
  const groupMap = new Map<string, StoryGroup>()
  for (const s of stories) {
    const img = Array.isArray(s.images) ? (s.images as string[])[0] : null
    if (!img) continue
    const g = groupMap.get(s.user.id) ?? { user: s.user, stories: [] }
    g.stories.push({ id: s.id, image: img, content: s.content, createdAt: s.createdAt.toISOString() })
    groupMap.set(s.user.id, g)
  }
  const storyGroups = [...groupMap.values()]

  const tabs = [
    { key: undefined, label: "For you", href: "/feed" },
    { key: "following", label: "Following", href: "/feed?tab=following" },
  ]

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Feed</h1>
        <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-900/50 p-0.5">
          {tabs.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                (tab === "following") === (t.key === "following")
                  ? "bg-orange-500/15 text-orange-400"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {tag && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-400">
            Posts tagged <span className="text-orange-400 font-medium">#{tag}</span>
          </span>
          <Link href="/feed" className="text-xs text-zinc-500 hover:text-white">
            ✕ clear
          </Link>
        </div>
      )}

      {!tag && <StoriesStrip groups={storyGroups} />}

      {me ? (
        <PostComposer />
      ) : (
        <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4 text-sm text-zinc-400">
          <Link href="/login?callbackUrl=/feed" className="text-orange-400 font-medium">
            Sign in
          </Link>{" "}
          to share your adventures.
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
            <LayoutGrid className="h-7 w-7 text-zinc-600" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">
            {following ? "Nothing from people you follow yet" : tag ? "No posts with this tag" : "No posts yet"}
          </h3>
          <p className="text-sm text-zinc-500">
            {following ? "Follow organizers to fill this tab." : "Be the first to share a ride photo!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={presentPost(p, me)} isAuthenticated={!!me} />
          ))}
        </div>
      )}
    </div>
  )
}
