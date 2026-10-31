export type StockStatus = 'in_stock' | 'low' | 'out'

/** Generated packshot description used when a product has no real photo yet. */
export interface ProductArt {
  shape: 'pouch' | 'bottle' | 'jug' | 'carton' | 'can' | 'jar' | 'rice' | 'packet'
  color: string
  motif: string
  label: string
}

export interface Product {
  id: string
  sku?: string
  name: string
  slug: string
  description?: string
  categoryId: string
  images: string[]
  /** Wholesale selling unit, e.g. "karton", "guni". */
  unit: string
  /** Retail packs per wholesale unit. */
  packQty: number
  /** Size of one retail pack, e.g. "1kg". */
  size: string
  /** Price per wholesale unit in integer cents. */
  price: number
  /** Previous price in cents when a promotion is running. */
  oldPrice?: number
  minimumQuantity: number
  /** Available wholesale units, or `null` when stock is unlimited. */
  stock: number | null
  stockStatus: StockStatus
  featured?: boolean
  promo?: boolean
  brand?: string
  active: boolean
  art?: ProductArt
  updatedAt?: string
}

export interface ManagedProduct extends Product {
  status: 'draft' | 'active' | 'archived'
  sortOrder: number
  stockQuantity: number
  unlimitedStock: boolean
  lowStockThreshold: number
  featured: boolean
}

export interface ProductInput {
  categoryId: string
  name: string
  slug?: string
  sku?: string | null
  description?: string | null
  brand?: string | null
  unit: string
  packQty: number
  size: string
  price: number
  oldPrice?: number | null
  minimumQuantity: number
  stockQuantity: number
  unlimitedStock: boolean
  status: 'draft' | 'active' | 'archived'
  sortOrder?: number
  featured?: boolean
}

export interface ProductQuery {
  categoryId?: string
  search?: string
  inStockOnly?: boolean
  promoOnly?: boolean
  ids?: string[]
  sort?: 'popular' | 'price_asc' | 'price_desc' | 'name'
  /** Local view-only switch used by authenticated catalogue management. */
  includeInactive?: boolean
}
