/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { format, parseISO } from 'date-fns'
import { Article } from '@/types/article'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, ExternalLink, ImageOff, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { updateArticle } from '@/lib/api'

interface ArticleWidgetProps {
  article: Article
  onClose: () => void
  isFavorite: boolean
  toggleFavorite: () => void
  onPrevious: () => void
  onNext: () => void
  hasPrevious: boolean
  hasNext: boolean
}

export function ArticleWidget({ 
  article, 
  onClose, 
  isFavorite, 
  toggleFavorite,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext
}: ArticleWidgetProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [imageError, setImageError] = useState(false)

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return format(date, 'HH:mm MMMM d, yyyy')
    } catch (error) {
      console.error('Invalid date:', dateString)
      return 'Invalid date'
    }
  }

  const handleToggleFavorite = async () => {
    try {
      setIsUpdating(true)
      await updateArticle(article.id, { is_favorited: !isFavorite })
      toggleFavorite()
    } catch (err) {
      console.error('Failed to update article:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <Card className="h-full flex flex-col bg-white dark:bg-gray-900">
      <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2 px-6 border-b">
        <CardTitle className="text-2xl font-bold break-words flex-grow mr-4 text-gray-900 dark:text-gray-100">{article.title}</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={onPrevious} disabled={!hasPrevious}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous article</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={onNext} disabled={!hasNext}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next article</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden px-6 py-4">
        <ScrollArea className="h-full">
          <div className="max-w-3xl mx-auto">
            {article.image_url && !imageError ? (
              <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden">
                <Image
                  src={article.image_url || "/placeholder.svg"}
                  alt={article.title}
                  fill
                  className="object-cover"
                  onError={handleImageError}
                />
              </div>
            ) : (
              <div className="w-full h-64 mb-6 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <ImageOff className="h-12 w-12 text-gray-400" />
              </div>
            )}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {article.author && `By ${article.author} • `}
                  {formatDate(article.published_at)}
                </p>
                {article.categories && article.categories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {article.categories.map((category, index) => (
                      <Badge key={index} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleFavorite}
                disabled={isUpdating}
                className={isFavorite ? 'text-red-500' : ''}
              >
                <Heart className="w-4 h-4 mr-2" fill={isFavorite ? "currentColor" : "none"} />
                {isFavorite ? 'Favorited' : 'Favorite'}
              </Button>
            </div>
            <div 
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content || article.summary || "" }}
            />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-end items-center mt-auto px-6 py-4 border-t">
        <Button variant="default" size="sm" asChild>
          <a href={article.link} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            Visit Website
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}

