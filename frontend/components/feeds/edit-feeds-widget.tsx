/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from "react"
import type { Feed } from "@/types/feed"
import { getFeeds, editFeed, deleteFeed } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Edit, Check, X, Trash2, Tag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { FeedCategoryManager } from "@/components/feed-category-manager"

interface EditFeedsWidgetProps {
  isOpen: boolean
  onClose: () => void
  onFeedsUpdate: (updatedFeeds: Feed[]) => void
}

export function EditFeedsWidget({ isOpen, onClose, onFeedsUpdate }: EditFeedsWidgetProps) {
  const [feeds, setFeeds] = useState<Feed[]>([])
  const [editingFeed, setEditingFeed] = useState<Feed | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchFeeds()
    }
  }, [isOpen])

  const fetchFeeds = async () => {
    try {
      setIsLoading(true)
      const fetchedFeeds = await getFeeds()
      setFeeds(fetchedFeeds)
      setError(null)
    } catch (err) {
      setError("Failed to fetch feeds")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditClick = (feed: Feed) => {
    setEditingFeed({ ...feed })
  }

  const handleSaveEdit = async () => {
    if (editingFeed) {
      try {
        const updatedFeed = await editFeed(editingFeed.id, {
          name: editingFeed.name,
        })

        // Preserve categories
        updatedFeed.categories = editingFeed.categories

        const updatedFeeds = feeds.map((feed) => (feed.id === updatedFeed.id ? updatedFeed : feed))
        setFeeds(updatedFeeds)
        onFeedsUpdate(updatedFeeds)
        setEditingFeed(null)
        toast({
          title: "Feed Updated",
          description: `${updatedFeed.name} has been updated successfully.`,
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update feed. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleCancelEdit = () => {
    setEditingFeed(null)
  }

  const handleDeleteFeed = async (feedId: number) => {
    try {
      await deleteFeed(feedId)
      const updatedFeeds = feeds.filter((feed) => feed.id !== feedId)
      setFeeds(updatedFeeds)
      onFeedsUpdate(updatedFeeds)
      toast({
        title: "Feed Deleted",
        description: "The feed has been successfully deleted.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete feed. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleManageCategories = (feed: Feed) => {
    setSelectedFeed({ ...feed })
    setShowCategoryManager(true)
  }

  const handleCategoryUpdate = () => {
    // The feed object is updated directly in the FeedCategoryManager
    setShowCategoryManager(false)

    // Update the feeds list to reflect the changes
    if (selectedFeed) {
      const updatedFeeds = feeds.map((feed) =>
        feed.id === selectedFeed.id ? { ...feed, categories: [...selectedFeed.categories] } : feed,
      )
      setFeeds(updatedFeeds)
      onFeedsUpdate(updatedFeeds)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Feeds</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <p>Loading feeds...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <div className="space-y-4">
              {feeds.map((feed) => (
                <div key={feed.id} className="space-y-2 border-b pb-4">
                  {editingFeed && editingFeed.id === feed.id ? (
                    <>
                      <div className="flex-grow space-y-2">
                        <Label htmlFor={`feed-name-${feed.id}`} className="sr-only">
                          Feed Name
                        </Label>
                        <Input
                          id={`feed-name-${feed.id}`}
                          value={editingFeed.name}
                          onChange={(e) => setEditingFeed({ ...editingFeed, name: e.target.value })}
                          placeholder="Feed Name"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" onClick={handleSaveEdit} title="Save changes">
                          <Check className="h-4 w-4 mr-2" /> Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit} title="Cancel editing">
                          <X className="h-4 w-4 mr-2" /> Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{feed.name}</p>
                        <div className="flex space-x-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEditClick(feed)} title="Edit feed">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleManageCategories(feed)}
                            title="Manage categories"
                          >
                            <Tag className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteFeed(feed.id)}
                            title="Delete feed"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>

                      {/* Display categories */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {feed.categories && feed.categories.length > 0 ? (
                          feed.categories.map((category) => (
                            <Badge key={category.id} variant="outline">
                              {category.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No categories</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Category Manager Dialog */}
        {selectedFeed && (
          <FeedCategoryManager
            feed={selectedFeed}
            onUpdate={handleCategoryUpdate}
            open={showCategoryManager}
            onOpenChange={setShowCategoryManager}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

