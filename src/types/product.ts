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
  stock: number
  stockStatus: StockStatus
  featured?: boolean
  promo?: boolean
  brand?: string
  active: boolean
  art?: ProductArt
  updatedAt?: string
}

export interface ProductQuery {
  categoryId?: string
  search?: string
  inStockOnly?: boolean
  promoOnly?: boolean
  ids?: string[]
  sort?: 'popular' | 'price_asc' | 'price_desc' | 'name'
}
