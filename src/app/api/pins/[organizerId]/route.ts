import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ organizerId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { organizerId } = await params

    const pin = await db.organizerPin.findUnique({
      where: {
        userId_organizerId: {
          userId: session.user.id,
          organizerId,
        },
      },
    })

    if (!pin) {
      return NextResponse.json({ error: "Pin not found" }, { status: 404 })
    }

    await db.organizerPin.delete({ where: { id: pin.id } })

    // Re-order remaining pins
    const remaining = await db.organizerPin.findMany({
      where: { userId: session.user.id },
      orderBy: { position: "asc" },
    })

    await Promise.all(
      remaining.map((p, i) =>
        db.organizerPin.update({
          where: { id: p.id },
          data: { position: i },
        })
      )
    )

    return NextResponse.json({ message: "Pin removed" })
  } catch (error) {
    console.error("Delete pin error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
