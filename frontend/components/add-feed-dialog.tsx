'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'

interface AddFeedDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddFeed: (name: string, url: string, category: string) => void
}

export function AddFeedDialog({ isOpen, onClose, onAddFeed }: AddFeedDialogProps) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && url.trim()) {
      onAddFeed(name.trim(), url.trim(), category.trim())
      setName('')
      setUrl('')
      setCategory('')
      onClose()
      toast({
        title: "Feed Added",
        description: `${name} has been added to your feed list${category ? ` in the ${category} category` : ''}.`,
      })
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
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="My Awesome Feed"
              />
            </div>
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
            <Button type="submit">Add Feed</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

