"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, ArrowRight, Compass, Plus, Building2, CalendarDays } from "lucide-react"

const QUICK_LINKS = [
  { label: "Discover events", href: "/events", icon: Compass },
  { label: "Create an event", href: "/events/create", icon: Plus },
  { label: "Organizations", href: "/organizations", icon: Building2 },
  { label: "My feed", href: "/feed", icon: CalendarDays },
]

/**
 * The ⌘K command palette. Replaces the formerly-decorative top-bar search:
 * the trigger opens a modal that routes to the real `/events?q=` search and
 * exposes quick navigation. Honest, dependency-free, and reduced-motion safe.
 */
export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const close = () => {
    setOpen(false)
    setQ("")
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === "Escape") {
        setOpen(false)
        setQ("")
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  function go(href: string) {
    close()
    router.push(href)
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    const term = q.trim()
    go(term ? `/events?q=${encodeURIComponent(term)}` : "/events")
  }

  return (
    <>
      {/* Trigger — same look as before, now actually interactive */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50 px-3 py-1.5 text-sm text-zinc-500 cursor-pointer hover:border-zinc-600 hover:text-zinc-300 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search events...</span>
        <kbd className="ml-4 px-1.5 py-0.5 rounded bg-zinc-700/50 text-[10px] font-mono text-zinc-400">⌘K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 backdrop-blur-sm px-4 pt-[12vh] animate-fade-in"
          onClick={close}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={submitSearch} className="flex items-center gap-3 border-b border-zinc-800 px-4">
              <Search className="h-4 w-4 text-zinc-500 shrink-0" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search events by name or destination..."
                className="flex-1 bg-transparent py-4 text-sm text-white placeholder:text-zinc-500 outline-none"
              />
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-500">Esc</kbd>
            </form>

            <div className="p-2">
              {q.trim() && (
                <button
                  onClick={submitSearch}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white hover:bg-zinc-800/60 transition-colors"
                >
                  <Search className="h-4 w-4 text-orange-500" />
                  Search events for <span className="font-medium">&ldquo;{q.trim()}&rdquo;</span>
                  <ArrowRight className="ml-auto h-4 w-4 text-zinc-600" />
                </button>
              )}
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Quick links
              </p>
              {QUICK_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => go(link.href)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800/60 hover:text-white transition-colors"
                >
                  <link.icon className="h-4 w-4 text-zinc-500" />
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
