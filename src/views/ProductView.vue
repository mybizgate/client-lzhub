<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { Product } from '../types/product'
import AppIcon from '../components/common/AppIcon.vue'
import ProductArt from '../components/common/ProductArt.vue'
import QtyControl from '../components/common/QtyControl.vue'
import WhatsAppLink from '../components/common/WhatsAppLink.vue'
import EmptyState from '../components/common/EmptyState.vue'
import { useCatalogueStore } from '../stores/catalogue'
import { useCartStore } from '../stores/cart'
import { useUiStore } from '../stores/ui'
import { useClient } from '../composables/useClient'
import { useHead } from '../composables/useHead'
import { unitPrice, priceTiers, packDescription, isAvailable, discountPercent, maxOrderable } from '../services/pricing'
import { enquiryMessage } from '../services/whatsapp-message'

const route = useRoute()
const catalogue = useCatalogueStore()
const cart = useCartStore()
const ui = useUiStore()
const { config, money } = useClient()

const product = ref<Product | null>(null)
const loading = ref(true)
async function load() {
  loading.value = true
  if (catalogue.status !== 'ready') await catalogue.load()
  product.value = await catalogue.loadProduct(String(route.params.slug))
  loading.value = false
}
watch(() => route.params.slug, load, { immediate: true })
// Keep stock/price live when the store refreshes.
watch(
  () => (product.value ? catalogue.product(product.value.id) : null),
  (p) => {
    if (p) product.value = p
  },
)

const qty = computed(() => (product.value ? cart.qtyOf(product.value.id) : 0))
const available = computed(() => !!product.value && isAvailable(product.value))
const price = computed(() => (product.value ? unitPrice(product.value, qty.value, config.value.ordering) : 0))
const tiers = computed(() => (product.value ? priceTiers(product.value, config.value.ordering) : []))
const activeTier = computed(() => tiers.value.filter((t) => Math.max(1, qty.value) >= t.from).slice(-1)[0])
const discount = computed(() => (product.value ? discountPercent(product.value) : 0))
const watching = computed(() => !!product.value && catalogue.isWatching(product.value.id))
useHead({
  title: computed(() => (product.value ? `${product.value.name} ${product.value.size}` : 'Produk')),
  description: computed(() => (product.value ? `${product.value.name} ${product.value.size} borong, ${packDescription(product.value)}. ${config.value.businessName}.` : undefined)),
})
const notify = (r: { message?: string }) => r.message && ui.toast(r.message)
function toggleWatch() {
  if (!product.value) return
  ui.toast(catalogue.toggleWatch(product.value.id) ? 'Minat ditandakan. Kami akan maklumkan apabila stok tersedia.' : 'Tanda minat stok dibuang.')
}
</script>

<template>
  <div v-if="loading" class="mx-auto max-w-[590px] animate-pulse rounded-[20px] border border-line bg-white p-6"><div class="h-[220px] rounded-xl bg-page" /><div class="mt-6 h-6 w-2/3 rounded bg-page" /><div class="mt-3 h-10 w-1/3 rounded bg-page" /></div>
  <EmptyState v-else-if="!product" title="Produk tidak ditemui" description="Produk ini mungkin telah dikeluarkan daripada katalog.">
    <RouterLink :to="{ name: 'catalogue' }" class="btn-primary">Lihat katalog</RouterLink>
  </EmptyState>
  <article v-else class="mx-auto max-w-[590px] rounded-[20px] border border-line bg-white p-5 md:p-[25px]">
    <RouterLink :to="product ? { name: 'category', params: { slug: catalogue.categoryById.get(product.categoryId)?.slug ?? '' } } : { name: 'catalogue' }" class="btn-link mb-3 !text-[11px]"><AppIcon name="arrow" class="rotate-180" /> {{ catalogue.categoryName(product.categoryId) || 'Katalog' }}</RouterLink>
    <div class="product-stage mb-[18px] grid h-[180px] place-items-center rounded-xl md:mb-[22px] md:h-[220px]">
      <ProductArt :product="product" eager img-class="h-[179px] w-[161px] md:h-[218px] md:w-[190px]" />
    </div>
    <p class="eyebrow">{{ product.sku }} / {{ catalogue.categoryName(product.categoryId) }}</p>
    <h1 class="mb-[9px] mt-[6px] text-[23px] font-extrabold leading-[1.3] tracking-[-.7px]">{{ product.name }} {{ product.size }}</h1>
    <p class="text-muted">{{ product.brand }} &bull; {{ packDescription(product) }}</p>
    <p v-if="product.description" class="mt-2 text-[12px] leading-[1.7] text-muted">{{ product.description }}</p>
    <div class="my-[10px] md:my-[14px]">
      <b class="text-[30px] tracking-[-1px] text-brand md:text-[31px]">{{ money(price) }}</b><span class="text-[12px] text-muted"> / {{ product.unit }}</span>
      <del v-if="discount" class="ml-[10px] text-[12px] text-[#819279]">{{ money(product.oldPrice!) }}</del>
    </div>
    <div class="flex items-center gap-[15px] border-y border-line py-3 text-[10px] text-[#687d61] md:text-[11px]">
      <span class="flex items-center gap-[5px]"><AppIcon name="box" class="h-4 w-4" /> {{ product.stock === null ? 'Sentiasa ada' : `Baki ${product.stock} ${product.unit}` }}</span>
      <span>Min. {{ product.minimumQuantity }} {{ product.unit }}</span>
    </div>
    <h2 class="mb-[10px] mt-[19px] text-[14px] font-extrabold">Harga ikut kuantiti</h2>
    <div class="grid grid-cols-3 gap-2">
      <div v-for="t in tiers" :key="t.from" class="rounded-[10px] border px-[5px] py-[11px] text-center md:px-[7px] md:py-3" :class="activeTier?.from === t.from ? 'border-brand bg-brand-soft' : 'border-line'">
        <small class="block text-[10px] text-muted">{{ t.label }} {{ product.unit }}</small>
        <b class="mt-[5px] block text-[14px] text-brand md:text-[15px]">{{ money(t.price) }}</b>
      </div>
    </div>
    <p class="hint mt-2">Harga per {{ product.unit }}. Satu {{ product.unit }} mengandungi {{ product.packQty }} x {{ product.size }}. Minimum pesanan {{ product.minimumQuantity }} {{ product.unit }}.</p>
    <div class="my-3 mt-[18px] flex gap-3">
      <button v-if="!available" type="button" class="btn-secondary w-full" :aria-pressed="watching" @click="toggleWatch"><AppIcon name="bell" />{{ watching ? 'Minat stok ditandakan' : 'Maklumkan apabila ada stok' }}</button>
      <template v-else-if="qty">
        <QtyControl class="min-w-[135px] md:min-w-[130px]" :qty="qty" :max="maxOrderable(product)" :name="product.name" @increment="notify(cart.increment(product.id))" @decrement="notify(cart.decrement(product.id))" />
        <RouterLink :to="{ name: 'cart' }" class="btn-primary flex-1 !min-h-[48px]"><AppIcon name="bag" />Lihat troli</RouterLink>
      </template>
      <button v-else type="button" class="btn-primary w-full !min-h-[48px]" @click="notify(cart.add(product.id))">+ Tambah {{ product.minimumQuantity }} {{ product.unit }} ke troli</button>
    </div>
    <WhatsAppLink :text="enquiryMessage(config, `${product.name} ${product.size} (${packDescription(product)})`)" label="Tanya tentang produk ini" variant="ghost" class="w-full" />
    <p v-if="!product.images.length" class="mt-[17px] text-center text-[9px] leading-[1.6] text-[#7c8775] md:text-[10px]">Ilustrasi pembungkusan, bukan gambar produk sebenar.</p>
  </article>
</template>
