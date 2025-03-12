/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import type React from "react"

import { useState } from "react"
import type { Feed } from "@/types/feed"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Inbox, ChevronRight, ChevronDown, Folder, Star } from "lucide-react"
import { AddFeedDialog } from "./add-feed-dialog"
import { EditFeedsWidget } from "./edit-feeds-widget"
import Image from "next/image"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"

interface FeedSidebarProps {
  onFeedSelect: (feed: Feed | null) => void
  onCategorySelect: (category: string | null) => void
  onFavoritesSelect: (selected: boolean) => void
  selectedFeed: Feed | null
  selectedCategory: string | null
  selectedFavorites: boolean
  onFeedsUpdate: (updatedFeeds: Feed[]) => void
  feeds: Feed[]
}

interface GroupedFeeds {
  [key: string]: Feed[]
}

export function FeedSidebar({
  onFeedSelect,
  onCategorySelect,
  onFavoritesSelect,
  selectedFeed,
  selectedCategory,
  selectedFavorites,
  onFeedsUpdate,
  feeds,
}: FeedSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditWidgetOpen, setIsEditWidgetOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const handleAddFeed = (newFeed: Feed) => {
    onFeedsUpdate([...feeds, newFeed])
  }

  const handleFeedsUpdate = (updatedFeeds: Feed[]) => {
    onFeedsUpdate(updatedFeeds)
    // If the currently selected feed was deleted, reset the selection
    if (selectedFeed && !updatedFeeds.find((feed) => feed.id === selectedFeed.id)) {
      onFeedSelect(null)
    }
  }

  const getFaviconUrl = (feedUrl: string) => {
    try {
      const url = new URL(feedUrl)
      return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`
    } catch (error) {
      console.error("Invalid URL:", feedUrl)
      return "/placeholder.svg"
    }
  }

  const toggleCategory = (category: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  const filteredFeeds = feeds.filter(
    (feed) =>
      feed.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (feed.category && feed.category.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const groupedFeeds = filteredFeeds.reduce((acc: GroupedFeeds, feed) => {
    if (feed.category) {
      if (!acc[feed.category]) {
        acc[feed.category] = []
      }
      acc[feed.category].push(feed)
    }
    return acc
  }, {})

  const uncategorizedFeeds = filteredFeeds.filter((feed) => !feed.category)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">RSS Feeds</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={() => setIsEditWidgetOpen(true)} title="Edit feeds">
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit feeds</span>
            </Button>
            <Button variant="outline" size="icon" onClick={() => setIsAddDialogOpen(true)} title="Add new feed">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add new feed</span>
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder="Search feeds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-2">
        <div className="space-y-1">
          <button
            onClick={() => {
              onFeedSelect(null)
              onCategorySelect(null)
              onFavoritesSelect(false)
            }}
            className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
              !selectedFeed && !selectedCategory && !selectedFavorites
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50"
            }`}
          >
            <Inbox className="mr-2 h-4 w-4" />
            <span className="font-medium">All Feeds</span>
          </button>

          <button
            onClick={() => {
              onFeedSelect(null)
              onCategorySelect(null)
              onFavoritesSelect(true)
            }}
            className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
              selectedFavorites ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
            }`}
          >
            <Star className="mr-2 h-4 w-4" />
            <span className="font-medium">Favorites</span>
          </button>
        </div>

        <Separator className="my-2" />

        {/* Categories */}
        {Object.entries(groupedFeeds).map(([category, categoryFeeds]) => (
          <Collapsible key={category} open={expandedCategories.has(category)}>
            <div className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md hover:bg-accent/50">
              <button
                onClick={() => onCategorySelect(category)}
                className={`flex items-center flex-1 ${
                  selectedCategory === category ? "font-medium text-accent-foreground" : ""
                }`}
              >
                <Folder className="mr-2 h-4 w-4" />
                <span>{category}</span>
              </button>
              <CollapsibleTrigger asChild onClick={(e) => toggleCategory(category, e)}>
                <button className="p-1 rounded-sm hover:bg-accent-foreground/10">
                  {expandedCategories.has(category) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <div className="ml-6 space-y-1 mt-1">
                {categoryFeeds.map((feed) => (
                  <button
                    key={feed.id}
                    onClick={() => onFeedSelect(feed)}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                      selectedFeed?.id === feed.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex-shrink-0 mr-2">
                      <Image
                        src={feed.image_url || getFaviconUrl(feed.url)}
                        alt={`${feed.name} icon`}
                        width={16}
                        height={16}
                        className="rounded-sm"
                      />
                    </div>
                    <span className="truncate">{feed.name}</span>
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}

        {/* Uncategorized Feeds */}
        {uncategorizedFeeds.length > 0 && (
          <>
            <Separator className="my-2" />
            <div className="text-xs font-medium text-muted-foreground px-3 py-1">Uncategorized</div>
            <div className="space-y-1 mt-1">
              {uncategorizedFeeds.map((feed) => (
                <button
                  key={feed.id}
                  onClick={() => onFeedSelect(feed)}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                    selectedFeed?.id === feed.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                  }`}
                >
                  <div className="flex-shrink-0 mr-2">
                    <Image
                      src={feed.image_url || getFaviconUrl(feed.url)}
                      alt={`${feed.name} icon`}
                      width={16}
                      height={16}
                      className="rounded-sm"
                    />
                  </div>
                  <span className="truncate">{feed.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <AddFeedDialog isOpen={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} onAddFeed={handleAddFeed} />
      <EditFeedsWidget
        isOpen={isEditWidgetOpen}
        onClose={() => setIsEditWidgetOpen(false)}
        onFeedsUpdate={handleFeedsUpdate}
      />
    </div>
  )
}

