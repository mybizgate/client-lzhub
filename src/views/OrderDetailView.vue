<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Order } from '../types/order'
import AppIcon from '../components/common/AppIcon.vue'
import StatusBadge from '../components/common/StatusBadge.vue'
import EmptyState from '../components/common/EmptyState.vue'
import WhatsAppLink from '../components/common/WhatsAppLink.vue'
import { useOrderStore } from '../stores/order'
import { useUiStore } from '../stores/ui'
import { useClient } from '../composables/useClient'
import { useHead } from '../composables/useHead'
import { orderMessage } from '../services/whatsapp-message'
import { humanDate } from '../utils/date'
import { statusLabel, canCancel } from '../utils/order-status'

const route = useRoute()
const router = useRouter()
const orders = useOrderStore()
const ui = useUiStore()
const { config, money } = useClient()

const order = ref<Order | null>(null)
const loading = ref(true)
watch(
  () => route.params.id,
  async (id) => {
    loading.value = true
    order.value = await orders.fetch(String(id))
    loading.value = false
  },
  { immediate: true },
)
watch(
  () => (order.value ? orders.byId(order.value.id) : null),
  (o) => {
    if (o) order.value = o
  },
)
const text = computed(() => (order.value ? orderMessage(order.value, config.value) : ''))
const showManual = ref(false)
useHead({ title: computed(() => order.value?.id ?? 'Pesanan') })

async function copy() {
  try {
    await navigator.clipboard.writeText(text.value)
    ui.toast('Teks pesanan disalin.')
  } catch {
    showManual.value = true
  }
}
async function markSent() {
  if (!order.value) return
  await orders.markSent(order.value.id)
  ui.toast('Ditanda hantar oleh anda. Menunggu semakan pembekal.')
}
async function cancel() {
  if (!order.value) return
  if (!window.confirm('Batalkan rekod pesanan ini? Ini TIDAK membatalkan mesej WhatsApp yang telah dihantar. Hubungi pembekal untuk pembatalan sebenar.')) return
  await orders.cancel(order.value.id)
  ui.toast('Rekod dibatalkan. Hubungi pembekal bagi pesanan sebenar.')
}
function reorder() {
  if (!order.value) return
  const r = orders.reorder(order.value.id)
  ui.toast(r.added ? `${r.added} jenis ditambah dengan harga terkini.` : 'Semua produk pesanan ini tidak tersedia.')
  if (r.added) router.push({ name: 'cart' })
}
</script>

<template>
  <div v-if="loading" class="mx-auto max-w-[590px] animate-pulse rounded-[20px] border border-line bg-white p-6"><div class="h-6 w-1/2 rounded bg-page" /><div class="mt-6 h-40 rounded bg-page" /></div>
  <EmptyState v-else-if="!order" title="Pesanan tidak ditemui" description="Rekod ini tidak wujud pada browser ini.">
    <RouterLink :to="{ name: 'orders' }" class="btn-primary">Pesanan saya</RouterLink>
  </EmptyState>
  <article v-else class="mx-auto max-w-[590px] rounded-[20px] border border-line bg-white p-5 md:p-[25px]">
    <RouterLink :to="{ name: 'orders' }" class="btn-link mb-3 !text-[11px]"><AppIcon name="arrow" class="rotate-180" /> Pesanan saya</RouterLink>
    <div class="mb-[18px] flex items-center justify-between gap-2">
      <h1 class="text-[20px] font-extrabold tracking-[-.5px]">{{ order.id }}</h1>
      <StatusBadge :status="order.status" />
    </div>
    <small class="block text-[10px] text-muted">{{ humanDate(order.createdAt, config.locale) }}</small>
    <div v-if="order.status === 'draft_whatsapp'" class="mt-3 rounded-xl bg-brand-soft p-4 text-[12px] leading-[1.6] text-brand-dark">Draf ini belum dianggap dihantar. Buka WhatsApp, semak mesej dan tekan <b>Hantar</b>. Sistem tidak dapat mengesahkan penghantaran WhatsApp.</div>
    <h2 class="mb-[10px] mt-[19px] text-[14px] font-extrabold">{{ order.customer.storeName }}</h2>
    <p class="hint">
      {{ order.customer.contactName }} &bull; {{ order.customer.phone }}<br />
      {{ order.customer.address || 'Ambil sendiri' }}<br />
      {{ order.fulfilment === 'pickup' ? 'Ambil sendiri' : 'Penghantaran' }} &bull; {{ humanDate(order.requestedDate, config.locale) }} (diminta)<br />
      {{ order.paymentMethod }}
    </p>
    <div class="my-[14px] border-y border-line py-[5px]">
      <div v-for="i in order.items" :key="i.productId" class="flex items-start justify-between gap-4 py-[10px] text-[11px] md:text-[12px]">
        <span><b>{{ i.name }} {{ i.size }}</b><small class="mt-1 block text-[10px] leading-[1.5] text-muted">{{ i.qty }} {{ i.unit }} &times; {{ money(i.unitPrice) }} / {{ i.unit }}<br />{{ i.packQty }} &times; {{ i.size }} / {{ i.unit }}</small></span>
        <strong class="whitespace-nowrap text-brand">{{ money(i.qty * i.unitPrice) }}</strong>
      </div>
    </div>
    <div class="totals"><span>Subtotal</span><b>{{ money(order.subtotal) }}</b></div>
    <div class="totals"><span>Penghantaran (anggaran)</span><b>{{ money(order.deliveryFee) }}</b></div>
    <div class="totals totals-big"><span>Anggaran jumlah</span><b>{{ money(order.total) }}</b></div>
    <p v-if="order.notes" class="hint">Nota: {{ order.notes }}</p>
    <div class="mt-[10px] border-t border-line pb-[17px] pt-[10px]">
      <div v-for="h in order.history" :key="h.at" class="flex items-center gap-[7px] py-[5px] text-[10px]"><i class="h-[5px] w-[5px] rounded-full bg-brand" /><span>{{ statusLabel(h.status) }}</span><small class="ml-auto text-muted">{{ humanDate(h.at, config.locale) }}</small></div>
    </div>
    <div class="flex flex-col gap-[9px]">
      <WhatsAppLink v-if="order.status !== 'cancelled'" :text="text" :label="order.status === 'draft_whatsapp' ? 'Buka draf di WhatsApp' : 'Rujuk pembekal di WhatsApp'" class="w-full !text-[12px]" />
      <button v-if="order.status === 'draft_whatsapp'" type="button" class="btn-secondary w-full !min-h-[46px] !text-[11px]" @click="markSent"><AppIcon name="check" />Saya sudah hantar di WhatsApp</button>
      <button type="button" class="btn-ghost w-full !min-h-[46px] !text-[11px]" @click="copy"><AppIcon name="copy" />Salin teks pesanan</button>
      <button type="button" class="btn-ghost w-full !min-h-[46px] !text-[11px]" @click="reorder"><AppIcon name="repeat" />Pesan semula dengan harga terkini</button>
      <button v-if="canCancel(order.status)" type="button" class="btn-link mx-auto !min-h-[43px] !text-[#a15140]" @click="cancel">Batalkan rekod pesanan</button>
    </div>
    <textarea v-if="showManual" class="mt-3 h-[300px] w-full rounded-[10px] border border-line p-3 text-[13px]" aria-label="Teks pesanan" readonly :value="text" />
    <p class="hint mt-3"><template v-if="order.status === 'pending_review'">Ditanda hantar oleh anda, bukan pengesahan daripada WhatsApp. </template>Harga pesanan ini tidak berubah apabila harga katalog dikemas kini.</p>
  </article>
</template>
