"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Compass, Lock, Eye, EyeOff, ArrowLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
        <CardContent className="pt-8 text-center">
          <p className="text-zinc-400">Loading...</p>
        </CardContent>
      </Card>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const passwordChecks = [
    { label: "8+ characters", valid: password.length >= 8 },
    { label: "Uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "Lowercase letter", valid: /[a-z]/.test(password) },
    { label: "Number", valid: /[0-9]/.test(password) },
    { label: "Special character", valid: /[^A-Za-z0-9]/.test(password) },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!passwordChecks.every((c) => c.valid)) {
      setError("Password does not meet all requirements")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong")
        return
      }

      setSuccess(true)
      setTimeout(() => router.push("/login"), 3000)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
        <CardContent className="pt-8 text-center">
          <p className="text-zinc-400 mb-4">Invalid or missing reset token.</p>
          <Link href="/forgot-password">
            <Button variant="glow" className="rounded-xl">
              Request a new reset link
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
      <CardHeader className="text-center pb-2">
        <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20">
            <Compass className="h-5 w-5 text-white" />
          </div>
        </Link>
        <CardTitle className="text-2xl text-white">
          {success ? "Password Reset!" : "Set New Password"}
        </CardTitle>
        <CardDescription className="text-zinc-400">
          {success
            ? "Your password has been updated. Redirecting to login..."
            : "Enter your new password below"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {success ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-sm text-green-400 text-center">
              Password reset successful! Redirecting to login...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password strength checks */}
            {password.length > 0 && (
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
              <label className="text-sm font-medium text-zinc-300">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500"
                />
              </div>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <p className="text-xs text-red-400">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              variant="glow"
              className="w-full h-11 rounded-xl"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 mt-4"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Sign In
            </Link>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
