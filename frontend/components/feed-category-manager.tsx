"use client"

import { useState, useEffect } from "react"
import { addFeedToCategory, removeFeedFromCategory, getAllCategories } from "@/lib/category-service"
import type { CategoryOut } from "@/types/category"
import type { Feed } from "@/types/feed"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Tag } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface FeedCategoryManagerProps {
  feed: Feed
  onUpdate: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function FeedCategoryManager({ feed, onUpdate, open, onOpenChange }: FeedCategoryManagerProps) {
  const [allCategories, setAllCategories] = useState<CategoryOut[]>([])
  const [feedCategories, setFeedCategories] = useState<CategoryOut[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Handle controlled or uncontrolled open state
  const isOpen = open !== undefined ? open : isDialogOpen
  const setIsOpen = onOpenChange || setIsDialogOpen

  // Initialize feed categories
  useEffect(() => {
    if (feed.categories) {
      setFeedCategories([...feed.categories])
    } else {
      setFeedCategories([])
    }
  }, [feed])

  const fetchCategories = async () => {
    try {
      const data = await getAllCategories()
      setAllCategories(data)
    } catch (error) {
      console.error("Failed to fetch categories:", error)
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  const handleAddCategory = async () => {
    if (!selectedCategoryId) return

    const categoryId = Number.parseInt(selectedCategoryId)
    setIsLoading(true)

    try {
      await addFeedToCategory({
        category_id: categoryId,
        feed_id: feed.id,
      })

      // Add the category to the local state
      const category = allCategories.find((c) => c.id === categoryId)
      if (category) {
        const updatedCategories = [...feedCategories, category]
        setFeedCategories(updatedCategories)

        // Update the feed object with the new category
        feed.categories = updatedCategories
      }

      setSelectedCategoryId("")
      toast({
        title: "Success",
        description: "Feed added to category successfully",
      })
    } catch (error) {
      console.error("Failed to add feed to category:", error)
      toast({
        title: "Error",
        description: "Failed to add feed to category",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveCategory = async (categoryId: number) => {
    setIsLoading(true)

    try {
      await removeFeedFromCategory({
        category_id: categoryId,
        feed_id: feed.id,
      })

      // Remove the category from the local state
      const updatedCategories = feedCategories.filter((c) => c.id !== categoryId)
      setFeedCategories(updatedCategories)

      // Update the feed object with the updated categories
      feed.categories = updatedCategories

      toast({
        title: "Success",
        description: "Feed removed from category successfully",
      })
    } catch (error) {
      console.error("Failed to remove feed from category:", error)
      toast({
        title: "Error",
        description: "Failed to remove feed from category",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter out categories that the feed is already in
  const availableCategories = allCategories.filter((category) => !feedCategories.some((c) => c.id === category.id))

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Tag className="h-4 w-4 mr-2" />
          Manage Categories
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Feed Categories</DialogTitle>
          <DialogDescription>Add or remove categories for {feed.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Current Categories</h4>
            <div className="flex flex-wrap gap-2">
              {feedCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No categories assigned</p>
              ) : (
                feedCategories.map((category) => (
                  <Badge key={category.id} variant="secondary" className="flex items-center gap-1">
                    {category.name}
                    <button
                      onClick={() => handleRemoveCategory(category.id)}
                      className="ml-1 rounded-full hover:bg-muted p-0.5"
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove {category.name}</span>
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={selectedCategoryId}
              onValueChange={setSelectedCategoryId}
              disabled={availableCategories.length === 0 || isLoading}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddCategory} disabled={!selectedCategoryId || isLoading}>
              Add
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false)
              onUpdate()
            }}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

