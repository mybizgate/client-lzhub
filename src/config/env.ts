export type DataMode = 'local' | 'api'

function read(name: string, fallback = ''): string {
  const v = (import.meta.env as Record<string, string | undefined>)[name]
  return typeof v === 'string' && v.trim() ? v.trim() : fallback
}

const mode = read('VITE_DATA_MODE', 'local')

/**
 * Every MyBizGate tenant talks to two backends:
 *  - client-api (VITE_API_BASE_URL): business data such as products and orders
 *  - media-api  (VITE_MEDIA_API_BASE_URL): file and image uploads
 */
export const env = Object.freeze({
  clientCode: read('VITE_CLIENT_CODE', 'lzhub'),
  dataMode: (mode === 'api' ? 'api' : 'local') as DataMode,
  apiBaseUrl: read('VITE_API_BASE_URL', '').replace(/\/+$/, ''),
  mediaApiBaseUrl: read('VITE_MEDIA_API_BASE_URL', '').replace(/\/+$/, ''),
  siteUrl: read('VITE_SITE_URL', '').replace(/\/+$/, ''),
  isDev: import.meta.env.DEV,
})

if (env.dataMode === 'api' && !env.apiBaseUrl) {
  // Fail loudly in development; in production the API repositories throw on first call.
  console.error('[mybizgate] VITE_DATA_MODE=api requires VITE_API_BASE_URL')
}

if (env.dataMode === 'api' && !env.mediaApiBaseUrl) {
  console.error('[mybizgate] VITE_DATA_MODE=api requires VITE_MEDIA_API_BASE_URL')
}
