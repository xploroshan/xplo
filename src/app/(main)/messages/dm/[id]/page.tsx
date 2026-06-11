import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getConversationAccess } from "@/lib/dm"
import { realtimeEnabled } from "@/lib/realtime"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DmThread } from "@/components/messages/dm-thread"

export const metadata = { title: "Direct message — HYKRZ" }

export default async function DmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) notFound()

  const access = await getConversationAccess(id, session.user.id)
  if (!access) notFound()

  const other = await db.user.findUnique({
    where: { id: access.otherId },
    select: { name: true, image: true, slug: true },
  })

  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center gap-3">
        <Link href="/messages" className="text-zinc-400 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Avatar className="h-8 w-8">
          {other?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={other.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <AvatarFallback className="bg-zinc-700 text-zinc-300 text-xs">{other?.name?.charAt(0).toUpperCase() ?? "?"}</AvatarFallback>
          )}
        </Avatar>
        <h1 className="text-sm font-semibold text-white">{other?.name ?? "Rider"}</h1>
      </div>
      <DmThread conversationId={id} realtime={realtimeEnabled()} />
    </div>
  )
}
