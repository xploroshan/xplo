import { MessageCircle } from "lucide-react"

export const metadata = { title: "Messages" }

export default function MessagesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Messages</h1>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mb-6">
          <MessageCircle className="h-8 w-8 text-zinc-600" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No messages yet</h3>
        <p className="text-zinc-500 max-w-sm">
          When you join an event, you&apos;ll be added to the group chat automatically.
          Start chatting with your crew here!
        </p>
      </div>
    </div>
  )
}
