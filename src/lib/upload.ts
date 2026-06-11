/**
 * Image uploads via Vercel Blob.
 *
 * Active when a Blob store is connected (BLOB_READ_WRITE_TOKEN is present —
 * auto-injected on Vercel). `put` reads the token from the environment.
 */

import { put } from "@vercel/blob"

const MAX_BYTES = 8 * 1024 * 1024 // 8 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export function isUploadConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

export async function uploadImage(
  file: File,
  prefix = "uploads"
): Promise<{ url: string }> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Unsupported file type — use JPEG, PNG, WebP, or GIF")
  }
  if (file.size > MAX_BYTES) {
    throw new Error("File too large — max 8 MB")
  }

  const ext = file.type.split("/")[1] || "bin"
  const key = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { url } = await put(key, file, {
    access: "public",
    addRandomSuffix: false,
  })
  return { url }
}
