'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Sidebar, SidebarContent, SidebarHeader, SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Search, Inbox, Plus, ChevronRight, ChevronDown, Folder } from 'lucide-react'
import { Feed } from '@/types/feed'

interface FeedSidebarProps {
  feeds: Feed[]
  selectedFeed: string | null
  selectedFolder: string | null
  onSelectFeed: (feedId: string | null) => void
  onSelectFolder: (folder: string | null) => void
  onAddFeed: () => void
}

export function FeedSidebar({ 
  feeds, 
  selectedFeed, 
  selectedFolder,
  onSelectFeed, 
  onSelectFolder,
  onAddFeed 
}: FeedSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const filteredFeeds = feeds.filter(feed => 
    feed.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (feed.category && feed.category.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const groupedFeeds = filteredFeeds.reduce((acc, feed) => {
    if (feed.category) {
      if (!acc[feed.category]) {
        acc[feed.category] = []
      }
      acc[feed.category].push(feed)
    } else {
      if (!acc['uncategorized']) {
        acc['uncategorized'] = []
      }
      acc['uncategorized'].push(feed)
    }
    return acc
  }, {} as Record<string, Feed[]>)

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folder)) {
        newSet.delete(folder)
      } else {
        newSet.add(folder)
      }
      return newSet
    })
  }

  return (
    <Sidebar className="bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <SidebarHeader className="px-4 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <SidebarTrigger />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">RSS Feeds</h2>
          </div>
          <Button variant="outline" size="icon" onClick={onAddFeed} title="Add new feed">
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add new feed</span>
          </Button>
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
        <ScrollArea className="h-[calc(100vh-120px)]">
          <Button
            variant={selectedFolder === null && selectedFeed === null ? 'secondary' : 'ghost'}
            className="w-full justify-start mb-2 text-gray-700 dark:text-gray-300"
            onClick={() => {
              onSelectFolder(null)
              onSelectFeed(null)
            }}
          >
            <Inbox className="mr-2 h-4 w-4" />
            All Feeds
          </Button>
          {groupedFeeds['uncategorized'] && groupedFeeds['uncategorized'].map((feed) => (
            <Button
              key={feed.id}
              variant={selectedFeed === feed.id ? 'secondary' : 'ghost'}
              className="w-full justify-start mb-1 text-gray-700 dark:text-gray-300"
              onClick={() => {
                onSelectFeed(feed.id)
                onSelectFolder(null)
              }}
            >
              {feed.iconUrl ? (
                <Image
                  src={feed.iconUrl}
                  alt={`${feed.name} icon`}
                  width={16}
                  height={16}
                  className="mr-2 rounded-sm"
                />
              ) : (
                <div className="w-4 h-4 mr-2 bg-gray-300 dark:bg-gray-600 rounded-sm" />
              )}
              {feed.name}
            </Button>
          ))}
          {Object.entries(groupedFeeds).filter(([folder]) => folder !== 'uncategorized').map(([folder, folderFeeds]) => (
            <div key={folder}>
              <Button
                variant={selectedFolder === folder ? 'secondary' : 'ghost'}
                className="w-full justify-start mb-1 text-gray-700 dark:text-gray-300"
                onClick={() => {
                  toggleFolder(folder)
                  onSelectFolder(folder)
                  onSelectFeed(null)
                }}
              >
                {expandedFolders.has(folder) ? (
                  <ChevronDown className="mr-2 h-4 w-4" />
                ) : (
                  <ChevronRight className="mr-2 h-4 w-4" />
                )}
                <Folder className="mr-2 h-4 w-4" />
                {folder}
              </Button>
              {expandedFolders.has(folder) && (
                <div className="ml-6">
                  {folderFeeds.map((feed) => (
                    <Button
                      key={feed.id}
                      variant={selectedFeed === feed.id ? 'secondary' : 'ghost'}
                      className="w-full justify-start mb-1 text-gray-700 dark:text-gray-300"
                      onClick={() => {
                        onSelectFeed(feed.id)
                        onSelectFolder(null)
                      }}
                    >
                      {feed.iconUrl ? (
                        <Image
                          src={feed.iconUrl}
                          alt={`${feed.name} icon`}
                          width={16}
                          height={16}
                          className="mr-2 rounded-sm"
                        />
                      ) : (
                        <div className="w-4 h-4 mr-2 bg-gray-300 dark:bg-gray-600 rounded-sm" />
                      )}
                      {feed.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  )
}

