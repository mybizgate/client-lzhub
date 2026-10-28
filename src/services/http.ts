import { env } from '../config/env'

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

type TokenProvider = () => string | null

/**
 * Minimal fetch wrapper for the future Laravel API. Sends the tenant identifier as
 * X-Client-Code (identification only; the backend must still authorise properly) and
 * a bearer token when an auth provider has been registered.
 */
export class HttpClient {
  private tokenProvider: TokenProvider = () => null

  constructor(
    private readonly baseUrl: string,
    private readonly clientCode: string,
  ) {}

  setTokenProvider(provider: TokenProvider) {
    this.tokenProvider = provider
  }

  async request<T>(path: string, init: RequestInit & { query?: Record<string, string | number | boolean | undefined> } = {}): Promise<T> {
    if (!this.baseUrl) throw new HttpError(0, 'API base URL is not configured (VITE_API_BASE_URL)')
    const url = new URL(this.baseUrl + (path.startsWith('/') ? path : `/${path}`))
    for (const [k, v] of Object.entries(init.query ?? {})) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
    }
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json')
    headers.set('X-Client-Code', this.clientCode)
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    const token = this.tokenProvider()
    if (token) headers.set('Authorization', `Bearer ${token}`)

    const res = await fetch(url.toString(), { ...init, headers, credentials: 'omit' })
    const text = await res.text()
    const data = text ? safeJson(text) : null
    if (!res.ok) {
      const message = (data as { message?: string } | null)?.message ?? `${res.status} ${res.statusText}`
      throw new HttpError(res.status, message, data)
    }
    return data as T
  }

  get<T>(path: string, query?: Record<string, string | number | boolean | undefined>) {
    return this.request<T>(path, { method: 'GET', query })
  }
  post<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) })
  }
  put<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) })
  }
  patch<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export const http = new HttpClient(env.apiBaseUrl, env.clientCode)
