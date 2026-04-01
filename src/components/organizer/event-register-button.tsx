"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EventRegisterButtonProps {
  eventId: string
  isRegistered: boolean
  isAuthenticated: boolean
  isFull: boolean
  organizerSlug: string
}

export function EventRegisterButton({
  eventId,
  isRegistered: initialRegistered,
  isAuthenticated,
  isFull,
  organizerSlug,
}: EventRegisterButtonProps) {
  const router = useRouter()
  const [isRegistered, setIsRegistered] = useState(initialRegistered)
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=/@${organizerSlug}`)
      return
    }

    setLoading(true)
    try {
      if (isRegistered) {
        const res = await fetch(`/api/events/${eventId}/register`, {
          method: "DELETE",
        })
        if (res.ok) {
          setIsRegistered(false)
          router.refresh()
        }
      } else {
        const res = await fetch(`/api/events/${eventId}/register`, {
          method: "POST",
        })
        if (res.ok) {
          setIsRegistered(true)
          router.refresh()
        }
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false)
    }
  }

  if (isRegistered) {
    return (
      <Button
        variant="outline"
        className="w-full rounded-xl border-green-500/30 text-green-400 hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5 group"
        onClick={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Check className="h-4 w-4 mr-2" />
        )}
        <span className="group-hover:hidden">Registered</span>
        <span className="hidden group-hover:inline">Cancel Registration</span>
      </Button>
    )
  }

  return (
    <Button
      variant="glow"
      className="w-full rounded-xl"
      onClick={handleRegister}
      disabled={loading || isFull}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : null}
      {isFull ? "Event Full — Join Waitlist" : "Register"}
    </Button>
  )
}
