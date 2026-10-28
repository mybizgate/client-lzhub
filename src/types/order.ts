import type { ProductArt } from './product'

export type OrderStatus =
  | 'draft_whatsapp'
  | 'pending_review'
  | 'confirmed'
  | 'processing'
  | 'delivered'
  | 'completed'
  | 'cancelled'

export type FulfilmentMethod = 'delivery' | 'pickup'

export interface Customer {
  storeName: string
  contactName: string
  phone: string
  address: string
}

export interface OrderItem {
  productId: string
  sku?: string
  name: string
  slug: string
  unit: string
  packQty: number
  size: string
  qty: number
  /** Base unit price in cents at the time of ordering. */
  basePrice: number
  /** Unit price in cents after quantity discount. */
  unitPrice: number
  image?: string
  art?: ProductArt
}

export interface Order {
  id: string
  createdAt: string
  status: OrderStatus
  customer: Customer
  fulfilment: FulfilmentMethod
  requestedDate: string
  paymentMethod: string
  notes: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  history: { status: OrderStatus; at: string }[]
  seeded?: boolean
}

/** What the UI submits. Pricing is resolved by the repository (locally or by the API). */
export interface OrderDraft {
  customer: Customer
  fulfilment: FulfilmentMethod
  requestedDate: string
  paymentMethod: string
  notes: string
  items: { productId: string; qty: number }[]
}

export interface CheckoutDraft extends Omit<OrderDraft, 'items'> {
  saveProfile: boolean
}
