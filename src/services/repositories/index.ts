import { env } from '../../config/env'
import { siteConfig } from '../../config/site.config'
import { http } from '../http'
import { getGuestToken, getStaffToken, sessionStorageInstance } from '../session'
import type { CatalogueRepository } from './catalogue.repository'
import type { OrderRepository } from './order.repository'
import type { CustomerRepository } from './customer.repository'
import type { ClientRepository } from './client.repository'
import type { AuthRepository } from './auth.repository'
import type { ManageRepository } from './manage.repository'
import { LocalCatalogueRepository, LocalOrderRepository, LocalCustomerRepository, LocalClientRepository, LocalManageRepository } from './local.repository'
import { ApiCatalogueRepository, ApiOrderRepository, ApiCustomerRepository, ApiClientRepository } from './api.repository'
import { ApiAuthRepository, LocalAuthRepository } from './auth.repository'
import { ApiManageRepository } from './manage.repository'

export interface Repositories {
  catalogue: CatalogueRepository
  orders: OrderRepository
  customer: CustomerRepository
  client: ClientRepository
  auth: AuthRepository
  manage: ManageRepository
}

/** Shared storage instance; stores use it for their own persisted slices too. */
export const storage = sessionStorageInstance

function build(): Repositories {
  if (env.dataMode === 'api') {
    http.setTokenProvider(() => getStaffToken() ?? getGuestToken())
    return {
      catalogue: new ApiCatalogueRepository(http),
      orders: new ApiOrderRepository(http),
      customer: new ApiCustomerRepository(http),
      client: new ApiClientRepository(http, siteConfig),
      auth: new ApiAuthRepository(http),
      manage: new ApiManageRepository(http),
    }
  }
  const catalogue = new LocalCatalogueRepository(storage, siteConfig)
  return {
    catalogue,
    orders: new LocalOrderRepository(storage, catalogue, siteConfig),
    customer: new LocalCustomerRepository(storage),
    client: new LocalClientRepository(siteConfig),
    auth: new LocalAuthRepository(),
    manage: new LocalManageRepository(catalogue),
  }
}

export const repositories: Repositories = build()
