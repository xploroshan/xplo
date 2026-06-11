"use client"

import { useEffect, useState } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export interface StoryGroup {
  user: { id: string; name: string | null; image: string | null }
  stories: { id: string; image: string; content: string | null; createdAt: string }[]
}

// Instagram-style 24h stories: avatar ring strip + full-screen viewer.
export function StoriesStrip({ groups }: { groups: StoryGroup[] }) {
  const [viewing, setViewing] = useState<number | null>(null)
  const [storyIdx, setStoryIdx] = useState(0)

  // Auto-advance every 5s while viewing.
  useEffect(() => {
    if (viewing === null) return
    const t = setTimeout(() => next(), 5000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewing, storyIdx])

  if (groups.length === 0) return null

  function open(i: number) {
    setViewing(i)
    setStoryIdx(0)
  }

  function next() {
    if (viewing === null) return
    const g = groups[viewing]
    if (storyIdx < g.stories.length - 1) setStoryIdx(storyIdx + 1)
    else if (viewing < groups.length - 1) {
      setViewing(viewing + 1)
      setStoryIdx(0)
    } else setViewing(null)
  }

  function prev() {
    if (viewing === null) return
    if (storyIdx > 0) setStoryIdx(storyIdx - 1)
    else if (viewing > 0) {
      const g = groups[viewing - 1]
      setViewing(viewing - 1)
      setStoryIdx(g.stories.length - 1)
    }
  }

  const current = viewing !== null ? groups[viewing] : null
  const story = current?.stories[storyIdx]

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {groups.map((g, i) => (
          <button key={g.user.id} onClick={() => open(i)} className="flex flex-col items-center gap-1 shrink-0">
            <span className="rounded-full p-[2px] bg-gradient-to-tr from-orange-500 to-amber-400">
              <Avatar className="h-14 w-14 border-2 border-zinc-950">
                {g.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.user.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-zinc-800 text-zinc-300">{g.user.name?.charAt(0) ?? "?"}</AvatarFallback>
                )}
              </Avatar>
            </span>
            <span className="text-[10px] text-zinc-400 max-w-16 truncate">{g.user.name?.split(" ")[0] ?? "Rider"}</span>
          </button>
        ))}
      </div>

      {/* Viewer */}
      {current && story && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={next}>
          <div className="absolute top-4 left-4 right-4 flex items-center gap-2 z-10">
            {/* progress bars */}
            <div className="flex-1 flex gap-1">
              {current.stories.map((_, i) => (
                <span key={i} className={`h-0.5 flex-1 rounded ${i <= storyIdx ? "bg-white" : "bg-white/30"}`} />
              ))}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setViewing(null)
              }}
              className="text-white/80 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="absolute top-10 left-4 flex items-center gap-2 z-10">
            <Avatar className="h-8 w-8">
              {current.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={current.user.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <AvatarFallback className="bg-zinc-700 text-zinc-200 text-xs">{current.user.name?.charAt(0) ?? "?"}</AvatarFallback>
              )}
            </Avatar>
            <span className="text-sm text-white font-medium">{current.user.name ?? "Rider"}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white z-10"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white z-10"
          >
            <ChevronRight className="h-8 w-8" />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={story.image} alt="" className="max-h-[85vh] max-w-full object-contain rounded-lg" />
          {story.content && (
            <p className="absolute bottom-8 left-1/2 -translate-x-1/2 max-w-md text-center text-sm text-white bg-black/50 rounded-xl px-4 py-2">
              {story.content}
            </p>
          )}
        </div>
      )}
    </>
  )
}
