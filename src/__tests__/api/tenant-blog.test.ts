import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "@/app/api/tenant/[subdomain]/blog/route"
import { tenantContentWhere } from "@/lib/tenant"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const mockDb = vi.mocked(db)
const mockAuth = vi.mocked(auth)

const params = (subdomain = "taleson2wheels") => ({ params: Promise.resolve({ subdomain }) })
const req = (body: unknown) =>
  new Request("http://localhost/api/tenant/taleson2wheels/blog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

const orgTenant = { id: "org-1", subdomain: "taleson2wheels", name: "T2W", slug: "t2w" }

describe("tenantContentWhere", () => {
  it("scopes by org or user", () => {
    expect(tenantContentWhere({ kind: "org", id: "org-1" } as never)).toEqual({ organizationId: "org-1" })
    expect(tenantContentWhere({ kind: "user", id: "u-1" } as never)).toEqual({ userId: "u-1" })
  })
})

describe("Blog API — create", () => {
  beforeEach(() => vi.clearAllMocks())

  it("404s for an unclaimed subdomain", async () => {
    mockDb.organization.findUnique.mockResolvedValue(null)
    mockDb.user.findUnique.mockResolvedValue(null)
    mockAuth.mockResolvedValue({ user: { id: "u-1" } } as never)
    const res = await POST(req({ title: "Hi", content: "x" }), params())
    expect(res.status).toBe(404)
  })

  it("403s for a non-owner", async () => {
    mockDb.organization.findUnique.mockResolvedValue(orgTenant as never)
    mockAuth.mockResolvedValue({ user: { id: "rando", role: "USER" } } as never)
    mockDb.organizationMember.findUnique.mockResolvedValue(null) // not a member
    const res = await POST(req({ title: "Hi", content: "x" }), params())
    expect(res.status).toBe(403)
  })

  it("creates a post (201) for an org OWNER with a generated slug", async () => {
    mockDb.organization.findUnique.mockResolvedValue(orgTenant as never)
    mockAuth.mockResolvedValue({ user: { id: "owner-1", role: "USER" } } as never)
    mockDb.organizationMember.findUnique.mockResolvedValue({ role: "OWNER" } as never)
    mockDb.blogPost.findFirst.mockResolvedValue(null) // slug free
    mockDb.blogPost.create.mockResolvedValue({ id: "b-1", slug: "weekend-ride-to-goa" } as never)

    const res = await POST(req({ title: "Weekend Ride to Goa", content: "Body", status: "published" }), params())
    expect(res.status).toBe(201)
    expect(mockDb.blogPost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: "org-1",
          slug: "weekend-ride-to-goa",
          status: "published",
          publishedAt: expect.any(Date),
        }),
      })
    )
  })

  it("rejects invalid input (400)", async () => {
    mockDb.organization.findUnique.mockResolvedValue(orgTenant as never)
    mockAuth.mockResolvedValue({ user: { id: "owner-1", role: "USER" } } as never)
    mockDb.organizationMember.findUnique.mockResolvedValue({ role: "OWNER" } as never)
    const res = await POST(req({ title: "x" }), params()) // title too short, content missing
    expect(res.status).toBe(400)
  })
})
