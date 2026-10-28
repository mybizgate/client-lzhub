import type { Customer } from '../../types/order'

export interface CustomerRepository {
  getProfile(): Promise<Customer | null>
  saveProfile(customer: Customer): Promise<Customer>
}
