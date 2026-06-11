import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST as REACT } from "@/app/api/events/[eventId]/messages/[messageId]/react/route"
import { POST as VOTE } from "@/app/api/events/[eventId]/messages/[messageId]/vote/route"
import { PATCH as EDIT } from "@/app/api/events/[eventId]/messages/[messageId]/route"
import { POST as DM_CREATE } from "@/app/api/conversations/route"
import { resolveMentions, presentMessage } from "@/lib/chat-messages"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const mockDb = vi.mocked(db)
const mockAuth = vi.mocked(auth)
const p = (eventId = "event-1", messageId = "msg-1") => ({ params: Promise.resolve({ eventId, messageId }) })
const activeEvent = { id: "event-1", slug: "ride", title: "Ride", status: "OPEN", chatActive: true, organizerId: "org-1" }

function reqJson(body: unknown) {
  return new Request("http://localhost", { method: "POST", body: JSON.stringify(body) })
}

describe("chat-messages helpers", () => {
  it("resolves @mentions by first name and slug", () => {
    const members = [
      { id: "u1", name: "Sam Rider", slug: "sam-r" },
      { id: "u2", name: "Lee", slug: "lee" },
    ]
    expect(resolveMentions("hey @sam and @lee", members).sort()).toEqual(["u1", "u2"])
    expect(resolveMentions("@nobody here", members)).toEqual([])
  })

  it("summarizes reactions and polls for the viewer", () => {
    const presented = presentMessage(
      {
        id: "m", content: "Q", type: "POLL", pinned: false, deleted: false, editedAt: null,
        createdAt: new Date(), senderId: "x", sender: { id: "x", name: "X", image: null }, replyTo: null,
        metadata: {
          reactions: { "🔥": ["me", "u2"] },
          poll: { question: "Q", options: ["A", "B"], votes: { "0": ["me"] }, multi: false },
        },
      } as never,
      "me"
    )
    expect(presented.reactions[0]).toMatchObject({ emoji: "🔥", count: 2, mine: true })
    expect(presented.poll?.options[0]).toMatchObject({ votes: 1, mine: true })
    expect(presented.poll?.totalVoters).toBe(1)
  })
})

describe("reactions", () => {
  beforeEach(() => vi.clearAllMocks())
  it("toggles a reaction", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-2", role: "USER" } } as never)
    mockDb.event.findUnique.mockResolvedValue(activeEvent as never)
    mockDb.eventParticipant.findUnique.mockResolvedValue({ status: "CONFIRMED", role: "MEMBER" } as never)
    mockDb.message.findFirst.mockResolvedValue({ id: "msg-1", metadata: {} } as never)
    mockDb.message.update.mockResolvedValue({
      id: "msg-1", content: "hi", type: "TEXT", metadata: { reactions: { "🔥": ["u-2"] } },
      pinned: false, deleted: false, editedAt: null, createdAt: new Date(), senderId: "u-2",
      sender: { id: "u-2", name: "Sam", image: null }, replyTo: null,
    } as never)

    const res = await REACT(reqJson({ emoji: "🔥" }), p())
    expect(res.status).toBe(200)
    expect(mockDb.message.update).toHaveBeenCalled()
  })

  it("rejects an unsupported emoji", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-2", role: "USER" } } as never)
    mockDb.event.findUnique.mockResolvedValue(activeEvent as never)
    mockDb.eventParticipant.findUnique.mockResolvedValue({ status: "CONFIRMED", role: "MEMBER" } as never)
    const res = await REACT(reqJson({ emoji: "💩" }), p())
    expect(res.status).toBe(400)
  })
})

describe("poll vote", () => {
  beforeEach(() => vi.clearAllMocks())
  it("records a single-choice vote", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-2", role: "USER" } } as never)
    mockDb.event.findUnique.mockResolvedValue(activeEvent as never)
    mockDb.eventParticipant.findUnique.mockResolvedValue({ status: "CONFIRMED", role: "MEMBER" } as never)
    mockDb.message.findFirst.mockResolvedValue({
      id: "msg-1",
      metadata: { poll: { question: "Q", options: ["A", "B"], votes: {}, multi: false } },
    } as never)
    mockDb.message.update.mockResolvedValue({
      id: "msg-1", content: "Q", type: "POLL", metadata: { poll: { question: "Q", options: ["A", "B"], votes: { "1": ["u-2"] }, multi: false } },
      pinned: false, deleted: false, editedAt: null, createdAt: new Date(), senderId: "x",
      sender: { id: "x", name: "X", image: null }, replyTo: null,
    } as never)

    const res = await VOTE(reqJson({ option: 1 }), p())
    expect(res.status).toBe(200)
  })
})

describe("edit window", () => {
  beforeEach(() => vi.clearAllMocks())
  it("blocks editing after 15 minutes", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-2", role: "USER" } } as never)
    mockDb.event.findUnique.mockResolvedValue(activeEvent as never)
    mockDb.eventParticipant.findUnique.mockResolvedValue({ status: "CONFIRMED", role: "MEMBER" } as never)
    mockDb.message.findFirst.mockResolvedValue({
      id: "msg-1", senderId: "u-2", type: "TEXT", deleted: false,
      createdAt: new Date(Date.now() - 20 * 60 * 1000),
    } as never)

    const res = await EDIT(
      new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ content: "new" }) }),
      p()
    )
    expect(res.status).toBe(400)
  })
})

describe("DM create", () => {
  beforeEach(() => vi.clearAllMocks())
  it("creates/returns a conversation", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-1" } } as never)
    mockDb.user.findUnique.mockResolvedValue({ id: "u-2" } as never)
    mockDb.conversation.upsert.mockResolvedValue({ id: "conv-1", userAId: "u-1", userBId: "u-2" } as never)

    const res = await DM_CREATE(reqJson({ userId: "u-2" }))
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBe("conv-1")
  })

  it("won't message yourself", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-1" } } as never)
    const res = await DM_CREATE(reqJson({ userId: "u-1" }))
    expect(res.status).toBe(400)
  })
})
