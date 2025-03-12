"use client"

import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"

interface LayoutWithSidebarProps {
  children: React.ReactNode
}

export function LayoutWithSidebar({ children }: LayoutWithSidebarProps) {
  return (
    <div className="h-full pt-0 relative">
      <SidebarProvider>{children}</SidebarProvider>
    </div>
  )
}

