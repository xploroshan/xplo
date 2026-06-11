"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MessageCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// Starts (or opens) a DM with another user and navigates to the thread.
export function MessageUserButton({ userId, className }: { userId: string; className?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function open() {
    setLoading(true)
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      if (res.status === 401) {
        router.push("/login")
        return
      }
      const data = await res.json()
      if (res.ok && data.id) router.push(`/messages/dm/${data.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" className={className} onClick={open} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
      Message
    </Button>
  )
}
