"use client"

import { useState, useEffect } from "react"
import { addChannelToCategory, removeChannelFromCategory, getAllCategories } from "@/lib/category-service"
import type { CategoryOut } from "@/types/category"
import type { Channel } from "@/types/youtube"
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

interface ChannelCategoryManagerProps {
  channel: Channel
  onUpdate: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ChannelCategoryManager({ channel, onUpdate, open, onOpenChange }: ChannelCategoryManagerProps) {
  const [allCategories, setAllCategories] = useState<CategoryOut[]>([])
  const [channelCategories, setChannelCategories] = useState<CategoryOut[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Handle controlled or uncontrolled open state
  const isOpen = open !== undefined ? open : isDialogOpen
  const setIsOpen = onOpenChange || setIsDialogOpen

  // Initialize channel categories
  useEffect(() => {
    if (channel.categories) {
      setChannelCategories([...channel.categories])
    } else {
      setChannelCategories([])
    }
  }, [channel])

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
      await addChannelToCategory({
        category_id: categoryId,
        channel_id: channel.id,
      })

      // Add the category to the local state
      const category = allCategories.find((c) => c.id === categoryId)
      if (category) {
        const updatedCategories = [...channelCategories, category]
        setChannelCategories(updatedCategories)

        // Update the channel object with the new category
        channel.categories = updatedCategories
      }

      setSelectedCategoryId("")
      toast({
        title: "Success",
        description: "Channel added to category successfully",
      })
    } catch (error) {
      console.error("Failed to add channel to category:", error)
      toast({
        title: "Error",
        description: "Failed to add channel to category",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveCategory = async (categoryId: number) => {
    setIsLoading(true)

    try {
      await removeChannelFromCategory({
        category_id: categoryId,
        channel_id: channel.id,
      })

      // Remove the category from the local state
      const updatedCategories = channelCategories.filter((c) => c.id !== categoryId)
      setChannelCategories(updatedCategories)

      // Update the channel object with the updated categories
      channel.categories = updatedCategories

      toast({
        title: "Success",
        description: "Channel removed from category successfully",
      })
    } catch (error) {
      console.error("Failed to remove channel from category:", error)
      toast({
        title: "Error",
        description: "Failed to remove channel from category",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter out categories that the channel is already in
  const availableCategories = allCategories.filter((category) => !channelCategories.some((c) => c.id === category.id))

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
          <DialogTitle>Manage Channel Categories</DialogTitle>
          <DialogDescription>Add or remove categories for {channel.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Current Categories</h4>
            <div className="flex flex-wrap gap-2">
              {channelCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No categories assigned</p>
              ) : (
                channelCategories.map((category) => (
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

