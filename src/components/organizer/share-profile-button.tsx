"use client"

import { useState } from "react"
import { Share2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ShareProfileButtonProps {
  slug: string
}

export function ShareProfileButton({ slug }: ShareProfileButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = `${window.location.origin}/@${slug}`

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textArea = document.createElement("textarea")
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-xl border-zinc-700 text-zinc-400 hover:text-white"
      onClick={handleShare}
      title="Copy profile link"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-400" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
    </Button>
  )
}
