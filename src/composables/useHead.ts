import { watchEffect, type MaybeRefOrGetter, toValue } from 'vue'
import { useClientStore } from '../stores/client'

function setMeta(selector: string, attr: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    const [k, v] = selector.replace(/^meta\[|\]$/g, '').split('=')
    el.setAttribute(k!, v!.replace(/"/g, ''))
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

/** Lightweight per-route head management for an SPA. Title is suffixed with the business name. */
export function useHead(input: { title: MaybeRefOrGetter<string>; description?: MaybeRefOrGetter<string | undefined> }) {
  const client = useClientStore()
  watchEffect(() => {
    const title = toValue(input.title)
    const full = title ? `${title} | ${client.config.businessName}` : client.config.seo.title
    document.title = full
    const desc = toValue(input.description) || client.config.seo.description
    setMeta('meta[name="description"]', 'content', desc)
    setMeta('meta[property="og:title"]', 'content', full)
    setMeta('meta[property="og:description"]', 'content', desc)
  })
}
