/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addFeed } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Feed } from '@/types/feed'


interface AddFeedDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddFeed: (feed: Feed) => void
}

export function AddFeedDialog({ isOpen, onClose, onAddFeed }: AddFeedDialogProps) {
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      try {
        setIsLoading(true)
        const newFeed = await addFeed({ url: url.trim(), category: category.trim() })
        onAddFeed(newFeed)
        setUrl('')
        setCategory('')
        onClose()
        toast({
          title: "Feed Added",
          description: `${newFeed.name} has been added to your feed list${category ? ` in the ${category} category` : ''}.`,
        })
      } catch (error) {
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
        description: "Please enter both a name and URL for the feed.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New RSS Feed</DialogTitle>
          <DialogDescription>
            Enter the details of the RSS feed you want to add.
          </DialogDescription>
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="col-span-3"
                placeholder="Technology"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Feed'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

