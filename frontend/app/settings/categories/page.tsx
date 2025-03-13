import { CategoryManagement } from "@/components/category-management"

export default function CategoriesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Category Management</h1>
        <p className="text-muted-foreground">Create and manage categories for your RSS feeds and YouTube channels</p>
      </div>

      <CategoryManagement />
    </div>
  )
}

