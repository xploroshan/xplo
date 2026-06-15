"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, MapPin, Check, CheckCircle2, MailWarning } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DEFAULT_EVENT_TYPES } from "@/lib/constants"

interface Organizer {
  id: string
  name: string
  slug: string
  image: string | null
  verified: boolean
  city: string | null
  followers: number
  events: number
}

// Interest tags seeded from the event-type taxonomy (drives recommendations).
const INTERESTS = DEFAULT_EVENT_TYPES.map((t) => t.name)

export function WelcomeFlow({
  initialCity,
  initialInterests,
  emailVerified,
  organizers,
}: {
  initialCity: string
  initialInterests: string[]
  emailVerified: boolean
  organizers: Organizer[]
}) {
  const router = useRouter()
  const [city, setCity] = useState(initialCity)
  const [interests, setInterests] = useState<string[]>(initialInterests)
  const [following, setFollowing] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [resent, setResent] = useState(false)

  const toggleInterest = (name: string) =>
    setInterests((prev) => (prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]))

  const toggleFollow = (id: string) =>
    setFollowing((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  async function finish(skip = false) {
    setSaving(true)
    try {
      if (!skip) {
        await fetch("/api/users/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ city: city.trim() || null, interests }),
        }).catch(() => {})
        // Follow selected organizers (fire-and-forget, best effort).
        await Promise.all(
          [...following].map((organizerId) =>
            fetch("/api/follow", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ organizerId }),
            }).catch(() => {})
          )
        )
      }
      router.push("/events")
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function resendVerification() {
    setResent(true)
    await fetch("/api/auth/resend-verification", { method: "POST" }).catch(() => {})
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Welcome to HYK<span className="text-orange-500">RZ</span> 🎉</h1>
        <p className="mt-2 text-sm text-zinc-400">A few quick taps and we&apos;ll tailor your feed.</p>
      </div>

      {/* Email verification nudge — surfaced here so it gets a real moment */}
      {!emailVerified && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
          <MailWarning className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-amber-200">Verify your email to secure your account.</p>
            <button
              onClick={resendVerification}
              disabled={resent}
              className="text-xs text-amber-400 hover:text-amber-300 mt-1 disabled:opacity-60"
            >
              {resent ? "Verification email sent ✓" : "Resend verification email"}
            </button>
          </div>
        </div>
      )}

      {/* City */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-orange-500" /> Your city
        </h2>
        <Input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Bangalore"
          className="bg-zinc-800/50 border-zinc-700 text-white"
        />
      </section>

      {/* Interests */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-2">What are you into?</h2>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((name) => {
            const on = interests.includes(name)
            return (
              <button
                key={name}
                onClick={() => toggleInterest(name)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  on
                    ? "border-orange-500 bg-orange-500/10 text-orange-400"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                }`}
              >
                {on && <Check className="inline h-3 w-3 mr-1" />}
                {name}
              </button>
            )
          })}
        </div>
      </section>

      {/* Follow organizers */}
      {organizers.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-white mb-2">Follow a few organizers</h2>
          <p className="text-xs text-zinc-500 mb-3">You&apos;ll get notified when they post new rides.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {organizers.map((o) => {
              const on = following.has(o.id)
              return (
                <button
                  key={o.id}
                  onClick={() => toggleFollow(o.id)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                    on ? "border-orange-500/40 bg-orange-500/5" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                  }`}
                >
                  <Avatar className="h-9 w-9">
                    {o.image ? (
                      <AvatarImageSafe src={o.image} />
                    ) : (
                      <AvatarFallback className="bg-orange-500/10 text-orange-500 text-xs font-bold">
                        {o.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate flex items-center gap-1">
                      {o.name}
                      {o.verified && <CheckCircle2 className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
                    </p>
                    <p className="text-xs text-zinc-500">{o.events} events · {o.followers} followers</p>
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${on ? "text-orange-400" : "text-zinc-500"}`}>
                    {on ? "Following" : "Follow"}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      <div className="flex items-center justify-between pt-2">
        <button onClick={() => finish(true)} disabled={saving} className="text-sm text-zinc-500 hover:text-zinc-300">
          Skip for now
        </button>
        <Button variant="glow" className="rounded-xl gap-2" onClick={() => finish(false)} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Start exploring
        </Button>
      </div>
    </div>
  )
}

// Small wrapper so the avatar <img> keeps lazy/async without pulling extra props.
function AvatarImageSafe({ src }: { src: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
}
