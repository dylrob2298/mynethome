/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react'
import { Feed } from '@/types/feed'
import { getFeeds } from '@/lib/api'
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Edit, Inbox, ChevronRight, ChevronDown, Folder } from 'lucide-react'
import { AddFeedDialog } from './add-feed-dialog'
import { EditFeedsWidget } from './edit-feeds-widget'
import Image from 'next/image'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface FeedSidebarProps {
  onFeedSelect: (feed: Feed | null) => void
  selectedFeed: Feed | null
}

interface GroupedFeeds {
  [key: string]: Feed[]
}

export function FeedSidebar({ onFeedSelect, selectedFeed }: FeedSidebarProps) {
  const [feeds, setFeeds] = useState<Feed[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditWidgetOpen, setIsEditWidgetOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchFeeds()
  }, [])

  const fetchFeeds = async () => {
    try {
      setIsLoading(true)
      const fetchedFeeds = await getFeeds()
      setFeeds(fetchedFeeds)
      setError(null)
    } catch (err) {
      setError('Failed to fetch feeds')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFeed = (newFeed: Feed) => {
    setFeeds([...feeds, newFeed])
  }

  const handleFeedsUpdate = (updatedFeeds: Feed[]) => {
    setFeeds(updatedFeeds)
  }

  const getFaviconUrl = (feedUrl: string) => {
    try {
      const url = new URL(feedUrl)
      return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`
    } catch (error) {
      console.error('Invalid URL:', feedUrl)
      return '/placeholder.svg'
    }
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  const filteredFeeds = feeds.filter(feed =>
    feed.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (feed.category && feed.category.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const uncategorizedFeeds = filteredFeeds.filter(feed => !feed.category)

  const renderFeedItem = (feed: Feed) => (
    <SidebarMenuItem key={feed.id}>
      <SidebarMenuButton
        asChild
        onClick={() => onFeedSelect(feed)}
        className={`w-full justify-start ${selectedFeed?.id === feed.id ? 'bg-accent text-accent-foreground' : ''}`}
      >
        <button className="flex items-center w-full text-left py-2 px-3 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
          <div className="flex-shrink-0 mr-3">
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
      </SidebarMenuButton>
    </SidebarMenuItem>
  )

  return (
    <Sidebar>
      <SidebarHeader>
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
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? (
          <p>Loading feeds...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel>Your Feeds</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    onClick={() => onFeedSelect(null)}
                    className={`w-full justify-start ${!selectedFeed ? 'bg-accent text-accent-foreground' : ''}`}
                  >
                    <button className="flex items-center w-full text-left py-2 px-3 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                      <Inbox className="mr-2 h-4 w-4" />
                      <span className="font-medium">All Feeds</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarSeparator />
                {Object.entries(groupedFeeds).map(([category, categoryFeeds]) => (
                  <Collapsible
                    key={category}
                    open={expandedCategories.has(category)}
                    onOpenChange={() => toggleCategory(category)}
                  >
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="w-full justify-start">
                        <button className="flex items-center w-full text-left py-2 px-3 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                          {expandedCategories.has(category) ? (
                            <ChevronDown className="mr-2 h-4 w-4" />
                          ) : (
                            <ChevronRight className="mr-2 h-4 w-4" />
                          )}
                          <Folder className="mr-2 h-4 w-4" />
                          <span className="font-medium">{category}</span>
                        </button>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {categoryFeeds.map(renderFeedItem)}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
                {uncategorizedFeeds.length > 0 && (
                  <>
                    <SidebarSeparator />
                    {/* <SidebarGroupLabel>Uncategorized</SidebarGroupLabel> */}
                    {uncategorizedFeeds.map(renderFeedItem)}
                  </>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <AddFeedDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddFeed={handleAddFeed}
      />
      <EditFeedsWidget
        isOpen={isEditWidgetOpen}
        onClose={() => setIsEditWidgetOpen(false)}
        onFeedsUpdate={handleFeedsUpdate}
      />
    </Sidebar>
  )
}

