import { Camera, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Feed" }

export default function FeedPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Feed</h1>
        <Button variant="glow" size="sm" className="rounded-xl">
          <Camera className="h-4 w-4 mr-2" /> Post
        </Button>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mb-6">
          <Heart className="h-8 w-8 text-zinc-600" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Your feed is empty</h3>
        <p className="text-zinc-500 max-w-sm">
          Join events and follow other riders to see their posts, photos, and adventure stories here.
        </p>
      </div>
    </div>
  )
}
