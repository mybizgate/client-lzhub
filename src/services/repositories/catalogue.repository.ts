import type { Category } from '../../types/category'
import type { Product, ProductQuery } from '../../types/product'

export interface CatalogueRepository {
  getCategories(): Promise<Category[]>
  getProducts(query?: ProductQuery): Promise<Product[]>
  getProduct(slug: string): Promise<Product | null>
  searchProducts(term: string): Promise<Product[]>
}
