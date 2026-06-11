import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getEventChatAccess } from "@/lib/chat"
import { EventChat } from "@/components/messages/event-chat"

interface PageProps {
  params: Promise<{ slug: string }>
}

export const metadata = { title: "Group chat — HYKRZ" }

export default async function EventChatPage({ params }: PageProps) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user?.id) notFound()

  const event = await db.event.findUnique({ where: { slug }, select: { id: true } })
  if (!event) notFound()

  const access = await getEventChatAccess(event.id, session.user.id, session.user.role)
  if (!access) notFound()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center gap-3">
        <Link href={`/events/${access.event.slug}`} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-white truncate">{access.event.title}</h1>
          <p className="text-[11px] text-zinc-500">Group chat</p>
        </div>
      </div>
      <EventChat eventId={event.id} eventTitle={access.event.title} />
    </div>
  )
}
