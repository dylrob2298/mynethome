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
import { addChannel, getCategoryNames } from "@/lib/youtube-api"
import { useToast } from "@/hooks/use-toast"
import type { Channel } from "@/types/youtube"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X } from "lucide-react"

interface AddChannelDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddChannel: (channel: Channel) => void
}

export function AddChannelDialog({ isOpen, onClose, onAddChannel }: AddChannelDialogProps) {
  const [handle, setHandle] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState("")
  const [existingCategories, setExistingCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingCategories, setIsFetchingCategories] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  const fetchCategories = async () => {
    try {
      setIsFetchingCategories(true)
      const categories = await getCategoryNames()
      setExistingCategories(categories)
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    } finally {
      setIsFetchingCategories(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (handle.trim()) {
      try {
        setIsLoading(true)
        const newChannel = await addChannel({
          handle: handle.trim(),
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        })
        onAddChannel(newChannel)
        resetForm()
        onClose()
        toast({
          title: "Channel Added",
          description: `${newChannel.title} has been added to your channel list.`,
        })
      } catch (error) {
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

  const resetForm = () => {
    setHandle("")
    setSelectedCategories([])
    setNewCategory("")
  }

  const addCategory = () => {
    if (newCategory.trim() && !selectedCategories.includes(newCategory.trim())) {
      setSelectedCategories([...selectedCategories, newCategory.trim()])
      setNewCategory("")
    }
  }

  const removeCategory = (category: string) => {
    setSelectedCategories(selectedCategories.filter((c) => c !== category))
  }

  const selectExistingCategory = (category: string) => {
    if (!selectedCategories.includes(category)) {
      setSelectedCategories([...selectedCategories, category])
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
          resetForm()
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
              <div className="col-span-3 space-y-3">
                <div className="flex gap-2">
                  <Input
                    id="categories"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Add a category"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addCategory()
                      }
                    }}
                  />
                  <Button type="button" onClick={addCategory} disabled={!newCategory.trim()}>
                    Add
                  </Button>
                </div>

                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedCategories.map((category) => (
                      <Badge key={category} variant="secondary" className="flex items-center gap-1">
                        {category}
                        <button
                          type="button"
                          onClick={() => removeCategory(category)}
                          className="ml-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 p-0.5"
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove {category}</span>
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {isFetchingCategories ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading categories...
                  </div>
                ) : (
                  existingCategories.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-1">Existing categories:</p>
                      <ScrollArea className="h-24 rounded-md border p-2">
                        <div className="flex flex-wrap gap-2">
                          {existingCategories.map((category) => (
                            <Badge
                              key={category}
                              variant={selectedCategories.includes(category) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => selectExistingCategory(category)}
                            >
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )
                )}
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

