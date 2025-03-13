export interface CategoryCreate {
    name: string
  }
  
  export interface CategoryOut {
    id: number
    name: string
  }
  
  export interface UpdateFeedCategory {
    category_id: number
    feed_id: number
  }
  
  export interface UpdateChannelCategory {
    category_id: number
    channel_id: string
  }
  
  