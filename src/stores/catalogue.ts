import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Category } from '../types/category'
import type { Product } from '../types/product'
import { catalogueService } from '../services/catalogue.service'
import { usePersistedRef, isStringArray } from './persist'

type Status = 'idle' | 'loading' | 'ready' | 'error'

export const useCatalogueStore = defineStore('catalogue', () => {
  const categories = ref<Category[]>([])
  const products = ref<Product[]>([])
  const status = ref<Status>('idle')
  const error = ref('')
  const favorites = usePersistedRef<string[]>('favorites', () => [], isStringArray)
  const watchList = usePersistedRef<string[]>('watch', () => [], isStringArray)

  const byId = computed(() => new Map(products.value.map((p) => [p.id, p])))
  const bySlug = computed(() => new Map(products.value.map((p) => [p.slug, p])))
  const categoryBySlug = computed(() => new Map(categories.value.map((c) => [c.slug, c])))
  const categoryById = computed(() => new Map(categories.value.map((c) => [c.id, c])))
  const activeProducts = computed(() => products.value.filter((p) => p.active))
  const promoProducts = computed(() => activeProducts.value.filter((p) => p.promo && p.oldPrice && p.oldPrice > p.price))
  const favoriteProducts = computed(() => activeProducts.value.filter((p) => favorites.value.includes(p.id)))
  const featured = computed(() => activeProducts.value.filter((p) => p.featured))

  async function load(force = false) {
    if (status.value === 'loading' || (status.value === 'ready' && !force)) return
    status.value = 'loading'
    error.value = ''
    try {
      const [cats, prods] = await Promise.all([catalogueService.categories(), catalogueService.products()])
      categories.value = cats
      products.value = prods
      status.value = 'ready'
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Katalog tidak dapat dimuatkan.'
      status.value = 'error'
    }
  }

  async function loadProduct(slug: string): Promise<Product | null> {
    const cached = bySlug.value.get(slug)
    if (cached) return cached
    const p = await catalogueService.product(slug)
    if (p && !byId.value.has(p.id)) products.value.push(p)
    return p
  }

  function product(id: string) {
    return byId.value.get(id)
  }
  function categoryName(id: string) {
    return categoryById.value.get(id)?.name ?? ''
  }
  function sampleFor(categoryId: string) {
    return activeProducts.value.find((p) => p.categoryId === categoryId) ?? products.value.find((p) => p.categoryId === categoryId)
  }
  function isFavorite(id: string) {
    return favorites.value.includes(id)
  }
  function toggleFavorite(id: string) {
    favorites.value = isFavorite(id) ? favorites.value.filter((x) => x !== id) : [...favorites.value, id]
  }
  function isWatching(id: string) {
    return watchList.value.includes(id)
  }
  function toggleWatch(id: string): boolean {
    const next = !isWatching(id)
    watchList.value = next ? [...watchList.value, id] : watchList.value.filter((x) => x !== id)
    return next
  }

  return {
    categories,
    products,
    status,
    error,
    favorites,
    watchList,
    byId,
    bySlug,
    categoryBySlug,
    categoryById,
    activeProducts,
    promoProducts,
    favoriteProducts,
    featured,
    load,
    loadProduct,
    product,
    categoryName,
    sampleFor,
    isFavorite,
    toggleFavorite,
    isWatching,
    toggleWatch,
  }
})
