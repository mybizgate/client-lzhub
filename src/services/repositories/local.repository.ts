import type { Category } from '../../types/category'
import type { ClientConfig } from '../../types/client'
import type { Product, ProductQuery } from '../../types/product'
import type { Customer, Order, OrderDraft, OrderStatus } from '../../types/order'
import type { StorageService } from '../storage'
import type { CatalogueRepository } from './catalogue.repository'
import type { OrderRepository } from './order.repository'
import type { CustomerRepository } from './customer.repository'
import type { ClientRepository } from './client.repository'
import { seedCategories } from '../../data/seed/categories'
import { buildSeedProducts, stockStatusFor } from '../../data/seed/products'
import { unitPrice, deliveryFee } from '../pricing'
import { dateISO } from '../../utils/date'
import { applyProductQuery } from '../product-query'

const PRODUCTS_KEY = 'products'
const ORDERS_KEY = 'orders'
const PROFILE_KEY = 'profile'

export class LocalCatalogueRepository implements CatalogueRepository {
  private products: Product[]

  constructor(
    private readonly storage: StorageService,
    config: ClientConfig,
  ) {
    const stored = storage.get<Product[]>(PRODUCTS_KEY)
    this.products = Array.isArray(stored) && stored.length ? stored : buildSeedProducts(config.ordering.referencePrefix, config.businessName)
  }

  async getCategories(): Promise<Category[]> {
    return [...seedCategories].filter((c) => c.active).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  }
  async getProducts(query?: ProductQuery): Promise<Product[]> {
    return applyProductQuery(this.products, query).map((p) => ({ ...p }))
  }
  async getProduct(slug: string): Promise<Product | null> {
    const p = this.products.find((x) => x.slug === slug || x.id === slug)
    return p ? { ...p } : null
  }
  async searchProducts(term: string): Promise<Product[]> {
    return this.getProducts({ search: term })
  }

  /** Used by the local order repository to reserve/release stock. */
  adjustStock(productId: string, delta: number) {
    const p = this.products.find((x) => x.id === productId)
    if (!p) return
    p.stock = Math.max(0, p.stock + delta)
    p.stockStatus = stockStatusFor(p.stock, p.minimumQuantity)
    this.storage.set(PRODUCTS_KEY, this.products)
  }
  snapshot(id: string): Product | undefined {
    return this.products.find((x) => x.id === id)
  }
}

export class LocalCustomerRepository implements CustomerRepository {
  constructor(private readonly storage: StorageService) {}
  async getProfile(): Promise<Customer | null> {
    return this.storage.get<Customer>(PROFILE_KEY)
  }
  async saveProfile(customer: Customer): Promise<Customer> {
    this.storage.set(PROFILE_KEY, customer)
    return customer
  }
}

export class LocalOrderRepository implements OrderRepository {
  private orders: Order[]

  constructor(
    private readonly storage: StorageService,
    private readonly catalogue: LocalCatalogueRepository,
    private readonly config: ClientConfig,
  ) {
    const stored = storage.get<Order[]>(ORDERS_KEY)
    this.orders = Array.isArray(stored) ? stored : []
  }

  async list(): Promise<Order[]> {
    return this.orders.map((o) => ({ ...o }))
  }
  async get(id: string): Promise<Order | null> {
    const o = this.orders.find((x) => x.id === id)
    return o ? { ...o } : null
  }
  async create(draft: OrderDraft): Promise<Order> {
    const ordering = this.config.ordering
    const items = draft.items.map(({ productId, qty }) => {
      const p = this.catalogue.snapshot(productId)
      if (!p || !p.active) throw new Error(`Produk ${productId} tidak tersedia.`)
      if (qty < p.minimumQuantity) throw new Error(`${p.name}: minimum ${p.minimumQuantity} ${p.unit}.`)
      if (qty > p.stock) throw new Error(`${p.name}: stok tersedia ${p.stock} ${p.unit}.`)
      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        unit: p.unit,
        packQty: p.packQty,
        size: p.size,
        qty,
        basePrice: p.price,
        unitPrice: unitPrice(p, qty, ordering),
        image: p.images[0],
        art: p.art,
      }
    })
    const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
    if (subtotal < ordering.minimumOrder) throw new Error('Jumlah pesanan belum mencapai minimum.')
    const fee = deliveryFee(subtotal, draft.fulfilment, ordering)
    const now = new Date().toISOString()
    const order: Order = {
      id: `${ordering.referencePrefix}-${dateISO().replace(/-/g, '')}-${(Date.now().toString(36) + Math.random().toString(36).slice(2, 4)).slice(-7).toUpperCase()}`,
      createdAt: now,
      status: 'draft_whatsapp',
      customer: { ...draft.customer },
      fulfilment: draft.fulfilment,
      requestedDate: draft.requestedDate,
      paymentMethod: draft.paymentMethod,
      notes: draft.notes,
      items,
      subtotal,
      deliveryFee: fee,
      total: subtotal + fee,
      history: [{ status: 'draft_whatsapp', at: now }],
    }
    this.orders.push(order)
    this.persist()
    return { ...order }
  }
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const o = this.orders.find((x) => x.id === id)
    if (!o) throw new Error('Pesanan tidak ditemui.')
    o.status = status
    o.history.push({ status, at: new Date().toISOString() })
    this.persist()
    return { ...o }
  }
  private persist() {
    this.storage.set(ORDERS_KEY, this.orders)
  }
}

export class LocalClientRepository implements ClientRepository {
  constructor(private readonly config: ClientConfig) {}
  async getConfig(): Promise<ClientConfig> {
    return this.config
  }
}
