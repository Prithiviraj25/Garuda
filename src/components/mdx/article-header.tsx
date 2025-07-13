import Image from "next/image"
import ShareButtons from "../global/share-buttons"

type Props = {
  author: string
  authorImage: string
  date: string
  title: string
  description: string
}

const ArticleHeader = (props: Props) => {
  return (
    <div className="mb-10 text-left">
      {/* Author info and date */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <Image
            src={props.authorImage || "/placeholder.svg"}
            alt={props.author}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{props.author}</span>
          <span className="hidden sm:block">•</span>
          <time dateTime={props.date}>{props.date}</time>
        </div>
      </div>

      {/* Title and description */}
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">{props.title}</h1>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">{props.description}</p>
      </div>
      <ShareButtons />

    </div>
  )
}

export default ArticleHeader
