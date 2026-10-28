/**
 * REST implementations for the future Laravel backend at VITE_API_BASE_URL.
 * They implement the same interfaces as the local repositories, so switching
 * VITE_DATA_MODE=api requires no component or store changes.
 *
 * Expected endpoints (contract for the backend team):
 *   GET  /client/config
 *   GET  /categories
 *   GET  /products?category=&search=&in_stock=&promo=&sort=
 *   GET  /products/{slug}
 *   GET  /orders            (customer-scoped; requires auth)
 *   GET  /orders/{id}
 *   POST /orders            body: OrderDraft, returns priced Order
 *   PATCH /orders/{id}/status { status }
 *   GET  /customer/profile, PUT /customer/profile
 */
import type { Category } from '../../types/category'
import type { ClientConfig } from '../../types/client'
import type { Product, ProductQuery } from '../../types/product'
import type { Customer, Order, OrderDraft, OrderStatus } from '../../types/order'
import type { HttpClient } from '../http'
import type { CatalogueRepository } from './catalogue.repository'
import type { OrderRepository } from './order.repository'
import type { CustomerRepository } from './customer.repository'
import type { ClientRepository } from './client.repository'

type Envelope<T> = { data: T } | T

function unwrap<T>(res: Envelope<T>): T {
  return res && typeof res === 'object' && 'data' in (res as object) ? (res as { data: T }).data : (res as T)
}

export class ApiCatalogueRepository implements CatalogueRepository {
  constructor(private readonly http: HttpClient) {}
  async getCategories(): Promise<Category[]> {
    return unwrap(await this.http.get<Envelope<Category[]>>('/categories'))
  }
  async getProducts(query: ProductQuery = {}): Promise<Product[]> {
    return unwrap(
      await this.http.get<Envelope<Product[]>>('/products', {
        category: query.categoryId,
        search: query.search,
        in_stock: query.inStockOnly,
        promo: query.promoOnly,
        ids: query.ids?.join(','),
        sort: query.sort,
      }),
    )
  }
  async getProduct(slug: string): Promise<Product | null> {
    try {
      return unwrap(await this.http.get<Envelope<Product>>(`/products/${encodeURIComponent(slug)}`))
    } catch (e) {
      if ((e as { status?: number }).status === 404) return null
      throw e
    }
  }
  async searchProducts(term: string): Promise<Product[]> {
    return this.getProducts({ search: term })
  }
}

export class ApiOrderRepository implements OrderRepository {
  constructor(private readonly http: HttpClient) {}
  async list(): Promise<Order[]> {
    return unwrap(await this.http.get<Envelope<Order[]>>('/orders'))
  }
  async get(id: string): Promise<Order | null> {
    try {
      return unwrap(await this.http.get<Envelope<Order>>(`/orders/${encodeURIComponent(id)}`))
    } catch (e) {
      if ((e as { status?: number }).status === 404) return null
      throw e
    }
  }
  async create(draft: OrderDraft): Promise<Order> {
    return unwrap(await this.http.post<Envelope<Order>>('/orders', draft))
  }
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return unwrap(await this.http.patch<Envelope<Order>>(`/orders/${encodeURIComponent(id)}/status`, { status }))
  }
}

export class ApiCustomerRepository implements CustomerRepository {
  constructor(private readonly http: HttpClient) {}
  async getProfile(): Promise<Customer | null> {
    try {
      return unwrap(await this.http.get<Envelope<Customer>>('/customer/profile'))
    } catch (e) {
      if ((e as { status?: number }).status === 404 || (e as { status?: number }).status === 401) return null
      throw e
    }
  }
  async saveProfile(customer: Customer): Promise<Customer> {
    return unwrap(await this.http.put<Envelope<Customer>>('/customer/profile', customer))
  }
}

export class ApiClientRepository implements ClientRepository {
  constructor(
    private readonly http: HttpClient,
    private readonly fallback: ClientConfig,
  ) {}
  /** Static config stays the base; the API may override business facts (hours, contact, ordering rules). */
  async getConfig(): Promise<ClientConfig> {
    try {
      const remote = unwrap(await this.http.get<Envelope<Partial<ClientConfig>>>('/client/config'))
      return { ...this.fallback, ...remote, contact: { ...this.fallback.contact, ...remote.contact }, ordering: { ...this.fallback.ordering, ...remote.ordering } }
    } catch {
      return this.fallback
    }
  }
}
