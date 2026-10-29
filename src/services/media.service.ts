import { env } from '../config/env'
import { HttpError } from './http'

/**
 * Client for the MyBizGate Media API (VITE_MEDIA_API_BASE_URL). Media never goes
 * through client-api: uploads, previews, downloads and deletes all live here.
 * The tenant is identified by X-Client-Code; the backend enforces isolation.
 */

export type MediaType = 'image' | 'file'
export type MediaVisibility = 'public' | 'private'

export interface MediaItem {
  id: string
  tenant: string
  module: string
  entity_id: string | null
  type: MediaType
  format: string
  mime_type: string
  visibility: MediaVisibility
  original_filename: string
  original_mime_type: string
  size_bytes: number
  original_size_bytes: number
  width: number | null
  height: number | null
  thumbnail: boolean
  created_at: string
  updated_at: string
  view_url: string
  thumbnail_url: string | null
  metadata_url: string
  download_url: string
}

export interface MediaListMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
}

export interface MediaUploadOptions {
  module: string
  entityId?: string
  visibility?: MediaVisibility
}

export interface MediaListFilters {
  module?: string
  entityId?: string
  mediaType?: MediaType
  year?: number
  month?: number
  page?: number
  perPage?: number
}

interface Envelope<T> {
  success: boolean
  data: T
  meta?: MediaListMeta
  message?: string
  errors?: Record<string, string[]>
}

export class MediaApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly clientCode: string,
  ) {}

  get configured(): boolean {
    return this.baseUrl !== ''
  }

  viewUrl(id: string): string {
    return `${this.base()}/media/${encodeURIComponent(id)}`
  }

  thumbnailUrl(id: string): string {
    return `${this.viewUrl(id)}/thumbnail`
  }

  downloadUrl(id: string): string {
    return `${this.viewUrl(id)}/download`
  }

  async upload(file: File, options: MediaUploadOptions): Promise<MediaItem> {
    const body = new FormData()
    body.append('file', file)
    body.append('module', options.module)
    if (options.entityId) body.append('entity_id', options.entityId)
    if (options.visibility) body.append('visibility', options.visibility)

    return this.request<MediaItem>(`${this.base()}/media`, { method: 'POST', body })
  }

  /** Replace the content of an existing media item; the id and URLs stay the same. */
  async replace(id: string, file: File, visibility?: MediaVisibility): Promise<MediaItem> {
    // PHP cannot parse multipart PUT bodies, so the API accepts POST + _method=PUT.
    const body = new FormData()
    body.append('_method', 'PUT')
    body.append('file', file)
    if (visibility) body.append('visibility', visibility)

    return this.request<MediaItem>(this.viewUrl(id), { method: 'POST', body })
  }

  async metadata(id: string): Promise<MediaItem> {
    return this.request<MediaItem>(`${this.viewUrl(id)}/metadata`)
  }

  async remove(id: string): Promise<void> {
    await this.request<{ id: string; deleted: boolean }>(this.viewUrl(id), { method: 'DELETE' })
  }

  async list(filters: MediaListFilters = {}): Promise<{ items: MediaItem[]; meta: MediaListMeta }> {
    const url = new URL(`${this.base()}/media`)
    const params: Record<string, string | number | undefined> = {
      module: filters.module,
      entity_id: filters.entityId,
      media_type: filters.mediaType,
      year: filters.year,
      month: filters.month,
      page: filters.page,
      per_page: filters.perPage,
    }
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
    }

    const res = await fetch(url.toString(), { headers: this.headers(), credentials: 'omit' })
    const envelope = await this.parse<MediaItem[]>(res)
    return { items: envelope.data, meta: envelope.meta as MediaListMeta }
  }

  /** Fetch the stored file as a Blob (uses the tenant header so private media works too). */
  async downloadBlob(id: string): Promise<Blob> {
    const res = await fetch(this.downloadUrl(id), { headers: this.headers(), credentials: 'omit' })
    if (!res.ok) throw new HttpError(res.status, `Download failed: HTTP ${res.status}`)
    return res.blob()
  }

  private base(): string {
    if (!this.baseUrl) throw new HttpError(0, 'Media API base URL is not configured (VITE_MEDIA_API_BASE_URL)')
    return this.baseUrl
  }

  private headers(): Headers {
    const headers = new Headers()
    headers.set('Accept', 'application/json')
    headers.set('X-Client-Code', this.clientCode)
    return headers
  }

  private async request<T>(url: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(url, { ...init, headers: this.headers(), credentials: 'omit' })
    return (await this.parse<T>(res)).data
  }

  private async parse<T>(res: Response): Promise<Envelope<T>> {
    const text = await res.text()
    let body: Envelope<T> | null = null
    try {
      body = text ? (JSON.parse(text) as Envelope<T>) : null
    } catch {
      body = null
    }
    if (!res.ok || !body || body.success === false) {
      const message = body?.message ?? `${res.status} ${res.statusText}`
      throw new HttpError(res.status, message, body)
    }
    return body
  }
}

export const mediaApi = new MediaApiClient(env.mediaApiBaseUrl, env.clientCode)
