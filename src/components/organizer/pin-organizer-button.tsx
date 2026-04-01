"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pin, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PinOrganizerButtonProps {
  organizerId: string
  initialPinned: boolean
  isAuthenticated: boolean
}

export function PinOrganizerButton({
  organizerId,
  initialPinned,
  isAuthenticated,
}: PinOrganizerButtonProps) {
  const router = useRouter()
  const [pinned, setPinned] = useState(initialPinned)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleToggle() {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    setLoading(true)
    setError("")
    try {
      if (pinned) {
        const res = await fetch(`/api/pins/${organizerId}`, { method: "DELETE" })
        if (res.ok) {
          setPinned(false)
          router.refresh()
        }
      } else {
        const res = await fetch("/api/pins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizerId }),
        })
        if (res.ok) {
          setPinned(true)
          router.refresh()
        } else if (res.status === 409) {
          setError("Max 5 pins")
        }
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        className={`rounded-xl border-zinc-700 ${
          pinned ? "bg-orange-500/10 border-orange-500/30 text-orange-500" : "text-zinc-400 hover:text-white"
        }`}
        onClick={handleToggle}
        disabled={loading}
        title={pinned ? "Unpin from sidebar" : "Pin to sidebar"}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Pin className={`h-4 w-4 ${pinned ? "fill-current" : ""}`} />
        )}
      </Button>
      {error && (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-red-400 whitespace-nowrap">
          {error}
        </span>
      )}
    </div>
  )
}
