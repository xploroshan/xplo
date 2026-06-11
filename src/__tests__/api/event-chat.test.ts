import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET, POST } from "@/app/api/events/[eventId]/messages/route"
import { PATCH, DELETE } from "@/app/api/events/[eventId]/messages/[messageId]/route"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const mockDb = vi.mocked(db)
const mockAuth = vi.mocked(auth)

const params = (eventId = "event-1", messageId = "msg-1") => ({
  params: Promise.resolve({ eventId, messageId }),
})

const activeEvent = {
  id: "event-1", slug: "ride", title: "Ride", status: "OPEN",
  chatActive: true, organizerId: "org-1",
}

describe("Event chat — access & send", () => {
  beforeEach(() => vi.clearAllMocks())

  it("lets a confirmed participant read messages", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-2", role: "USER" } } as never)
    mockDb.event.findUnique.mockResolvedValue(activeEvent as never)
    mockDb.eventParticipant.findUnique.mockResolvedValue({ status: "CONFIRMED", role: "MEMBER" } as never)
    mockDb.message.findMany.mockResolvedValue([] as never)

    const res = await GET(new Request("http://localhost/api/events/event-1/messages"), params())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.canModerate).toBe(false)
  })

  it("blocks a non-participant", async () => {
    mockAuth.mockResolvedValue({ user: { id: "rando", role: "USER" } } as never)
    mockDb.event.findUnique.mockResolvedValue(activeEvent as never)
    mockDb.eventParticipant.findUnique.mockResolvedValue(null)

    const res = await GET(new Request("http://localhost/api/events/event-1/messages"), params())
    expect(res.status).toBe(403)
  })

  it("treats the organizer as a moderator", async () => {
    mockAuth.mockResolvedValue({ user: { id: "org-1", role: "ORGANIZER" } } as never)
    mockDb.event.findUnique.mockResolvedValue(activeEvent as never)
    mockDb.message.findMany.mockResolvedValue([] as never)

    const res = await GET(new Request("http://localhost/api/events/event-1/messages"), params())
    const data = await res.json()
    expect(data.canModerate).toBe(true)
  })

  it("sends a message as a participant", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-2", role: "USER" } } as never)
    mockDb.event.findUnique.mockResolvedValue(activeEvent as never)
    mockDb.eventParticipant.findUnique.mockResolvedValue({ status: "CONFIRMED", role: "MEMBER" } as never)
    mockDb.message.create.mockResolvedValue({
      id: "m1", content: "hi", type: "TEXT", pinned: false, deleted: false,
      editedAt: null, createdAt: new Date(), senderId: "u-2",
      sender: { id: "u-2", name: "Sam", image: null }, replyTo: null,
    } as never)

    const res = await POST(
      new Request("http://localhost/api/events/event-1/messages", {
        method: "POST", body: JSON.stringify({ content: "hi" }),
      }),
      params()
    )
    expect(res.status).toBe(201)
  })

  it("refuses to send to a read-only (archived) chat", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-2", role: "USER" } } as never)
    mockDb.event.findUnique.mockResolvedValue({ ...activeEvent, chatActive: false } as never)
    mockDb.eventParticipant.findUnique.mockResolvedValue({ status: "CONFIRMED", role: "MEMBER" } as never)

    const res = await POST(
      new Request("http://localhost/api/events/event-1/messages", {
        method: "POST", body: JSON.stringify({ content: "hi" }),
      }),
      params()
    )
    expect(res.status).toBe(403)
  })
})

describe("Event chat — moderation", () => {
  beforeEach(() => vi.clearAllMocks())

  it("lets the organizer pin a message", async () => {
    mockAuth.mockResolvedValue({ user: { id: "org-1", role: "ORGANIZER" } } as never)
    mockDb.event.findUnique.mockResolvedValue(activeEvent as never)
    mockDb.message.findFirst.mockResolvedValue({ id: "msg-1" } as never)
    mockDb.message.update.mockResolvedValue({} as never)

    const res = await PATCH(
      new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ pinned: true }) }),
      params()
    )
    expect(res.status).toBe(200)
  })

  it("stops a member from pinning", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-2", role: "USER" } } as never)
    mockDb.event.findUnique.mockResolvedValue(activeEvent as never)
    mockDb.eventParticipant.findUnique.mockResolvedValue({ status: "CONFIRMED", role: "MEMBER" } as never)

    const res = await PATCH(
      new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ pinned: true }) }),
      params()
    )
    expect(res.status).toBe(403)
  })

  it("lets an author delete their own message", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-2", role: "USER" } } as never)
    mockDb.event.findUnique.mockResolvedValue(activeEvent as never)
    mockDb.eventParticipant.findUnique.mockResolvedValue({ status: "CONFIRMED", role: "MEMBER" } as never)
    mockDb.message.findFirst.mockResolvedValue({ id: "msg-1", senderId: "u-2" } as never)
    mockDb.message.update.mockResolvedValue({} as never)

    const res = await DELETE(new Request("http://localhost", { method: "DELETE" }), params())
    expect(res.status).toBe(200)
  })

  it("stops a member from deleting someone else's message", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-2", role: "USER" } } as never)
    mockDb.event.findUnique.mockResolvedValue(activeEvent as never)
    mockDb.eventParticipant.findUnique.mockResolvedValue({ status: "CONFIRMED", role: "MEMBER" } as never)
    mockDb.message.findFirst.mockResolvedValue({ id: "msg-1", senderId: "someone-else" } as never)

    const res = await DELETE(new Request("http://localhost", { method: "DELETE" }), params())
    expect(res.status).toBe(403)
  })
})
