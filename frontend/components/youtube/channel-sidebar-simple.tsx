/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Channel } from "@/types/youtube"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Inbox, ChevronRight, ChevronDown, Folder, Star, Heart, Minus } from "lucide-react"
import { AddChannelDialog } from "./add-channel-dialog"
import { EditChannelsWidget } from "./edit-channels-widget"
import Image from "next/image"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toggleChannelFavorite } from "@/lib/youtube-api"
import { useToast } from "@/hooks/use-toast"
import { getAllCategories } from "@/lib/category-service"
import type { CategoryOut } from "@/types/category"

interface ChannelSidebarProps {
  onChannelSelect: (channel: Channel | null) => void
  onCategorySelect: (category: string | null) => void
  onFavoritesSelect: (selected: boolean) => void
  selectedChannel: Channel | null
  selectedCategory: string | null
  selectedFavorites: boolean
  onChannelsUpdate: (updatedChannels: Channel[]) => void
  channels: Channel[]
  isLoading: boolean
}

interface GroupedChannels {
  [key: string]: Channel[]
}

export function ChannelSidebarSimple({
  onChannelSelect,
  onCategorySelect,
  onFavoritesSelect,
  selectedChannel,
  selectedCategory,
  selectedFavorites,
  onChannelsUpdate,
  channels,
  isLoading,
}: ChannelSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditWidgetOpen, setIsEditWidgetOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [allCategories, setAllCategories] = useState<CategoryOut[]>([])
  const { toast } = useToast()

  useEffect(() => {
    // Fetch all categories when the component mounts
    const fetchCategories = async () => {
      try {
        const categories = await getAllCategories()
        setAllCategories(categories)
      } catch (error) {
        console.error("Failed to fetch categories:", error)
      }
    }

    fetchCategories()
  }, [])

  // Filter channels based on search term
  const getFilteredChannels = () => {
    if (searchTerm.trim() === "") {
      return channels
    } else {
      const term = searchTerm.toLowerCase()
      return channels.filter(
        (channel) =>
          channel.title.toLowerCase().includes(term) ||
          channel.categories.some((cat) => cat.name.toLowerCase().includes(term)),
      )
    }
  }

  // Get favorite channels
  const getFavoriteChannels = () => {
    return channels.filter((channel) => channel.is_favorited)
  }

  const handleAddChannel = (newChannel: Channel) => {
    onChannelsUpdate([...channels, newChannel])
  }

  const handleChannelsUpdate = (updatedChannels: Channel[]) => {
    onChannelsUpdate(updatedChannels)
    // If the currently selected channel was deleted, reset the selection
    if (selectedChannel && !updatedChannels.find((channel) => channel.id === selectedChannel.id)) {
      onChannelSelect(null)
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

  const handleToggleFavorite = async (channel: Channel, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      const updatedChannel = await toggleChannelFavorite(channel.id, !channel.is_favorited)

      // Update the channels list with the updated channel
      const updatedChannels = channels.map((c) => (c.id === updatedChannel.id ? updatedChannel : c))

      onChannelsUpdate(updatedChannels)

      toast({
        title: updatedChannel.is_favorited ? "Channel favorited" : "Channel unfavorited",
        description: `${updatedChannel.title} has been ${updatedChannel.is_favorited ? "added to" : "removed from"} your favorites.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorite status. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Group channels by category
  const getGroupedChannels = () => {
    const filtered = getFilteredChannels()
    const grouped: GroupedChannels = {}

    filtered.forEach((channel) => {
      channel.categories.forEach((category) => {
        const categoryName = category.name

        if (!grouped[categoryName]) {
          grouped[categoryName] = []
        }

        if (!grouped[categoryName].find((c) => c.id === channel.id)) {
          grouped[categoryName].push(channel)
        }
      })
    })

    return grouped
  }

  const getUncategorizedChannels = () => {
    return getFilteredChannels().filter((channel) => channel.categories.length === 0)
  }

  const renderSkeletonItems = () => (
    <div className="space-y-3 px-3 py-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center space-x-3">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  )

  const groupedChannels = getGroupedChannels()
  const uncategorizedChannels = getUncategorizedChannels()
  const favoriteChannelsList = getFavoriteChannels()

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">YouTube Channels</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" onClick={() => setIsEditWidgetOpen(true)} title="Edit channels">
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit channels</span>
            </Button>
            <Button variant="outline" size="icon" onClick={() => setIsAddDialogOpen(true)} title="Add new channel">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add new channel</span>
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder="Search channels..."
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
              onChannelSelect(null)
              onCategorySelect(null)
              onFavoritesSelect(false)
            }}
            className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
              !selectedChannel && !selectedCategory && !selectedFavorites
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50"
            }`}
          >
            <Inbox className="mr-2 h-4 w-4" />
            <span className="font-medium">All Channels</span>
          </button>

          <button
            onClick={() => {
              onChannelSelect(null)
              onCategorySelect(null)
              onFavoritesSelect(true)
            }}
            className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
              selectedFavorites ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
            }`}
          >
            <Star className="mr-2 h-4 w-4" />
            <span className="font-medium">Favorite Videos</span>
          </button>
        </div>

        <Separator className="my-2" />

        {/* Loading State */}
        {isLoading ? (
          renderSkeletonItems()
        ) : (
          <>
            {/* Favorite Channels */}
            {favoriteChannelsList.length > 0 && (
              <>
                <div className="text-xs font-medium text-muted-foreground px-3 py-1">Favorite Channels</div>
                <div className="space-y-1 mt-1">
                  {favoriteChannelsList.map((channel) => (
                    <div key={channel.id} className="flex items-center">
                      <button
                        onClick={() => onChannelSelect(channel)}
                        className={`flex-1 flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                          selectedChannel?.id === channel.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                        }`}
                      >
                        <div className="flex-shrink-0 mr-2 relative">
                          <Image
                            src={channel.thumbnail_url || "/placeholder.svg"}
                            alt={`${channel.title} icon`}
                            width={24}
                            height={24}
                            className="rounded-full object-cover"
                          />
                          {channel.is_favorited && (
                            <div className="absolute -top-1 -right-1 bg-background rounded-full p-0.5">
                              <Heart className="h-2.5 w-2.5 fill-red-500 text-red-500" />
                            </div>
                          )}
                        </div>
                        <span className="truncate">{channel.title}</span>
                        {channel.total_videos > 0 && (
                          <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                            {channel.total_videos}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={(e) => handleToggleFavorite(channel, e)}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-accent/50 hover:opacity-100 opacity-0 transition-opacity"
                        title="Remove from favorites"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <Separator className="my-2" />
              </>
            )}

            {/* Categories */}
            {Object.entries(groupedChannels).map(([category, categoryChannels]) => (
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
                    <Badge variant="outline" className="ml-2 text-xs">
                      {categoryChannels.length}
                    </Badge>
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
                    {categoryChannels.map((channel) => (
                      <div key={channel.id} className="flex items-center group">
                        <button
                          onClick={() => onChannelSelect(channel)}
                          className={`flex-1 flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                            selectedChannel?.id === channel.id
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent/50"
                          }`}
                        >
                          <div className="flex-shrink-0 mr-2 relative">
                            <Image
                              src={channel.thumbnail_url || "/placeholder.svg"}
                              alt={`${channel.title} icon`}
                              width={24}
                              height={24}
                              className="rounded-full object-cover"
                            />
                            {channel.is_favorited && (
                              <div className="absolute -top-1 -right-1 bg-background rounded-full p-0.5">
                                <Heart className="h-2.5 w-2.5 fill-red-500 text-red-500" />
                              </div>
                            )}
                          </div>
                          <span className="truncate">{channel.title}</span>
                          {channel.total_videos > 0 && (
                            <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                              {channel.total_videos}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={(e) => handleToggleFavorite(channel, e)}
                          className={`p-1.5 rounded-md ${channel.is_favorited ? "text-red-500" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
                        >
                          <Heart className={`h-4 w-4 ${channel.is_favorited ? "fill-red-500" : ""}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}

            {/* Uncategorized Channels */}
            {uncategorizedChannels.length > 0 && (
              <>
                <Separator className="my-2" />
                <div className="text-xs font-medium text-muted-foreground px-3 py-1">Uncategorized</div>
                <div className="space-y-1 mt-1">
                  {uncategorizedChannels.map((channel) => (
                    <div key={channel.id} className="flex items-center group">
                      <button
                        onClick={() => onChannelSelect(channel)}
                        className={`flex-1 flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                          selectedChannel?.id === channel.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                        }`}
                      >
                        <div className="flex-shrink-0 mr-2 relative">
                          <Image
                            src={channel.thumbnail_url || "/placeholder.svg"}
                            alt={`${channel.title} icon`}
                            width={24}
                            height={24}
                            className="rounded-full object-cover"
                          />
                          {channel.is_favorited && (
                            <div className="absolute -top-1 -right-1 bg-background rounded-full p-0.5">
                              <Heart className="h-2.5 w-2.5 fill-red-500 text-red-500" />
                            </div>
                          )}
                        </div>
                        <span className="truncate">{channel.title}</span>
                        {channel.total_videos > 0 && (
                          <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                            {channel.total_videos}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={(e) => handleToggleFavorite(channel, e)}
                        className={`p-1.5 rounded-md ${channel.is_favorited ? "text-red-500" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
                      >
                        <Heart className={`h-4 w-4 ${channel.is_favorited ? "fill-red-500" : ""}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <AddChannelDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddChannel={handleAddChannel}
      />
      <EditChannelsWidget
        isOpen={isEditWidgetOpen}
        onClose={() => setIsEditWidgetOpen(false)}
        onChannelsUpdate={handleChannelsUpdate}
      />
    </div>
  )
}

