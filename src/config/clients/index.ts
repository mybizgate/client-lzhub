import type { ClientConfig } from '../../types/client'
import { lzhub } from './lzhub'

/** Registry of every MyBizGate supplier client this codebase can build. Add new clients here. */
export const clients: Record<string, ClientConfig> = {
  lzhub,
}

export function resolveClient(code: string): ClientConfig {
  const config = clients[code]
  if (!config) {
    throw new Error(`Unknown client code "${code}". Known clients: ${Object.keys(clients).join(', ')}`)
  }
  return config
}
