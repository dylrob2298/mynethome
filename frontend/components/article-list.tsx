/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import Image from 'next/image'
import { Article } from '@/types/article'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArticleWidget } from './article-widget'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, RefreshCw, LayoutGrid, List, ImageOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { getArticles, updateArticle, refreshFeed } from '@/lib/api'

interface ArticleListProps {
  feedId: number
  feedName: string
  feedDescription?: string
}

const ARTICLES_PER_PAGE = 10

export function ArticleList({ feedId, feedName, feedDescription }: ArticleListProps) {
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [isGridView, setIsGridView] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalArticles, setTotalArticles] = useState(0)

  const fetchArticles = useCallback(async () => {
    if (!feedId) return;
    try {
      setIsLoading(true)
      const { articles: fetchedArticles, total_count } = await getArticles({
        feed_id: feedId,
        limit: ARTICLES_PER_PAGE,
        offset: (currentPage - 1) * ARTICLES_PER_PAGE,
      })
      setArticles(fetchedArticles)
      setTotalArticles(total_count)
      setError(null)
    } catch (err) {
      setError('Failed to fetch articles')
    } finally {
      setIsLoading(false)
    }
  }, [feedId, currentPage])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const handleRefresh = async () => {
    try {
      await refreshFeed(feedId)
      await fetchArticles()
    } catch (err) {
      setError('Failed to refresh feed')
    }
  }

  const handleToggleFavorite = async (article: Article) => {
    try {
      const updatedArticle = await updateArticle(article.id, { is_favorited: !article.is_favorited })
      setArticles(articles.map(a => a.id === updatedArticle.id ? updatedArticle : a))
    } catch (err) {
      setError('Failed to update article')
    }
  }

  const handleArticleClick = async (article: Article) => {
    try {
      if (!article.is_read) {
        const updatedArticle = await updateArticle(article.id, { is_read: true })
        setArticles(articles.map(a => a.id === updatedArticle.id ? updatedArticle : a))
      }
      setSelectedArticle(article)
    } catch (err) {
      setError('Failed to update article')
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return format(date, 'MMM d, yyyy')
    } catch (error) {
      console.error('Invalid date:', dateString)
      return 'Invalid date'
    }
  }

  const renderArticleCard = (article: Article) => (
    <Card
      key={article.id}
      className={`cursor-pointer transition-shadow hover:shadow-md ${
        article.is_read ? 'opacity-60' : ''
      }`}
      onClick={() => handleArticleClick(article)}
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
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
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
          <h3 className="text-lg font-semibold mb-1 line-clamp-2">{article.title}</h3>
          <p className="text-sm text-gray-500 mb-1">{formatDate(article.published_at)}</p>
          <p className="text-sm line-clamp-2">{article.summary}</p>
          <div className="flex justify-between items-center mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-0"
              onClick={(e) => {
                e.stopPropagation()
                handleToggleFavorite(article)
              }}
            >
              <Heart className={`h-4 w-4 ${article.is_favorited ? 'fill-current text-red-500' : ''}`} />
            </Button>
            <span className="text-xs text-gray-500">{article.author}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderListView = () => (
    <div className="space-y-4">
      {articles.map(renderArticleCard)}
    </div>
  )

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {articles.map(renderArticleCard)}
    </div>
  )

  const renderPagination = () => {
    const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE)
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              isActive={currentPage === 1}
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => setCurrentPage(page)}
                isActive={currentPage === page}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              isActive={currentPage === totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div className="w-full h-full p-4">
        <div className="flex flex-col mb-6">
          <div className="flex flex-row items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{feedName}</h1>
            <div className="flex items-center space-x-2">
              <Toggle
                aria-label="Toggle view"
                pressed={isGridView}
                onPressedChange={setIsGridView}
              >
                {isGridView ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </Toggle>
              <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
                Update Feed
              </Button>
            </div>
          </div>
          {feedDescription && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{feedDescription}</p>
          )}
        </div>
        <ScrollArea className="h-[calc(100vh-200px)]">
          {isLoading ? (
            <p>Loading articles...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            isGridView ? renderGridView() : renderListView()
          )}
        </ScrollArea>
        <div className="mt-6">
          {renderPagination()}
        </div>
      </div>
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 w-full h-full bg-white dark:bg-gray-900 shadow-lg z-50"
            style={{ width: 'calc(100% - var(--sidebar-width))' }}
          >
            <ArticleWidget 
              article={selectedArticle} 
              onClose={() => setSelectedArticle(null)} 
              isFavorite={selectedArticle.is_favorited}
              toggleFavorite={() => handleToggleFavorite(selectedArticle)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

