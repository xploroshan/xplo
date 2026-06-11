"use client"

import { useState, Fragment } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, MessageCircle, Bookmark, CheckCircle2, Trash2, Send, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { PresentedPost } from "@/lib/posts"

function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return `${Math.floor(days / 7)}w`
}

function renderContent(content: string) {
  return content.split(/(#[a-zA-Z0-9_]+)/g).map((part, i) =>
    part.startsWith("#") ? (
      <Link key={i} href={`/feed?tag=${part.slice(1).toLowerCase()}`} className="text-orange-400 hover:text-orange-300">
        {part}
      </Link>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  )
}

interface CommentItem {
  id: string
  content: string
  createdAt: string
  user: { id: string; name: string | null; image: string | null }
}

export function PostCard({ post, isAuthenticated }: { post: PresentedPost; isAuthenticated: boolean }) {
  const router = useRouter()
  const [liked, setLiked] = useState(post.liked)
  const [likes, setLikes] = useState(post.likes)
  const [bookmarked, setBookmarked] = useState(post.bookmarked)
  const [deleted, setDeleted] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState<CommentItem[] | null>(null)
  const [commentCount, setCommentCount] = useState(post.comments)
  const [commentInput, setCommentInput] = useState("")
  const [sending, setSending] = useState(false)

  async function toggleLike() {
    if (!isAuthenticated) return router.push("/login?callbackUrl=/feed")
    setLiked(!liked)
    setLikes((n) => n + (liked ? -1 : 1))
    const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" })
    if (res.ok) {
      const data = await res.json()
      setLiked(data.liked)
      setLikes(data.likes)
    }
  }

  async function toggleBookmark() {
    if (!isAuthenticated) return router.push("/login?callbackUrl=/feed")
    setBookmarked(!bookmarked)
    await fetch(`/api/posts/${post.id}/bookmark`, { method: "POST" })
  }

  async function remove() {
    setDeleted(true)
    await fetch(`/api/posts/${post.id}`, { method: "DELETE" })
  }

  async function openComments() {
    setCommentsOpen((o) => !o)
    if (!comments) {
      const res = await fetch(`/api/posts/${post.id}/comments`)
      if (res.ok) setComments((await res.json()).comments)
    }
  }

  async function sendComment() {
    const content = commentInput.trim()
    if (!content || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        const data = await res.json()
        setComments((prev) => [...(prev ?? []), data.comment])
        setCommentCount((n) => n + 1)
        setCommentInput("")
      }
    } finally {
      setSending(false)
    }
  }

  if (deleted) return null

  const initials = post.author.name?.charAt(0).toUpperCase() ?? "?"

  return (
    <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 overflow-hidden">
      {/* Author */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <Avatar className="h-10 w-10">
          {post.author.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.author.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          ) : (
            <AvatarFallback className="bg-orange-500/10 text-orange-500 font-bold">{initials}</AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-white truncate">{post.author.name ?? "Rider"}</span>
            {post.author.verified && <CheckCircle2 className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
            <span className="text-xs text-zinc-600">· {timeAgo(post.createdAt)}</span>
          </div>
          {post.event && (
            <Link href={`/events/${post.event.slug}`} className="text-xs text-orange-400/90 hover:text-orange-300 truncate block">
              📍 {post.event.title}
            </Link>
          )}
        </div>
        {post.mine && (
          <button onClick={remove} title="Delete post" className="text-zinc-600 hover:text-red-400 p-1">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p className="px-4 pb-3 text-sm text-zinc-200 whitespace-pre-wrap break-words">
          {renderContent(post.content)}
        </p>
      )}

      {/* Images */}
      {post.images.length > 0 && (
        <div className={cn("grid gap-0.5", post.images.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
          {post.images.slice(0, 4).map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className={cn("w-full object-cover", post.images.length === 1 ? "max-h-[480px]" : "h-48")} />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 px-4 py-3">
        <button onClick={toggleLike} className={cn("flex items-center gap-1.5 text-sm", liked ? "text-red-400" : "text-zinc-500 hover:text-red-400")}>
          <Heart className={cn("h-[18px] w-[18px]", liked && "fill-red-400")} />
          {likes > 0 && likes}
        </button>
        <button onClick={openComments} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white">
          <MessageCircle className="h-[18px] w-[18px]" />
          {commentCount > 0 && commentCount}
        </button>
        <button onClick={toggleBookmark} className={cn("ml-auto", bookmarked ? "text-orange-400" : "text-zinc-500 hover:text-orange-400")}>
          <Bookmark className={cn("h-[18px] w-[18px]", bookmarked && "fill-orange-400")} />
        </button>
      </div>

      {/* Comments */}
      {commentsOpen && (
        <div className="border-t border-zinc-800/50 px-4 py-3 space-y-3">
          {comments === null ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-600 mx-auto" />
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <Avatar className="h-6 w-6 shrink-0">
                  {c.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.user.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  ) : (
                    <AvatarFallback className="bg-zinc-700 text-zinc-300 text-[9px]">{c.user.name?.charAt(0) ?? "?"}</AvatarFallback>
                  )}
                </Avatar>
                <p className="text-sm text-zinc-300 min-w-0">
                  <span className="font-medium text-white mr-1.5">{c.user.name ?? "Rider"}</span>
                  {c.content}
                </p>
              </div>
            ))
          )}
          {isAuthenticated && (
            <div className="flex items-center gap-2 pt-1">
              <input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendComment()}
                placeholder="Add a comment…"
                className="flex-1 rounded-lg bg-zinc-800/60 border border-zinc-700/60 px-3 py-1.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-orange-500/40"
              />
              <button onClick={sendComment} disabled={sending || !commentInput.trim()} className="text-orange-400 disabled:text-zinc-700">
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
