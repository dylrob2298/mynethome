/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Channel } from "@/types/youtube"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarMenuAction,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Inbox, ChevronRight, ChevronDown, Folder, Star, Heart } from "lucide-react"
import { AddChannelDialog } from "./add-channel-dialog"
import { EditChannelsWidget } from "./edit-channels-widget"
import Image from "next/image"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toggleChannelFavorite } from "@/lib/youtube-api"
import { useToast } from "@/hooks/use-toast"

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

export function ChannelSidebar({
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
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([])
  const [favoriteChannels, setFavoriteChannels] = useState<Channel[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredChannels(channels)
    } else {
      const term = searchTerm.toLowerCase()
      setFilteredChannels(
        channels.filter(
          (channel) =>
            channel.title.toLowerCase().includes(term) ||
            channel.categories.some((cat) => cat.name.toLowerCase().includes(term)),
        ),
      )
    }

    // Filter favorite channels
    setFavoriteChannels(channels.filter((channel) => channel.is_favorited))
  }, [searchTerm, channels])

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
  const groupedChannels: GroupedChannels = {}
  const categoryNames = new Set<string>()

  filteredChannels.forEach((channel) => {
    channel.categories.forEach((category) => {
      const categoryName = category.name
      categoryNames.add(categoryName)

      if (!groupedChannels[categoryName]) {
        groupedChannels[categoryName] = []
      }

      if (!groupedChannels[categoryName].find((c) => c.id === channel.id)) {
        groupedChannels[categoryName].push(channel)
      }
    })
  })

  const uncategorizedChannels = filteredChannels.filter((channel) => channel.categories.length === 0)

  const renderChannelItem = (channel: Channel) => (
    <SidebarMenuItem key={channel.id}>
      <SidebarMenuButton
        asChild
        onClick={() => onChannelSelect(channel)}
        className={`w-full justify-start ${selectedChannel?.id === channel.id ? "bg-accent text-accent-foreground" : ""}`}
      >
        <button className="flex items-center w-full text-left py-2 px-3 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
          <div className="flex-shrink-0 mr-3 relative">
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
          <span className="truncate max-w-[150px]">{channel.title}</span>
          {channel.total_videos > 0 && (
            <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
              {channel.total_videos}
            </span>
          )}
        </button>
      </SidebarMenuButton>
      <SidebarMenuAction
        onClick={(e) => handleToggleFavorite(channel, e)}
        showOnHover={!channel.is_favorited}
        className={channel.is_favorited ? "text-red-500" : ""}
        title={channel.is_favorited ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart className={`h-4 w-4 ${channel.is_favorited ? "fill-red-500" : ""}`} />
      </SidebarMenuAction>
    </SidebarMenuItem>
  )

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

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold truncate">YouTube Channels</h2>
          <div className="flex space-x-2 flex-shrink-0">
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
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Your Channels</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  onClick={() => {
                    onChannelSelect(null)
                    onCategorySelect(null)
                    onFavoritesSelect(false)
                  }}
                  className={`w-full justify-start ${!selectedChannel && !selectedCategory && !selectedFavorites ? "bg-accent text-accent-foreground" : ""}`}
                >
                  <button className="flex items-center w-full text-left py-2 px-3 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Inbox className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="font-medium truncate">All Channels</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  onClick={() => {
                    onChannelSelect(null)
                    onCategorySelect(null)
                    onFavoritesSelect(true)
                  }}
                  className={`w-full justify-start ${selectedFavorites ? "bg-accent text-accent-foreground" : ""}`}
                >
                  <button className="flex items-center w-full text-left py-2 px-3 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Star className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="font-medium truncate">Favorite Videos</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {favoriteChannels.length > 0 && (
                <>
                  <SidebarSeparator />
                  <SidebarGroupLabel>Favorite Channels</SidebarGroupLabel>
                  {favoriteChannels.map(renderChannelItem)}
                </>
              )}

              <SidebarSeparator />

              {isLoading ? (
                renderSkeletonItems()
              ) : (
                <>
                  {Object.entries(groupedChannels).map(([category, categoryChannels]) => (
                    <Collapsible key={category} open={expandedCategories.has(category)}>
                      <SidebarMenuButton
                        className={`w-full justify-start px-0 ${selectedCategory === category ? "bg-accent text-accent-foreground" : ""}`}
                        onClick={() => onCategorySelect(category)}
                      >
                        <button className="flex items-center justify-between w-full text-left py-2 px-3 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                          <div className="flex items-center min-w-0">
                            <Folder className="mr-2 h-4 w-4 flex-shrink-0" />
                            <span className="font-medium truncate">{category}</span>
                            <Badge variant="outline" className="ml-2 text-xs flex-shrink-0">
                              {categoryChannels.length}
                            </Badge>
                          </div>
                          <CollapsibleTrigger asChild onClick={(e) => toggleCategory(category, e)}>
                            <button className="p-1 rounded-sm hover:bg-accent-foreground/10 flex-shrink-0">
                              {expandedCategories.has(category) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </CollapsibleTrigger>
                        </button>
                      </SidebarMenuButton>
                      <CollapsibleContent>{categoryChannels.map(renderChannelItem)}</CollapsibleContent>
                    </Collapsible>
                  ))}

                  {uncategorizedChannels.length > 0 && (
                    <>
                      <SidebarSeparator />
                      <SidebarGroupLabel>Uncategorized</SidebarGroupLabel>
                      {uncategorizedChannels.map(renderChannelItem)}
                    </>
                  )}
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
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
    </Sidebar>
  )
}

