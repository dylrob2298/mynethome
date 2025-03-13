"use client"

import { useState, useEffect } from "react"
import { getAllCategories } from "@/lib/category-service"
import type { CategoryOut } from "@/types/category"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface CategoryFilterProps {
  onCategoryChange: (categories: CategoryOut[]) => void
  selectedCategories?: CategoryOut[]
}

export function CategoryFilter({ onCategoryChange, selectedCategories = [] }: CategoryFilterProps) {
  const [categories, setCategories] = useState<CategoryOut[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(
    new Set(selectedCategories.map((c) => c.id)),
  )
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true)
      try {
        const data = await getAllCategories()
        setCategories(data)
      } catch (error) {
        console.error("Failed to fetch categories:", error)
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Update selected categories when prop changes
  useEffect(() => {
    setSelectedCategoryIds(new Set(selectedCategories.map((c) => c.id)))
  }, [selectedCategories])

  // Notify parent component when selected categories change
  useEffect(() => {
    const selectedCats = categories.filter((cat) => selectedCategoryIds.has(cat.id))
    onCategoryChange(selectedCats)
  }, [selectedCategoryIds, categories, onCategoryChange])

  const handleCategorySelect = (categoryId: string) => {
    const id = Number.parseInt(categoryId)
    if (!selectedCategoryIds.has(id)) {
      setSelectedCategoryIds(new Set([...selectedCategoryIds, id]))
    }
  }

  const handleCategoryRemove = (categoryId: number) => {
    const newSelectedIds = new Set(selectedCategoryIds)
    newSelectedIds.delete(categoryId)
    setSelectedCategoryIds(newSelectedIds)
  }

  // Filter out categories that are already selected
  const availableCategories = categories.filter((category) => !selectedCategoryIds.has(category.id))

  // Get the selected category objects
  const selectedCategoryObjects = categories.filter((cat) => selectedCategoryIds.has(cat.id))

  return (
    <div className="space-y-2">
      <Select onValueChange={handleCategorySelect} disabled={isLoading || availableCategories.length === 0}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={isLoading ? "Loading categories..." : "Select a category"} />
        </SelectTrigger>
        <SelectContent>
          {availableCategories.map((category) => (
            <SelectItem key={category.id} value={category.id.toString()}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedCategoryObjects.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedCategoryObjects.map((category) => (
            <Badge key={category.id} variant="secondary" className="flex items-center gap-1">
              {category.name}
              <button
                onClick={() => handleCategoryRemove(category.id)}
                className="ml-1 rounded-full hover:bg-muted p-0.5"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {category.name}</span>
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

