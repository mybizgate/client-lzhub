<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { OrderStatus } from '../types/order'
import AppIcon from '../components/common/AppIcon.vue'
import PageHead from '../components/common/PageHead.vue'
import EmptyState from '../components/common/EmptyState.vue'
import OrderCard from '../components/orders/OrderCard.vue'
import { useOrderStore } from '../stores/order'
import { useUiStore } from '../stores/ui'
import { useHead } from '../composables/useHead'
import { ORDER_STATUS_ORDER, statusLabel } from '../utils/order-status'

const orders = useOrderStore()
const ui = useUiStore()
const router = useRouter()
useHead({ title: 'Pesanan saya' })
const filter = ref<OrderStatus | 'all'>('all')
const list = computed(() => (filter.value === 'all' ? orders.sorted : orders.sorted.filter((o) => o.status === filter.value)))
onMounted(() => orders.load())

function reorder(id: string) {
  const r = orders.reorder(id)
  ui.toast(r.added ? `${r.added} jenis ditambah dengan harga terkini.${r.skipped ? ` ${r.skipped} tiada stok.` : ''}${r.adjusted ? ` ${r.adjusted} kuantiti dihadkan kepada stok.` : ''}` : 'Semua produk pesanan ini tidak tersedia.')
  if (r.added) router.push({ name: 'cart' })
}
</script>

<template>
  <PageHead title="Pesanan saya" description="Semak sejarah dan pesan semula menggunakan harga serta stok terkini." />
  <div class="scrollbar-thin mb-[15px] flex gap-[7px] overflow-x-auto pb-[7px] md:mb-5">
    <button type="button" class="chip" :class="filter === 'all' && 'chip-active'" @click="filter = 'all'">Semua</button>
    <button v-for="s in ORDER_STATUS_ORDER" :key="s" type="button" class="chip" :class="filter === s && 'chip-active'" @click="filter = s">{{ statusLabel(s) }}</button>
  </div>
  <div v-if="orders.status === 'loading'" class="grid gap-3"><div v-for="i in 2" :key="i" class="h-40 animate-pulse rounded-[17px] border border-line bg-white" /></div>
  <div v-else-if="list.length" class="grid gap-3 md:gap-4">
    <OrderCard v-for="o in list" :key="o.id" :order="o" @reorder="reorder" />
  </div>
  <EmptyState v-else title="Tiada pesanan dalam kategori ini" description="Pesanan yang disimpan akan muncul di sini.">
    <RouterLink :to="{ name: 'catalogue' }" class="btn-primary"><AppIcon name="grid" />Lihat katalog</RouterLink>
  </EmptyState>
</template>
