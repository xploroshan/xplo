"use client"

import { useRef, useState } from "react"
import { ImagePlus, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  /** Tailwind aspect/size classes for the drop zone. */
  className?: string
  label?: string
}

/**
 * Reusable image picker — uploads to /api/upload (Vercel Blob) and returns the
 * public URL via onChange. Used for event covers, avatars, and org logos/banners.
 */
export function ImageUpload({ value, onChange, className, label = "Upload image" }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setBusy(true)
    setError(null)
    try {
      const body = new FormData()
      body.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      onChange(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ""
        }}
      />

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full h-full min-h-32 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-orange-500/50 hover:text-orange-400 transition-colors"
        >
          {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
          <span className="text-xs font-medium">{busy ? "Uploading…" : label}</span>
        </button>
      )}

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  )
}
