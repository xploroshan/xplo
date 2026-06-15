"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  CheckCircle2,
  Share2,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AiEnhanceButton } from "@/components/events/ai-enhance-button"
import { AiSuggestionsPanel } from "@/components/events/ai-suggestions-panel"
import { OrgSelector } from "@/components/organizations/org-selector"
import { ImageUpload } from "@/components/image-upload"
import Link from "next/link"
import { DEFAULT_EVENT_TYPES } from "@/lib/constants"
import { track } from "@/lib/analytics-client"

interface UserOrg {
  id: string
  name: string
  slug: string
  logo: string | null
}

interface Published {
  eventSlug: string
  organizerSlug: string
  title: string
}

export default function CreateEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [published, setPublished] = useState<Published | null>(null)
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [userOrgs, setUserOrgs] = useState<UserOrg[]>([])
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ key: string; label: string; value: string | string[] }> | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  // Controlled so AI suggestions can populate them; the rest stay uncontrolled.
  const [title, setTitle] = useState("")
  const [eventType, setEventType] = useState("")
  const [description, setDescription] = useState("")
  const [checklist, setChecklist] = useState("")
  const [difficulty, setDifficulty] = useState("")
  // Structured AI extras (itinerary/safety/weather/fitness/duration) → aiAssessment.
  const [aiExtras, setAiExtras] = useState<Record<string, unknown> | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Map an AI enhance key onto the matching form field.
  function applySuggestion(key: string, value: string | string[]) {
    if (key === "description" && typeof value === "string") setDescription(value)
    else if (key === "equipmentChecklist" && Array.isArray(value)) setChecklist(value.join("\n"))
    else if (key === "difficulty" && typeof value === "string") setDifficulty(value)
  }

  useEffect(() => {
    fetch("/api/organizations?mine=true")
      .then((res) => (res.ok ? res.json() : { organizations: [] }))
      .then((data) => setUserOrgs(data.organizations || []))
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const titleVal = title.trim()
    const eventTypeSlug = eventType || null
    const startDate = fd.get("startDate") as string | null

    if (!eventTypeSlug) {
      setError("Please pick an event type.")
      return
    }
    if (!titleVal || !startDate) {
      setError("Title and start date are required.")
      return
    }

    const num = (k: string) => {
      const v = fd.get(k)
      const n = v ? Number(v) : NaN
      return Number.isFinite(n) ? n : undefined
    }
    const str = (k: string) => {
      const v = (fd.get(k) as string)?.trim()
      return v || undefined
    }

    setLoading(true)
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleVal,
          eventTypeSlug,
          startDate,
          description: description.trim() || undefined,
          endDate: str("endDate"),
          startLocationAddress: str("startLocation"),
          destinationAddress: str("destination"),
          capacity: num("capacity"),
          price: num("price"),
          coverImage: coverImage ?? undefined,
          requiresApproval: fd.get("requiresApproval") === "on",
          organizationId: selectedOrgId ?? undefined,
          assemblyPointAddress: str("assemblyPoint"),
          assemblyPointTime: str("assemblyTime"),
          difficulty: difficulty || undefined,
          aiAssessment: aiExtras ?? undefined,
          checklist: checklist
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || "Could not publish event. Please try again.")
        return
      }
      setPublished({ eventSlug: data.event.slug, organizerSlug: data.organizerSlug, title })
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (published) {
    return <PublishedSuccess published={published} />
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Events
      </Link>

      <h1 className="text-3xl font-bold text-white mb-2">Create Event</h1>
      <p className="text-sm text-zinc-400 mb-8">
        Publish in under a minute — you&apos;ll get a shareable link to drop in your bio.
      </p>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {userOrgs.length > 0 && (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="pt-6">
              <OrgSelector value={selectedOrgId} onChange={setSelectedOrgId} organizations={userOrgs} />
            </CardContent>
          </Card>
        )}

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Event Title</label>
              <Input
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekend Ride to Goa"
                required
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Event Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DEFAULT_EVENT_TYPES.map((type) => (
                  <label
                    key={type.slug}
                    className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/30 p-3 cursor-pointer hover:border-orange-500/50 transition-colors has-[:checked]:border-orange-500 has-[:checked]:bg-orange-500/10"
                  >
                    <input
                      type="radio"
                      name="eventType"
                      value={type.slug}
                      checked={eventType === type.slug}
                      onChange={(e) => setEventType(e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-xs font-medium text-zinc-300">{type.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-300">Description</label>
                <AiEnhanceButton
                  disabled={!title.trim() || !eventType}
                  getFormData={() => {
                    const fd = new FormData(formRef.current!)
                    const n = (k: string) => {
                      const v = fd.get(k)
                      const x = v ? Number(v) : NaN
                      return Number.isFinite(x) ? x : undefined
                    }
                    return {
                      title: title.trim(),
                      eventType,
                      startLocation: (fd.get("startLocation") as string) || undefined,
                      destination: (fd.get("destination") as string) || undefined,
                      startDate: (fd.get("startDate") as string) || undefined,
                      endDate: (fd.get("endDate") as string) || undefined,
                      capacity: n("capacity"),
                      price: n("price"),
                    }
                  }}
                  onError={(msg) => setAiError(msg)}
                  onResult={(result) => {
                    setAiError(null)
                    // Stash structured extras for submission as aiAssessment.
                    setAiExtras(result)
                    // Build display suggestions; itinerary objects → readable lines.
                    const labelize = (k: string) =>
                      k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())
                    const suggestions = Object.entries(result)
                      .filter(([, v]) => v !== undefined && v !== null && (!Array.isArray(v) || v.length > 0))
                      .map(([key, value]) => {
                        let display: string | string[]
                        if (key === "itinerary" && Array.isArray(value)) {
                          display = (value as Array<{ time?: string; activity?: string }>).map(
                            (it) => [it.time, it.activity].filter(Boolean).join(" — ")
                          )
                        } else {
                          display = value as string | string[]
                        }
                        return { key, label: labelize(key), value: display }
                      })
                    setAiSuggestions(suggestions)
                  }}
                />
              </div>
              <textarea
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your event..."
                rows={4}
                className="w-full rounded-lg bg-zinc-800/50 border border-zinc-700 text-white placeholder:text-zinc-500 p-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none"
              />
            </div>

            {aiError && (
              <p className="text-xs text-red-400">{aiError}</p>
            )}

            {aiSuggestions && (
              <AiSuggestionsPanel
                suggestions={aiSuggestions}
                onApply={applySuggestion}
                onApplyAll={() => aiSuggestions.forEach((s) => applySuggestion(s.key, s.value))}
                onDismiss={() => setAiSuggestions(null)}
              />
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Difficulty</label>
              <select
                name="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-lg bg-zinc-800/50 border border-zinc-700 text-white text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500/50"
              >
                <option value="">Not specified</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" /> Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Start Date &amp; Time</label>
                <Input
                  type="datetime-local"
                  name="startDate"
                  required
                  className="bg-zinc-800/50 border-zinc-700 text-white focus-visible:ring-orange-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">End Date &amp; Time</label>
                <Input
                  type="datetime-local"
                  name="endDate"
                  className="bg-zinc-800/50 border-zinc-700 text-white focus-visible:ring-orange-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-500" /> Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Starting Point</label>
              <Input
                name="startLocation"
                placeholder="Assembly point address"
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Destination</label>
              <Input
                name="destination"
                placeholder="Destination address"
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" /> Capacity &amp; Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Max Participants</label>
                <Input
                  type="number"
                  name="capacity"
                  placeholder="e.g. 30"
                  min={2}
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Price (INR)
                </label>
                <Input
                  type="number"
                  name="price"
                  placeholder="0 for free"
                  min={0}
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-300 pt-1">
              <input
                type="checkbox"
                name="requiresApproval"
                className="rounded border-zinc-700 bg-zinc-900"
              />
              Require my approval before riders can join
            </label>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white">Cover Image</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              value={coverImage}
              onChange={setCoverImage}
              className="h-44"
              label="Upload a cover photo (optional)"
            />
            <p className="text-xs text-zinc-500 mt-2">
              Events with a photo get noticeably more registrations.
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-500" /> Assembly &amp; Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Assembly point</label>
                <Input
                  name="assemblyPoint"
                  placeholder="e.g. Indiranagar HP petrol pump"
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Assembly time</label>
                <Input
                  name="assemblyTime"
                  placeholder="e.g. 5:45 AM sharp"
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Pre-ride checklist <span className="text-zinc-500">(one item per line)</span>
              </label>
              <textarea
                name="checklist"
                value={checklist}
                onChange={(e) => setChecklist(e.target.value)}
                rows={4}
                placeholder={"Full tank of fuel\nValid licence & RC\nHelmet & riding gear\nRain jacket"}
                className="w-full rounded-xl bg-zinc-800/50 border border-zinc-700 text-sm text-white placeholder:text-zinc-500 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500/40"
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <Button variant="glow" type="submit" className="rounded-xl" disabled={loading}>
            {loading ? "Publishing..." : "Publish Event"}
          </Button>
        </div>
      </form>
    </div>
  )
}

function PublishedSuccess({ published }: { published: Published }) {
  // Always rendered client-side (after a successful POST), so reading window
  // during the initializer is safe and avoids a setState-in-effect.
  const [origin] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""))
  const [copied, setCopied] = useState<"event" | "profile" | null>(null)

  const eventUrl = `${origin}/events/${published.eventSlug}`
  const profileUrl = `${origin}/@${published.organizerSlug}`

  async function copy(which: "event" | "profile", url: string) {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      /* ignore */
    }
    track("link_copied", { props: { context: `publish_${which}`, slug: published.eventSlug } })
    setCopied(which)
    setTimeout(() => setCopied(null), 2000)
  }

  async function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: published.title,
          text: `Join my ride: ${published.title} 🏍️`,
          url: eventUrl,
        })
        track("share_clicked", { props: { context: "publish", slug: published.eventSlug } })
        return
      } catch {
        /* fall through */
      }
    }
    copy("event", eventUrl)
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
      <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">You&apos;re live! 🎉</h1>
        <p className="mt-2 text-sm text-zinc-400">
          <span className="text-zinc-200 font-medium">{published.title}</span> is published. Share
          the link — every share brings riders.
        </p>

        {/* Event link */}
        <div className="mt-6 text-left">
          <label className="text-xs text-zinc-500">Event link</label>
          <div className="mt-1 flex gap-2">
            <Input readOnly value={eventUrl} className="bg-zinc-800/50 border-zinc-700 text-white text-sm" />
            <Button variant="outline" size="icon" className="rounded-xl border-zinc-700 shrink-0" onClick={() => copy("event", eventUrl)} title="Copy event link">
              {copied === "event" ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Profile link */}
        <div className="mt-3 text-left">
          <label className="text-xs text-zinc-500">Your page (put this in your bio)</label>
          <div className="mt-1 flex gap-2">
            <Input readOnly value={profileUrl} className="bg-zinc-800/50 border-zinc-700 text-white text-sm" />
            <Button variant="outline" size="icon" className="rounded-xl border-zinc-700 shrink-0" onClick={() => copy("profile", profileUrl)} title="Copy profile link">
              {copied === "profile" ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button variant="glow" className="flex-1 rounded-xl" onClick={share}>
            <Share2 className="h-4 w-4 mr-2" /> Share now
          </Button>
          <Link href={`/events/${published.eventSlug}`} className="flex-1">
            <Button variant="outline" className="w-full rounded-xl border-zinc-700">
              View event
            </Button>
          </Link>
        </div>

        <Link
          href={`/@${published.organizerSlug}`}
          className="mt-4 inline-block text-sm text-orange-400 hover:text-orange-300"
        >
          Go to your organiser page →
        </Link>
      </div>
    </div>
  )
}
