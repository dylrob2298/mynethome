"use client"

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UnifiedPaginationProps {
  totalItems: number
  itemsPerPage: number
  currentPage: number
  onPageChange: (page: number) => void
  isLoading?: boolean
  showSummary?: boolean
  itemName?: string
}

export function UnifiedPagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  isLoading = false,
  showSummary = true,
  itemName = "items",
}: UnifiedPaginationProps) {
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  // Calculate start and end items
  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Generate pagination range with ellipsis
  const generatePaginationRange = () => {
    const maxVisiblePages = 5
    const range: (number | string)[] = []

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    if (startPage > 1) {
      range.push(1)
      if (startPage > 2) {
        range.push("...")
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      range.push(i)
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        range.push("...")
      }
      range.push(totalPages)
    }

    return range
  }

  const paginationRange = generatePaginationRange()

  if (totalPages <= 1) return null

  const handlePageClick = (page: number) => {
    if (!isLoading && page >= 1 && page <= totalPages) {
      onPageChange(page)
    }
  }

  const canPrevPage = currentPage > 1
  const canNextPage = currentPage < totalPages

  return (
    <div className="pagination-container w-full">
      {showSummary && totalItems > 0 && (
        <div className="flex justify-between items-center mb-2 text-sm text-gray-500">
          <div>
            Showing {startItem} - {endItem} of {totalItems} {itemName}
          </div>
          <div>
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}
      <div className="flex justify-center w-full mt-4">
        <div className="flex items-center gap-1 pagination-buttons-container">
          {/* Previous button */}
          <Button
            variant="outline"
            onClick={() => handlePageClick(currentPage - 1)}
            disabled={!canPrevPage || isLoading}
            className="pagination-button pagination-prev flex items-center gap-1"
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          {/* Page numbers */}
          <div className="flex items-center">
            {paginationRange.map((page, index) =>
              page === "..." ? (
                <span key={`ellipsis-${index}`} aria-hidden className="flex h-9 w-9 items-center justify-center">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More pages</span>
                </span>
              ) : (
                <Button
                  key={`page-${page}`}
                  variant={currentPage === page ? "default" : "outline"}
                  onClick={() => handlePageClick(page as number)}
                  disabled={isLoading}
                  className="pagination-page-button h-9 w-9 mx-1"
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </Button>
              ),
            )}
          </div>

          {/* Next button */}
          <Button
            variant="outline"
            onClick={() => handlePageClick(currentPage + 1)}
            disabled={!canNextPage || isLoading}
            className="pagination-button pagination-next flex items-center gap-1"
            aria-label="Go to next page"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

