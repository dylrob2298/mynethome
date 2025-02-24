export interface Feed {
  id: number;
  name: string;
  url: string; // Corresponding to Pydantic's HttpUrl
  category?: string | null;
  categories?: string[] | null;
  description?: string | null;
  author?: string | null;
  image_url?: string | null; // Corresponding to Pydantic's HttpUrl
  created_at: string; // ISO format datetime
  last_updated: string; // ISO format datetime
  total_articles: number;
}
