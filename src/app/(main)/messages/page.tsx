import Link from "next/link"
import { redirect } from "next/navigation"
import { MessageCircle } from "lucide-react"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export const metadata = { title: "Messages — HYKRZ" }

export default async function MessagesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login?callbackUrl=/messages")
  const me = session.user.id

  const [events, conversations] = await Promise.all([
    db.event.findMany({
      where: {
        status: { notIn: ["DRAFT"] },
        OR: [{ organizerId: me }, { participants: { some: { userId: me, status: "CONFIRMED" } } }],
      },
      select: {
        id: true,
        slug: true,
        title: true,
        eventType: { select: { color: true } },
        messages: {
          where: { deleted: false },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, createdAt: true, senderId: true, sender: { select: { name: true } } },
        },
      },
      take: 50,
    }),
    db.conversation.findMany({
      where: { OR: [{ userAId: me }, { userBId: me }] },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
      select: {
        id: true,
        lastMessageAt: true,
        userA: { select: { id: true, name: true, image: true } },
        userB: { select: { id: true, name: true, image: true } },
      },
    }),
  ])

  const eventIds = events.map((e) => e.id)
  const reads = await db.chatRead.findMany({
    where: { userId: me, eventId: { in: eventIds } },
    select: { eventId: true, lastReadAt: true },
  })
  const readMap = new Map(reads.map((r) => [r.eventId, r.lastReadAt]))

  const eventChats = events
    .map((e) => {
      const last = e.messages[0]
      const lastRead = readMap.get(e.id)
      const unread = !!last && last.senderId !== me && (!lastRead || last.createdAt > lastRead)
      return { ...e, last, unread }
    })
    .sort((a, b) => (b.last?.createdAt?.getTime() ?? 0) - (a.last?.createdAt?.getTime() ?? 0))

  const dms = conversations.map((c) => ({
    id: c.id,
    lastMessageAt: c.lastMessageAt,
    other: c.userA.id === me ? c.userB : c.userA,
  }))

  const empty = eventChats.length === 0 && dms.length === 0

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-xl font-bold text-white mb-1">Messages</h1>
      <p className="text-sm text-zinc-500 mb-5">Event group chats and direct messages.</p>

      {empty ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-7 w-7 text-zinc-600" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">No chats yet</h3>
          <p className="text-sm text-zinc-500 mb-4">Join an event to chat with the group.</p>
          <Link href="/events" className="inline-block px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium">
            Explore events
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {dms.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Direct messages</h2>
              <div className="space-y-1">
                {dms.map((d) => (
                  <Link key={d.id} href={`/messages/dm/${d.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-zinc-800/40 transition-colors">
                    <Avatar className="h-10 w-10 shrink-0">
                      {d.other.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.other.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      ) : (
                        <AvatarFallback className="bg-zinc-700 text-zinc-300 text-sm">{d.other.name?.charAt(0).toUpperCase() ?? "?"}</AvatarFallback>
                      )}
                    </Avatar>
                    <span className="text-sm font-medium text-white flex-1 truncate">{d.other.name ?? "Rider"}</span>
                    <span className="text-[11px] text-zinc-600">{new Date(d.lastMessageAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Event chats</h2>
            {eventChats.length === 0 ? (
              <p className="text-sm text-zinc-500">Join an event to get its group chat.</p>
            ) : (
              <div className="space-y-1">
                {eventChats.map((e) => (
                  <Link key={e.id} href={`/events/${e.slug}/chat`} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-zinc-800/40 transition-colors">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 font-bold" style={{ backgroundColor: `${e.eventType?.color ?? "#f97316"}30`, color: e.eventType?.color ?? "#f97316" }}>
                      {e.title.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm truncate ${e.unread ? "font-semibold text-white" : "font-medium text-white"}`}>{e.title}</p>
                      <p className="text-xs text-zinc-500 truncate">
                        {e.last ? `${e.last.sender.name?.split(" ")[0] ?? "Someone"}: ${e.last.content || "📷"}` : "No messages yet"}
                      </p>
                    </div>
                    {e.unread && <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shrink-0" />}
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
