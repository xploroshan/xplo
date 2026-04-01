"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Compass, Mail, Lock, User, Eye, EyeOff, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", password: "", city: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Registration failed")
      } else {
        router.push("/login?registered=true")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
      <CardHeader className="text-center pb-2">
        <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20">
            <Compass className="h-5 w-5 text-white" />
          </div>
        </Link>
        <CardTitle className="text-2xl text-white">Create your account</CardTitle>
        <CardDescription className="text-zinc-400">
          Join HYKRZ and start your adventure
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                required
                className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                required
                className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 chars, uppercase, number, special"
                value={form.password}
                onChange={(e) => updateForm("password", e.target.value)}
                required
                minLength={8}
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">City</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                type="text"
                placeholder="e.g. Bangalore"
                value={form.city}
                onChange={(e) => updateForm("city", e.target.value)}
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
            {loading ? "Creating account..." : "Create Account"}
          </Button>

          <p className="text-xs text-zinc-500 text-center">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="text-orange-500 hover:underline">Terms</Link> and{" "}
            <Link href="/privacy" className="text-orange-500 hover:underline">Privacy Policy</Link>.
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-orange-500 hover:text-orange-400 font-medium">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
