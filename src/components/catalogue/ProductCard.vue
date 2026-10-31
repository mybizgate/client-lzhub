<script setup lang="ts">
import { computed } from 'vue'
import type { ManagedProduct, Product } from '../../types/product'
import AppIcon from '../common/AppIcon.vue'
import ProductArt from '../common/ProductArt.vue'
import QtyControl from '../common/QtyControl.vue'
import { useCatalogueStore } from '../../stores/catalogue'
import { useCartStore } from '../../stores/cart'
import { useUiStore } from '../../stores/ui'
import { useAuthStore } from '../../stores/auth'
import { useClient } from '../../composables/useClient'
import { unitPrice, discountPercent, packDescription, isAvailable, isLowStock, maxOrderable } from '../../services/pricing'

const props = defineProps<{ product: Product }>()
const emit = defineEmits<{ edit: [] }>()
const catalogue = useCatalogueStore()
const cart = useCartStore()
const ui = useUiStore()
const auth = useAuthStore()
const { config, money } = useClient()

const qty = computed(() => cart.qtyOf(props.product.id))
const available = computed(() => isAvailable(props.product))
const price = computed(() => unitPrice(props.product, qty.value, config.value.ordering))
const discount = computed(() => discountPercent(props.product))
const fav = computed(() => catalogue.isFavorite(props.product.id))
const watching = computed(() => catalogue.isWatching(props.product.id))
const stockText = computed(() =>
  props.product.stock === null ? 'Sentiasa ada' : !available.value ? 'Tiada stok' : isLowStock(props.product) ? `Baki ${props.product.stock} ${props.product.unit}` : `${props.product.stock} ${props.product.unit} tersedia`,
)
const dotClass = computed(() => (!available.value ? 'bg-[#e76a50]' : isLowStock(props.product) ? 'bg-[#d29b3a]' : 'bg-[#438660]'))
const status = computed(() => 'status' in props.product ? (props.product as ManagedProduct).status : 'active')

function notify(r: { ok: boolean; message?: string }) {
  if (r.message) ui.toast(r.message)
}
function toggleWatch() {
  const on = catalogue.toggleWatch(props.product.id)
  ui.toast(on ? 'Minat ditandakan. Kami akan maklumkan apabila stok tersedia.' : 'Tanda minat stok dibuang.')
}
</script>

<template>
  <article class="product-card relative min-w-0 overflow-hidden rounded-[13px] border border-line bg-white shadow-[0_2px_4px_#34432702] transition-[box-shadow,border-color] hover:border-[#bfd1c1] hover:shadow-lift md:rounded-2xl">
    <RouterLink :to="{ name: 'product', params: { slug: product.slug } }" class="product-stage group block h-[158px] w-full md:h-[183px]" :aria-label="`Lihat ${product.name}`">
      <div class="grid h-full place-items-center">
        <ProductArt :product="product" img-class="h-[153px] w-[121px] transition-transform group-hover:-translate-y-[2px] group-hover:-rotate-2 md:h-[177px] md:w-[145px]" />
      </div>
    </RouterLink>
    <span v-if="discount" class="absolute left-[9px] top-[10px] z-[2] rounded-md bg-brand px-2 py-1 text-[9px] font-black text-white md:left-[10px] md:top-3 md:text-[10px]">-{{ discount }}%</span>
    <span v-else-if="!available" class="absolute left-[9px] top-[10px] z-[2] rounded-md bg-[#eceee6] px-2 py-1 text-[9px] font-black text-[#60695c] md:text-[10px]">Stok habis</span>
    <button
      type="button"
      class="absolute right-[3px] top-[3px] z-[2] grid h-11 w-11 place-items-center rounded-full border border-[#e8e9df] bg-white/85 md:right-[10px] md:top-[10px] md:h-9 md:w-9"
      :class="fav ? 'bg-white text-[#bc6250]' : 'text-[#7b8b7d]'"
      :aria-label="`${fav ? 'Buang' : 'Simpan'} ${product.name} daripada kegemaran`"
      :aria-pressed="fav"
      @click="catalogue.toggleFavorite(product.id)"
    >
      <AppIcon name="heart" class="h-4 w-4" :class="fav ? '[&_path]:fill-[#bc625024]' : ''" />
    </button>
    <button
      v-if="auth.canEdit"
      type="button"
      class="absolute right-[50px] top-[3px] z-[2] grid h-11 w-11 place-items-center rounded-full border border-[#e8e9df] bg-white/85 text-brand md:right-[51px] md:top-[10px] md:h-9 md:w-9"
      :aria-label="`Sunting ${product.name}`"
      @click="emit('edit')"
    >
      <AppIcon name="edit" class="h-4 w-4" />
    </button>
    <div class="px-[11px] pb-[11px] pt-3 md:p-[14px] md:pb-[13px]">
      <div class="text-[7px] font-extrabold uppercase tracking-[.8px] text-[#71816f] md:text-[8px] md:tracking-[1px]">{{ catalogue.categoryName(product.categoryId) }}</div>
      <h3 class="mb-[6px] mt-[5px] min-h-[37px] text-[13px] font-extrabold leading-[1.4]">
        <RouterLink :to="{ name: 'product', params: { slug: product.slug } }" class="block text-left">{{ product.name }} {{ product.size }}</RouterLink>
      </h3>
      <div class="mb-[9px] text-[10px] leading-[1.4] text-[#73806f] md:text-[11px]">{{ packDescription(product) }}</div>
      <div class="flex min-h-[26px] flex-wrap items-baseline gap-x-[5px] gap-y-px">
        <span class="text-[21px] font-black leading-[1.1] tracking-[-.7px] text-brand md:text-[22px]">{{ money(price) }}</span>
        <span v-if="discount" class="text-[9px] text-[#929487] line-through md:text-[10px]">{{ money(product.oldPrice!) }}</span>
      </div>
      <div class="mt-[3px] text-[9px] leading-[1.4] text-[#7f8779] md:text-[10px]">Harga / {{ product.unit }}</div>
      <div class="mt-[10px] flex min-h-[30px] items-center justify-between gap-[6px] border-t border-line pt-[9px] text-[9px] text-[#667563] md:mt-[13px] md:pt-[11px] md:text-[10px]">
        <span class="flex items-center gap-1"><i class="h-1 w-1 rounded-full md:h-[5px] md:w-[5px]" :class="dotClass" />{{ stockText }}</span>
        <span v-if="auth.canEdit && status !== 'active'" class="chip !min-h-0 !px-2 !py-1">{{ status === 'draft' ? 'Draf' : 'Arkib' }}</span>
      </div>
      <div class="mt-2 flex min-h-[44px] items-center justify-between gap-1 md:mt-[10px] md:min-h-[40px] md:gap-[6px]">
        <template v-if="!available">
          <span class="text-[9px] leading-[1.35] text-[#7a8476] md:text-[10px]">Min. {{ product.minimumQuantity }}<br />{{ product.unit }}</span>
          <button type="button" class="min-h-[44px] max-w-[88px] rounded-lg border border-[#e4e7dc] bg-[#f0f2ec] p-[6px] text-[9px] font-bold leading-[1.3] text-[#52674e] md:min-h-[39px] md:max-w-[91px]" :aria-pressed="watching" @click="toggleWatch">
            {{ watching ? 'Ditandakan' : 'Maklumkan stok' }}
          </button>
        </template>
        <QtyControl v-else-if="qty" class="w-full" :qty="qty" :max="maxOrderable(product)" :name="product.name" @increment="notify(cart.increment(product.id))" @decrement="notify(cart.decrement(product.id))" />
        <template v-else>
          <span class="text-[9px] leading-[1.35] text-[#7a8476] md:text-[10px]">Min. {{ product.minimumQuantity }}<br />{{ product.unit }}</span>
          <button type="button" class="min-h-[44px] min-w-[86px] rounded-[9px] bg-brand px-2 text-[10px] font-extrabold text-white hover:bg-brand-dark md:min-h-[39px] md:min-w-[90px] md:px-[13px] md:text-[11px]" :aria-label="`Tambah ${product.name} ke troli`" @click="notify(cart.add(product.id))">+ Tambah</button>
        </template>
      </div>
    </div>
  </article>
</template>
