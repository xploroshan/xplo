"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, UserCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FollowButtonProps {
  organizerId: string
  initialFollowing: boolean
  isAuthenticated: boolean
}

export function FollowButton({
  organizerId,
  initialFollowing,
  isAuthenticated,
}: FollowButtonProps) {
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/follow", {
        method: following ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizerId }),
      })

      if (res.ok) {
        setFollowing(!following)
        router.refresh()
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={following ? "outline" : "glow"}
      className="rounded-xl"
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : following ? (
        <>
          <UserCheck className="h-4 w-4 mr-2" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  )
}
