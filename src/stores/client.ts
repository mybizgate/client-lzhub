import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { siteConfig } from '../config/site.config'
import { repositories, storage } from '../services/repositories'
import type { ClientConfig } from '../types/client'
import { formatMoney } from '../utils/money'

function hexToRgb(hex: string | undefined, fallback: string): string {
  if (!hex) return fallback
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return fallback
  const n = parseInt(m[1]!, 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

export const useClientStore = defineStore('client', () => {
  const config = ref<ClientConfig>(siteConfig)
  const ready = ref(false)
  const storageAvailable = computed(() => storage.available)

  function applyTheme() {
    const b = config.value.branding
    const root = document.documentElement
    root.style.setProperty('--c-brand', hexToRgb(b.primaryColor, '23 111 81'))
    root.style.setProperty('--c-brand-dark', hexToRgb(b.primaryDark, '16 76 59'))
    root.style.setProperty('--c-brand-soft', hexToRgb(b.primarySoft, '233 243 236'))
    root.style.setProperty('--c-accent', hexToRgb(b.accentColor, '237 186 99'))
    root.style.setProperty('--c-hero-from', hexToRgb(b.heroFrom ?? b.primaryDark, '17 85 62'))
    root.style.setProperty('--c-hero-to', hexToRgb(b.heroTo ?? b.primaryColor, '32 110 78'))
    document.documentElement.lang = config.value.locale.split('-')[0] ?? 'ms'
  }

  async function init() {
    applyTheme()
    try {
      config.value = await repositories.client.getConfig()
      applyTheme()
    } finally {
      ready.value = true
    }
  }

  const money = (cents: number) => formatMoney(cents, config.value.locale, config.value.ordering.currency)

  return { config, ready, storageAvailable, init, applyTheme, money }
})
