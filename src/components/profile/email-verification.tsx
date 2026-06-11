"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { MailCheck, MailWarning, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EmailVerification({ verified }: { verified: boolean }) {
  const params = useSearchParams()
  const flag = params.get("verified")
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  async function resend() {
    setSending(true)
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" })
      if (res.ok) setSent(true)
    } finally {
      setSending(false)
    }
  }

  if (verified || flag === "success") {
    return (
      <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 flex items-center gap-3">
        <MailCheck className="h-5 w-5 text-green-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-300">Email verified</p>
          <p className="text-xs text-zinc-400">Your email address is confirmed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
      <MailWarning className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-300">Verify your email</p>
        <p className="text-xs text-zinc-400 mb-2">
          {flag === "expired"
            ? "That link expired — send yourself a fresh one."
            : "We sent a verification link when you signed up. Didn't get it?"}
        </p>
        {sent ? (
          <p className="text-xs text-green-400">Verification email sent — check your inbox.</p>
        ) : (
          <Button size="sm" variant="outline" className="h-8 gap-2 border-amber-500/30 text-amber-300" onClick={resend} disabled={sending}>
            {sending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Resend verification email
          </Button>
        )}
      </div>
    </div>
  )
}
