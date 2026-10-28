<script setup lang="ts">
import type { Order } from '../../types/order'
import AppIcon from '../common/AppIcon.vue'
import ProductArt from '../common/ProductArt.vue'
import StatusBadge from '../common/StatusBadge.vue'
import { useClient } from '../../composables/useClient'
import { humanDate } from '../../utils/date'

defineProps<{ order: Order }>()
const emit = defineEmits<{ reorder: [id: string] }>()
const { config, money } = useClient()
</script>

<template>
  <article class="rounded-[17px] border border-line bg-white p-4 md:p-5">
    <div class="flex items-start justify-between gap-2 md:items-center">
      <div>
        <strong class="text-[12px] md:text-[15px]">{{ order.id }}</strong>
        <small class="mt-[5px] block max-w-[200px] text-[9px] leading-[1.6] text-muted md:max-w-none md:text-[11px]">{{ humanDate(order.createdAt, config.locale) }} &bull; {{ order.customer.storeName }}</small>
      </div>
      <StatusBadge :status="order.status" />
    </div>
    <div class="my-[13px] flex items-center gap-[6px] border-y border-line py-3 md:my-4 md:gap-[9px] md:py-[14px]">
      <div v-for="i in order.items.slice(0, 4)" :key="i.productId" class="text-center">
        <div class="product-stage grid h-[49px] w-[45px] place-items-center rounded-[9px] md:h-[58px] md:w-[55px]"><ProductArt :product="i" img-class="h-[49px] w-[39px] md:h-[55px] md:w-[43px]" /></div>
        <span class="mt-1 block text-[8px] text-muted md:text-[9px]">{{ i.qty }} {{ i.unit }}</span>
      </div>
      <div class="ml-auto text-right">
        <b class="block text-[17px] tracking-[-.5px] text-brand md:text-[20px]">{{ money(order.total) }}</b>
        <small class="text-[9px] text-muted md:text-[10px]">{{ order.items.length }} jenis produk</small>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-[7px] md:gap-2">
      <RouterLink :to="{ name: 'order', params: { id: order.id } }" class="btn-ghost !px-[11px] !py-[9px] !text-[10px] md:!px-[14px] md:!text-[11px]"><AppIcon name="box" />Butiran</RouterLink>
      <button type="button" class="btn-secondary !px-[11px] !py-[9px] !text-[10px] md:!px-[14px] md:!text-[11px]" @click="emit('reorder', order.id)"><AppIcon name="repeat" />Pesan semula</button>
    </div>
  </article>
</template>
