import type { Feed } from "@/types/feed"
import type { Article, ArticleSearchResponse } from "@/types/article"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

async function fetchWithErrorHandling(url: string, options?: RequestInit) {
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`)
  }
  return response.json()
}

// Helper function to ensure feed has categories array
function ensureFeedCategories(feed: Feed): Feed {
  return {
    ...feed,
    categories: Array.isArray(feed.categories) ? feed.categories : [],
  }
}

export async function getFeeds(): Promise<Feed[]> {
  const feeds = await fetchWithErrorHandling(`${API_BASE_URL}/feeds/search`)

  // Ensure all feeds have a categories array
  return feeds.map(ensureFeedCategories)
}

export async function addFeed(feed: { url: string }): Promise<Feed> {
  const newFeed = await fetchWithErrorHandling(`${API_BASE_URL}/feeds/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(feed),
  })

  // Ensure the new feed has a categories array
  return ensureFeedCategories(newFeed)
}

export async function editFeed(feedId: number, updates: Partial<Feed>): Promise<Feed> {
  const updatedFeed = await fetchWithErrorHandling(`${API_BASE_URL}/feeds/${feedId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  })

  // Ensure the updated feed has a categories array
  return ensureFeedCategories(updatedFeed)
}

export async function deleteFeed(feedId: number): Promise<void> {
  await fetchWithErrorHandling(`${API_BASE_URL}/feeds/${feedId}`, {
    method: "DELETE",
  })
}

// Get articles with optional filtering
export async function getArticles(params: {
  limit?: number
  offset?: number
  feedIds?: number[]
  title?: string
  author?: string
  isFavorited?: boolean
  isRead?: boolean
  orderBy?: string
}): Promise<ArticleSearchResponse> {
  const queryParams = new URLSearchParams()

  if (params.limit) queryParams.append("limit", params.limit.toString())
  if (params.offset) queryParams.append("offset", params.offset.toString())
  if (params.title) queryParams.append("title", params.title)
  if (params.author) queryParams.append("author", params.author)
  if (params.isFavorited !== undefined) queryParams.append("is_favorited", params.isFavorited.toString())
  if (params.isRead !== undefined) queryParams.append("is_read", params.isRead.toString())
  if (params.orderBy) queryParams.append("order_by", params.orderBy)

  // Add feed_ids as multiple parameters
  if (params.feedIds && params.feedIds.length > 0) {
    params.feedIds.forEach((id) => queryParams.append("feed_ids", id.toString()))
  }

  return fetchWithErrorHandling(`${API_BASE_URL}/articles/search?${queryParams.toString()}`)
}

// Update article (mark as read, favorite, etc.)
export async function updateArticle(articleId: number, updates: Partial<Article>): Promise<Article> {
  return fetchWithErrorHandling(`${API_BASE_URL}/articles/${articleId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  })
}



interface RefreshFeedResponse {
  new_articles: number
  updated_articles: number
}

export async function refreshFeed(feedId: number): Promise<RefreshFeedResponse> {
  const response = await fetchWithErrorHandling(`${API_BASE_URL}/feeds/${feedId}/refresh`, {
    method: "POST",
  })
  return response
}

export async function getAllFeedIds(): Promise<number[]> {
  const feeds = await getFeeds()
  return feeds.map((feed) => feed.id)
}

