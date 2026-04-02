"use client"

import { Send, Paperclip, ArrowLeft } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { MockConversation, MockMessage } from "@/lib/mock-data"

function MessageBubble({ message }: { message: MockMessage }) {
  if (message.type === "system") {
    return (
      <div className="flex justify-center py-2">
        <span className="text-[11px] text-zinc-600 bg-zinc-800/50 rounded-full px-3 py-1">
          {message.content}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex gap-2 ${message.isOwn ? "flex-row-reverse" : ""}`}>
      {!message.isOwn && (
        <Avatar className="h-7 w-7 shrink-0 mt-1">
          <AvatarFallback className="bg-zinc-800 text-zinc-400 text-[9px]">
            {message.senderName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}
      <div className={`max-w-[75%] ${message.isOwn ? "items-end" : ""}`}>
        {!message.isOwn && (
          <p className="text-[10px] text-zinc-500 mb-0.5 px-1">{message.senderName}</p>
        )}
        <div
          className={`rounded-2xl px-3.5 py-2 text-sm ${
            message.isOwn
              ? "bg-orange-500 text-white rounded-br-md"
              : "bg-zinc-800 text-zinc-200 rounded-bl-md"
          }`}
        >
          {message.content}
        </div>
        <p className={`text-[10px] text-zinc-600 mt-0.5 px-1 ${message.isOwn ? "text-right" : ""}`}>
          {new Date(message.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  )
}

export function ChatArea({
  conversation,
  messages,
  onBack,
}: {
  conversation: MockConversation
  messages: MockMessage[]
  onBack?: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/50 bg-zinc-950/50">
        {onBack && (
          <button onClick={onBack} className="lg:hidden text-zinc-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <Avatar className="h-9 w-9">
          <AvatarFallback
            className="font-bold text-sm"
            style={conversation.eventType ? {
              backgroundColor: `${conversation.eventType.color}15`,
              color: conversation.eventType.color,
            } : undefined}
          >
            {conversation.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-white">{conversation.name}</p>
          {conversation.isGroup && (
            <p className="text-[11px] text-zinc-500">Event group chat</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-zinc-800/50">
        <div className="flex items-center gap-2">
          <button className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors">
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-orange-500/50 transition-colors"
          />
          <button className="p-2.5 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-colors">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
