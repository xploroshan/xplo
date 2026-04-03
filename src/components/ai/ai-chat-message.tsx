"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Bot } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface AiChatMessageProps {
  role: "user" | "assistant"
  content: string
  timestamp?: Date
}

function formatContent(text: string) {
  const lines = text.split("\n")
  return lines.map((line, i) => {
    // Bold text
    const formatted = line.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-semibold text-white">$1</strong>'
    )

    // List items
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const content = formatted.replace(/^[\s]*[-*]\s/, "")
      return (
        <li
          key={i}
          className="ml-4 list-disc text-sm"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )
    }

    // Numbered list items
    if (/^\s*\d+\.\s/.test(line)) {
      const content = formatted.replace(/^\s*\d+\.\s/, "")
      return (
        <li
          key={i}
          className="ml-4 list-decimal text-sm"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )
    }

    if (line.trim() === "") {
      return <br key={i} />
    }

    return (
      <p
        key={i}
        className="text-sm"
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    )
  })
}

export function AiChatMessage({ role, content, timestamp }: AiChatMessageProps) {
  const [showTime, setShowTime] = useState(false)
  const isUser = role === "user"

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      onMouseEnter={() => setShowTime(true)}
      onMouseLeave={() => setShowTime(false)}
    >
      {!isUser && (
        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
          <AvatarFallback className="bg-orange-500/20 text-orange-400">
            <Bot className="h-3.5 w-3.5" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`relative max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 ${
            isUser
              ? "bg-orange-500/10 border border-orange-500/20 text-orange-50"
              : "bg-zinc-800 border border-zinc-700/50 text-zinc-200"
          }`}
        >
          <div className="space-y-1">{formatContent(content)}</div>
        </div>

        {showTime && timestamp && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`absolute -bottom-5 text-[10px] text-zinc-500 ${
              isUser ? "right-1" : "left-1"
            }`}
          >
            {timestamp.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </motion.span>
        )}
      </div>
    </motion.div>
  )
}
