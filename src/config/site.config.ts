import { env } from './env'
import { resolveClient } from './clients'
import type { ClientConfig } from '../types/client'

/** The active client's configuration, chosen by VITE_CLIENT_CODE at build time. */
export const siteConfig: ClientConfig = resolveClient(env.clientCode)
