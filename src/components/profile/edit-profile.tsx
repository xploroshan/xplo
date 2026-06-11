"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/image-upload"

interface EditProfileProps {
  initial: {
    name: string
    bio: string
    city: string
    image: string | null
    interests: string[]
  }
}

export function EditProfile({ initial }: EditProfileProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: initial.name,
    bio: initial.bio,
    city: initial.city,
    image: initial.image,
    interests: initial.interests.join(", "),
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          bio: form.bio || null,
          city: form.city || null,
          image: form.image,
          interests: form.interests
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not save")
      setSaved(true)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save")
    } finally {
      setSaving(false)
    }
  }

  const label = "block text-xs font-medium text-zinc-400 mb-1.5"

  return (
    <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-white">Edit profile</h3>

      <div className="flex items-center gap-4">
        <div className="w-20 h-20 shrink-0">
          <ImageUpload value={form.image} onChange={(url) => setForm({ ...form, image: url })} className="h-20 w-20 rounded-full overflow-hidden" label="Photo" />
        </div>
        <div className="flex-1">
          <label className={label}>Display name</label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
      </div>

      <div>
        <label className={label}>Bio</label>
        <Textarea rows={3} maxLength={500} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell riders a bit about you…" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>City</label>
          <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Bangalore" />
        </div>
        <div>
          <label className={label}>Interests (comma-separated)</label>
          <Input value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} placeholder="Motorcycle, Trek, Camping" />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex items-center gap-3">
        <Button variant="glow" onClick={save} disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save profile
        </Button>
        {saved && <span className="text-sm text-green-400">Saved ✓</span>}
      </div>
    </div>
  )
}
