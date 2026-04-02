"use client"

import { useState } from "react"
import { Lock, Eye, EyeOff, Check, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ChangePassword() {
  const [open, setOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const passwordChecks = [
    { label: "8+ characters", valid: newPassword.length >= 8 },
    { label: "Uppercase letter", valid: /[A-Z]/.test(newPassword) },
    { label: "Lowercase letter", valid: /[a-z]/.test(newPassword) },
    { label: "Number", valid: /[0-9]/.test(newPassword) },
    { label: "Special character", valid: /[^A-Za-z0-9]/.test(newPassword) },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!passwordChecks.every((c) => c.valid)) {
      setError("New password does not meet all requirements")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong")
        return
      }

      setSuccess("Password changed successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-orange-500" />
          <span className="font-medium text-white">Change Password</span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-zinc-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        )}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-4 border-t border-zinc-800 pt-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-400">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Current Password</label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="pr-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">New Password</label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="pr-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {newPassword.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {passwordChecks.map((check) => (
                <div
                  key={check.label}
                  className={`flex items-center gap-1 ${
                    check.valid ? "text-green-400" : "text-zinc-500"
                  }`}
                >
                  <Check className={`h-3 w-3 ${check.valid ? "opacity-100" : "opacity-30"}`} />
                  {check.label}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Confirm New Password</label>
            <Input
              type={showNew ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500"
            />
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-xs text-red-400">Passwords do not match</p>
            )}
          </div>

          <Button
            type="submit"
            variant="glow"
            className="w-full h-10 rounded-xl"
            disabled={loading}
          >
            {loading ? "Changing..." : "Change Password"}
          </Button>
        </form>
      )}
    </div>
  )
}
