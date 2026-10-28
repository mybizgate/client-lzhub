<script setup lang="ts">
import { computed } from 'vue'
import type { OrderStatus } from '../../types/order'
import { statusLabel } from '../../utils/order-status'

const props = defineProps<{ status: OrderStatus }>()
const cls: Record<OrderStatus, string> = {
  draft_whatsapp: 'bg-[#f1f2eb] text-[#737c6b]',
  pending_review: 'bg-[#fff1d9] text-[#98732f]',
  confirmed: 'bg-[#edf2ff] text-[#4869a6]',
  processing: 'bg-[#e9efff] text-[#5368a9]',
  delivered: 'bg-[#e8f0ff] text-[#315d9b]',
  completed: 'bg-[#e7f6ed] text-[#278153]',
  cancelled: 'bg-[#f6e7e2] text-[#a1584c]',
}
const label = computed(() => statusLabel(props.status))
</script>

<template>
  <span class="status" :class="cls[status]">{{ label }}</span>
</template>
