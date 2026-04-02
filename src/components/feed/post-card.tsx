"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Heart, MessageCircle, Share2, Bookmark, CheckCircle2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { MockPost } from "@/lib/mock-data"

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return "Just now"
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

function highlightHashtags(content: string): React.ReactNode {
  const parts = content.split(/(#\w+)/g)
  return parts.map((part, i) =>
    part.startsWith("#") ? (
      <span key={i} className="text-orange-500 hover:text-orange-400 cursor-pointer">
        {part}
      </span>
    ) : (
      part
    )
  )
}

export function PostCard({ post, index = 0 }: { post: MockPost; index?: number }) {
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const likes = liked ? post.likesCount + 1 : post.likesCount

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 overflow-hidden"
    >
      {/* Author Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-orange-500/10 text-orange-500 font-bold">
            {post.author.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-white">{post.author.name}</span>
            {post.author.verified && <CheckCircle2 className="h-3.5 w-3.5 text-orange-500" />}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>@{post.author.slug}</span>
            <span>·</span>
            <span>{timeAgo(post.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Event Tag */}
      {post.eventTag && (
        <div className="px-4 pb-2">
          <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
            📍 {post.eventTag.title}
          </Badge>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
          {highlightHashtags(post.content)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800/50">
        <div className="flex items-center gap-5">
          <button
            onClick={() => setLiked(!liked)}
            className="flex items-center gap-1.5 text-sm transition-colors"
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                liked ? "text-red-500 fill-red-500" : "text-zinc-500 hover:text-red-500"
              }`}
            />
            <span className={liked ? "text-red-500" : "text-zinc-500"}>{likes}</span>
          </button>

          <button className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-blue-400 transition-colors">
            <MessageCircle className="h-5 w-5" />
            <span>{post.commentsCount}</span>
          </button>

          <button className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-green-400 transition-colors">
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={() => setBookmarked(!bookmarked)}
          className="transition-colors"
        >
          <Bookmark
            className={`h-5 w-5 ${
              bookmarked ? "text-orange-500 fill-orange-500" : "text-zinc-500 hover:text-orange-500"
            }`}
          />
        </button>
      </div>
    </motion.div>
  )
}
