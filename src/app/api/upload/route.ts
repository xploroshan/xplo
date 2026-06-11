import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"
import { uploadImage, isUploadConfigured } from "@/lib/upload"

// Authenticated image upload. Returns the public Blob URL.
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isUploadConfigured()) {
    return NextResponse.json(
      { error: "Image uploads are not configured yet" },
      { status: 503 }
    )
  }

  const { success } = await rateLimit(`upload:${session.user.id}`, 30, 60 * 60 * 1000)
  if (!success) {
    return NextResponse.json(
      { error: "Too many uploads. Please try again later." },
      { status: 429 }
    )
  }

  const form = await request.formData().catch(() => null)
  const file = form?.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  try {
    const { url } = await uploadImage(file, `user-${session.user.id}`)
    return NextResponse.json({ url }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 400 }
    )
  }
}
