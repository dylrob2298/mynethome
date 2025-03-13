/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { format, parseISO } from "date-fns"
import Image from "next/image"
import type { Video } from "@/types/youtube"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { Input } from "@/components/ui/input"
import { Heart, RefreshCw, LayoutGrid, List, ImageOff, ExternalLink, Search, Loader2, AlertCircle } from "lucide-react"
import { getVideos, toggleVideoFavorite } from "@/lib/youtube-api"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { VideoPlayer } from "./video-player"
import { UnifiedPagination } from "../unified-pagination"

interface VideoListProps {
  channelIds: string[]
  channelName: string
  channelDescription?: string
  showFavorites: boolean
}

const VIDEOS_PER_PAGE = 24

export function VideoList({ channelIds, channelName, channelDescription, showFavorites }: VideoListProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [isGridView, setIsGridView] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaginationLoading, setIsPaginationLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalVideos, setTotalVideos] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Create a key to track when filters change to reset pagination
  const filterKey = JSON.stringify({
    channelIds,
    showFavorites,
    searchTerm: debouncedSearchTerm,
  })

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reset page when filter key changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filterKey])

  // Fetch videos when page, search term, channel IDs, or favorites filter changes
  useEffect(() => {
    fetchVideos(currentPage)
  }, [currentPage, debouncedSearchTerm, channelIds, showFavorites])

  const fetchVideos = useCallback(
    async (page: number) => {
      try {
        // Use different loading states for initial load vs pagination
        if (page === 1) {
          setIsLoading(true)
          setIsPaginationLoading(false)
        } else {
          setIsPaginationLoading(true)
        }

        const response = await getVideos({
          channel_ids: channelIds.length > 0 ? channelIds : undefined,
          title: debouncedSearchTerm || undefined,
          limit: VIDEOS_PER_PAGE,
          offset: (page - 1) * VIDEOS_PER_PAGE,
          order_by: "published_at",
          is_favorited: showFavorites ? true : undefined,
        })

        setVideos(response.videos)
        setTotalVideos(response.total_count)
        setError(null)

        // Scroll to top when changing pages
        if (contentRef.current && page > 1) {
          contentRef.current.scrollTop = 0
        }
      } catch (err) {
        console.error("Error fetching videos:", err)
        setError("Failed to fetch videos")
        toast({
          title: "Error",
          description: "Failed to fetch videos. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
        setIsPaginationLoading(false)
      }
    },
    [channelIds, debouncedSearchTerm, showFavorites, toast],
  )

  const handleToggleFavorite = async (video: Video, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      setIsUpdatingFavorite(video.id)
      const updatedVideo = await toggleVideoFavorite(video.id, !video.is_favorited)

      // Update the videos list with the updated video
      setVideos((prevVideos) => prevVideos.map((v) => (v.id === updatedVideo.id ? updatedVideo : v)))

      toast({
        title: updatedVideo.is_favorited ? "Video favorited" : "Video unfavorited",
        description: `${updatedVideo.title} has been ${updatedVideo.is_favorited ? "added to" : "removed from"} your favorites.`,
      })

      // If we're in the favorites view and we just unfavorited a video, we need to refresh the list
      if (showFavorites && !updatedVideo.is_favorited) {
        fetchVideos(currentPage)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorite status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingFavorite(null)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return format(date, "MMM d, yyyy")
    } catch (error) {
      console.error("Invalid date:", dateString)
      return "Invalid date"
    }
  }

  const openYouTubeVideo = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank", "noopener,noreferrer")
  }

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video)
  }

  const handleVideoUpdate = (updatedVideo: Video) => {
    // Update the video in the list
    setVideos((prevVideos) => prevVideos.map((v) => (v.id === updatedVideo.id ? updatedVideo : v)))

    // If we're in the favorites view and we just unfavorited a video, we need to refresh the list
    if (showFavorites && !updatedVideo.is_favorited) {
      fetchVideos(currentPage)
    }
  }

  const renderVideoCard = (video: Video) => (
    <Card
      key={video.id}
      className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] overflow-hidden h-full flex flex-col"
      onClick={() => handleVideoClick(video)}
    >
      <CardContent className="p-0 flex flex-col flex-1">
        <div className="relative aspect-video w-full overflow-hidden flex-shrink-0">
          {video.thumbnail_url ? (
            <Image
              src={video.thumbnail_url || "/placeholder.svg"}
              alt={video.title}
              fill
              className="object-cover transition-transform hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "/placeholder.svg"
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              <ImageOff className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded">
            {formatDate(video.published_at)}
          </div>
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 ${isUpdatingFavorite === video.id ? "opacity-50 pointer-events-none" : ""}`}
              onClick={(e) => handleToggleFavorite(video, e)}
              title={video.is_favorited ? "Remove from favorites" : "Add to favorites"}
            >
              {isUpdatingFavorite === video.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Heart className={`h-4 w-4 ${video.is_favorited ? "fill-red-500 text-red-500" : "text-white"}`} />
              )}
            </Button>
          </div>
        </div>
        <div className="p-3 flex flex-col flex-1">
          <h3 className="text-base font-medium line-clamp-2 mb-1 min-h-[2.5rem]">{video.title}</h3>
          {video.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 flex-grow">{video.description}</p>
          )}
          <div className="flex justify-end items-center mt-auto">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation()
                openYouTubeVideo(video.id)
              }}
            >
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">Open on YouTube</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderListView = () => (
    <div className="space-y-4">
      {videos.map((video) => (
        <Card
          key={video.id}
          className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] overflow-hidden"
          onClick={() => handleVideoClick(video)}
        >
          <CardContent className="p-4 flex">
            <div className="flex-shrink-0 mr-4">
              <div className="relative w-40 h-24 rounded-md overflow-hidden">
                {video.thumbnail_url ? (
                  <Image
                    src={video.thumbnail_url || "/placeholder.svg"}
                    alt={video.title}
                    fill
                    className="object-cover transition-transform hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg"
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <ImageOff className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-1 right-1 z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 ${isUpdatingFavorite === video.id ? "opacity-50 pointer-events-none" : ""}`}
                    onClick={(e) => handleToggleFavorite(video, e)}
                    title={video.is_favorited ? "Remove from favorites" : "Add to favorites"}
                  >
                    {isUpdatingFavorite === video.id ? (
                      <Loader2 className="h-3 w-3 animate-spin text-white" />
                    ) : (
                      <Heart className={`h-3 w-3 ${video.is_favorited ? "fill-red-500 text-red-500" : "text-white"}`} />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex-grow min-w-0 flex flex-col">
              <h3 className="text-lg font-semibold mb-1 line-clamp-2">{video.title}</h3>
              {video.description && (
                <p className="text-sm line-clamp-2 text-gray-600 dark:text-gray-400">{video.description}</p>
              )}
              <p className="text-sm mt-1">{formatDate(video.published_at)}</p>
              <div className="flex items-center space-x-2 mt-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 hover:bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation()
                    openYouTubeVideo(video.id)
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">Open on YouTube</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map((video) => renderVideoCard(video))}
    </div>
  )

  const renderSkeletonGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="overflow-hidden h-full">
          <CardContent className="p-0 h-full flex flex-col">
            <Skeleton className="aspect-video w-full flex-shrink-0" />
            <div className="p-3 space-y-2 flex-grow flex flex-col">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex justify-end mt-auto">
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderSkeletonList = () => (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-4 flex">
            <Skeleton className="w-40 h-24 rounded-md mr-4 flex-shrink-0" />
            <div className="flex-grow space-y-2 flex flex-col min-w-0">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
              <div className="flex mt-auto">
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // For debugging
  console.log("VideoList render:", {
    totalVideos,
    currentPage,
    VIDEOS_PER_PAGE,
    totalPages: Math.ceil(totalVideos / VIDEOS_PER_PAGE),
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header section */}
      <div className="p-4 flex-shrink-0">
        <div className="flex flex-row items-center justify-between mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">{channelName}</h1>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Toggle
              aria-label="Toggle view"
              pressed={isGridView}
              onPressedChange={setIsGridView}
              title={isGridView ? "Switch to list view" : "Switch to grid view"}
            >
              {isGridView ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Toggle>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => {
                setCurrentPage(1)
                fetchVideos(1)
              }}
              disabled={isLoading || isPaginationLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </div>
        {channelDescription && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-4 line-clamp-2">{channelDescription}</p>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-500 dark:text-gray-400" />
          <Input
            type="text"
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-auto px-4 pb-4" ref={contentRef}>
        {isLoading ? (
          isGridView ? (
            renderSkeletonGrid()
          ) : (
            renderSkeletonList()
          )
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-red-500 mb-4">{error}</p>
            <Button
              onClick={() => {
                setCurrentPage(1)
                fetchVideos(1)
              }}
            >
              Try Again
            </Button>
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <p className="text-gray-500 mb-2">
              {debouncedSearchTerm
                ? "No videos match your search"
                : showFavorites
                  ? "You haven't favorited any videos yet"
                  : "No videos found for the selected channels"}
            </p>
            {debouncedSearchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className={`${isPaginationLoading ? "opacity-60 pointer-events-none" : ""}`}>
            {isGridView ? renderGridView() : renderListView()}
          </div>
        )}

        {/* Pagination loading indicator */}
        {isPaginationLoading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-10 dark:bg-opacity-20 backdrop-blur-[1px] z-10">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </div>
        )}
      </div>

      {/* Pagination footer */}
      {!isLoading && videos.length > 0 && (
        <div className="px-4 pb-4 pt-2 flex-shrink-0 border-t">
          <UnifiedPagination
            totalItems={totalVideos}
            itemsPerPage={VIDEOS_PER_PAGE}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            isLoading={isPaginationLoading}
            showSummary={true}
            itemName="videos"
          />
        </div>
      )}

      {selectedVideo && (
        <VideoPlayer video={selectedVideo} onClose={() => setSelectedVideo(null)} onVideoUpdate={handleVideoUpdate} />
      )}
    </div>
  )
}

