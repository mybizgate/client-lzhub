<script setup lang="ts">
import type { CartEntry } from '../../stores/cart'
import AppIcon from '../common/AppIcon.vue'
import ProductArt from '../common/ProductArt.vue'
import QtyControl from '../common/QtyControl.vue'
import { useCartStore } from '../../stores/cart'
import { useUiStore } from '../../stores/ui'
import { useClient } from '../../composables/useClient'
import { maxOrderable, packDescription } from '../../services/pricing'

const props = defineProps<{ entry: CartEntry }>()
const cart = useCartStore()
const ui = useUiStore()
const { money } = useClient()
const notify = (r: { message?: string }) => r.message && ui.toast(r.message)
const discountActive = () => props.entry.unitPrice < props.entry.product.price
</script>

<template>
  <div class="flex items-start gap-3 border-b border-line py-[17px] md:gap-4 md:py-5">
    <RouterLink :to="{ name: 'product', params: { slug: entry.product.slug } }" class="product-stage grid h-[92px] w-16 shrink-0 place-items-center rounded-[10px] md:h-[112px] md:w-[88px]">
      <ProductArt :product="entry.product" img-class="h-[90px] w-[58px] md:h-[103px] md:w-20" />
    </RouterLink>
    <div class="min-w-0 flex-1">
      <div class="flex justify-between gap-[7px]">
        <div>
          <h3 class="mb-[5px] text-[12px] font-extrabold leading-[1.4] md:text-[14px]">{{ entry.product.name }} {{ entry.product.size }}</h3>
          <p class="text-[10px] leading-[1.5] text-muted md:text-[11px]">{{ packDescription(entry.product) }}</p>
        </div>
        <button type="button" class="grid h-[35px] w-[30px] shrink-0 place-items-center text-[#8d9586] md:h-[34px] md:w-[34px]" :aria-label="`Buang ${entry.product.name}`" @click="cart.remove(entry.product.id)">
          <AppIcon name="trash" class="h-4 w-4" />
        </button>
      </div>
      <div class="my-2 flex items-center justify-between gap-[6px] md:gap-2">
        <QtyControl class="min-w-[116px] md:min-w-[122px]" :qty="entry.qty" :max="maxOrderable(entry.product)" :name="entry.product.name" @increment="notify(cart.increment(entry.product.id))" @decrement="notify(cart.decrement(entry.product.id))" />
        <div class="text-right">
          <b class="text-[15px] text-brand md:text-[17px]">{{ money(entry.lineTotal) }}</b>
          <small class="block text-[9px] text-muted md:text-[10px]">{{ money(entry.unitPrice) }} / {{ entry.product.unit }}</small>
        </div>
      </div>
      <p class="mt-[6px] text-[9px] leading-[1.6] text-[#71836a]">
        {{ entry.qty }} {{ entry.product.unit }} = {{ entry.qty * entry.product.packQty }} {{ entry.product.packQty === 1 ? 'pek besar' : 'pek / botol' }} &bull; Min. {{ entry.product.minimumQuantity }} {{ entry.product.unit }}<span v-if="discountActive()"> &bull; Diskaun kuantiti aktif</span>
      </p>
    </div>
  </div>
</template>
