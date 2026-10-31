import { repositories } from './repositories'
import type { CategoryInput } from '../types/category'
import type { ProductInput } from '../types/product'

export const manageService = {
  products: () => repositories.manage.listProducts(),
  createProduct: (input: ProductInput) => repositories.manage.createProduct(input),
  updateProduct: (id: string, input: ProductInput) => repositories.manage.updateProduct(id, input),
  categories: () => repositories.manage.listCategories(),
  createCategory: (input: CategoryInput) => repositories.manage.createCategory(input),
  setPrimaryImage: (productId: string, file: File) => repositories.manage.setPrimaryImage(productId, file),
}
