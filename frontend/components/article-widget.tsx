/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { Article } from '@/types/article'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, ExternalLink, BookOpen, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

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
            {article.imageUrl && (
              <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden">
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {article.author && `By ${article.author} • `}
                  {format(new Date(article.publishedAt), 'MMMM d, yyyy')}
                </p>
                {article.feedName && (
                  <Badge variant="secondary" className="mt-2">
                    {article.feedName}
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFavorite}
                className={isFavorite ? 'text-red-500' : ''}
              >
                <Heart className="w-4 h-4 mr-2" fill={isFavorite ? "currentColor" : "none"} />
                {isFavorite ? 'Favorited' : 'Favorite'}
              </Button>
            </div>
            <div 
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-end items-center mt-auto px-6 py-4 border-t">
        <Button variant="default" size="sm" asChild>
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            Visit Website
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}

