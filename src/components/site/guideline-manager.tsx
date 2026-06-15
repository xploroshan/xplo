"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Plus, Trash2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface Guideline {
  id: string
  title: string
  content: string
  category: string | null
  sortOrder: number
}

const EMPTY = { id: "", title: "", content: "", category: "", sortOrder: "0" }

export function GuidelineManager({ subdomain }: { subdomain: string }) {
  const base = `/api/tenant/${subdomain}/guidelines`
  const [items, setItems] = useState<Guideline[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<typeof EMPTY | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(base)
    if (res.ok) setItems((await res.json()).guidelines)
    setLoading(false)
  }, [base])
  useEffect(() => { load() }, [load])

  async function save() {
    if (!form) return
    setSaving(true)
    setError(null)
    try {
      const body = {
        title: form.title,
        content: form.content,
        category: form.category || undefined,
        sortOrder: Number(form.sortOrder) || 0,
      }
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

  async function remove(id: string) {
    await fetch(`${base}/${id}`, { method: "DELETE" })
    setItems((prev) => prev.filter((g) => g.id !== id))
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-zinc-600" /></div>

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/manage" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4" /> Manage
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Guidelines</h1>
        {!form && (
          <Button variant="glow" className="rounded-xl gap-2" onClick={() => setForm({ ...EMPTY })}>
            <Plus className="h-4 w-4" /> New guideline
          </Button>
        )}
      </div>

      {form ? (
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 space-y-4">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-zinc-800/50 border-zinc-700 text-white" />
          <Textarea rows={5} placeholder="Guideline details…" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="bg-zinc-800/50 border-zinc-700 text-white" />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Category (e.g. Safety)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-zinc-800/50 border-zinc-700 text-white" />
            <Input type="number" placeholder="Order" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className="bg-zinc-800/50 border-zinc-700 text-white" />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="glow" className="rounded-xl gap-2" onClick={save} disabled={saving || !form.title.trim() || !form.content.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </Button>
            <Button variant="outline" className="rounded-xl border-zinc-700" onClick={() => setForm(null)}>Cancel</Button>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-zinc-500">No guidelines yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((g) => (
            <div key={g.id} className="flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{g.title}</p>
                {g.category && <p className="text-xs text-zinc-500">{g.category}</p>}
              </div>
              <button onClick={() => setForm({ id: g.id, title: g.title, content: g.content, category: g.category || "", sortOrder: String(g.sortOrder) })} className="p-2 text-zinc-500 hover:text-white" title="Edit"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => remove(g.id)} className="p-2 text-zinc-500 hover:text-red-400" title="Delete"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
