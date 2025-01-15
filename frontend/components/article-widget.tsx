/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { format, parseISO } from 'date-fns'
import { Article } from '@/types/article'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, ExternalLink, ImageOff, X } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { updateArticle } from '@/lib/api'

interface ArticleWidgetProps {
  article: Article
  onClose: () => void
  isFavorite: boolean
  toggleFavorite: () => void
}

export function ArticleWidget({ 
  article, 
  onClose, 
  isFavorite, 
  toggleFavorite 
}: ArticleWidgetProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [imageError, setImageError] = useState(false)

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return format(date, 'MMMM d, yyyy')
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
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
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
              </div>
              <div>
                <Badge variant="outline" className="mr-2">
                  {article.categories ? article.categories.join(', ') : 'Uncategorized'}
                </Badge>
              </div>
            </div>
            <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: article.content || article.summary || "" }} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <div className="flex justify-between items-center w-full">
          <Button variant="outline" size="sm" asChild>
            <a href={article.link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Read Original
            </a>
          </Button>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFavorite}
              disabled={isUpdating}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
              <span className="ml-2">{isFavorite ? 'Favorited' : 'Favorite'}</span>
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

