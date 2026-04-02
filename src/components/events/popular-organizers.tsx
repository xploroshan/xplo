"use client"

import { motion } from "framer-motion"
import { Star, CheckCircle2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { MockOrganizer } from "@/lib/mock-data"

export function PopularOrganizers({ organizers }: { organizers: MockOrganizer[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-5"
    >
      <h3 className="text-sm font-semibold text-white mb-4">Popular Organizers</h3>

      <div className="space-y-3">
        {organizers.map((org) => (
          <div key={org.id} className="flex items-center gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-orange-500/10 text-orange-500 text-sm font-bold">
                {org.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-white truncate">{org.name}</span>
                {org.verified && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>{org.eventCount} events</span>
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                  {org.rating}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="h-7 px-3 text-xs rounded-full border-zinc-700 text-zinc-400 hover:text-orange-500 hover:border-orange-500/30"
            >
              Follow
            </Button>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
