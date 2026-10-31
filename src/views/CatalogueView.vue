<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHead from '../components/common/PageHead.vue'
import SearchBox from '../components/common/SearchBox.vue'
import CategoryStrip from '../components/catalogue/CategoryStrip.vue'
import CatalogueSection from '../components/catalogue/CatalogueSection.vue'
import { useCatalogueStore } from '../stores/catalogue'
import { useClient } from '../composables/useClient'
import { useHead } from '../composables/useHead'
import { applyProductQuery } from '../services/product-query'
import { useAuthStore } from '../stores/auth'
import { useUiStore } from '../stores/ui'

type Mode = 'all' | 'category' | 'deals' | 'favorites'
const route = useRoute()
const router = useRouter()
const catalogue = useCatalogueStore()
const auth = useAuthStore()
const ui = useUiStore()
const { config } = useClient()

const mode = computed<Mode>(() => (route.meta.mode as Mode) ?? 'all')
const slug = computed(() => String(route.params.slug ?? ''))
const category = computed(() => (mode.value === 'category' ? catalogue.categoryBySlug.get(slug.value) : undefined))
const search = ref(String(route.query.q ?? ''))
watch(
  () => route.query.q,
  (q) => {
    search.value = String(q ?? '')
  },
)
let t: ReturnType<typeof setTimeout> | undefined
watch(search, (v) => {
  clearTimeout(t)
  t = setTimeout(() => router.replace({ query: v ? { q: v } : {} }), 250)
})

const base = computed(() => {
  if (auth.canEdit && mode.value === 'all') return catalogue.manageableProducts
  if (mode.value === 'deals') return catalogue.promoProducts
  if (mode.value === 'favorites') return catalogue.favoriteProducts
  return catalogue.activeProducts
})
const list = computed(() => applyProductQuery(base.value, { categoryId: category.value?.id, search: search.value, includeInactive: auth.canEdit && mode.value === 'all' }))
const title = computed(() => (mode.value === 'deals' ? 'Promosi untuk kedai anda' : mode.value === 'favorites' ? 'Barang kegemaran' : category.value ? category.value.name : 'Katalog borong'))
const sectionTitle = computed(() => (mode.value === 'deals' ? 'Harga istimewa' : mode.value === 'favorites' ? 'Kegemaran kedai anda' : category.value ? category.value.name : 'Pilihan untuk kedai anda'))
const description = computed(() => (mode.value === 'favorites' ? 'Simpan barang yang selalu dipesan.' : 'Harga bagi karton, guni dan pek pukal.'))
const notFound = computed(() => mode.value === 'category' && catalogue.status === 'ready' && !category.value)
useHead({ title, description: computed(() => (category.value ? `${category.value.name} borong daripada ${config.value.businessName}.` : undefined)) })

watch(
  () => auth.canEdit,
  async (canEdit) => {
    if (!canEdit) return
    try {
      await catalogue.loadManageable()
    } catch (caught) {
      ui.toast(caught instanceof Error ? caught.message : 'Produk pengurusan tidak dapat dimuatkan.')
    }
  },
  { immediate: true },
)
</script>

<template>
  <PageHead :eyebrow="`${config.shortName} / Borong untuk kedai`" :title="title" :description="description" />
  <SearchBox id="search-input" v-model="search" placeholder="Cari produk atau kod SKU..." />
  <CategoryStrip :active-slug="category?.slug" />
  <CatalogueSection
    v-if="!notFound"
    :products="list"
    :loading="catalogue.status === 'loading'"
    :title="sectionTitle"
    :empty-title="mode === 'favorites' ? 'Belum ada kegemaran' : undefined"
    :empty-text="mode === 'favorites' ? 'Tekan ikon hati pada produk untuk menyimpannya di sini.' : undefined"
  >
    <template #empty><RouterLink :to="{ name: 'catalogue' }" class="btn-primary">Lihat katalog</RouterLink></template>
  </CatalogueSection>
  <div v-else class="validation-error">Kategori "{{ slug }}" tidak ditemui. <RouterLink :to="{ name: 'catalogue' }" class="underline">Lihat semua produk</RouterLink>.</div>
</template>
