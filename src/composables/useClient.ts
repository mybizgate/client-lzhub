import { computed } from 'vue'
import { useClientStore } from '../stores/client'

export function useClient() {
  const store = useClientStore()
  const config = computed(() => store.config)
  return { config, money: store.money }
}
