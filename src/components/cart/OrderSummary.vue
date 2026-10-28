<script setup lang="ts">
import { useClient } from '../../composables/useClient'
defineProps<{ subtotal: number; savings?: number; fee: number }>()
const { money } = useClient()
</script>

<template>
  <div>
    <div class="totals"><span>Subtotal barangan</span><b>{{ money(subtotal) }}</b></div>
    <div v-if="savings" class="totals text-[10px] text-brand"><span>Penjimatan kuantiti (termasuk)</span><b>{{ money(savings) }}</b></div>
    <div class="totals"><span>Penghantaran (anggaran)</span><b>{{ fee === 0 ? 'Percuma' : money(fee) }}</b></div>
    <div class="totals totals-big"><span>Anggaran jumlah</span><span>{{ money(subtotal + fee) }}</span></div>
  </div>
</template>
