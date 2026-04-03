"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, MapPin, Users, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AiEnhanceButton } from "@/components/events/ai-enhance-button"
import { AiSuggestionsPanel } from "@/components/events/ai-suggestions-panel"
import Link from "next/link"
import { DEFAULT_EVENT_TYPES } from "@/lib/constants"

export default function CreateEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ key: string; label: string; value: string | string[] }> | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    // TODO: API call to create event
    setTimeout(() => {
      setLoading(false)
      router.push("/events")
    }, 1000)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Events
      </Link>

      <h1 className="text-3xl font-bold text-white mb-8">Create Event</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Event Title</label>
              <Input
                name="title"
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
                    <input type="radio" name="eventType" value={type.slug} className="sr-only" />
                    <span className="text-xs font-medium text-zinc-300">{type.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-300">Description</label>
                <AiEnhanceButton
                  onResult={(result) => {
                    const suggestions = Object.entries(result)
                      .filter(([, v]) => v !== undefined && v !== null)
                      .map(([key, value]) => ({
                        key,
                        label: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
                        value: value as string | string[],
                      }))
                    setAiSuggestions(suggestions)
                  }}
                  formData={{}}
                />
              </div>
              <textarea
                placeholder="Describe your event..."
                rows={4}
                className="w-full rounded-lg bg-zinc-800/50 border border-zinc-700 text-white placeholder:text-zinc-500 p-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none"
              />
            </div>

            {aiSuggestions && (
              <AiSuggestionsPanel
                suggestions={aiSuggestions}
                onApply={() => {}}
                onApplyAll={() => {}}
                onDismiss={() => setAiSuggestions(null)}
              />
            )}
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
                <label className="text-sm font-medium text-zinc-300">Start Date & Time</label>
                <Input
                  type="datetime-local"
                  required
                  className="bg-zinc-800/50 border-zinc-700 text-white focus-visible:ring-orange-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">End Date & Time</label>
                <Input
                  type="datetime-local"
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
              <Users className="h-5 w-5 text-orange-500" /> Capacity & Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Max Participants</label>
                <Input
                  type="number"
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
                  placeholder="0 for free"
                  min={0}
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" type="button" className="rounded-xl border-zinc-700 text-zinc-300">
            Save as Draft
          </Button>
          <Button variant="glow" type="submit" className="rounded-xl" disabled={loading}>
            {loading ? "Publishing..." : "Publish Event"}
          </Button>
        </div>
      </form>
    </div>
  )
}
