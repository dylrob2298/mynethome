"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addFeed } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { Feed } from "@/types/feed"
import { CategoryFilter } from "@/components/category-filter"
import { addFeedToCategory } from "@/lib/category-service"
import type { CategoryOut } from "@/types/category"

interface AddFeedDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddFeed: (feed: Feed) => void
}

export function AddFeedDialog({ isOpen, onClose, onAddFeed }: AddFeedDialogProps) {
  const [url, setUrl] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<CategoryOut[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setUrl("")
      setSelectedCategories([])
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      try {
        setIsLoading(true)

        // Add the feed without any categories first
        const newFeed = await addFeed({ url: url.trim() })

        // Initialize categories array if it doesn't exist
        if (!newFeed.categories) {
          newFeed.categories = []
        }

        // Then add the feed to each selected category
        if (selectedCategories.length > 0) {
          const categoryPromises = selectedCategories.map(async (category) => {
            await addFeedToCategory({
              category_id: category.id,
              feed_id: newFeed.id,
            })
          })

          await Promise.all(categoryPromises)

          // Update the feed object with categories for the UI
          newFeed.categories = selectedCategories
        }

        // Ensure is_favorited property is set
        if (newFeed.is_favorited === undefined) {
          newFeed.is_favorited = false
        }

        onAddFeed(newFeed)
        setUrl("")
        setSelectedCategories([])
        onClose()

        toast({
          title: "Feed Added",
          description: `${newFeed.name} has been added to your feed list${selectedCategories.length > 0 ? ` with ${selectedCategories.length} categories` : ""}.`,
        })
      } catch (error) {
        console.error("Error adding feed:", error)
        toast({
          title: "Error",
          description: "Failed to add feed. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    } else {
      toast({
        title: "Error",
        description: "Please enter a URL for the feed.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New RSS Feed</DialogTitle>
          <DialogDescription>Enter the details of the RSS feed you want to add.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="url" className="text-right">
                URL
              </Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="col-span-3"
                placeholder="https://example.com/rss"
                type="url"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="categories" className="text-right pt-2">
                Categories
              </Label>
              <div className="col-span-3">
                <CategoryFilter onCategoryChange={setSelectedCategories} selectedCategories={selectedCategories} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Feed"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

