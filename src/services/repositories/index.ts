import { env } from '../../config/env'
import { siteConfig } from '../../config/site.config'
import { createStorage } from '../storage'
import { http } from '../http'
import type { CatalogueRepository } from './catalogue.repository'
import type { OrderRepository } from './order.repository'
import type { CustomerRepository } from './customer.repository'
import type { ClientRepository } from './client.repository'
import { LocalCatalogueRepository, LocalOrderRepository, LocalCustomerRepository, LocalClientRepository } from './local.repository'
import { ApiCatalogueRepository, ApiOrderRepository, ApiCustomerRepository, ApiClientRepository } from './api.repository'

export interface Repositories {
  catalogue: CatalogueRepository
  orders: OrderRepository
  customer: CustomerRepository
  client: ClientRepository
}

/** Shared storage instance; stores use it for their own persisted slices too. */
export const storage = createStorage(env.clientCode)

function build(): Repositories {
  if (env.dataMode === 'api') {
    return {
      catalogue: new ApiCatalogueRepository(http),
      orders: new ApiOrderRepository(http),
      customer: new ApiCustomerRepository(http),
      client: new ApiClientRepository(http, siteConfig),
    }
  }
  const catalogue = new LocalCatalogueRepository(storage, siteConfig)
  return {
    catalogue,
    orders: new LocalOrderRepository(storage, catalogue, siteConfig),
    customer: new LocalCustomerRepository(storage),
    client: new LocalClientRepository(siteConfig),
  }
}

export const repositories: Repositories = build()
