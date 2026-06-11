"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, BellRing, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RemindButtonProps {
  eventId: string
  isAuthenticated: boolean
  initialReminding: boolean
}

// "Remind me when registration opens" for events that aren't joinable yet.
export function RemindButton({ eventId, isAuthenticated, initialReminding }: RemindButtonProps) {
  const router = useRouter()
  const [reminding, setReminding] = useState(initialReminding)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (!isAuthenticated) {
      router.push("/login?callbackUrl=/events")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}/remind`, {
        method: reminding ? "DELETE" : "POST",
      })
      if (res.ok) setReminding(!reminding)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={reminding ? "outline" : "glow"}
      className={`w-full rounded-xl ${reminding ? "border-orange-500/30 text-orange-400" : ""}`}
      onClick={toggle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : reminding ? (
        <BellRing className="h-4 w-4 mr-2" />
      ) : (
        <Bell className="h-4 w-4 mr-2" />
      )}
      {reminding ? "We'll remind you" : "Remind me when it opens"}
    </Button>
  )
}
