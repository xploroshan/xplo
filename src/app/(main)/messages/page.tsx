"use client"

import { ConversationList } from "@/components/messages/conversation-list"
import { ChatArea } from "@/components/messages/chat-area"
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from "@/lib/mock-data"
import { useUIStore } from "@/stores/ui-store"
import { MessageCircle } from "lucide-react"

export default function MessagesPage() {
  const { selectedConversation, setSelectedConversation } = useUIStore()
  const activeConversation = MOCK_CONVERSATIONS.find((c) => c.id === selectedConversation)

  return (
    <div className="h-[calc(100vh-3.5rem)] flex border-t border-zinc-800/30">
      {/* Conversation List */}
      <div className={`w-full lg:w-80 lg:border-r border-zinc-800/50 bg-zinc-950/50 ${
        selectedConversation ? "hidden lg:block" : "block"
      }`}>
        <ConversationList
          conversations={MOCK_CONVERSATIONS}
          selectedId={selectedConversation}
          onSelect={setSelectedConversation}
        />
      </div>

      {/* Chat Area */}
      <div className={`flex-1 ${selectedConversation ? "block" : "hidden lg:block"}`}>
        {activeConversation ? (
          <ChatArea
            conversation={activeConversation}
            messages={MOCK_MESSAGES}
            onBack={() => setSelectedConversation(null)}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Your Messages</h3>
            <p className="text-sm text-zinc-500 max-w-xs">
              Select a conversation to start chatting. Group chats are created automatically when you join events.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
