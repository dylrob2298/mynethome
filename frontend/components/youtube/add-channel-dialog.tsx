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
import { addChannel } from "@/lib/youtube-api"
import { useToast } from "@/hooks/use-toast"
import type { Channel } from "@/types/youtube"
import { Loader2 } from "lucide-react"
import { CategoryFilter } from "@/components/category-filter"
import { getAllCategories, addChannelToCategory } from "@/lib/category-service"
import type { CategoryOut } from "@/types/category"

interface AddChannelDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddChannel: (channel: Channel) => void
}

export function AddChannelDialog({ isOpen, onClose, onAddChannel }: AddChannelDialogProps) {
  const [handle, setHandle] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<CategoryOut[]>([])
  const [allCategoriesData, setAllCategoriesData] = useState<CategoryOut[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    } else {
      setHandle("")
      setSelectedCategories([])
    }
  }, [isOpen])

  const fetchCategories = async () => {
    try {
      const categories = await getAllCategories()
      setAllCategoriesData(categories)
    } catch (error) {
      console.error("Failed to fetch categories:", error)
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (handle.trim()) {
      try {
        setIsLoading(true)

        // Add the channel without any categories first
        const newChannel = await addChannel({
          handle: handle.trim(),
        })

        // Initialize categories array if it doesn't exist
        if (!newChannel.categories) {
          newChannel.categories = []
        }

        // Then add the channel to each selected category
        if (selectedCategories.length > 0) {
          const categoryPromises = selectedCategories.map(async (category) => {
            await addChannelToCategory({
              category_id: category.id,
              channel_id: newChannel.id,
            })
          })

          await Promise.all(categoryPromises)

          // Update the channel object with categories for the UI
          newChannel.categories = selectedCategories
        }

        // Ensure is_favorited property is set
        if (newChannel.is_favorited === undefined) {
          newChannel.is_favorited = false
        }

        onAddChannel(newChannel)
        setHandle("")
        setSelectedCategories([])
        onClose()

        toast({
          title: "Channel Added",
          description: `${newChannel.title} has been added to your channel list${selectedCategories.length > 0 ? ` with ${selectedCategories.length} categories` : ""}.`,
        })
      } catch (error) {
        console.error("Error adding channel:", error)
        toast({
          title: "Error",
          description: "Failed to add channel. Please check the channel handle and try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    } else {
      toast({
        title: "Error",
        description: "Please enter a channel handle.",
        variant: "destructive",
      })
    }
  }

  const handleCategoryChange = (categories: CategoryOut[]) => {
    setSelectedCategories(categories)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
          setHandle("")
          setSelectedCategories([])
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add YouTube Channel</DialogTitle>
          <DialogDescription>Enter the handle of the YouTube channel you want to add.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="handle" className="text-right">
                Channel Handle
              </Label>
              <div className="col-span-3">
                <Input
                  id="handle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="e.g. @GoogleDevelopers"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the channel handle starting with @ or the channel ID
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="categories" className="text-right pt-2">
                Categories
              </Label>
              <div className="col-span-3">
                <CategoryFilter onCategoryChange={handleCategoryChange} selectedCategories={selectedCategories} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Channel"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

