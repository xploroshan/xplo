"use client"

import { Search, MessageCircle } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { MockConversation } from "@/lib/mock-data"

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: MockConversation[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-zinc-800/50">
        <div className="flex items-center gap-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50 px-3 py-2">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none w-full"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-zinc-800/30",
              selectedId === conv.id
                ? "bg-zinc-800/50"
                : "hover:bg-zinc-800/30"
            )}
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback
                className="font-bold text-sm"
                style={conv.eventType ? {
                  backgroundColor: `${conv.eventType.color}15`,
                  color: conv.eventType.color,
                } : {
                  backgroundColor: "rgba(249, 115, 22, 0.1)",
                  color: "#f97316",
                }}
              >
                {conv.isGroup ? (
                  <MessageCircle className="h-4 w-4" />
                ) : (
                  conv.name.charAt(0)
                )}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white truncate">{conv.name}</span>
                <span className="text-[10px] text-zinc-600 shrink-0 ml-2">{conv.lastMessageTime}</span>
              </div>
              <p className="text-xs text-zinc-500 truncate mt-0.5">{conv.lastMessage}</p>
            </div>

            {conv.unreadCount > 0 && (
              <span className="shrink-0 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-orange-500 text-white text-[10px] font-bold px-1">
                {conv.unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
