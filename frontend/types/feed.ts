
export interface CategoryOut {
  id: number
  name: string
}

export interface Feed {
  id: number;
  name: string;
  url: string; // Corresponding to Pydantic's HttpUrl
  categories: CategoryOut[];
  description?: string | null;
  author?: string | null;
  image_url?: string | null; // Corresponding to Pydantic's HttpUrl
  created_at: string; // ISO format datetime
  last_updated: string; // ISO format datetime
  total_articles: number;
  is_favorited: boolean;
}
