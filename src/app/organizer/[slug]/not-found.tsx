import Link from "next/link"
import { Compass } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OrganizerNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-800/50 mb-6">
        <Compass className="h-8 w-8 text-zinc-500" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Organizer Not Found</h1>
      <p className="text-zinc-400 mb-8 max-w-md">
        This organizer profile doesn&apos;t exist or may have been removed.
      </p>
      <Link href="/events">
        <Button variant="glow" className="rounded-xl">
          Browse Events
        </Button>
      </Link>
    </div>
  )
}
