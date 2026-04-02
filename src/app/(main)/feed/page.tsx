"use client"

import { PostCard } from "@/components/feed/post-card"
import { ActivityCard } from "@/components/feed/activity-card"
import { FeedSidebar } from "@/components/feed/feed-sidebar"
import { MOCK_POSTS, MOCK_ACTIVITIES, MOCK_ORGANIZERS, MOCK_EVENTS } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { PenLine } from "lucide-react"

export default function FeedPage() {
  const nextEvent = MOCK_EVENTS.find((e) => new Date(e.startDate) > new Date())

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Feed */}
        <div className="flex-1 max-w-2xl space-y-4">
          {/* Create Post */}
          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-xl bg-zinc-800/50 border border-zinc-700/50 px-4 py-2.5 text-sm text-zinc-500 cursor-pointer hover:border-zinc-600 transition-colors">
                Share your adventure...
              </div>
              <Button variant="glow" className="rounded-xl gap-2">
                <PenLine className="h-4 w-4" />
                Post
              </Button>
            </div>
          </div>

          {/* Mixed Feed — Posts + Activities */}
          {MOCK_POSTS.map((post, i) => (
            <div key={post.id}>
              <PostCard post={post} index={i} />
              {/* Insert activity after every 2 posts */}
              {MOCK_ACTIVITIES[Math.floor(i / 2)] && i % 2 === 1 && (
                <div className="mt-4">
                  <ActivityCard
                    activity={MOCK_ACTIVITIES[Math.floor(i / 2)]}
                    index={i}
                  />
                </div>
              )}
            </div>
          ))}

          {/* Remaining activities */}
          {MOCK_ACTIVITIES.slice(Math.ceil(MOCK_POSTS.length / 2)).map((activity, i) => (
            <ActivityCard key={activity.id} activity={activity} index={i + MOCK_POSTS.length} />
          ))}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-20">
            <FeedSidebar
              organizers={MOCK_ORGANIZERS.slice(0, 4)}
              nextEvent={nextEvent}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
