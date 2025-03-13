"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/page-layout"
import { VideoList } from "@/components/youtube/video-list"
import { ChannelSidebarSimple } from "@/components/youtube/channel-sidebar-simple"
import type { Channel } from "@/types/youtube"
import { getChannels } from "@/lib/youtube-api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2 } from "lucide-react"

export default function YouTubePage() {
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [allChannels, setAllChannels] = useState<Channel[]>([])
  const [selectedFavorites, setSelectedFavorites] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchAllChannels()
  }, [])

  const fetchAllChannels = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const channels = await getChannels()
      setAllChannels(channels)
    } catch (error) {
      console.error("Failed to fetch channels:", error)
      setError("Failed to load channels. Please try again.")
      toast({
        title: "Error",
        description: "Failed to load channels. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChannelSelect = (channel: Channel | null) => {
    setSelectedCategory(null)
    setSelectedFavorites(false)
    if (channel) {
      setSelectedChannels([channel])
    } else {
      setSelectedChannels([]) // This will show all channels
    }
  }

  const handleCategorySelect = (category: string | null) => {
    setSelectedChannels([])
    setSelectedFavorites(false)
    setSelectedCategory(category)
  }

  const handleFavoritesSelect = (showFavorites: boolean) => {
    setSelectedChannels([])
    setSelectedCategory(null)
    setSelectedFavorites(showFavorites)
  }

  const handleChannelsUpdate = (updatedChannels: Channel[]) => {
    setAllChannels(updatedChannels)
    // If any of the selected channels were deleted, remove them from the selection
    setSelectedChannels((prevSelected) =>
      prevSelected.filter((channel) => updatedChannels.some((updatedChannel) => updatedChannel.id === channel.id)),
    )
  }

  const getSelectedChannelIds = () => {
    if (selectedFavorites) {
      return [] // We'll fetch all favorite videos regardless of channel
    }
    if (selectedCategory) {
      const categoryChannelIds = allChannels
        .filter((channel) => channel.categories.some((cat) => cat.name === selectedCategory))
        .map((channel) => channel.id)
      return categoryChannelIds
    }

    const channelIds =
      selectedChannels.length > 0
        ? selectedChannels.map((channel) => channel.id)
        : allChannels.map((channel) => channel.id)

    return channelIds
  }

  const getChannelName = () => {
    if (selectedFavorites) return "Favorite Videos"
    if (selectedCategory) return selectedCategory
    if (selectedChannels.length === 1) return selectedChannels[0].title
    return "All YouTube Channels"
  }

  const getChannelDescription = () => {
    if (selectedFavorites) return "Your favorite videos from all channels"
    if (selectedCategory) return `Videos from all channels in ${selectedCategory}`
    if (selectedChannels.length === 1) {
      const channel = selectedChannels[0]
      const videoCount = channel.total_videos > 0 ? `${channel.total_videos} videos` : "No videos"
      return channel.description ? `${channel.description} • ${videoCount}` : videoCount
    }
    return "Videos from all your subscribed YouTube channels"
  }

  // Create sidebar and content components for the layout
  const sidebar = (
    <ChannelSidebarSimple
      onChannelSelect={handleChannelSelect}
      onCategorySelect={handleCategorySelect}
      onFavoritesSelect={handleFavoritesSelect}
      selectedChannel={selectedChannels[0] || null}
      selectedCategory={selectedCategory}
      selectedFavorites={selectedFavorites}
      onChannelsUpdate={handleChannelsUpdate}
      channels={allChannels}
      isLoading={isLoading}
    />
  )

  const content = error ? (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <p className="text-lg mb-4">{error}</p>
      <Button onClick={fetchAllChannels} className="flex items-center gap-2" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Try Again"}
      </Button>
    </div>
  ) : (
    <VideoList
      channelIds={getSelectedChannelIds()}
      channelName={getChannelName()}
      channelDescription={getChannelDescription()}
      showFavorites={selectedFavorites}
    />
  )

  return <PageLayout sidebar={sidebar} content={content} />
}

