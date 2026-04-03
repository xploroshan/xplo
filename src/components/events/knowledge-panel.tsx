"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen,
  ChevronDown,
  Loader2,
  AlertTriangle,
  Bike,
  Mountain,
  Tent,
  Waves,
  Car,
  Timer,
  ShieldCheck,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface KBArticle {
  article: string
  title: string
}

interface KBArticleContent {
  content: string
  category: string
  article: string
  title: string
}

const categoryIcons: Record<string, React.ReactNode> = {
  "motorcycle-rides": <Bike className="h-4 w-4" />,
  "treks-hikes": <Mountain className="h-4 w-4" />,
  camping: <Tent className="h-4 w-4" />,
  cycling: <Bike className="h-4 w-4" />,
  "water-sports": <Waves className="h-4 w-4" />,
  "road-trips": <Car className="h-4 w-4" />,
  "running-events": <Timer className="h-4 w-4" />,
  general: <ShieldCheck className="h-4 w-4" />,
}

const categoryLabels: Record<string, string> = {
  "motorcycle-rides": "Motorcycle Rides",
  "treks-hikes": "Treks & Hikes",
  camping: "Camping",
  cycling: "Cycling",
  "water-sports": "Water Sports",
  "road-trips": "Road Trips",
  "running-events": "Running Events",
  general: "General Safety",
}

function renderMarkdown(md: string): string {
  const lines = md.split("\n")
  const firstHeadingIdx = lines.findIndex((l) => l.startsWith("# "))
  const content = firstHeadingIdx >= 0 ? lines.slice(firstHeadingIdx + 1).join("\n") : md

  return (
    content
      .replace(/^### (.+)$/gm, '<h4 class="text-sm font-semibold text-zinc-200 mt-4 mb-2">$1</h4>')
      .replace(
        /^## (.+)$/gm,
        '<h3 class="text-base font-semibold text-orange-400 mt-5 mb-2">$1</h3>'
      )
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-200 font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(
        /^- (.+)$/gm,
        '<li class="ml-4 text-zinc-400 text-sm leading-relaxed list-disc">$1</li>'
      )
      .replace(
        /^(\d+)\. (.+)$/gm,
        '<li class="ml-4 text-zinc-400 text-sm leading-relaxed list-decimal" value="$1">$2</li>'
      )
      .replace(/^\|(.+)\|$/gm, (match) => {
        const cells = match
          .split("|")
          .filter((c) => c.trim())
          .map((c) => c.trim())
        if (cells.every((c) => /^[-:]+$/.test(c))) return ""
        const cellsHtml = cells
          .map(
            (c) =>
              `<td class="px-3 py-1.5 text-sm text-zinc-400 border border-zinc-700/50">${c}</td>`
          )
          .join("")
        return `<tr>${cellsHtml}</tr>`
      })
      .replace(
        /^(?!<[hlu]|<li|<tr|<table)(.+)$/gm,
        '<p class="text-zinc-400 text-sm leading-relaxed mb-2">$1</p>'
      )
      .replace(
        /(<tr>[\s\S]*?<\/tr>(\s*<tr>[\s\S]*?<\/tr>)*)/g,
        '<table class="w-full border-collapse my-3 text-left">$1</table>'
      )
      .replace(/<p class="[^"]*"><\/p>/g, "")
  )
}

function AccordionItem({
  article,
  eventType,
  index,
}: {
  article: KBArticle
  eventType: string
  index: number
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState<KBArticleContent | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const fetchContent = useCallback(async () => {
    if (content) return
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/kb/${eventType}/${article.article}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setContent(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [content, eventType, article.article])

  const handleToggle = () => {
    if (!isOpen) fetchContent()
    setIsOpen((prev) => !prev)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
    >
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/60 overflow-hidden transition-colors hover:border-zinc-700/70">
        <button
          onClick={handleToggle}
          className="w-full flex items-center justify-between px-4 py-3.5 text-left group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500">
              {categoryIcons[eventType] || <BookOpen className="h-4 w-4" />}
            </div>
            <span className="text-sm font-medium text-zinc-200 truncate group-hover:text-orange-400 transition-colors">
              {article.title}
            </span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 ml-2"
          >
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-zinc-800/50">
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 text-orange-500 animate-spin" />
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-2 py-4 text-sm text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Failed to load article. Please try again.</span>
                  </div>
                )}
                {content && (
                  <div
                    className="pt-3 kb-content"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(content.content),
                    }}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export function KnowledgePanel({ eventType }: { eventType: string }) {
  const [articles, setArticles] = useState<KBArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchArticles() {
      setLoading(true)
      setError(false)
      try {
        const res = await fetch(`/api/kb/${eventType}`)
        if (!res.ok) throw new Error("Failed to fetch")
        const data = await res.json()
        setArticles(data.articles || [])
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchArticles()
  }, [eventType])

  if (loading) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800/50">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (error || articles.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-zinc-900/50 border-zinc-800/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5 text-lg text-zinc-100">
              <BookOpen className="h-5 w-5 text-orange-500" />
              Knowledge Base
            </CardTitle>
            <Badge className="bg-orange-500/10 text-orange-500 border-0 text-xs">
              {categoryLabels[eventType] || eventType}
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Essential guides and safety information for your adventure
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {articles.map((article, index) => (
            <AccordionItem
              key={article.article}
              article={article}
              eventType={eventType}
              index={index}
            />
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}
