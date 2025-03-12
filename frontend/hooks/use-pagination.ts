"use client"

import { useState, useEffect, useCallback } from "react"

interface UsePaginationProps {
  totalItems: number
  itemsPerPage: number
  initialPage?: number
}

interface UsePaginationReturn {
  currentPage: number
  setCurrentPage: (page: number) => void
  totalPages: number
  pageItems: number[]
  nextPage: () => void
  prevPage: () => void
  goToPage: (page: number) => void
  canNextPage: boolean
  canPrevPage: boolean
  startItem: number
  endItem: number
  paginationRange: (number | string)[]
}

export function usePagination({ totalItems, itemsPerPage, initialPage = 1 }: UsePaginationProps): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage)

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  // Ensure current page is within bounds when total changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  // Calculate start and end items
  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Navigation functions
  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }, [totalPages])

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }, [])

  const goToPage = useCallback(
    (page: number) => {
      const pageNumber = Math.max(1, Math.min(page, totalPages))
      setCurrentPage(pageNumber)
    },
    [totalPages],
  )

  // Calculate page items for current view
  const pageItems = Array.from(
    { length: Math.min(itemsPerPage, totalItems - (currentPage - 1) * itemsPerPage) },
    (_, i) => i + (currentPage - 1) * itemsPerPage,
  )

  // Generate pagination range with ellipsis
  const generatePaginationRange = useCallback(() => {
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
  }, [currentPage, totalPages])

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    pageItems,
    nextPage,
    prevPage,
    goToPage,
    canNextPage: currentPage < totalPages,
    canPrevPage: currentPage > 1,
    startItem,
    endItem,
    paginationRange: generatePaginationRange(),
  }
}

