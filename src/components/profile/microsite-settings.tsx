"use client"

import { useState } from "react"
import { Globe, Loader2, Save, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MicrositeFields, type MicrositeValue } from "@/components/site/microsite-fields"

// Lets an individual organizer claim a subdomain + brand their microsite.
export function MicrositeSettings({ initial }: { initial: MicrositeValue }) {
  const [value, setValue] = useState<MicrositeValue>(initial)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const rootHost = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/^https?:\/\//, "")
  const proto = (process.env.NEXT_PUBLIC_APP_URL || "").startsWith("https") ? "https" : "http"

  async function save() {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain: value.subdomain.trim() || null,
          themeColor: value.themeColor.trim() || null,
          tagline: value.tagline.trim() || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Couldn't save")
      setMsg({ ok: true, text: "Microsite saved ✓" })
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Couldn't save" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-5 w-5 text-orange-500" />
        <h3 className="text-sm font-semibold text-white">Your microsite</h3>
      </div>
      <MicrositeFields value={value} onChange={(patch) => setValue((v) => ({ ...v, ...patch }))} />
      <div className="mt-4 flex items-center gap-3">
        <Button variant="glow" className="rounded-xl gap-2" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save microsite
        </Button>
        {value.subdomain && (
          <a
            href={`${proto}://${value.subdomain}.${rootHost}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-300"
          >
            Visit <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        {msg && <span className={msg.ok ? "text-sm text-green-400" : "text-sm text-red-400"}>{msg.text}</span>}
      </div>
    </div>
  )
}
