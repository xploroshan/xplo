"use client"

import { useState } from "react"
import Image from "next/image"
import { ShieldCheck, Shield, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function TwoFactor({ enabled: initialEnabled }: { enabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [stage, setStage] = useState<"idle" | "setup" | "disabling">("idle")
  const [qr, setQr] = useState<string | null>(null)
  const [secret, setSecret] = useState("")
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function beginSetup() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not start setup")
      setQr(data.qr)
      setSecret(data.secret)
      setStage("setup")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start setup")
    } finally {
      setBusy(false)
    }
  }

  async function confirm(path: "enable" | "disable") {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/auth/2fa/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "That didn't work")
      setEnabled(path === "enable")
      setStage("idle")
      setCode("")
      setQr(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't work")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-5">
      <div className="flex items-center gap-3 mb-1">
        {enabled ? <ShieldCheck className="h-5 w-5 text-green-400" /> : <Shield className="h-5 w-5 text-zinc-500" />}
        <h3 className="text-sm font-semibold text-white">Two-factor authentication</h3>
        {enabled && <span className="text-xs text-green-400 ml-auto">On</span>}
      </div>
      <p className="text-xs text-zinc-500 mb-3">
        Add a code from an authenticator app (Google Authenticator, Authy) on top of your password.
      </p>

      {stage === "idle" && (
        <>
          {enabled ? (
            <Button size="sm" variant="outline" className="border-zinc-700" onClick={() => setStage("disabling")}>
              Disable 2FA
            </Button>
          ) : (
            <Button size="sm" variant="glow" className="gap-2" onClick={beginSetup} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Enable 2FA
            </Button>
          )}
        </>
      )}

      {stage === "setup" && qr && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-400">1. Scan this with your authenticator app:</p>
          <div className="bg-white p-2 rounded-xl w-fit">
            <Image src={qr} alt="2FA QR code" width={180} height={180} unoptimized />
          </div>
          <p className="text-[11px] text-zinc-500">
            Or enter this key manually: <span className="font-mono text-zinc-300">{secret}</span>
          </p>
          <p className="text-xs text-zinc-400">2. Enter the 6-digit code it shows:</p>
          <div className="flex gap-2 max-w-xs">
            <Input inputMode="numeric" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} className="tracking-widest" />
            <Button variant="glow" onClick={() => confirm("enable")} disabled={busy || code.length < 6}>
              Verify
            </Button>
          </div>
        </div>
      )}

      {stage === "disabling" && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-400">Enter a current code to turn 2FA off:</p>
          <div className="flex gap-2 max-w-xs">
            <Input inputMode="numeric" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} className="tracking-widest" />
            <Button variant="outline" className="border-red-500/30 text-red-400" onClick={() => confirm("disable")} disabled={busy || code.length < 6}>
              Disable
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </div>
  )
}
