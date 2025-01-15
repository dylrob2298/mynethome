'use client'

import { useState, useEffect } from 'react'
import { FeedSidebar } from '@/components/feed-sidebar'
import { ArticleList } from '@/components/article-list'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Feed } from '@/types/feed'
import { getFeeds } from '@/lib/api'

export default function Home() {
  const [selectedFeeds, setSelectedFeeds] = useState<Feed[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [allFeeds, setAllFeeds] = useState<Feed[]>([])

  useEffect(() => {
    const fetchAllFeeds = async () => {
      const feeds = await getFeeds()
      setAllFeeds(feeds)
    }
    fetchAllFeeds()
  }, [])

  const handleFeedSelect = (feed: Feed | null) => {
    setSelectedCategory(null)
    if (feed) {
      setSelectedFeeds([feed])
    } else {
      setSelectedFeeds([]) // This will show all feeds
    }
  }

  const handleCategorySelect = (category: string | null) => {
    setSelectedFeeds([])
    setSelectedCategory(category)
  }

  const handleFeedsUpdate = (updatedFeeds: Feed[]) => {
    setAllFeeds(updatedFeeds)
    // If any of the selected feeds were deleted, remove them from the selection
    setSelectedFeeds(prevSelected => 
      prevSelected.filter(feed => updatedFeeds.some(updatedFeed => updatedFeed.id === feed.id))
    )
  }

  const getSelectedFeedIds = () => {
    if (selectedCategory) {
      return allFeeds
        .filter(feed => feed.category === selectedCategory)
        .map(feed => feed.id)
    }
    return selectedFeeds.length > 0 ? selectedFeeds.map(feed => feed.id) : allFeeds.map(feed => feed.id)
  }

  const getFeedName = () => {
    if (selectedCategory) return selectedCategory
    if (selectedFeeds.length === 1) return selectedFeeds[0].name
    return "All Feeds"
  }

  const getFeedDescription = () => {
    if (selectedCategory) return `Articles from all feeds in ${selectedCategory}`
    if (selectedFeeds.length === 1) return selectedFeeds[0].description || "No description available"
    return "Articles from all your subscribed feeds"
  }

  return (
    <SidebarProvider>
      <FeedSidebar 
        onFeedSelect={handleFeedSelect} 
        onCategorySelect={handleCategorySelect}
        selectedFeed={selectedFeeds[0] || null} 
        selectedCategory={selectedCategory}
        onFeedsUpdate={handleFeedsUpdate}
        feeds={allFeeds}
      />
      <SidebarInset>
        <ArticleList
          feedIds={getSelectedFeedIds()}
          feedName={getFeedName()}
          feedDescription={getFeedDescription()}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}

