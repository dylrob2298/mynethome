/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { Article } from '@/types/article'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArticleWidget } from './article-widget'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, RefreshCw, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface ArticleListProps {
  articles: Article[]
  feedName: string
  feedDescription?: string
}

const ARTICLES_PER_PAGE = 10

export function ArticleList({ articles, feedName, feedDescription }: ArticleListProps) {
  const [selectedArticle, setSelectedArticleState] = useState<Article | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [readArticles, setReadArticles] = useState<Set<string>>(new Set())
  const [isGridView, setIsGridView] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(articles.length / ARTICLES_PER_PAGE)
  const paginatedArticles = articles.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE
  )

  const setSelectedArticle = (article: Article | null) => {
    if (article && !readArticles.has(article.id)) {
      setReadArticles(new Set(readArticles).add(article.id))
    }
    setSelectedArticleState(article)
  }

  const closeArticle = () => setSelectedArticle(null)

  const toggleFavorite = (articleId: string) => {
    setFavorites((prevFavorites) => {
      const newFavorites = new Set(prevFavorites)
      if (newFavorites.has(articleId)) {
        newFavorites.delete(articleId)
      } else {
        newFavorites.add(articleId)
      }
      return newFavorites
    })
  }

  const renderListView = () => (
    <div className="space-y-4">
      {paginatedArticles.map((article) => (
        <div
          key={article.id}
          className={`p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
            readArticles.has(article.id) ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700' : ''
          }`}
          onClick={() => setSelectedArticle(article.id === selectedArticle?.id ? null : article)}
        >
          <div className="flex items-start gap-4">
            {article.imageUrl && (
              <Image
                src={article.imageUrl}
                alt={article.title}
                width={80}
                height={80}
                className="rounded-md object-cover"
              />
            )}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className={`font-semibold mb-1 hover:underline ${readArticles.has(article.id) ? 'text-gray-600 dark:text-gray-400' : ''}`}>
                  {article.title}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(article.id);
                  }}
                  className={`p-1 rounded-full transition-colors ${
                    favorites.has(article.id) ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-gray-500'
                  }`}
                  aria-label={favorites.has(article.id) ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart className="w-5 h-5" fill={favorites.has(article.id) ? "currentColor" : "none"} />
                </button>
              </div>
              {article.author && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">By {article.author}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                {format(new Date(article.publishedAt), 'PPP')}
              </p>
              {article.feedName && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                  From: {article.feedName}
                </p>
              )}
              {selectedArticle?.id !== article.id && (
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{article.content.replace(/<[^>]*>/g, '')}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderGridView = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {paginatedArticles.map((article) => (
        <Card 
          key={article.id} 
          className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
            readArticles.has(article.id) ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-700'
          }`}
        >
          <div 
            className="cursor-pointer"
            onClick={() => setSelectedArticle(article.id === selectedArticle?.id ? null : article)}
          >
            {article.imageUrl && (
              <div className="relative w-full h-48">
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <CardContent className="p-4">
              <h3 className={`font-semibold text-lg mb-2 line-clamp-2 ${readArticles.has(article.id) ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                {article.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {article.author && `By ${article.author} • `}
                {format(new Date(article.publishedAt), 'MMM d, yyyy')}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                {article.content.replace(/<[^>]*>/g, '')}
              </p>
            </CardContent>
          </div>
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
            {article.feedName && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {article.feedName}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(article.id);
              }}
              className={favorites.has(article.id) ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-gray-500'}
            >
              <Heart className="h-4 w-4" fill={favorites.has(article.id) ? "currentColor" : "none"} />
              <span className="sr-only">{favorites.has(article.id) ? "Remove from favorites" : "Add to favorites"}</span>
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )

  const renderPagination = () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 1) setCurrentPage(currentPage - 1);
            }}
          />
        </PaginationItem>
        {[...Array(totalPages)].map((_, i) => (
          <PaginationItem key={i}>
            <PaginationLink 
              href="#" 
              isActive={currentPage === i + 1}
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage(i + 1);
              }}
            >
              {i + 1}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              if (currentPage < totalPages) setCurrentPage(currentPage + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )

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
              <Button variant="outline" size="sm" className="flex items-center gap-2">
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
          {isGridView ? renderGridView() : renderListView()}
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
              onClose={closeArticle} 
              isFavorite={favorites.has(selectedArticle?.id)}
              toggleFavorite={() => toggleFavorite(selectedArticle.id)}
              onPrevious={() => {
                const currentIndex = articles.findIndex(a => a.id === selectedArticle.id);
                const prevIndex = (currentIndex - 1 + articles.length) % articles.length;
                setSelectedArticle(articles[prevIndex]);
              }}
              onNext={() => {
                const currentIndex = articles.findIndex(a => a.id === selectedArticle.id);
                const nextIndex = (currentIndex + 1) % articles.length;
                setSelectedArticle(articles[nextIndex]);
              }}
              hasPrevious={articles.length > 1}
              hasNext={articles.length > 1}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

