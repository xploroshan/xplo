import Link from "next/link"
import { Compass } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 mb-6">
        <Compass className="h-8 w-8 text-orange-500" />
      </div>
      <h1 className="text-3xl font-bold text-white">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-400">
        The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get you
        back to the adventure.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Link href="/events">
          <Button variant="glow" className="rounded-xl">Explore events</Button>
        </Link>
        <Link href="/">
          <Button variant="outline" className="rounded-xl border-zinc-700">Go home</Button>
        </Link>
      </div>
    </div>
  )
}
