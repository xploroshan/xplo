"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Megaphone, ExternalLink, Loader2, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function OrganizerCta() {
  const { data: session } = useSession()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [slug, setSlug] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const role = session?.user?.role

  // Organizer — show link to their profile
  if (role === "ORGANIZER" || role === "ADMIN" || role === "SUPER_ADMIN") {
    return (
      <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-orange-500" />
              Organizer Profile
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Manage your public organizer page and events.
            </p>
          </div>
          <Button
            variant="glow"
            className="rounded-xl shrink-0"
            onClick={() => {
              // Fetch slug from session or redirect to profile
              fetch("/api/users/upgrade-to-organizer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
                .then(res => res.json())
                .then(data => {
                  if (data.slug) {
                    window.open(`/@${data.slug}`, "_blank")
                  }
                })
                .catch(() => {})
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Page
          </Button>
        </div>
      </div>
    )
  }

  // Regular user — show upgrade CTA
  if (!showForm) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-orange-500" />
              Become an Organizer
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Create your public profile, organize events, and build your community.
            </p>
          </div>
          <Button
            variant="glow"
            className="rounded-xl shrink-0"
            onClick={() => setShowForm(true)}
          >
            Get Started
          </Button>
        </div>
      </div>
    )
  }

  // Upgrade form
  async function handleUpgrade() {
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/users/upgrade-to-organizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slug || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to upgrade")
      } else {
        router.push(`/@${data.slug}`)
        router.refresh()
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  function handleSlugInput(value: string) {
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
  }

  return (
    <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-orange-500" />
        Set Up Your Organizer Profile
      </h3>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-300">Choose your profile URL</label>
        <div className="relative">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            type="text"
            placeholder="your-name"
            value={slug}
            onChange={(e) => handleSlugInput(e.target.value)}
            minLength={3}
            maxLength={30}
            className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500"
          />
        </div>
        {slug && (
          <p className="text-xs text-zinc-500">
            Your profile: <span className="text-orange-500">hykrz.com/@{slug}</span>
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="glow"
          className="rounded-xl"
          onClick={handleUpgrade}
          disabled={loading || slug.length < 3}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Become an Organizer
        </Button>
        <Button
          variant="outline"
          className="rounded-xl border-zinc-700 text-zinc-400"
          onClick={() => setShowForm(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
