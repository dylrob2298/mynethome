export interface CategoryOut {
  id: number
  name: string
}

export interface Channel {
  id: string
  title: string
  handle: string | null
  description: string | null
  uploads_id: string
  thumbnail_url: string | null
  created_at: string
  last_updated: string
  is_favorited: boolean
  total_videos: number
  categories: CategoryOut[]
}

export interface Video {
  id: string
  title: string
  description: string | null
  channel_id: string
  thumbnail_url: string | null
  published_at: string
  created_at: string
  last_updated: string
  is_favorited: boolean
}

export interface VideoSearchResponse {
  videos: Video[]
  total_count: number
}

export interface ChannelAdd {
  handle: string
  categories?: string[]
}

export interface ChannelUpdate {
  title?: string | null
  description?: string | null
  is_favorited?: boolean | null
}

export interface VideoUpdate {
  title?: string | null
  description?: string | null
  is_favorited?: boolean | null
}

export interface VideoSearchParams {
  channel_ids?: string[]
  title?: string
  description?: string
  is_favorited?: boolean
  order_by?: "created_at" | "last_updated" | "published_at" | "title"
  limit?: number
  offset?: number
}

export interface ChannelSearchParams {
  title?: string
  categories?: string[]
  order_by?: "created_at" | "last_updated" | "title"
  limit?: number
  offset?: number
}

