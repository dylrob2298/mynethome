"use client"

import type React from "react"
import { TabNav } from "@/components/tab-nav"

interface PageLayoutProps {
  sidebar: React.ReactNode
  content: React.ReactNode
}

export function PageLayout({ sidebar, content }: PageLayoutProps) {
  return (
    <div className="flex flex-col h-screen">
      {/* Tab Navigation - Full Width at Top */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
        <TabNav />
      </div>

      {/* Main Content Area - Sidebar and Content Side by Side */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Left Side */}
        <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          {sidebar}
        </div>

        {/* Content - Right Side */}
        <div className="flex-1 overflow-auto">{content}</div>
      </div>
    </div>
  )
}

