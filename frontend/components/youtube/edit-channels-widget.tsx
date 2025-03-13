/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from "react"
import type { Channel } from "@/types/youtube"
import { getChannels, deleteChannel } from "@/lib/youtube-api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, Loader2, Search, Tag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ChannelCategoryManager } from "@/components/channel-category-manager"

interface EditChannelsWidgetProps {
  isOpen: boolean
  onClose: () => void
  onChannelsUpdate: (updatedChannels: Channel[]) => void
}

export function EditChannelsWidget({ isOpen, onClose, onChannelsUpdate }: EditChannelsWidgetProps) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchChannels()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredChannels(channels)
    } else {
      const term = searchTerm.toLowerCase()
      setFilteredChannels(
        channels.filter(
          (channel) =>
            channel.title.toLowerCase().includes(term) ||
            channel.categories.some((cat) => cat.name.toLowerCase().includes(term)),
        ),
      )
    }
  }, [searchTerm, channels])

  const fetchChannels = async () => {
    try {
      setIsLoading(true)
      const fetchedChannels = await getChannels()
      setChannels(fetchedChannels)
      setFilteredChannels(fetchedChannels)
      setError(null)
    } catch (err) {
      setError("Failed to fetch channels")
    } finally {
      setIsLoading(false)
    }
  }

  const confirmDeleteChannel = (channel: Channel) => {
    setChannelToDelete(channel)
  }

  const handleDeleteChannel = async () => {
    if (!channelToDelete) return

    try {
      setIsDeleting(true)
      await deleteChannel(channelToDelete.id)
      const updatedChannels = channels.filter((channel) => channel.id !== channelToDelete.id)
      setChannels(updatedChannels)
      setFilteredChannels(
        searchTerm.trim() === ""
          ? updatedChannels
          : updatedChannels.filter(
              (channel) =>
                channel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                channel.categories.some((cat) => cat.name.toLowerCase().includes(searchTerm.toLowerCase())),
            ),
      )
      onChannelsUpdate(updatedChannels)
      toast({
        title: "Channel Deleted",
        description: `${channelToDelete.title} has been successfully deleted.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete channel. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setChannelToDelete(null)
    }
  }

  const handleManageCategories = (channel: Channel) => {
    setSelectedChannel({ ...channel })
    setShowCategoryManager(true)
  }

  const handleCategoryUpdate = () => {
    // The channel object is updated directly in the ChannelCategoryManager
    setShowCategoryManager(false)

    // Update the channels list to reflect the changes
    if (selectedChannel) {
      const updatedChannels = channels.map((channel) =>
        channel.id === selectedChannel.id ? { ...channel, categories: [...selectedChannel.categories] } : channel,
      )
      setChannels(updatedChannels)
      setFilteredChannels(
        searchTerm.trim() === ""
          ? updatedChannels
          : updatedChannels.filter(
              (channel) =>
                channel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                channel.categories.some((cat) => cat.name.toLowerCase().includes(searchTerm.toLowerCase())),
            ),
      )
      onChannelsUpdate(updatedChannels)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manage YouTube Channels</DialogTitle>
          </DialogHeader>

          <div className="relative mb-4">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-500 dark:text-gray-400" />
            <Input
              type="text"
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <ScrollArea className="h-[60vh] pr-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <p>Loading channels...</p>
              </div>
            ) : error ? (
              <div className="text-center p-4">
                <p className="text-red-500 mb-2">{error}</p>
                <Button onClick={fetchChannels}>Retry</Button>
              </div>
            ) : filteredChannels.length === 0 ? (
              <div className="text-center p-4 text-gray-500">
                {searchTerm.trim() !== "" ? "No channels match your search" : "No channels added yet"}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredChannels.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center space-x-3 p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {channel.thumbnail_url ? (
                        <Image
                          src={channel.thumbnail_url || "/placeholder.svg"}
                          alt={channel.title}
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold">{channel.title.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-medium truncate">{channel.title}</p>
                      {channel.handle && <p className="text-sm text-gray-500 truncate">{channel.handle}</p>}
                      {channel.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {channel.categories.map((category) => (
                            <Badge key={category.id} variant="secondary" className="text-xs">
                              {category.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleManageCategories(channel)}
                        title="Manage categories"
                      >
                        <Tag className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => confirmDeleteChannel(channel)}
                        title="Delete channel"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!channelToDelete} onOpenChange={(open) => !open && setChannelToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Channel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {channelToDelete?.title}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChannel}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category Manager Dialog */}
      {selectedChannel && (
        <ChannelCategoryManager
          channel={selectedChannel}
          onUpdate={handleCategoryUpdate}
          open={showCategoryManager}
          onOpenChange={setShowCategoryManager}
        />
      )}
    </>
  )
}

