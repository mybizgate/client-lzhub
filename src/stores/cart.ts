import { defineStore } from 'pinia'
import { computed } from 'vue'
import type { Product } from '../types/product'
import { useCatalogueStore } from './catalogue'
import { useClientStore } from './client'
import { unitPrice, deliveryFee as feeFor } from '../services/pricing'
import { usePersistedRef } from './persist'

export interface CartEntry {
  product: Product
  qty: number
  unitPrice: number
  lineTotal: number
}

type Lines = Record<string, number>
const isLines = (v: unknown): v is Lines =>
  !!v && typeof v === 'object' && !Array.isArray(v) && Object.values(v as object).every((q) => Number.isInteger(q) && (q as number) > 0)

export const useCartStore = defineStore('cart', () => {
  const lines = usePersistedRef<Lines>('cart', () => ({}), isLines)
  const catalogue = useCatalogueStore()
  const client = useClientStore()
  const ordering = computed(() => client.config.ordering)

  const entries = computed<CartEntry[]>(() =>
    Object.entries(lines.value)
      .map(([id, qty]) => {
        const product = catalogue.product(id)
        if (!product) return null
        const price = unitPrice(product, qty, ordering.value)
        return { product, qty, unitPrice: price, lineTotal: price * qty }
      })
      .filter((e): e is CartEntry => e !== null),
  )
  const count = computed(() => Object.values(lines.value).reduce((s, q) => s + q, 0))
  const subtotal = computed(() => entries.value.reduce((s, e) => s + e.lineTotal, 0))
  const fullPrice = computed(() => entries.value.reduce((s, e) => s + e.product.price * e.qty, 0))
  const savings = computed(() => Math.max(0, fullPrice.value - subtotal.value))
  const meetsMinimum = computed(() => subtotal.value >= ordering.value.minimumOrder)
  const remainingToMinimum = computed(() => Math.max(0, ordering.value.minimumOrder - subtotal.value))
  const issues = computed(() =>
    entries.value
      .filter((e) => !e.product.active || e.product.stock < e.qty || e.qty < e.product.minimumQuantity)
      .map((e) =>
        !e.product.active
          ? `${e.product.name}: produk tidak tersedia`
          : e.qty < e.product.minimumQuantity
            ? `${e.product.name}: minimum ${e.product.minimumQuantity} ${e.product.unit}`
            : `${e.product.name}: stok tersedia ${e.product.stock} ${e.product.unit}`,
      ),
  )
  const signature = computed(() => JSON.stringify(entries.value.map((e) => [e.product.id, e.qty, e.product.price, e.product.stock, e.product.active])))

  function qtyOf(id: string) {
    return lines.value[id] ?? 0
  }
  function deliveryFee(fulfilment: 'delivery' | 'pickup') {
    return feeFor(subtotal.value, fulfilment, ordering.value)
  }

  type Result = { ok: true; message?: string } | { ok: false; message: string }

  function change(id: string, delta: number): Result {
    const p = catalogue.product(id)
    if (!p?.active) return { ok: false, message: 'Produk tidak tersedia.' }
    const current = qtyOf(id)
    if (delta > 0 && p.stock < p.minimumQuantity) return { ok: false, message: 'Stok belum mencukupi untuk pesanan minimum.' }
    const next = current === 0 ? p.minimumQuantity : current + delta
    if (next < p.minimumQuantity) {
      remove(id)
      return { ok: true }
    }
    if (next > p.stock) return { ok: false, message: `Maksimum ${p.stock} ${p.unit} tersedia.` }
    lines.value = { ...lines.value, [id]: next }
    return { ok: true, message: current === 0 && delta > 0 ? `${p.minimumQuantity} ${p.unit} ditambah ke troli.` : undefined }
  }
  function add(id: string) {
    return change(id, 1)
  }
  function increment(id: string) {
    return change(id, 1)
  }
  function decrement(id: string) {
    return change(id, -1)
  }
  function setQty(id: string, qty: number) {
    const p = catalogue.product(id)
    if (!p) return
    const clamped = Math.min(p.stock, Math.max(p.minimumQuantity, qty))
    lines.value = { ...lines.value, [id]: clamped }
  }
  function remove(id: string) {
    const next = { ...lines.value }
    delete next[id]
    lines.value = next
  }
  function clear() {
    lines.value = {}
  }
  /** Clamp every line to current stock/minimum and drop unavailable products. */
  function repair() {
    const next: Lines = {}
    for (const [id, qty] of Object.entries(lines.value)) {
      const p = catalogue.product(id)
      if (!p?.active || p.stock < p.minimumQuantity) continue
      next[id] = Math.min(p.stock, Math.max(p.minimumQuantity, qty))
    }
    lines.value = next
  }

  return {
    lines,
    entries,
    count,
    subtotal,
    fullPrice,
    savings,
    meetsMinimum,
    remainingToMinimum,
    issues,
    signature,
    qtyOf,
    deliveryFee,
    add,
    increment,
    decrement,
    setQty,
    remove,
    clear,
    repair,
  }
})
