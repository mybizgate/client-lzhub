import { repositories } from './repositories'
import type { ProductQuery } from '../types/product'

export const catalogueService = {
  categories: () => repositories.catalogue.getCategories(),
  products: (query?: ProductQuery) => repositories.catalogue.getProducts(query),
  product: (slug: string) => repositories.catalogue.getProduct(slug),
  search: (term: string) => repositories.catalogue.searchProducts(term),
}
