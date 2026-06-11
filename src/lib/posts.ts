/**
 * Social feed helpers (SRS Module 5) over the Post model.
 */

export function extractHashtags(content: string): string[] {
  return [...new Set([...content.matchAll(/#([a-zA-Z0-9_]+)/g)].map((m) => m[1].toLowerCase()))].slice(0, 20)
}

export const POST_SELECT = {
  id: true,
  content: true,
  images: true,
  visibility: true,
  likedBy: true,
  likesCount: true,
  bookmarkedBy: true,
  hashtags: true,
  isStory: true,
  expiresAt: true,
  createdAt: true,
  userId: true,
  user: { select: { id: true, name: true, image: true, slug: true, verified: true } },
  event: { select: { slug: true, title: true } },
  _count: { select: { comments: true } },
} as const

interface RawPost {
  id: string
  content: string | null
  images: unknown
  visibility: string
  likedBy: string[]
  likesCount: number
  bookmarkedBy: string[]
  hashtags: string[]
  isStory: boolean
  expiresAt: Date | null
  createdAt: Date
  userId: string
  user: { id: string; name: string | null; image: string | null; slug: string | null; verified: boolean }
  event: { slug: string; title: string } | null
  _count: { comments: number }
}

// Client shape: per-viewer flags instead of raw id arrays.
export function presentPost(p: RawPost, me: string | null) {
  return {
    id: p.id,
    content: p.content,
    images: Array.isArray(p.images) ? (p.images as string[]) : [],
    hashtags: p.hashtags,
    likes: p.likesCount,
    liked: !!me && p.likedBy.includes(me),
    bookmarked: !!me && p.bookmarkedBy.includes(me),
    comments: p._count.comments,
    isStory: p.isStory,
    createdAt: p.createdAt,
    mine: !!me && p.userId === me,
    author: p.user,
    event: p.event,
  }
}

export type PresentedPost = ReturnType<typeof presentPost>
