import type { Order, OrderDraft, OrderStatus } from '../../types/order'

export interface OrderRepository {
  list(): Promise<Order[]>
  get(id: string): Promise<Order | null>
  /** Prices the draft and stores it. Local mode prices from the catalogue; API mode lets Laravel price it. */
  create(draft: OrderDraft): Promise<Order>
  updateStatus(id: string, status: OrderStatus): Promise<Order>
}
