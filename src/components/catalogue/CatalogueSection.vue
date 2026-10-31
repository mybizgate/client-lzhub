<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { ManagedProduct, Product, ProductQuery } from '../../types/product'
import ProductCard from './ProductCard.vue'
import AddProductCard from '../manage/AddProductCard.vue'
import ProductEditorCard from '../manage/ProductEditorCard.vue'
import EmptyState from '../common/EmptyState.vue'
import { applyProductQuery } from '../../services/product-query'
import { useClient } from '../../composables/useClient'
import { useCatalogueStore } from '../../stores/catalogue'
import { useAuthStore } from '../../stores/auth'

const props = defineProps<{ products: Product[]; title: string; loading?: boolean; emptyTitle?: string; emptyText?: string }>()
const { config } = useClient()
const catalogue = useCatalogueStore()
const auth = useAuthStore()
const inStockOnly = ref(false)
const sort = ref<NonNullable<ProductQuery['sort']>>('popular')
const editing = ref<string | 'new' | null>(null)
const list = computed(() => applyProductQuery(props.products, { inStockOnly: inStockOnly.value, sort: sort.value, includeInactive: auth.canEdit }))
const sorts: [ProductQuery['sort'], string][] = [
  ['popular', 'Pilihan kami'],
  ['price_asc', 'Harga terendah'],
  ['price_desc', 'Harga tertinggi'],
  ['name', 'Nama A-Z'],
]

watch(
  () => auth.canEdit,
  (canEdit) => {
    if (!canEdit) editing.value = null
  },
)

async function openEditor(id: string | 'new') {
  editing.value = id
  await nextTick()
  document.querySelector<HTMLElement>('[data-product-editor]')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
}

function asManaged(product: Product): ManagedProduct {
  if ('status' in product) return product as ManagedProduct
  return {
    ...product,
    status: product.active ? 'active' : 'draft',
    sortOrder: 0,
    stockQuantity: product.stock ?? 0,
    unlimitedStock: product.stock === null,
    lowStockThreshold: 10,
    featured: Boolean(product.featured),
  }
}
</script>

<template>
  <section id="catalog">
    <div class="my-[18px] mb-[13px] flex flex-wrap items-center gap-2 md:my-6 md:mb-[14px] md:flex-nowrap md:justify-between md:gap-3">
      <div class="w-full md:w-auto">
        <h2 class="text-[16px] font-extrabold tracking-[-.5px] md:text-[17px]">{{ title }}</h2>
        <p class="mt-[5px] text-[10px] text-muted md:mt-[6px] md:text-[11px]">{{ list.length }} produk &bull; Dijual dalam unit borong</p>
      </div>
      <div class="flex w-full items-center justify-between gap-2 md:w-auto md:justify-start md:gap-[10px]">
        <label class="flex min-h-[39px] cursor-pointer items-center gap-[6px] whitespace-nowrap text-[11px] text-muted md:min-h-[44px]">
          <input v-model="inStockOnly" type="checkbox" class="h-4 w-4 rounded border-line text-brand focus:ring-0" /> Ada stok
        </label>
        <select v-model="sort" aria-label="Susunan produk" class="h-[39px] max-w-[160px] rounded-[11px] border border-line bg-white px-[10px] py-0 text-[11px] text-ink focus:border-brand focus:ring-0 md:min-h-[44px]">
          <option v-for="[k, label] in sorts" :key="k" :value="k">{{ label }}</option>
        </select>
      </div>
    </div>
    <div v-if="catalogue.status === 'error'" class="validation-error" role="alert">
      Katalog tidak dapat dimuatkan. {{ catalogue.error }}
      <button type="button" class="btn-link ml-2 !text-[11px] underline" @click="catalogue.load(true)">Cuba lagi</button>
    </div>
    <div v-else-if="loading" class="grid grid-cols-2 gap-[11px] md:grid-cols-3 md:gap-[13px] xl:grid-cols-4 xl:gap-[15px]">
      <div v-for="i in 8" :key="i" class="h-[330px] animate-pulse rounded-2xl border border-line bg-white" />
    </div>
    <div v-else-if="list.length || auth.canEdit" class="grid grid-cols-2 gap-[11px] md:grid-cols-3 md:gap-[13px] xl:grid-cols-4 xl:gap-[15px]">
      <ProductEditorCard v-if="auth.canEdit && editing === 'new'" key="editor-new" @saved="editing = null" @cancel="editing = null" />
      <AddProductCard v-else-if="auth.canEdit" key="add-product" @add="openEditor('new')" />
      <template v-for="p in list" :key="p.id">
        <ProductEditorCard v-if="auth.canEdit && editing === p.id" :product="asManaged(p)" @saved="editing = null" @cancel="editing = null" />
        <ProductCard v-else :product="p" @edit="openEditor(p.id)" />
      </template>
    </div>
    <EmptyState v-else :title="emptyTitle ?? 'Tiada produk ditemui'" :description="emptyText ?? 'Cuba kategori atau carian lain.'">
      <slot name="empty" />
    </EmptyState>
    <p class="mb-[2px] mt-[17px] text-center text-[9px] leading-[1.6] text-[#7c8775] md:mt-5 md:text-[10px]">{{ config.copy.catalogueNote }}</p>
  </section>
</template>
