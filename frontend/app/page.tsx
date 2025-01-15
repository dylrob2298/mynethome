'use client'

import { useState } from 'react'
import { FeedSidebar } from '@/components/feed-sidebar'
import { ArticleList } from '@/components/article-list'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Feed } from '@/types/feed'

export default function Home() {
  const [selectedFeeds, setSelectedFeeds] = useState<Feed[]>([])

  const handleFeedSelect = (feed: Feed | null) => {
    if (feed) {
      setSelectedFeeds([feed])
    } else {
      setSelectedFeeds([]) // This will show all feeds
    }
  }

  return (
    <SidebarProvider>
      <FeedSidebar onFeedSelect={handleFeedSelect} selectedFeed={selectedFeeds[0] || null} />
      <SidebarInset>
        <ArticleList
          feedIds={selectedFeeds.map(feed => feed.id)}
          feedName={selectedFeeds.length === 1 ? selectedFeeds[0].name : "Selected Feeds"}
          feedDescription={selectedFeeds.length === 1 ? selectedFeeds[0].description || "" : "Articles from selected feeds"}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}

