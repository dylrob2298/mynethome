import { Feed } from "@/types/feed";
import { Article, ArticleSearchResponse } from "@/types/article";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchWithErrorHandling(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
}

export async function getFeeds(): Promise<Feed[]> {
  return fetchWithErrorHandling(`${API_BASE_URL}/feeds/`);
}

export async function addFeed(feed: { url: string, category: string }): Promise<Feed> {
  return fetchWithErrorHandling(`${API_BASE_URL}/feeds/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(feed),
  });
}

export async function editFeed(feedId: number, updates: Partial<Feed>): Promise<Feed> {
    return fetchWithErrorHandling(`${API_BASE_URL}/feeds/${feedId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
  }

export async function getArticles(params: {
  limit?: number;
  offset?: number;
  feed_id?: number;
  is_read?: boolean;
  is_favorite?: boolean;
  order_by?: "created_at" | "last_updated";
}): Promise<ArticleSearchResponse> {
  const searchParams = new URLSearchParams(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Object.entries(params).filter(([_, value]) => value !== undefined) as [string, string][]
  );
  return fetchWithErrorHandling(`${API_BASE_URL}/articles/search?${searchParams}`);
}

export async function updateArticle(articleId: number, updates: Partial<Article>): Promise<Article> {
  return fetchWithErrorHandling(`${API_BASE_URL}/articles/${articleId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });
}

export async function refreshFeed(feedId: number): Promise<void> {
  await fetchWithErrorHandling(`${API_BASE_URL}/feeds/${feedId}/refresh`, {
    method: "POST",
  });
}

