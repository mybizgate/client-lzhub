import { ref, watch, type Ref } from 'vue'
import { storage } from '../services/repositories'

/**
 * A ref whose value is mirrored to the namespaced, versioned storage key and refreshed
 * when another tab changes it. Components never touch localStorage themselves.
 */
export function usePersistedRef<T>(name: string, fallback: () => T, validate: (v: unknown) => v is T, version = 1): Ref<T> {
  const stored = storage.get<unknown>(name, version)
  const state = ref(validate(stored) ? stored : fallback()) as Ref<T>
  watch(
    state,
    (value) => {
      storage.set(name, value, version)
    },
    { deep: true },
  )
  storage.onChange(
    name,
    () => {
      const next = storage.get<unknown>(name, version)
      if (validate(next)) state.value = next
    },
    version,
  )
  return state
}

export const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string')
