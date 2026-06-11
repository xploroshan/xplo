import { describe, it, expect, vi, beforeEach } from "vitest"
import { safeJsonLd } from "@/lib/json-ld"
import { GET as KB_GET } from "@/app/api/kb/[...slug]/route"
import { GET as POI_GET } from "@/app/api/ai/places-of-interest/route"
import { POST as ASSESS_POST } from "@/app/api/ai/assess-event/route"
import { GET as TICKET_TYPES_GET } from "@/app/api/events/[eventId]/ticket-types/route"
import { GET as ORG_EVENTS_GET } from "@/app/api/organizations/[slug]/events/route"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const mockDb = vi.mocked(db)
const mockAuth = vi.mocked(auth)

describe("safeJsonLd (C2 — JSON-LD XSS)", () => {
  it("escapes a </script> breakout inside a string value", () => {
    const out = safeJsonLd({ title: "</script><script>alert(1)</script>" })
    expect(out).not.toContain("</script>")
    expect(out).not.toContain("<script>")
    expect(out).toContain("\\u003c")
    // Still valid JSON after escaping.
    expect(JSON.parse(out).title).toBe("</script><script>alert(1)</script>")
  })

  it("escapes ampersands and JS line terminators", () => {
    const out = safeJsonLd({ s: "a&b c d" })
    expect(out).toContain("\\u0026")
    expect(out).toContain("\\u2028")
    expect(out).toContain("\\u2029")
    expect(out).not.toContain(" ")
    expect(out).not.toContain(" ")
  })
})

describe("KB path traversal (C1)", () => {
  function kbReq() {
    return new Request("http://localhost/api/kb")
  }

  it("rejects ../ traversal segments with 404", async () => {
    const res = await KB_GET(kbReq(), {
      params: Promise.resolve({ slug: ["..", "..", "etc", "passwd"] }),
    })
    expect(res.status).toBe(404)
  })

  it("rejects segments with slashes or dots", async () => {
    const res = await KB_GET(kbReq(), {
      params: Promise.resolve({ slug: ["safety", "../../secret"] }),
    })
    expect(res.status).toBe(404)
  })
})

describe("AI ownership guard (H2 — cross-tenant cache poisoning)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = "test-key"
  })

  it("places-of-interest returns 403 for a non-organizer when uncached", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "USER" } } as never)
    mockDb.event.findUnique.mockResolvedValue({
      id: "e-1",
      organizerId: "someone-else",
      destination: { address: "Goa" },
      startLocation: null,
      eventType: { name: "Ride" },
      nearbyPoi: null,
    } as never)

    const res = await POI_GET(
      new Request("http://localhost/api/ai/places-of-interest?eventId=e-1")
    )
    expect(res.status).toBe(403)
  })

  it("places-of-interest serves the cache to any authed user without an LLM call", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "USER" } } as never)
    mockDb.event.findUnique.mockResolvedValue({
      id: "e-1",
      organizerId: "someone-else",
      eventType: { name: "Ride" },
      nearbyPoi: { places: ["cached"] },
    } as never)

    const res = await POI_GET(
      new Request("http://localhost/api/ai/places-of-interest?eventId=e-1")
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ places: ["cached"] })
  })

  it("assess-event returns 403 for a non-organizer", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "USER" } } as never)
    mockDb.event.findUnique.mockResolvedValue({
      id: "e-1",
      organizerId: "someone-else",
      title: "X",
      startLocation: null,
      destination: null,
      eventType: { name: "Ride" },
    } as never)

    const res = await ASSESS_POST(
      new Request("http://localhost/api/ai/assess-event", {
        method: "POST",
        body: JSON.stringify({ eventId: "e-1" }),
      })
    )
    expect(res.status).toBe(403)
  })
})

describe("Draft leak (H4)", () => {
  beforeEach(() => vi.clearAllMocks())

  it("ticket-types GET hides DRAFT pricing from the public (404)", async () => {
    mockAuth.mockResolvedValue(null as never)
    mockDb.event.findUnique.mockResolvedValue({
      status: "DRAFT",
      organizerId: "owner-1",
    } as never)

    const res = await TICKET_TYPES_GET(new Request("http://localhost"), {
      params: Promise.resolve({ eventId: "e-1" }),
    })
    expect(res.status).toBe(404)
    expect(mockDb.ticketType.findMany).not.toHaveBeenCalled()
  })

  it("ticket-types GET shows DRAFT pricing to the organizer", async () => {
    mockAuth.mockResolvedValue({ user: { id: "owner-1", role: "USER" } } as never)
    mockDb.event.findUnique.mockResolvedValue({
      status: "DRAFT",
      organizerId: "owner-1",
    } as never)
    mockDb.ticketType.findMany.mockResolvedValue([] as never)

    const res = await TICKET_TYPES_GET(new Request("http://localhost"), {
      params: Promise.resolve({ eventId: "e-1" }),
    })
    expect(res.status).toBe(200)
    expect(mockDb.ticketType.findMany).toHaveBeenCalled()
  })

  it("ticket-types GET serves a PUBLISHED event without auth", async () => {
    mockAuth.mockResolvedValue(null as never)
    mockDb.event.findUnique.mockResolvedValue({
      status: "PUBLISHED",
      organizerId: "owner-1",
    } as never)
    mockDb.ticketType.findMany.mockResolvedValue([] as never)

    const res = await TICKET_TYPES_GET(new Request("http://localhost"), {
      params: Promise.resolve({ eventId: "e-1" }),
    })
    expect(res.status).toBe(200)
  })

  it("org events list filters to public statuses by default", async () => {
    mockDb.organization.findUnique.mockResolvedValue({ id: "org-1" } as never)
    mockDb.event.findMany.mockResolvedValue([] as never)
    mockDb.event.count.mockResolvedValue(0 as never)

    const res = await ORG_EVENTS_GET(
      new Request("http://localhost/api/organizations/acme/events"),
      { params: Promise.resolve({ slug: "acme" }) }
    )
    expect(res.status).toBe(200)
    const whereArg = mockDb.event.findMany.mock.calls[0][0].where
    expect(whereArg.status.in).not.toContain("DRAFT")
    expect(whereArg.status.in).not.toContain("ARCHIVED")
    expect(whereArg.status.in).toContain("PUBLISHED")
  })
})
