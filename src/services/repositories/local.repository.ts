import type { Category, CategoryInput, ManagedCategory } from '../../types/category'
import type { ClientConfig } from '../../types/client'
import type { ManagedProduct, Product, ProductInput, ProductQuery } from '../../types/product'
import type { Customer, Order, OrderDraft, OrderStatus } from '../../types/order'
import type { StorageService } from '../storage'
import type { CatalogueRepository } from './catalogue.repository'
import type { OrderRepository } from './order.repository'
import type { CustomerRepository } from './customer.repository'
import type { ClientRepository } from './client.repository'
import type { ManageRepository } from './manage.repository'
import { seedCategories } from '../../data/seed/categories'
import { buildSeedProducts, stockStatusFor } from '../../data/seed/products'
import { unitPrice, deliveryFee } from '../pricing'
import { dateISO } from '../../utils/date'
import { applyProductQuery } from '../product-query'
import { slugify } from '../../utils/slug'

const PRODUCTS_KEY = 'products'
const CATEGORIES_KEY = 'categories'
const ORDERS_KEY = 'orders'
const PROFILE_KEY = 'profile'

export class LocalCatalogueRepository implements CatalogueRepository {
  private products: Product[]
  private categories: Category[]

  constructor(
    private readonly storage: StorageService,
    config: ClientConfig,
  ) {
    const stored = storage.get<Product[]>(PRODUCTS_KEY)
    this.products = Array.isArray(stored) && stored.length ? stored : buildSeedProducts(config.ordering.referencePrefix, config.businessName)
    const storedCategories = storage.get<Category[]>(CATEGORIES_KEY)
    this.categories = Array.isArray(storedCategories) && storedCategories.length ? storedCategories : [...seedCategories]
  }

  async getCategories(): Promise<Category[]> {
    return this.categories.filter((c) => c.active).map((c) => ({ ...c })).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
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
    if (!p || p.stock === null) return
    p.stock = Math.max(0, p.stock + delta)
    p.stockStatus = stockStatusFor(p.stock, p.minimumQuantity)
    this.storage.set(PRODUCTS_KEY, this.products)
  }
  snapshot(id: string): Product | undefined {
    return this.products.find((x) => x.id === id)
  }

  all(): Product[] {
    return this.products.map((p) => ({ ...p, images: [...p.images] }))
  }

  upsert(product: Product): void {
    const index = this.products.findIndex((p) => p.id === product.id)
    const next = { ...product, images: [...product.images] }
    if (index >= 0) this.products[index] = next
    else this.products.push(next)
    this.storage.set(PRODUCTS_KEY, this.products)
  }

  allCategories(): Category[] {
    return this.categories.map((category) => ({ ...category }))
  }

  upsertCategory(category: Category): void {
    const index = this.categories.findIndex((item) => item.id === category.id)
    if (index >= 0) this.categories[index] = { ...category }
    else this.categories.push({ ...category })
    this.storage.set(CATEGORIES_KEY, this.categories)
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
      if (p.stock !== null && qty > p.stock) throw new Error(`${p.name}: stok tersedia ${p.stock} ${p.unit}.`)
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

export class LocalManageRepository implements ManageRepository {
  constructor(private readonly catalogue: LocalCatalogueRepository) {}

  async listProducts(): Promise<ManagedProduct[]> {
    return this.catalogue.all().map(toManagedProduct).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
  }

  async createProduct(input: ProductInput): Promise<ManagedProduct> {
    const products = await this.listProducts()
    const numericIds = products.map((p) => Number(p.id)).filter(Number.isFinite)
    const id = String((numericIds.length ? Math.max(...numericIds) : 0) + 1)
    const product = productFromInput(id, uniqueProductSlug(input, products), input, undefined, products.length + 1)
    this.catalogue.upsert(product)
    return { ...product, images: [...product.images] }
  }

  async updateProduct(id: string, input: ProductInput): Promise<ManagedProduct> {
    const products = await this.listProducts()
    const current = products.find((product) => product.id === id)
    if (!current) throw new Error('Produk tidak ditemui.')
    const product = productFromInput(id, uniqueProductSlug(input, products, id), input, current, current.sortOrder)
    this.catalogue.upsert(product)
    return { ...product, images: [...product.images] }
  }

  async listCategories(): Promise<ManagedCategory[]> {
    return this.catalogue.allCategories().map((category) => {
      const managed = category as Category & Partial<ManagedCategory>
      const status = managed.status ?? (category.active ? 'active' : 'draft')
      return { ...category, active: status === 'active', status, parentId: managed.parentId ?? null }
    })
  }

  async createCategory(input: CategoryInput): Promise<ManagedCategory> {
    const categories = await this.listCategories()
    const numericIds = categories.map((category) => Number(category.id)).filter(Number.isFinite)
    const id = String((numericIds.length ? Math.max(...numericIds) : 0) + 1)
    const baseSlug = input.slug?.trim() || slugify(input.name)
    let slug = baseSlug
    let suffix = 2
    while (categories.some((category) => category.slug === slug)) slug = `${baseSlug}-${suffix++}`
    const status = input.status ?? 'active'
    const category: ManagedCategory = {
      id,
      name: input.name.trim(),
      slug,
      description: input.description ?? undefined,
      active: status === 'active',
      sortOrder: input.sortOrder ?? categories.length + 1,
      status,
      parentId: null,
    }
    this.catalogue.upsertCategory(category)
    return { ...category }
  }

  async setPrimaryImage(productId: string, file: File): Promise<string> {
    if (file.size > 1024 * 1024) throw new Error('Gambar mesti bersaiz 1 MB atau kurang dalam mod tempatan.')
    const dataUrl = await readDataUrl(file)
    const product = (await this.listProducts()).find((item) => item.id === productId)
    if (!product) throw new Error('Produk tidak ditemui.')
    product.images = [dataUrl, ...product.images.slice(1)]
    this.catalogue.upsert(product)
    return dataUrl
  }
}

function toManagedProduct(product: Product): ManagedProduct {
  const managed = product as Product & Partial<ManagedProduct>
  const status = managed.status ?? (product.active ? 'active' : 'draft')
  const unlimitedStock = managed.unlimitedStock ?? product.stock === null
  return {
    ...product,
    images: [...product.images],
    active: status === 'active',
    status,
    sortOrder: managed.sortOrder ?? (Number(product.id) || 0),
    stockQuantity: managed.stockQuantity ?? product.stock ?? 0,
    unlimitedStock,
    lowStockThreshold: managed.lowStockThreshold ?? 10,
    featured: managed.featured ?? Boolean(product.featured),
  }
}

function uniqueProductSlug(input: ProductInput, products: ManagedProduct[], currentId?: string): string {
  const base = input.slug?.trim() || slugify(`${input.name} ${input.size}`)
  let slug = base
  let suffix = 2
  while (products.some((product) => product.id !== currentId && product.slug === slug)) slug = `${base}-${suffix++}`
  return slug
}

function productFromInput(
  id: string,
  slug: string,
  input: ProductInput,
  current: ManagedProduct | undefined,
  defaultSortOrder: number,
): ManagedProduct {
  const stock = input.unlimitedStock ? null : input.stockQuantity
  const oldPrice = input.oldPrice && input.oldPrice > input.price ? input.oldPrice : undefined
  return {
    id,
    sku: input.sku ?? undefined,
    name: input.name.trim(),
    slug,
    description: input.description ?? undefined,
    categoryId: input.categoryId,
    images: current ? [...current.images] : [],
    unit: input.unit,
    packQty: input.packQty,
    size: input.size,
    price: input.price,
    oldPrice,
    minimumQuantity: input.minimumQuantity,
    stock,
    stockStatus: stockStatusFor(stock, input.minimumQuantity),
    featured: input.featured ?? current?.featured ?? false,
    promo: oldPrice !== undefined,
    brand: input.brand ?? undefined,
    active: input.status === 'active',
    art: current?.art,
    updatedAt: new Date().toISOString(),
    status: input.status,
    sortOrder: input.sortOrder ?? current?.sortOrder ?? defaultSortOrder,
    stockQuantity: input.stockQuantity,
    unlimitedStock: input.unlimitedStock,
    lowStockThreshold: current?.lowStockThreshold ?? 10,
  }
}

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Gambar tidak dapat dibaca.'))
    reader.onerror = () => reject(new Error('Gambar tidak dapat dibaca.'))
    reader.readAsDataURL(file)
  })
}
