/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { editFeed } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Feed } from '@/types/feed'

interface EditFeedDialogProps {
  isOpen: boolean
  onClose: () => void
  onEditFeed: (updatedFeed: Feed) => void
  feed: Feed
}

export function EditFeedDialog({ isOpen, onClose, onEditFeed, feed }: EditFeedDialogProps) {
  const [name, setName] = useState(feed.name)
  const [category, setCategory] = useState(feed.category || '')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      try {
        setIsLoading(true)
        const updatedFeed = await editFeed(feed.id, { name: name.trim(), category: category.trim() })
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Feed</DialogTitle>
          <DialogDescription>
            Update the details of your RSS feed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Feed'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

