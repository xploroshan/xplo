"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ImagePlus, Loader2, Send, X, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function PostComposer() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [content, setContent] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [asStory, setAsStory] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function addImage(file: File) {
    if (images.length >= 10) return
    setUploading(true)
    setError(null)
    try {
      const body = new FormData()
      body.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      setImages((prev) => [...prev, data.url])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function publish() {
    if (posting) return
    setPosting(true)
    setError(null)
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim() || undefined,
          images: images.length > 0 ? images : undefined,
          isStory: asStory,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not post")
      setContent("")
      setImages([])
      setAsStory(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post")
    } finally {
      setPosting(false)
    }
  }

  const canPost = !posting && !uploading && (content.trim() || images.length > 0) && (!asStory || images.length > 0)

  return (
    <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
        maxLength={2200}
        placeholder="Share your adventure…  #hashtags work"
        className="w-full resize-none bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none"
      />

      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap mt-2">
          {images.map((src, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-20 w-20 rounded-lg object-cover" />
              <button
                onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 rounded-full bg-zinc-950 border border-zinc-700 p-0.5 text-zinc-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-800/50">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) addImage(f)
            e.target.value = ""
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading || images.length >= 10}
          className="text-zinc-400 hover:text-white p-1.5 disabled:opacity-40"
          title="Add photo"
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
        </button>
        <button
          onClick={() => setAsStory((s) => !s)}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border",
            asStory
              ? "bg-orange-500/15 text-orange-400 border-orange-500/40"
              : "text-zinc-500 border-zinc-800 hover:text-zinc-300"
          )}
          title="Stories disappear after 24 hours"
        >
          <Zap className="h-3 w-3" />
          24h story
        </button>
        <Button variant="glow" size="sm" className="ml-auto gap-1.5" onClick={publish} disabled={!canPost}>
          {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Post
        </Button>
      </div>
    </div>
  )
}
