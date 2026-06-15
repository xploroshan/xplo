"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Plus, Trash2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/image-upload"

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  status: string
  coverImage: string | null
  publishedAt: string | null
  updatedAt: string
}

const EMPTY = { id: "", title: "", excerpt: "", content: "", coverImage: null as string | null, tags: "", status: "draft" }

export function BlogManager({ subdomain }: { subdomain: string }) {
  const base = `/api/tenant/${subdomain}/blog`
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<typeof EMPTY | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(base)
    if (res.ok) setPosts((await res.json()).posts)
    setLoading(false)
  }, [base])
  useEffect(() => { load() }, [load])

  async function save() {
    if (!form) return
    setSaving(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        title: form.title,
        excerpt: form.excerpt || undefined,
        coverImage: form.coverImage,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        status: form.status,
      }
      // On edit, only send content when the author actually retyped it.
      if (form.content.trim() || !form.id) body.content = form.content
      const res = form.id
        ? await fetch(`${base}/${form.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch(base, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Save failed")
      setForm(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  function edit(id: string) {
    // Edits metadata/status; leave content blank to keep the existing body
    // (PATCH only updates fields that are sent).
    const p = posts.find((x) => x.id === id)
    if (p) setForm({ id: p.id, title: p.title, excerpt: p.excerpt || "", content: "", coverImage: p.coverImage, tags: "", status: p.status })
  }

  async function remove(id: string) {
    await fetch(`${base}/${id}`, { method: "DELETE" })
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-zinc-600" /></div>

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/manage" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4" /> Manage
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Blog posts</h1>
        {!form && (
          <Button variant="glow" className="rounded-xl gap-2" onClick={() => setForm({ ...EMPTY })}>
            <Plus className="h-4 w-4" /> New post
          </Button>
        )}
      </div>

      {form ? (
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 space-y-4">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-zinc-800/50 border-zinc-700 text-white" />
          <Input placeholder="Short excerpt (optional)" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="bg-zinc-800/50 border-zinc-700 text-white" />
          <ImageUpload value={form.coverImage} onChange={(url) => setForm({ ...form, coverImage: url })} className="h-40" label="Cover image (optional)" />
          <Textarea rows={12} placeholder="Write your post…" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="bg-zinc-800/50 border-zinc-700 text-white" />
          <Input placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="bg-zinc-800/50 border-zinc-700 text-white" />
          <div className="flex items-center gap-3">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="h-10 rounded-lg bg-zinc-800/50 border border-zinc-700 text-sm text-white px-3">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <Button variant="glow" className="rounded-xl gap-2" onClick={save} disabled={saving || !form.title.trim() || (!form.id && !form.content.trim())}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </Button>
            <Button variant="outline" className="rounded-xl border-zinc-700" onClick={() => setForm(null)}>Cancel</Button>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <p className="text-xs text-zinc-500">Editing keeps the existing body unless you type new content.</p>
        </div>
      ) : posts.length === 0 ? (
        <p className="text-sm text-zinc-500">No posts yet — create your first.</p>
      ) : (
        <div className="space-y-2">
          {posts.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{p.title}</p>
                <p className="text-xs text-zinc-500">{p.status === "published" ? "Published" : "Draft"}</p>
              </div>
              <button onClick={() => edit(p.id)} className="p-2 text-zinc-500 hover:text-white" title="Edit"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => remove(p.id)} className="p-2 text-zinc-500 hover:text-red-400" title="Delete"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
