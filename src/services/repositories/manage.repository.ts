import type { CategoryInput, ManagedCategory } from '../../types/category'
import type { ManagedProduct, ProductInput } from '../../types/product'
import type { HttpClient } from '../http'
import { mediaApi } from '../media.service'

export interface ManageRepository {
  listProducts(): Promise<ManagedProduct[]>
  createProduct(input: ProductInput): Promise<ManagedProduct>
  updateProduct(id: string, input: ProductInput): Promise<ManagedProduct>
  listCategories(): Promise<ManagedCategory[]>
  createCategory(input: CategoryInput): Promise<ManagedCategory>
  setPrimaryImage(productId: string, file: File): Promise<string>
}

type Envelope<T> = { data: T }

export class ApiManageRepository implements ManageRepository {
  constructor(private readonly http: HttpClient) {}

  async listProducts(): Promise<ManagedProduct[]> {
    return (await this.http.get<Envelope<ManagedProduct[]>>('/manage/products')).data
  }

  async createProduct(input: ProductInput): Promise<ManagedProduct> {
    return (await this.http.post<Envelope<ManagedProduct>>('/manage/products', input)).data
  }

  async updateProduct(id: string, input: ProductInput): Promise<ManagedProduct> {
    return (await this.http.put<Envelope<ManagedProduct>>(`/manage/products/${encodeURIComponent(id)}`, input)).data
  }

  async listCategories(): Promise<ManagedCategory[]> {
    return (await this.http.get<Envelope<ManagedCategory[]>>('/manage/categories')).data
  }

  async createCategory(input: CategoryInput): Promise<ManagedCategory> {
    return (await this.http.post<Envelope<ManagedCategory>>('/manage/categories', input)).data
  }

  async setPrimaryImage(productId: string, file: File): Promise<string> {
    const media = await mediaApi.upload(file, { module: 'products', entityId: productId })
    const attachment = await this.http.post<Envelope<{ view_url: string }>>(`/attachments/product/${encodeURIComponent(productId)}`, {
      media_id: media.id,
      role: 'primary',
    })
    return attachment.data.view_url
  }
}
