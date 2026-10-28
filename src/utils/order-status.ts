import type { OrderStatus } from '../types/order'

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  draft_whatsapp: 'Draf WhatsApp',
  pending_review: 'Menunggu semakan',
  confirmed: 'Disahkan',
  processing: 'Diproses',
  delivered: 'Dihantar',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

export const ORDER_STATUS_ORDER: OrderStatus[] = [
  'draft_whatsapp',
  'pending_review',
  'confirmed',
  'processing',
  'delivered',
  'completed',
  'cancelled',
]

export const OPEN_STATUSES: OrderStatus[] = ['draft_whatsapp', 'pending_review', 'confirmed', 'processing']

export function statusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABEL[status] ?? status
}

export function canCancel(status: OrderStatus): boolean {
  return OPEN_STATUSES.includes(status)
}
