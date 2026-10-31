import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { CheckoutDraft, Customer, Order, OrderDraft } from '../types/order'
import { orderService, validateDraft } from '../services/order.service'
import { useCartStore } from './cart'
import { useCatalogueStore } from './catalogue'
import { useClientStore } from './client'
import { usePersistedRef } from './persist'
import { dateISO } from '../utils/date'
import { hasStock } from '../services/pricing'

const emptyCustomer = (): Customer => ({ storeName: '', contactName: '', phone: '', address: '' })

const isDraft = (v: unknown): v is CheckoutDraft =>
  !!v && typeof v === 'object' && 'customer' in (v as object) && 'fulfilment' in (v as object)

export const useOrderStore = defineStore('order', () => {
  const client = useClientStore()
  const cart = useCartStore()
  const catalogue = useCatalogueStore()

  const orders = ref<Order[]>([])
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const profile = ref<Customer | null>(null)

  /** Checkout form state survives refreshes (persisted) until the order is submitted. */
  const draft = usePersistedRef<CheckoutDraft>(
    'checkout-draft',
    () => ({
      customer: emptyCustomer(),
      fulfilment: 'delivery',
      requestedDate: dateISO(1),
      paymentMethod: client.config.ordering.paymentOptions[0] ?? '',
      notes: '',
      saveProfile: true,
    }),
    isDraft,
  )

  const sorted = computed(() => [...orders.value].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))

  async function load(force = false) {
    if (status.value === 'loading' || (status.value === 'ready' && !force)) return
    status.value = 'loading'
    try {
      orders.value = await orderService.list()
      status.value = 'ready'
    } catch {
      status.value = 'error'
    }
  }
  async function loadProfile() {
    profile.value = await orderService.profile()
    if (profile.value && !draft.value.customer.storeName) draft.value.customer = { ...profile.value }
  }
  async function saveProfile(c: Customer) {
    profile.value = await orderService.saveProfile({ ...c })
    draft.value.customer = { ...c }
  }
  function byId(id: string) {
    return orders.value.find((o) => o.id === id)
  }
  async function fetch(id: string) {
    const cached = byId(id)
    if (cached) return cached
    const o = await orderService.get(id)
    if (o) orders.value.push(o)
    return o
  }

  /** Validates and submits the checkout draft from the current cart. Returns the stored order. */
  async function submit(): Promise<Order> {
    const input: OrderDraft = {
      customer: { ...draft.value.customer },
      fulfilment: draft.value.fulfilment,
      requestedDate: draft.value.requestedDate,
      paymentMethod: draft.value.paymentMethod,
      notes: draft.value.notes.trim(),
      items: cart.entries.map((e) => ({ productId: e.product.id, qty: e.qty })),
    }
    const err = validateDraft(input)
    if (err) throw new Error(err)
    if (cart.issues.length) throw new Error('Stok atau syarat telah berubah. Semak semula troli.')
    if (!cart.meetsMinimum) throw new Error(`Minimum pesanan ialah ${client.money(client.config.ordering.minimumOrder)}.`)
    const order = await orderService.create(input)
    orders.value.push(order)
    if (draft.value.saveProfile) await saveProfile(input.customer)
    cart.clear()
    draft.value = { ...draft.value, notes: '', requestedDate: dateISO(1) }
    return order
  }

  async function markSent(id: string) {
    const o = byId(id)
    if (!o || o.status !== 'draft_whatsapp') return
    replace(await orderService.updateStatus(id, 'pending_review'))
  }
  async function cancel(id: string) {
    const o = byId(id)
    if (!o) return
    replace(await orderService.updateStatus(id, 'cancelled'))
  }
  /** Re-adds an old order's items to the cart at current prices. */
  function reorder(id: string) {
    const o = byId(id)
    if (!o) return { added: 0, skipped: 0, adjusted: 0 }
    let added = 0
    let skipped = 0
    let adjusted = 0
    for (const item of o.items) {
      const p = catalogue.product(item.productId)
      if (!p?.active || !hasStock(p)) {
        skipped++
        continue
      }
      const requested = cart.qtyOf(p.id) + Math.max(p.minimumQuantity, item.qty)
      const qty = p.stock === null ? requested : Math.min(p.stock, requested)
      if (qty !== requested) adjusted++
      cart.setQty(p.id, qty)
      added++
    }
    return { added, skipped, adjusted }
  }
  function replace(o: Order) {
    const i = orders.value.findIndex((x) => x.id === o.id)
    if (i >= 0) orders.value[i] = o
    else orders.value.push(o)
  }

  return { orders, sorted, status, profile, draft, load, loadProfile, saveProfile, byId, fetch, submit, markSent, cancel, reorder }
})
