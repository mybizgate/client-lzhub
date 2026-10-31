export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  active: boolean
  sortOrder?: number
}

export interface ManagedCategory extends Category {
  status: 'draft' | 'active' | 'archived'
  parentId: string | null
}

export interface CategoryInput {
  name: string
  slug?: string
  description?: string | null
  sortOrder?: number
  status?: 'draft' | 'active' | 'archived'
}
