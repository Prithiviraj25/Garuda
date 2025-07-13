import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllArticles, type ArticleWithSlug } from "@/lib/articles"
import { formatDate } from "@/lib/utils"
import type { Metadata } from "next"
import Link from "next/link"

function Article({ article }: { article: ArticleWithSlug }) {
  return (
    <article>
      <Card className="w-full border-border/40 shadow-sm">
        <CardHeader className="p-6">
          <CardTitle className="text-xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
            <Link
              href={`/blog/${article.slug}`}
              className="hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
            >
              {article.title}
            </Link>
          </CardTitle>
          <time dateTime={article.date} className="block text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            {formatDate(article.date)}
          </time>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <CardDescription className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {article.description}
          </CardDescription>
          <Button
            variant="link"
            className="p-0 h-auto font-medium text-teal-500 hover:text-teal-600 dark:text-teal-400 dark:hover:text-teal-300 mt-4"
            asChild
          >
            <Link href={`/blog/${article.slug}`}>
              Read article <span aria-hidden="true">→</span>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </article>
  )
}

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Explore my thoughts on software development, technology, and everything in between. Discover insights, tutorials, and reflections on building modern applications.",
}

export default async function ArticlesIndex() {
  const articles = await getAllArticles()

  return (
    <div>
      <header className="max-w-2xl mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
          From the blog
        </h1>
        <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400">
          Explore my thoughts on software development, technology, and everything in between. Discover insights, tutorials, and reflections on building modern applications.
        </p>
      </header>
      <div className="md:border-l md:border-zinc-200 md:pl-6 md:dark:border-zinc-700/40">
        <div className="flex max-w-3xl flex-col space-y-16">
          {articles.map((article) => (
            <Article key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </div>
  )
}
