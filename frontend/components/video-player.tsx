/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from "react"
import type { Video } from "@/types/youtube"
import { format, parseISO } from "date-fns"
import { ExternalLink, Share2, Heart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { toggleVideoFavorite } from "@/lib/youtube-api"
import { useToast } from "@/hooks/use-toast"

interface VideoPlayerProps {
  video: Video
  onClose: () => void
  onVideoUpdate?: (updatedVideo: Video) => void
}

export function VideoPlayer({ video, onClose, onVideoUpdate }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [currentVideo, setCurrentVideo] = useState<Video>(video)
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setIsOpen(true)
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(onClose, 300) // Wait for animation to complete
  }

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return format(date, "MMMM d, yyyy")
    } catch (error) {
      console.error("Invalid date:", dateString)
      return "Invalid date"
    }
  }

  const shareVideo = () => {
    if (navigator.share) {
      navigator
        .share({
          title: currentVideo.title,
          url: `https://www.youtube.com/watch?v=${currentVideo.id}`,
        })
        .catch((err) => {
          console.error("Error sharing:", err)
        })
    } else {
      navigator.clipboard
        .writeText(`https://www.youtube.com/watch?v=${currentVideo.id}`)
        .then(() => {
          toast({
            title: "Link copied",
            description: "Video link copied to clipboard!",
          })
        })
        .catch((err) => {
          console.error("Error copying to clipboard:", err)
        })
    }
  }

  const handleToggleFavorite = async () => {
    try {
      setIsUpdatingFavorite(true)
      const updatedVideo = await toggleVideoFavorite(currentVideo.id, !currentVideo.is_favorited)

      setCurrentVideo(updatedVideo)

      if (onVideoUpdate) {
        onVideoUpdate(updatedVideo)
      }

      toast({
        title: updatedVideo.is_favorited ? "Video favorited" : "Video unfavorited",
        description: `${updatedVideo.title} has been ${updatedVideo.is_favorited ? "added to" : "removed from"} your favorites.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorite status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingFavorite(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[900px] p-0 h-[80vh] max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex flex-col h-full">
          <div className="relative aspect-video w-full bg-black flex-shrink-0">
            {isLoading ? (
              <Skeleton className="absolute inset-0" />
            ) : (
              <iframe
                src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1`}
                title={currentVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            )}
          </div>

          <div className="flex-grow overflow-hidden p-4">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div className="flex-grow min-w-0">
                    <h2 className="text-xl font-bold break-words">{currentVideo.title}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Published on {formatDate(currentVideo.published_at)}
                    </p>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    <Button
                      variant={currentVideo.is_favorited ? "default" : "outline"}
                      size="sm"
                      onClick={handleToggleFavorite}
                      disabled={isUpdatingFavorite}
                      className={currentVideo.is_favorited ? "bg-red-500 hover:bg-red-600 border-red-500" : ""}
                    >
                      {isUpdatingFavorite ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Heart className={`h-4 w-4 mr-2 ${currentVideo.is_favorited ? "fill-white" : ""}`} />
                      )}
                      {currentVideo.is_favorited ? "Favorited" : "Favorite"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={shareVideo}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://www.youtube.com/watch?v=${currentVideo.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        YouTube
                      </a>
                    </Button>
                  </div>
                </div>

                {currentVideo.description && (
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                    <p className="whitespace-pre-line text-sm break-words">{currentVideo.description}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

