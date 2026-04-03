"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Settings,
  Globe,
  MapPin,
  Image as ImageIcon,
  Loader2,
  Save,
  Link2,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface OrgSettings {
  name: string
  description: string
  website: string
  city: string
  logo: string
  banner: string
  socialLinks: {
    instagram?: string
    twitter?: string
    facebook?: string
  }
}

export default function OrgSettingsPage() {
  const params = useParams()
  const slug = params.slug as string
  const router = useRouter()
  const { status: authStatus } = useSession()
  const [form, setForm] = useState<OrgSettings>({
    name: "",
    description: "",
    website: "",
    city: "",
    logo: "",
    banner: "",
    socialLinks: {},
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push(`/org/${slug}`)
      return
    }
    if (authStatus !== "authenticated") return

    async function fetchSettings() {
      try {
        const res = await fetch(`/api/organizations/${slug}`)
        if (res.status === 403 || res.status === 401) {
          router.push(`/org/${slug}`)
          return
        }
        if (!res.ok) throw new Error("Failed to load")
        const data = await res.json()
        setForm({
          name: data.name ?? "",
          description: data.description ?? "",
          website: data.website ?? "",
          city: data.city ?? "",
          logo: data.logo ?? "",
          banner: data.banner ?? "",
          socialLinks: data.socialLinks ?? {},
        })
      } catch {
        setError("Failed to load organization settings")
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [slug, authStatus, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch(`/api/organizations/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to update")
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  function updateField(field: keyof OrgSettings, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateSocial(key: string, value: string) {
    setForm((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value },
    }))
  }

  if (loading || authStatus === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Settings className="h-6 w-6 text-orange-500" />
            Organization Settings
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Update your organization profile and settings
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Organization Name
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Description
                </label>
                <Textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={4}
                  className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Website
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    value={form.website}
                    onChange={(e) => updateField("website", e.target.value)}
                    placeholder="https://example.com"
                    className="border-zinc-700 bg-zinc-800 pl-10 text-white placeholder:text-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                  City
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="border-zinc-700 bg-zinc-800 pl-10 text-white placeholder:text-zinc-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branding */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <ImageIcon className="h-5 w-5 text-orange-500" />
                Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Logo URL
                </label>
                <Input
                  value={form.logo}
                  onChange={(e) => updateField("logo", e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Banner URL
                </label>
                <Input
                  value={form.banner}
                  onChange={(e) => updateField("banner", e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Link2 className="h-5 w-5 text-orange-500" />
                Social Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {["instagram", "twitter", "facebook"].map((platform) => (
                <div key={platform}>
                  <label className="mb-1.5 block text-sm font-medium capitalize text-zinc-300">
                    {platform}
                  </label>
                  <Input
                    value={form.socialLinks[platform as keyof typeof form.socialLinks] ?? ""}
                    onChange={(e) => updateSocial(platform, e.target.value)}
                    placeholder={`https://${platform}.com/...`}
                    className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              Settings saved successfully!
            </div>
          )}

          <Button
            type="submit"
            variant="glow"
            className="w-full"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
