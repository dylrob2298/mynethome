"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/page-layout"
import type { Feed } from "@/types/feed"
import { getFeeds } from "@/lib/api"

// Import components but don't wrap them in SidebarProvider
import { FeedSidebarSimple } from "@/components/feeds/feed-sidebar-simple"
import { ArticleList } from "@/components/feeds/article-list"

export default function FeedPage() {
  const [selectedFeeds, setSelectedFeeds] = useState<Feed[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [allFeeds, setAllFeeds] = useState<Feed[]>([])
  const [selectedFavorites, setSelectedFavorites] = useState(false)

  useEffect(() => {
    const fetchAllFeeds = async () => {
      const feeds = await getFeeds()
      setAllFeeds(feeds)
    }
    fetchAllFeeds()
  }, [])

  const handleFeedSelect = (feed: Feed | null) => {
    setSelectedCategory(null)
    setSelectedFavorites(false)
    if (feed) {
      setSelectedFeeds([feed])
    } else {
      setSelectedFeeds([]) // This will show all feeds
    }
  }

  const handleCategorySelect = (category: string | null) => {
    setSelectedFeeds([])
    setSelectedFavorites(false)
    setSelectedCategory(category)
  }

  const handleFavoritesSelect = (showFavorites: boolean) => {
    setSelectedFeeds([])
    setSelectedCategory(null)
    setSelectedFavorites(showFavorites)
  }

  const handleFeedsUpdate = (updatedFeeds: Feed[]) => {
    setAllFeeds(updatedFeeds)
    // If any of the selected feeds were deleted, remove them from the selection
    setSelectedFeeds((prevSelected) =>
      prevSelected.filter((feed) => updatedFeeds.some((updatedFeed) => updatedFeed.id === feed.id)),
    )
  }

  const getSelectedFeedIds = () => {
    if (selectedFavorites) {
      return [] // We'll fetch all favorite articles regardless of feed
    }
    if (selectedCategory) {
      // Find feeds that have the selected category in their categories array
      return allFeeds
        .filter((feed) => feed.categories && feed.categories.some((cat) => cat.name === selectedCategory))
        .map((feed) => feed.id)
    }
    return selectedFeeds.length > 0 ? selectedFeeds.map((feed) => feed.id) : allFeeds.map((feed) => feed.id)
  }

  const getFeedName = () => {
    if (selectedFavorites) return "Favorites"
    if (selectedCategory) return selectedCategory
    if (selectedFeeds.length === 1) return selectedFeeds[0].name
    return "All Feeds"
  }

  const getFeedDescription = () => {
    if (selectedFavorites) return "Your favorite articles from all feeds"
    if (selectedCategory) return `Articles from all feeds in ${selectedCategory}`
    if (selectedFeeds.length === 1) return selectedFeeds[0].description || "No description available"
    return "Articles from all your subscribed feeds"
  }

  // Create sidebar and content components for the layout
  const sidebar = (
    <FeedSidebarSimple
      onFeedSelect={handleFeedSelect}
      onCategorySelect={handleCategorySelect}
      onFavoritesSelect={handleFavoritesSelect}
      selectedFeed={selectedFeeds[0] || null}
      selectedCategory={selectedCategory}
      selectedFavorites={selectedFavorites}
      onFeedsUpdate={handleFeedsUpdate}
      feeds={allFeeds}
    />
  )

  const content = (
    <ArticleList
      feedIds={getSelectedFeedIds()}
      feedName={getFeedName()}
      feedDescription={getFeedDescription()}
      showFavorites={selectedFavorites}
    />
  )

  return <PageLayout sidebar={sidebar} content={content} />
}

