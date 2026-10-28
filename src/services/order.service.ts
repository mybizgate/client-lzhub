import { repositories } from './repositories'
import type { Customer, OrderDraft, OrderStatus } from '../types/order'
import { dateISO } from '../utils/date'

export function validateCustomer(c: Customer, addressRequired: boolean): string {
  if (c.storeName.trim().length < 2 || c.contactName.trim().length < 2) return 'Sila isi nama kedai dan penerima yang sah.'
  const digits = c.phone.replace(/\D/g, '')
  if (digits.length < 9 || digits.length > 15) return 'Sila masukkan nombor telefon yang sah.'
  if (addressRequired && c.address.trim().length < 10) return 'Sila isi alamat lengkap untuk penghantaran.'
  return ''
}

export function validateDraft(draft: OrderDraft): string {
  const err = validateCustomer(draft.customer, draft.fulfilment === 'delivery')
  if (err) return err
  if (!draft.requestedDate || draft.requestedDate < dateISO(1)) return 'Pilih tarikh esok atau selepasnya.'
  if (!draft.items.length) return 'Troli kosong.'
  return ''
}

export const orderService = {
  list: () => repositories.orders.list(),
  get: (id: string) => repositories.orders.get(id),
  create: (draft: OrderDraft) => repositories.orders.create(draft),
  updateStatus: (id: string, status: OrderStatus) => repositories.orders.updateStatus(id, status),
  profile: () => repositories.customer.getProfile(),
  saveProfile: (c: Customer) => repositories.customer.saveProfile(c),
}
