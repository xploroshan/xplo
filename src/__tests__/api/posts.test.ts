import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST as CREATE } from "@/app/api/posts/route"
import { POST as LIKE } from "@/app/api/posts/[postId]/like/route"
import { DELETE as REMOVE } from "@/app/api/posts/[postId]/route"
import { POST as COMMENT } from "@/app/api/posts/[postId]/comments/route"
import { extractHashtags, presentPost } from "@/lib/posts"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const mockDb = vi.mocked(db)
const mockAuth = vi.mocked(auth)
const p = (postId = "post-1") => ({ params: Promise.resolve({ postId }) })
const req = (body: unknown) =>
  new Request("http://localhost", { method: "POST", body: JSON.stringify(body) })

const rawPost = {
  id: "post-1", content: "Great ride #goa", images: ["https://x.test/a.jpg"],
  visibility: "public", likedBy: ["me"], likesCount: 1, bookmarkedBy: [],
  hashtags: ["goa"], isStory: false, expiresAt: null, createdAt: new Date(),
  userId: "me", user: { id: "me", name: "Sam", image: null, slug: "sam", verified: false },
  event: null, _count: { comments: 2 },
}

describe("posts lib", () => {
  it("extracts unique lowercase hashtags", () => {
    expect(extractHashtags("Loved #Goa! #goa #RideOn")).toEqual(["goa", "rideon"])
  })

  it("presents viewer-relative flags", () => {
    const out = presentPost(rawPost as never, "me")
    expect(out.liked).toBe(true)
    expect(out.mine).toBe(true)
    expect(presentPost(rawPost as never, "other").liked).toBe(false)
  })
})

describe("POST /api/posts", () => {
  beforeEach(() => vi.clearAllMocks())

  it("creates a post with hashtags", async () => {
    mockAuth.mockResolvedValue({ user: { id: "me", name: "Sam" } } as never)
    mockDb.post.create.mockResolvedValue(rawPost as never)

    const res = await CREATE(req({ content: "Great ride #goa" }))
    expect(res.status).toBe(201)
    expect(mockDb.post.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ hashtags: ["goa"] }) })
    )
  })

  it("rejects an empty post", async () => {
    mockAuth.mockResolvedValue({ user: { id: "me" } } as never)
    const res = await CREATE(req({}))
    expect(res.status).toBe(400)
  })

  it("rejects a story without a photo", async () => {
    mockAuth.mockResolvedValue({ user: { id: "me" } } as never)
    const res = await CREATE(req({ content: "story", isStory: true }))
    expect(res.status).toBe(400)
  })
})

describe("like / delete / comment", () => {
  beforeEach(() => vi.clearAllMocks())

  it("toggles a like and notifies the author", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-2", name: "Lee" } } as never)
    // Atomic UPDATE ... RETURNING: the new array now includes the liker.
    mockDb.$queryRaw.mockResolvedValue([{ likedBy: ["u-2"], userId: "me" }] as never)

    const res = await LIKE(new Request("http://localhost", { method: "POST" }), p())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.liked).toBe(true)
    expect(data.likes).toBe(1)
    expect(mockDb.notification.create).toHaveBeenCalled()
  })

  it("404s liking a post that doesn't exist", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-2", name: "Lee" } } as never)
    mockDb.$queryRaw.mockResolvedValue([] as never)

    const res = await LIKE(new Request("http://localhost", { method: "POST" }), p())
    expect(res.status).toBe(404)
  })

  it("blocks deleting someone else's post", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-2", role: "USER" } } as never)
    mockDb.post.findUnique.mockResolvedValue({ userId: "me" } as never)

    const res = await REMOVE(new Request("http://localhost", { method: "DELETE" }), p())
    expect(res.status).toBe(403)
  })

  it("adds a comment and notifies the author", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u-2", name: "Lee" } } as never)
    mockDb.post.findUnique.mockResolvedValue({ userId: "me" } as never)
    mockDb.comment.create.mockResolvedValue({
      id: "c1", content: "nice", createdAt: new Date(), userId: "u-2",
      user: { id: "u-2", name: "Lee", image: null },
    } as never)

    const res = await COMMENT(req({ content: "nice" }), p())
    expect(res.status).toBe(201)
    expect(mockDb.notification.create).toHaveBeenCalled()
  })
})
