/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { format, parseISO } from "date-fns"
import Image from "next/image"
import type { Article } from "@/types/article"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArticleWidget } from "./article-widget"
import { AnimatePresence, motion } from "framer-motion"
import { Heart, RefreshCw, LayoutGrid, List, ImageOff, ExternalLink, Search, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { Input } from "@/components/ui/input"
import { getArticles, updateArticle, refreshFeed, getAllFeedIds } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { UnifiedPagination } from "./unified-pagination"
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
  const [isPaginationLoading, setIsPaginationLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalArticles, setTotalArticles] = useState(0)
  const [allFeedIds, setAllFeedIds] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const contentRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Create a key to track when filters change to reset pagination
  const filterKey = JSON.stringify({
    feedIds,
    showFavorites,
    searchTerm: debouncedSearchTerm,
  })

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reset page when filter key changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filterKey])

  const fetchArticles = useCallback(
    async (page: number) => {
      try {
        // Use different loading states for initial load vs pagination
        if (page === 1) {
          setIsLoading(true)
          setIsPaginationLoading(false)
        } else {
          setIsPaginationLoading(true)
        }

        const { articles: fetchedArticles, total_count } = await getArticles({
          feed_ids: feedIds.length > 0 ? feedIds : undefined,
          title: debouncedSearchTerm || undefined,
          limit: ARTICLES_PER_PAGE,
          offset: (page - 1) * ARTICLES_PER_PAGE,
          order_by: "published_at",
          is_favorited: showFavorites ? true : undefined,
        })

        setArticles(fetchedArticles)
        setTotalArticles(total_count)
        setError(null)

        // Scroll to top when changing pages
        if (contentRef.current && page > 1) {
          contentRef.current.scrollTop = 0
        }
      } catch (err) {
        console.error("Error fetching articles:", err)
        setError("Failed to fetch articles")
        toast({
          title: "Error",
          description: "Failed to fetch articles. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
        setIsPaginationLoading(false)
      }
    },
    [feedIds, debouncedSearchTerm, showFavorites, toast],
  )

  // Fetch articles when page, search term, feed IDs, or favorites filter changes
  useEffect(() => {
    fetchArticles(currentPage)
  }, [currentPage, debouncedSearchTerm, feedIds, showFavorites, fetchArticles])

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

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-900 max-w-full">
      <div className="w-full h-full p-4 flex flex-col">
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

        {/* Search input */}
        <div className="relative mb-4">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            disabled={isLoading}
          />
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1" ref={contentRef}>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <p>Loading articles...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={() => fetchArticles(currentPage)}>Try Again</Button>
              </div>
            ) : articles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <p className="text-gray-500 mb-2">
                  {debouncedSearchTerm
                    ? "No articles match your search"
                    : showFavorites
                      ? "You haven't favorited any articles yet"
                      : "No articles found for the selected feeds"}
                </p>
                {debouncedSearchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm("")}>
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <div className={`${isPaginationLoading ? "opacity-60 pointer-events-none" : ""}`}>
                {isGridView ? renderGridView() : renderListView()}
              </div>
            )}

            {/* Pagination loading indicator */}
            {isPaginationLoading && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-10 dark:bg-opacity-20 backdrop-blur-[1px] z-10">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Pagination footer - moved outside ScrollArea */}
          {!isLoading && articles.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <UnifiedPagination
                totalItems={totalArticles}
                itemsPerPage={ARTICLES_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                isLoading={isPaginationLoading}
                showSummary={true}
                itemName="articles"
              />
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 w-full h-full bg-white dark:bg-gray-900 shadow-lg z-50"
            style={{ width: "calc(100% - 64px)" }}
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

