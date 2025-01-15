'use client'

import { useState } from 'react'
import { FeedSidebar } from '@/components/feed-sidebar'
import { ArticleList } from '@/components/article-list'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Feed } from '@/types/feed'

export default function Home() {
  const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null)

  return (
    <SidebarProvider>
      <FeedSidebar onFeedSelect={setSelectedFeed} />
      <SidebarInset>
        {selectedFeed ? (
          <ArticleList
            feedId={selectedFeed.id}
            feedName={selectedFeed.name}
            feedDescription={selectedFeed.description || ""}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-xl text-gray-500">Select a feed to view articles</p>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}

