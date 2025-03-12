"use client"

import { useEffect, useRef } from "react"

interface ScrollPosition {
  [key: string]: number
}

export function useScrollRestoration(key: string) {
  const scrollPositions = useRef<ScrollPosition>({})
  const scrollableRef = useRef<HTMLDivElement>(null)

  // Save scroll position before unmounting
  useEffect(() => {
    const currentKey = key

    return () => {
      if (scrollableRef.current) {
        scrollPositions.current[currentKey] = scrollableRef.current.scrollTop
      }
    }
  }, [key])

  // Restore scroll position on mount
  useEffect(() => {
    const savedPosition = scrollPositions.current[key]

    if (savedPosition && scrollableRef.current) {
      // Use requestAnimationFrame to ensure the DOM has been painted
      requestAnimationFrame(() => {
        if (scrollableRef.current) {
          scrollableRef.current.scrollTop = savedPosition
        }
      })
    }
  }, [key])

  return scrollableRef
}

