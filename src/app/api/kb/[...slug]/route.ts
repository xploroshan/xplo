import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const KB_DIR = path.join(process.cwd(), "src/knowledge-base")

function getAllArticles(dir: string, prefix = ""): { category: string; article: string; path: string }[] {
  const results: { category: string; article: string; path: string }[] = []
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        results.push(...getAllArticles(path.join(dir, entry.name), entry.name))
      } else if (entry.name.endsWith(".md")) {
        const article = entry.name.replace(".md", "")
        results.push({ category: prefix, article, path: path.join(dir, entry.name) })
      }
    }
  } catch {
    // Directory doesn't exist
  }
  return results
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params

  // Handle search: /api/kb/search?q=...&type=...
  if (slug[0] === "search") {
    const url = new URL(request.url)
    const query = url.searchParams.get("q")?.toLowerCase() || ""
    const type = url.searchParams.get("type") || ""

    if (!query && !type) {
      return NextResponse.json({ results: [] })
    }

    const articles = getAllArticles(KB_DIR)
    const results = articles
      .filter((a) => {
        if (type && a.category !== type) return false
        if (!query) return true
        try {
          const content = fs.readFileSync(a.path, "utf-8").toLowerCase()
          return content.includes(query) || a.article.includes(query)
        } catch {
          return false
        }
      })
      .map((a) => {
        const content = fs.readFileSync(a.path, "utf-8")
        const title = content.split("\n")[0]?.replace(/^#+\s*/, "") || a.article
        const snippet = content.slice(0, 200).replace(/^#+.*\n/, "")
        return { category: a.category, article: a.article, title, snippet }
      })
      .slice(0, 10)

    return NextResponse.json({ results })
  }

  // Handle listing: /api/kb/[category]
  if (slug.length === 1) {
    const categoryDir = path.join(KB_DIR, slug[0])
    try {
      const files = fs.readdirSync(categoryDir).filter((f) => f.endsWith(".md"))
      const articles = files.map((f) => {
        const content = fs.readFileSync(path.join(categoryDir, f), "utf-8")
        const title = content.split("\n")[0]?.replace(/^#+\s*/, "") || f.replace(".md", "")
        return { article: f.replace(".md", ""), title }
      })
      return NextResponse.json({ category: slug[0], articles })
    } catch {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }
  }

  // Handle article: /api/kb/[category]/[article]
  const filePath = path.join(KB_DIR, ...slug) + ".md"
  try {
    const content = fs.readFileSync(filePath, "utf-8")
    const title = content.split("\n")[0]?.replace(/^#+\s*/, "") || slug[slug.length - 1]
    return NextResponse.json({ content, category: slug[0], article: slug[slug.length - 1], title })
  } catch {
    return NextResponse.json({ error: "Article not found" }, { status: 404 })
  }
}
