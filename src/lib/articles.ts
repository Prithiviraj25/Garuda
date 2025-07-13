import fs from "fs"
import path from "path"
import matter from "gray-matter"

export interface ArticleWithSlug {
  slug: string
  title: string
  description: string
  date: string
  author?: string
}

const articlesDirectory = path.join(process.cwd(), "src", "app", "blog")

export async function getAllArticles(): Promise<ArticleWithSlug[]> {
  const articles: ArticleWithSlug[] = []

  const findArticlesRecursively = (dir: string) => {
    if (!fs.existsSync(dir)) return
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        const possibleFiles = ["page.mdx", "index.mdx", "page.md", "index.md"]
        let articleFile: string | null = null
        for (const fileName of possibleFiles) {
          const filePath = path.join(fullPath, fileName)
          if (fs.existsSync(filePath)) {
            articleFile = filePath
            break
          }
        }

        if (articleFile) {
          const fileContents = fs.readFileSync(articleFile, "utf8")
          const { data } = matter(fileContents)
          const slug = path.relative(articlesDirectory, fullPath).replace(/\\/g, "/")

          if (slug) {
            articles.push({
              slug,
              title: data.title || path.basename(slug),
              description: data.description || "",
              date: data.date || new Date().toISOString(),
              author: data.author,
            })
          }
        }
        findArticlesRecursively(fullPath)
      }
    }
  }

  try {
    findArticlesRecursively(articlesDirectory)
    return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error("Error reading articles:", error)
    return []
  }
}

export async function getArticleBySlug(slug: string) {
  const articlePath = path.join(articlesDirectory, slug)

  if (!fs.existsSync(articlePath)) {
    return null
  }

  // Look for page.mdx or index.mdx in the subdirectory
  const possibleFiles = ["page.mdx", "index.mdx", "page.md", "index.md"]
  let articleFile = null

  for (const fileName of possibleFiles) {
    const filePath = path.join(articlePath, fileName)
    if (fs.existsSync(filePath)) {
      articleFile = filePath
      break
    }
  }

  if (!articleFile) {
    return null
  }

  const fileContents = fs.readFileSync(articleFile, "utf8")
  const { data, content } = matter(fileContents)

  return {
    slug,
    title: data.title || slug,
    description: data.description || "",
    date: data.date || new Date().toISOString(),
    author: data.author,
    content,
  }
}
