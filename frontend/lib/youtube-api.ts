import type {
  Channel,
  ChannelAdd,
  ChannelUpdate,
  VideoUpdate,
  VideoSearchParams,
  ChannelSearchParams,
  VideoSearchResponse,
  Video,
} from "@/types/youtube"
import { getAllCategories } from "@/lib/category-service"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Helper function to ensure channel has categories array
function ensureChannelCategories(channel: Channel): Channel {
  return {
    ...channel,
    categories: Array.isArray(channel.categories) ? channel.categories : [],
  }
}

export async function getChannels(params?: ChannelSearchParams): Promise<Channel[]> {
  const searchParams = new URLSearchParams()

  if (params?.title) searchParams.append("title", params.title)
  if (params?.categories && params.categories.length > 0) {
    params.categories.forEach((category) => {
      searchParams.append("categories", category)
    })
  }
  if (params?.order_by) searchParams.append("order_by", params.order_by)
  if (params?.limit) searchParams.append("limit", params.limit.toString())
  if (params?.offset) searchParams.append("offset", params.offset.toString())

  try {
    const response = await fetch(`${API_BASE_URL}/youtube/channels/?${searchParams.toString()}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.detail || "Failed to fetch channels")
    }

    const channels = await response.json()
    return channels.map(ensureChannelCategories)
  } catch (error) {
    console.error("Error fetching channels:", error)
    throw error
  }
}

export async function getChannelById(channelId: string): Promise<Channel> {
  try {
    const response = await fetch(`${API_BASE_URL}/youtube/channels/${channelId}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.detail || "Failed to fetch channel")
    }

    const channel = await response.json()
    return ensureChannelCategories(channel)
  } catch (error) {
    console.error(`Error fetching channel ${channelId}:`, error)
    throw error
  }
}

export async function addChannel(channelData: ChannelAdd): Promise<Channel> {
  try {
    const response = await fetch(`${API_BASE_URL}/youtube/channels/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(channelData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.detail || "Failed to add channel")
    }

    const channel = await response.json()
    return ensureChannelCategories(channel)
  } catch (error) {
    console.error("Error adding channel:", error)
    throw error
  }
}

export async function updateChannel(channelId: string, updateData: ChannelUpdate): Promise<Channel> {
  try {
    const response = await fetch(`${API_BASE_URL}/youtube/channels/${channelId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.detail || "Failed to update channel")
    }

    const channel = await response.json()
    return ensureChannelCategories(channel)
  } catch (error) {
    console.error(`Error updating channel ${channelId}:`, error)
    throw error
  }
}

export async function toggleChannelFavorite(channelId: string, isFavorited: boolean): Promise<Channel> {
  return updateChannel(channelId, { is_favorited: isFavorited })
}

export async function deleteChannel(channelId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/youtube/channels/${channelId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.detail || "Failed to delete channel")
    }
  } catch (error) {
    console.error(`Error deleting channel ${channelId}:`, error)
    throw error
  }
}

export async function getVideos(params?: VideoSearchParams): Promise<VideoSearchResponse> {
  const searchParams = new URLSearchParams()

  if (params?.channel_ids && params.channel_ids.length > 0) {
    params.channel_ids.forEach((id) => {
      searchParams.append("channel_ids", id)
    })
  }
  if (params?.title) searchParams.append("title", params.title)
  if (params?.description) searchParams.append("description", params.description)
  if (params?.is_favorited !== undefined) searchParams.append("is_favorited", params.is_favorited.toString())
  if (params?.order_by) searchParams.append("order_by", params.order_by)
  if (params?.limit) searchParams.append("limit", params.limit.toString())
  if (params?.offset) searchParams.append("offset", params.offset.toString())

  try {
    const response = await fetch(`${API_BASE_URL}/youtube/videos/?${searchParams.toString()}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.detail || "Failed to fetch videos")
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching videos:", error)
    throw error
  }
}

export async function updateVideo(videoId: string, updateData: VideoUpdate): Promise<Video> {
  try {
    const response = await fetch(`${API_BASE_URL}/youtube/videos/${videoId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.detail || "Failed to update video")
    }

    return response.json()
  } catch (error) {
    console.error(`Error updating video ${videoId}:`, error)
    throw error
  }
}

export async function toggleVideoFavorite(videoId: string, isFavorited: boolean): Promise<Video> {
  return updateVideo(videoId, { is_favorited: isFavorited })
}

export async function getAllChannelIds(): Promise<string[]> {
  try {
    const channels = await getChannels()
    return channels.map((channel) => channel.id)
  } catch (error) {
    console.error("Error getting all channel IDs:", error)
    throw error
  }
}

export async function getCategoryNames(): Promise<string[]> {
  try {
    // Use the getAllCategories function from category-service instead
    const categories = await getAllCategories()
    return categories.map((category) => category.name)
  } catch (error) {
    console.error("Error getting category names:", error)
    throw error
  }
}

