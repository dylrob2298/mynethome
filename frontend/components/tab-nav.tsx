"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Rss, Youtube } from "lucide-react"

interface TabItem {
  name: string
  href: string
  icon: React.ElementType
}

export function TabNav() {
  const pathname = usePathname()

  const tabs: TabItem[] = [
    {
      name: "RSS Feeds",
      href: "/feeds",
      icon: Rss,
    },
    {
      name: "YouTube",
      href: "/youtube",
      icon: Youtube,
    },
  ]

  return (
    <div className="h-16 flex items-center px-4">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold">RSS Reader</h1>
      </div>
      <nav className="ml-8 flex space-x-4">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href)

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
              )}
            >
              <tab.icon className="mr-2 h-4 w-4" />
              {tab.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

