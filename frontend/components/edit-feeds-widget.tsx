/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react'
import { Feed } from '@/types/feed'
import { getFeeds, editFeed } from '@/lib/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Edit, Check, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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
      setError('Failed to fetch feeds')
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
          category: editingFeed.category || undefined,
        })
        const updatedFeeds = feeds.map(feed => feed.id === updatedFeed.id ? updatedFeed : feed)
        setFeeds(updatedFeeds)
        onFeedsUpdate(updatedFeeds)  // Add this line
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
                <div key={feed.id} className="flex items-center space-x-2">
                  {editingFeed && editingFeed.id === feed.id ? (
                    <>
                      <div className="flex-grow space-y-2">
                        <Label htmlFor={`feed-name-${feed.id}`} className="sr-only">Feed Name</Label>
                        <Input
                          id={`feed-name-${feed.id}`}
                          value={editingFeed.name}
                          onChange={(e) => setEditingFeed({ ...editingFeed, name: e.target.value })}
                          placeholder="Feed Name"
                        />
                        <Label htmlFor={`feed-category-${feed.id}`} className="sr-only">Feed Category</Label>
                        <Input
                          id={`feed-category-${feed.id}`}
                          value={editingFeed.category || ''}
                          onChange={(e) => setEditingFeed({ ...editingFeed, category: e.target.value })}
                          placeholder="Category (optional)"
                        />
                      </div>
                      <Button size="icon" onClick={handleSaveEdit} title="Save changes">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="outline" onClick={handleCancelEdit} title="Cancel editing">
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-grow">
                        <p className="font-medium">{feed.name}</p>
                        <p className="text-sm text-gray-500">{feed.category || 'No category'}</p>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => handleEditClick(feed)} title="Edit feed">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

