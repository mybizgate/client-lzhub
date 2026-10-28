import type { ClientConfig } from '../../types/client'

export interface ClientRepository {
  /** Returns the effective configuration (static in local mode; may be merged with API data later). */
  getConfig(): Promise<ClientConfig>
}
