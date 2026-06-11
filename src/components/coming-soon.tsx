import Link from "next/link"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ComingSoonProps {
  title: string
  description: string
}

/**
 * Honest placeholder for features that are designed and schema-backed but not
 * yet wired end-to-end. Replaces mock-data screens so users aren't shown fake
 * content. Swap these out as each feature ships (see plan Phases 3 & 5).
 */
export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/20 flex items-center justify-center mb-5">
        <Sparkles className="h-7 w-7 text-orange-500" />
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-500/80 mb-2">
        Coming soon
      </span>
      <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
      <p className="text-sm text-zinc-400 max-w-sm mb-6">{description}</p>
      <Link href="/events">
        <Button variant="glow" className="rounded-xl">
          Explore events
        </Button>
      </Link>
    </div>
  )
}
