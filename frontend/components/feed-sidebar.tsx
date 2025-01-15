/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react'
import { Feed } from '@/types/feed'
import { getFeeds } from '@/lib/api'
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Edit } from 'lucide-react'
import { AddFeedDialog } from './add-feed-dialog'
import { EditFeedsWidget } from './edit-feeds-widget'

interface FeedSidebarProps {
  onFeedSelect: (feed: Feed) => void
}

export function FeedSidebar({ onFeedSelect }: FeedSidebarProps) {
  const [feeds, setFeeds] = useState<Feed[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditWidgetOpen, setIsEditWidgetOpen] = useState(false)

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
    // If you need to perform any additional actions after updating feeds, do it here
  }

  const filteredFeeds = feeds.filter(feed =>
    feed.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (feed.category && feed.category.toLowerCase().includes(searchTerm.toLowerCase()))
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
                {filteredFeeds.map((feed) => (
                  <SidebarMenuItem key={feed.id}>
                    <SidebarMenuButton asChild onClick={() => onFeedSelect(feed)}>
                      <button className="flex-grow text-left">{feed.name}</button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
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

