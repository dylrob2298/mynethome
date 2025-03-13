import type { CategoryCreate, CategoryOut, UpdateFeedCategory, UpdateChannelCategory } from "@/types/category"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function createCategory(category: CategoryCreate): Promise<CategoryOut> {
  const response = await fetch(`${API_URL}/categories/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(category),
  })

  if (!response.ok) {
    throw new Error("Failed to create category")
  }

  return response.json()
}

export async function deleteCategory(categoryId: number): Promise<void> {
  const response = await fetch(`${API_URL}/categories/delete/${categoryId}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error("Failed to delete category")
  }
}

export async function addFeedToCategory(data: UpdateFeedCategory): Promise<void> {
  const response = await fetch(`${API_URL}/categories/addFeed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error("Failed to add feed to category")
  }
}

export async function removeFeedFromCategory(data: UpdateFeedCategory): Promise<void> {
  const response = await fetch(`${API_URL}/categories/removeFeed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error("Failed to remove feed from category")
  }
}

export async function addChannelToCategory(data: UpdateChannelCategory): Promise<void> {
  const response = await fetch(`${API_URL}/categories/addChannel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error("Failed to add channel to category")
  }
}

export async function removeChannelFromCategory(data: UpdateChannelCategory): Promise<void> {
  const response = await fetch(`${API_URL}/categories/removeChannel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error("Failed to remove channel from category")
  }
}

export async function getAllCategories(): Promise<CategoryOut[]> {
  // This endpoint isn't explicitly defined in the OpenAPI spec, but we'll assume it exists
  // or you can implement it on the backend
  const response = await fetch(`${API_URL}/categories`)

  if (!response.ok) {
    return [] // Return empty array if endpoint doesn't exist yet
  }

  return response.json()
}

