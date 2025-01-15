export interface Article {
  id: number;
  title: string;
  link: string; // Corresponding to Pydantic's HttpUrl
  author?: string | null;
  summary?: string | null;
  content?: string | null;
  image_url?: string | null; // Corresponding to Pydantic's HttpUrl
  categories?: string[] | null;
  published_at: string; // ISO format datetime
  updated_at?: string | null; // ISO format datetime
  is_favorited: boolean;
  is_read: boolean;
  created_at: string; // ISO format datetime
  last_updated: string; // ISO format datetime
}

export interface ArticleSearchResponse {
  articles: Article[]
  total_count: number;
}