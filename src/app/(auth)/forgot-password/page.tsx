"use client"

import { useState } from "react"
import Link from "next/link"
import { Compass, Mail, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (res.status === 429) {
        setError("Too many requests. Please try again later.")
        return
      }

      setSubmitted(true)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
      <CardHeader className="text-center pb-2">
        <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20">
            <Compass className="h-5 w-5 text-white" />
          </div>
        </Link>
        <CardTitle className="text-2xl text-white">Reset your password</CardTitle>
        <CardDescription className="text-zinc-400">
          {submitted
            ? "Check your email for a reset link"
            : "Enter your email and we'll send you a reset link"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {submitted ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-sm text-green-400">
              If an account with that email exists, we&apos;ve sent a password reset link.
              Please check your inbox.
            </div>
            <Link href="/login">
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="glow"
              className="w-full h-11 rounded-xl"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
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
