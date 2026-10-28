/**
 * The only module allowed to touch localStorage. Keys are namespaced per client and
 * versioned (mybizgate:<client>:<name>:v<version>) so tenants never collide.
 */
export interface StorageService {
  key(name: string, version?: number): string
  get<T>(name: string, version?: number): T | null
  set<T>(name: string, value: T, version?: number): boolean
  remove(name: string, version?: number): void
  readonly available: boolean
  onChange(name: string, handler: () => void, version?: number): () => void
}

function detect(): boolean {
  try {
    const probe = '__mybizgate_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

export function createStorage(clientCode: string): StorageService {
  const available = typeof window !== 'undefined' && detect()
  const key = (name: string, version = 1) => `mybizgate:${clientCode}:${name}:v${version}`
  return {
    available,
    key,
    get<T>(name: string, version = 1): T | null {
      if (!available) return null
      try {
        const raw = window.localStorage.getItem(key(name, version))
        return raw ? (JSON.parse(raw) as T) : null
      } catch {
        return null
      }
    },
    set<T>(name: string, value: T, version = 1): boolean {
      if (!available) return false
      try {
        window.localStorage.setItem(key(name, version), JSON.stringify(value))
        return true
      } catch {
        return false
      }
    },
    remove(name: string, version = 1) {
      if (!available) return
      try {
        window.localStorage.removeItem(key(name, version))
      } catch {
        /* ignore */
      }
    },
    onChange(name, handler, version = 1) {
      if (typeof window === 'undefined') return () => {}
      const k = key(name, version)
      const listener = (e: StorageEvent) => {
        if (e.key === k) handler()
      }
      window.addEventListener('storage', listener)
      return () => window.removeEventListener('storage', listener)
    },
  }
}
