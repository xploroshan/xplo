"use client"

import { useState } from "react"
import { Share2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { track } from "@/lib/analytics-client"

interface ShareProfileButtonProps {
  slug: string
  /** Organiser name, used in the native share sheet text. */
  name?: string | null
}

export function ShareProfileButton({ slug, name }: ShareProfileButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = `${window.location.origin}/@${slug}`
    const title = name ? `${name} on HYKRZ` : "Check out this organiser on HYKRZ"
    const text = name
      ? `Follow ${name}'s rides and join the next one 🏍️`
      : "Discover and join group rides & treks 🏍️"

    // Prefer the native share sheet on mobile (WhatsApp/Instagram/etc.).
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url })
        track("share_clicked", { props: { context: "organizer_profile", slug } })
        return
      } catch {
        // User dismissed the sheet, or share failed — fall back to copy.
      }
    }

    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const textArea = document.createElement("textarea")
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
    }
    track("link_copied", { props: { context: "organizer_profile", slug } })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-xl border-zinc-700 text-zinc-400 hover:text-white"
      onClick={handleShare}
      title="Share profile"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-400" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
    </Button>
  )
}
