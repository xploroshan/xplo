"use client"

import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { Building2, Loader2, Users, Star, Calendar, Shield } from "lucide-react"
import { CreateOrgForm } from "@/components/organizations/create-org-form"

export default function CreateOrganizationPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  const benefits = [
    { icon: Users, label: "Build your team with roles and permissions" },
    { icon: Calendar, label: "Create and manage events under your brand" },
    { icon: Star, label: "Earn organizational ratings and reviews" },
    { icon: Shield, label: "Get verified for increased visibility" },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            Register Your Organization
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
            Create an organization to manage events, build your team, and grow
            your adventure community under one brand.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Benefits sidebar */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6"
            >
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Benefits
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, i) => (
                  <motion.div
                    key={benefit.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                      <benefit.icon className="h-4 w-4 text-orange-500" />
                    </div>
                    <p className="text-sm text-zinc-300">{benefit.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <CreateOrgForm />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
