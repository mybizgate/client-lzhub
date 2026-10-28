<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '../common/AppIcon.vue'
import { useCartStore } from '../../stores/cart'
import { useClient } from '../../composables/useClient'

const cart = useCartStore()
const { config, money } = useClient()
const min = computed(() => config.value.ordering.minimumOrder)
const pct = computed(() => Math.min(100, (cart.subtotal / min.value) * 100))
</script>

<template>
  <div class="mb-[13px] rounded-[10px] bg-[#f0f5eb] p-[13px] text-[11px] font-bold text-brand">
    <span v-if="cart.meetsMinimum" class="inline-flex items-center gap-1"><AppIcon name="check" class="h-[14px] w-[14px]" /> Minimum pesanan dipenuhi</span>
    <span v-else>Tambah {{ money(cart.remainingToMinimum) }} untuk cukup minimum</span>
    <div class="my-2 h-[5px] overflow-hidden rounded-full bg-[#e6ede8]"><div class="h-full rounded-full bg-brand" :style="{ width: pct + '%' }" /></div>
    <small class="text-[10px] font-normal">Minimum pesanan: {{ money(min) }}</small>
  </div>
</template>
