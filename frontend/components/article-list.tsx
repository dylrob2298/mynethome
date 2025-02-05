/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect, useCallback } from "react"
import { format, parseISO } from "date-fns"
import Image from "next/image"
import type { Article } from "@/types/article"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArticleWidget } from "./article-widget"
import { AnimatePresence, motion } from "framer-motion"
import { Heart, RefreshCw, LayoutGrid, List, ImageOff, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import { getArticles, updateArticle, refreshFeed, getAllFeedIds } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import DOMPurify from "dompurify"

interface ArticleListProps {
  feedIds: number[]
  feedName: string
  feedDescription?: string
  showFavorites: boolean
}

const ARTICLES_PER_PAGE = 30

export function ArticleList({ feedIds, feedName, feedDescription, showFavorites }: ArticleListProps) {
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [selectedArticleIndex, setSelectedArticleIndex] = useState<number | null>(null)
  const [isGridView, setIsGridView] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalArticles, setTotalArticles] = useState(0)
  const [allFeedIds, setAllFeedIds] = useState<number[]>([])
  const { toast } = useToast()

  const fetchArticles = useCallback(
    async (page: number) => {
      try {
        setIsLoading(true)
        const { articles: fetchedArticles, total_count } = await getArticles({
          feed_ids: feedIds.length > 0 ? feedIds : undefined,
          limit: ARTICLES_PER_PAGE,
          offset: (page - 1) * ARTICLES_PER_PAGE,
          order_by: "published_at",
          is_favorited: showFavorites,
        })
        setArticles(fetchedArticles)
        setTotalArticles(total_count)
        setError(null)
      } catch (err) {
        setError("Failed to fetch articles")
      } finally {
        setIsLoading(false)
      }
    },
    [feedIds, showFavorites],
  )

  useEffect(() => {
    setCurrentPage(1)
    fetchArticles(1)
  }, [feedIds, showFavorites, fetchArticles])

  useEffect(() => {
    fetchArticles(currentPage)
  }, [currentPage, fetchArticles])

  useEffect(() => {
    const fetchAllFeedIds = async () => {
      const ids = await getAllFeedIds()
      setAllFeedIds(ids)
    }
    fetchAllFeedIds()
  }, [])

  const handleRefresh = async () => {
    try {
      if (feedIds.length > 0) {
        await Promise.all(feedIds.map((id) => refreshFeed(id)))
      } else {
        // Refresh all feeds when viewing favorites or all feeds
        await Promise.all(allFeedIds.map((id) => refreshFeed(id)))
      }
      await fetchArticles(currentPage)
      toast({
        title: "Feeds Refreshed",
        description: "Selected feeds have been updated.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to refresh feed(s). Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleToggleFavorite = async (article: Article) => {
    try {
      const updatedArticle = await updateArticle(article.id, { is_favorited: !article.is_favorited })
      setArticles(articles.map((a) => (a.id === updatedArticle.id ? updatedArticle : a)))
      if (selectedArticle && selectedArticle.id === updatedArticle.id) {
        setSelectedArticle(updatedArticle)
      }
    } catch (err) {
      setError("Failed to update article")
    }
  }

  const handleArticleClick = async (article: Article, index: number) => {
    try {
      if (!article.is_read) {
        const updatedArticle = await updateArticle(article.id, { is_read: true })
        setArticles(articles.map((a) => (a.id === updatedArticle.id ? updatedArticle : a)))
        article = updatedArticle
      }
      setSelectedArticle(article)
      setSelectedArticleIndex(index)
    } catch (err) {
      setError("Failed to update article")
    }
  }

  const handlePreviousArticle = () => {
    if (selectedArticleIndex !== null && selectedArticleIndex > 0) {
      const previousArticle = articles[selectedArticleIndex - 1]
      handleArticleClick(previousArticle, selectedArticleIndex - 1)
    }
  }

  const handleNextArticle = () => {
    if (selectedArticleIndex !== null && selectedArticleIndex < articles.length - 1) {
      const nextArticle = articles[selectedArticleIndex + 1]
      handleArticleClick(nextArticle, selectedArticleIndex + 1)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return format(date, "HH:mm MMM d, yyyy")
    } catch (error) {
      console.error("Invalid date:", dateString)
      return "Invalid date"
    }
  }

  const renderArticleCard = (article: Article, index: number) => (
    <Card
      key={article.id}
      className={`cursor-pointer transition-shadow hover:shadow-md ${
        article.is_read ? "opacity-60" : ""
      } max-w-full overflow-hidden`}
      onClick={() => handleArticleClick(article, index)}
    >
      <CardContent className="p-4 flex">
        <div className="flex-shrink-0 mr-4">
          <div className="relative w-20 h-20 rounded-md overflow-hidden">
            {article.image_url ? (
              <Image
                src={article.image_url || "/placeholder.svg"}
                alt={article.title}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg"
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                <ImageOff className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-semibold mb-1 line-clamp-2 break-words">{article.title}</h3>
          <p className="text-sm line-clamp-2 break-words">
            <div
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(article.summary || "", {
                  ALLOWED_TAGS: ["p", "strong", "em", "b", "i", "ul", "li"], // Exclude <img>
                  ALLOWED_ATTR: [],
                }),
              }}
            />
          </p>
          <p className="text-sm mb-1">{formatDate(article.published_at)}</p>
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleFavorite(article)
                }}
              >
                <Heart className={`h-4 w-4 ${article.is_favorited ? "fill-current text-red-500" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(article.link, "_blank", "noopener,noreferrer")
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-xs text-gray-500">{article.author}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderListView = () => (
    <div className="space-y-4">{articles.map((article, index) => renderArticleCard(article, index))}</div>
  )

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-full">
      {articles.map((article, index) => renderArticleCard(article, index))}
    </div>
  )

  const renderPagination = () => {
    const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE)
    if (totalPages <= 1) return null

    const maxVisiblePages = 5
    const pageNumbers = []

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    if (startPage > 1) {
      pageNumbers.push(1)
      if (startPage > 2) {
        pageNumbers.push("...")
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push("...")
      }
      pageNumbers.push(totalPages)
    }

    return (
      <Pagination>
        <PaginationContent className="flex justify-between items-center w-full">
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              isActive={currentPage > 1}
            />
          </PaginationItem>
          <div className="flex-1 flex justify-center items-center space-x-1">
            {pageNumbers.map((page, index) => (
              <PaginationItem key={index}>
                {page === "..." ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink onClick={() => setCurrentPage(page as number)} isActive={currentPage === page}>
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
          </div>
          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              isActive={currentPage < totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-900 max-w-full">
      <div className="w-full h-full p-4">
        <div className="flex flex-col mb-6">
          <div className="flex flex-row items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{feedName}</h1>
            <div className="flex items-center space-x-2">
              <Toggle aria-label="Toggle view" pressed={isGridView} onPressedChange={setIsGridView}>
                {isGridView ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </Toggle>
              <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
                Update Feed{feedIds.length > 1 ? "s" : ""}
              </Button>
            </div>
          </div>
          {feedDescription && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{feedDescription}</p>}
        </div>
        <ScrollArea className="h-[calc(100vh-200px)]">
          {isLoading ? (
            <p>Loading articles...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : isGridView ? (
            renderGridView()
          ) : (
            renderListView()
          )}
        </ScrollArea>
        <div className="mt-6">{renderPagination()}</div>
      </div>
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 w-full h-full bg-white dark:bg-gray-900 shadow-lg z-50"
            style={{ width: "calc(100% - var(--sidebar-width))" }}
          >
            <ArticleWidget
              article={selectedArticle}
              onClose={() => setSelectedArticle(null)}
              isFavorite={selectedArticle.is_favorited}
              toggleFavorite={() => handleToggleFavorite(selectedArticle)}
              onPrevious={handlePreviousArticle}
              onNext={handleNextArticle}
              hasPrevious={selectedArticleIndex !== null && selectedArticleIndex > 0}
              hasNext={selectedArticleIndex !== null && selectedArticleIndex < articles.length - 1}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

