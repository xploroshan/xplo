import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { pinOrganizerSchema } from "@/lib/validations/organizer"

const MAX_PINS = 5

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pins = await db.organizerPin.findMany({
      where: { userId: session.user.id },
      orderBy: { position: "asc" },
      include: {
        organizer: {
          select: { id: true, name: true, image: true, slug: true, verified: true },
        },
      },
    })

    return NextResponse.json({ pins })
  } catch (error) {
    console.error("Get pins error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = pinOrganizerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const { organizerId } = parsed.data

    // Verify organizer exists and has the right role
    const organizer = await db.user.findUnique({
      where: { id: organizerId },
      select: { role: true },
    })

    if (!organizer || !["ORGANIZER", "ADMIN", "SUPER_ADMIN"].includes(organizer.role)) {
      return NextResponse.json({ error: "Organizer not found" }, { status: 404 })
    }

    // Enforce max pins in a transaction
    const pin = await db.$transaction(async (tx) => {
      const count = await tx.organizerPin.count({
        where: { userId: session.user.id },
      })

      if (count >= MAX_PINS) {
        throw new Error("MAX_PINS_REACHED")
      }

      return tx.organizerPin.create({
        data: {
          userId: session.user.id,
          organizerId,
          position: count,
        },
        include: {
          organizer: {
            select: { id: true, name: true, image: true, slug: true, verified: true },
          },
        },
      })
    })

    return NextResponse.json({ pin }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "MAX_PINS_REACHED") {
      return NextResponse.json(
        { error: "Maximum of 5 pinned organizers reached" },
        { status: 409 }
      )
    }
    console.error("Create pin error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
