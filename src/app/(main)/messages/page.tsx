import Link from "next/link"
import { redirect } from "next/navigation"
import { MessageCircle } from "lucide-react"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export const metadata = { title: "Messages — HYKRZ" }

// Index of the user's event group chats (events they're confirmed for or
// organizing), most-recent activity first.
export default async function MessagesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login?callbackUrl=/messages")
  const userId = session.user.id

  // Events whose chat this user can see.
  const events = await db.event.findMany({
    where: {
      status: { notIn: ["DRAFT"] },
      OR: [
        { organizerId: userId },
        { participants: { some: { userId, status: "CONFIRMED" } } },
      ],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      chatActive: true,
      eventType: { select: { color: true } },
      messages: {
        where: { deleted: false },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true, sender: { select: { name: true } } },
      },
      _count: { select: { messages: true } },
    },
    take: 50,
  })

  // Sort by latest message (chats with no messages go last).
  const sorted = events.sort((a, b) => {
    const ta = a.messages[0]?.createdAt?.getTime() ?? 0
    const tb = b.messages[0]?.createdAt?.getTime() ?? 0
    return tb - ta
  })

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-xl font-bold text-white mb-1">Messages</h1>
      <p className="text-sm text-zinc-500 mb-5">Every event you join gets a group chat.</p>

      {sorted.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-7 w-7 text-zinc-600" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">No chats yet</h3>
          <p className="text-sm text-zinc-500 mb-4">Join an event to start chatting with the group.</p>
          <Link href="/events" className="inline-block px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium">
            Explore events
          </Link>
        </div>
      ) : (
        <div className="space-y-1">
          {sorted.map((e) => {
            const last = e.messages[0]
            return (
              <Link
                key={e.id}
                href={`/events/${e.slug}/chat`}
                className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-zinc-800/40 transition-colors"
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold"
                  style={{ backgroundColor: `${e.eventType?.color ?? "#f97316"}30`, color: e.eventType?.color ?? "#f97316" }}
                >
                  {e.title.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{e.title}</p>
                  <p className="text-xs text-zinc-500 truncate">
                    {last
                      ? `${last.sender.name?.split(" ")[0] ?? "Someone"}: ${last.content}`
                      : "No messages yet"}
                  </p>
                </div>
                {last && (
                  <span className="text-[11px] text-zinc-600 shrink-0">
                    {new Date(last.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
