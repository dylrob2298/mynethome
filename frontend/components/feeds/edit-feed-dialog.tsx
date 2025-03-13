/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { editFeed } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { Feed } from "@/types/feed"
import { FeedCategoryManager } from "@/components/feed-category-manager"
import { Badge } from "@/components/ui/badge"
import { Tag } from "lucide-react"

interface EditFeedDialogProps {
  isOpen: boolean
  onClose: () => void
  onEditFeed: (updatedFeed: Feed) => void
  feed: Feed
}

export function EditFeedDialog({ isOpen, onClose, onEditFeed, feed }: EditFeedDialogProps) {
  const [name, setName] = useState(feed.name)
  const [feedWithCategories, setFeedWithCategories] = useState<Feed>({ ...feed })
  const [isLoading, setIsLoading] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const { toast } = useToast()

  // Update local state when feed prop changes
  useEffect(() => {
    if (isOpen) {
      setName(feed.name)
      setFeedWithCategories({ ...feed })
    }
  }, [isOpen, feed])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      try {
        setIsLoading(true)
        const updatedFeed = await editFeed(feed.id, {
          name: name.trim(),
        })

        // Preserve the categories from our local state
        updatedFeed.categories = feedWithCategories.categories

        onEditFeed(updatedFeed)
        onClose()
        toast({
          title: "Feed Updated",
          description: `${updatedFeed.name} has been updated.`,
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update feed. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    } else {
      toast({
        title: "Error",
        description: "Please enter a name for the feed.",
        variant: "destructive",
      })
    }
  }

  const handleCategoryUpdate = () => {
    // Update our local copy of the feed with the latest categories
    setFeedWithCategories({ ...feed })
    setShowCategoryManager(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Feed</DialogTitle>
          <DialogDescription>Update the details of your RSS feed.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <div className="text-right pt-2">
                <Label>Categories</Label>
              </div>
              <div className="col-span-3">
                <div className="flex flex-wrap gap-2 mb-2">
                  {feedWithCategories.categories && feedWithCategories.categories.length > 0 ? (
                    feedWithCategories.categories.map((category) => (
                      <Badge key={category.id} variant="secondary">
                        {category.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No categories</span>
                  )}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCategoryManager(true)}>
                  <Tag className="h-4 w-4 mr-2" />
                  Manage Categories
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Feed"}
            </Button>
          </DialogFooter>
        </form>

        {/* Category Manager Dialog */}
        <FeedCategoryManager
          feed={feedWithCategories}
          onUpdate={handleCategoryUpdate}
          open={showCategoryManager}
          onOpenChange={setShowCategoryManager}
        />
      </DialogContent>
    </Dialog>
  )
}

