"use client"

import { useEffect, useState } from "react"
import { Globe2, Check, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"

export interface MicrositeValue {
  subdomain: string
  themeColor: string
  tagline: string
}

// Reusable claim + branding fields for an org or individual organizer microsite.
export function MicrositeFields({
  value,
  onChange,
}: {
  value: MicrositeValue
  onChange: (patch: Partial<MicrositeValue>) => void
}) {
  const [check, setCheck] = useState<"idle" | "checking" | "ok" | "taken" | "invalid">("idle")
  const rootHost =
    (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/^https?:\/\//, "")

  // Debounced availability check as the user types a subdomain. All state
  // updates happen inside the async callback (never synchronously in the effect).
  useEffect(() => {
    const v = value.subdomain.trim().toLowerCase()
    const t = setTimeout(async () => {
      if (!v) { setCheck("idle"); return }
      setCheck("checking")
      try {
        const res = await fetch(`/api/subdomain/check?value=${encodeURIComponent(v)}`)
        const data = await res.json()
        setCheck(data.available ? "ok" : data.reason === "invalid" ? "invalid" : "taken")
      } catch {
        setCheck("idle")
      }
    }, 400)
    return () => clearTimeout(t)
  }, [value.subdomain])

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-300">Subdomain</label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Globe2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              value={value.subdomain}
              onChange={(e) => onChange({ subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
              placeholder="taleson2wheels"
              className="border-zinc-700 bg-zinc-800 pl-10 pr-24 text-white placeholder:text-zinc-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">.{rootHost}</span>
          </div>
          <span className="w-5 shrink-0 text-center">
            {check === "checking" && <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />}
            {check === "ok" && <Check className="h-4 w-4 text-green-400" />}
            {(check === "taken" || check === "invalid") && <X className="h-4 w-4 text-red-400" />}
          </span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          {check === "taken" && <span className="text-red-400">That subdomain is taken. </span>}
          {check === "invalid" && <span className="text-red-400">Invalid — use letters, numbers, hyphens. </span>}
          {value.subdomain
            ? <>Your site: <span className="text-zinc-300">{value.subdomain}.{rootHost}</span></>
            : "Claim a subdomain to publish your microsite."}
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-300">Brand color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(value.themeColor) ? value.themeColor : "#f97316"}
            onChange={(e) => onChange({ themeColor: e.target.value })}
            className="h-10 w-14 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800"
            aria-label="Brand color"
          />
          <Input
            value={value.themeColor}
            onChange={(e) => onChange({ themeColor: e.target.value })}
            placeholder="#f97316"
            className="w-36 border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-300">Tagline</label>
        <Input
          value={value.tagline}
          onChange={(e) => onChange({ tagline: e.target.value })}
          maxLength={160}
          placeholder="Never ride alone."
          className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
        />
      </div>
    </div>
  )
}
