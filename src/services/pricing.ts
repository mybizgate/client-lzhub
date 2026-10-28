import type { ClientConfig } from '../types/client'
import type { Product } from '../types/product'

export type Ordering = ClientConfig['ordering']

/** Unit price in cents after the best quantity discount for `qty`. */
export function unitPrice(product: Pick<Product, 'price'>, qty: number, ordering: Ordering): number {
  const tiers = [...ordering.quantityDiscounts].sort((a, b) => b.minQty - a.minQty)
  const tier = tiers.find((t) => qty >= t.minQty)
  return Math.round(product.price * (1 - (tier?.rate ?? 0)))
}

export function deliveryFee(subtotal: number, fulfilment: 'delivery' | 'pickup', ordering: Ordering): number {
  if (fulfilment === 'pickup') return 0
  if (ordering.freeDeliveryFrom !== undefined && subtotal >= ordering.freeDeliveryFrom) return 0
  return ordering.deliveryFee
}

export function discountPercent(product: Pick<Product, 'price' | 'oldPrice'>): number {
  if (!product.oldPrice || product.oldPrice <= product.price) return 0
  return Math.round((1 - product.price / product.oldPrice) * 100)
}

export function packDescription(p: Pick<Product, 'packQty' | 'size' | 'unit'>): string {
  return `${p.packQty} x ${p.size} / ${p.unit}`
}

export function isAvailable(p: Pick<Product, 'active' | 'stock' | 'minimumQuantity'>): boolean {
  return p.active && p.stock >= p.minimumQuantity
}

/** Tier table for the product detail view: [label, price]. */
export function priceTiers(product: Pick<Product, 'price' | 'unit'>, ordering: Ordering) {
  const sorted = [...ordering.quantityDiscounts].sort((a, b) => a.minQty - b.minQty)
  const tiers: { from: number; label: string; price: number }[] = []
  let from = 1
  for (const t of sorted) {
    tiers.push({ from, label: `${from}-${t.minQty - 1}`, price: unitPrice(product, from, ordering) })
    from = t.minQty
  }
  tiers.push({ from, label: `${from}+`, price: unitPrice(product, from, ordering) })
  return tiers
}
