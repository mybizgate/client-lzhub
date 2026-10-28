<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/common/AppIcon.vue'
import PageHead from '../components/common/PageHead.vue'
import EmptyState from '../components/common/EmptyState.vue'
import CustomerFields from '../components/checkout/CustomerFields.vue'
import OrderSummary from '../components/cart/OrderSummary.vue'
import { useCartStore } from '../stores/cart'
import { useOrderStore } from '../stores/order'
import { useUiStore } from '../stores/ui'
import { useClient } from '../composables/useClient'
import { useHead } from '../composables/useHead'
import { orderMessage } from '../services/whatsapp-message'
import { whatsappUrl } from '../utils/whatsapp'
import { dateISO } from '../utils/date'

const cart = useCartStore()
const orders = useOrderStore()
const ui = useUiStore()
const router = useRouter()
const { config, money } = useClient()
useHead({ title: 'Semak & hantar pesanan' })

const agree = ref(false)
const error = ref('')
const submitting = ref(false)
const draft = computed(() => orders.draft)
const minDate = dateISO(1)
const fee = computed(() => cart.deliveryFee(draft.value.fulfilment))
onMounted(() => {
  void orders.loadProfile()
  if (draft.value.requestedDate < minDate) draft.value.requestedDate = minDate
})

async function submit() {
  error.value = ''
  if (!agree.value) {
    error.value = 'Sila sahkan bahawa harga akhir perlu disahkan pembekal.'
    return
  }
  submitting.value = true
  try {
    const order = await orders.submit()
    if (config.value.ordering.allowWhatsappOrder && config.value.contact.whatsapp) {
      // Click-to-chat only: the browser cannot verify that the person presses Send in WhatsApp.
      window.open(whatsappUrl(config.value.contact.whatsapp, orderMessage(order, config.value)), '_blank', 'noopener,noreferrer')
    }
    ui.toast('Draf disimpan. Selesaikan penghantaran dalam WhatsApp.')
    router.push({ name: 'order', params: { id: order.id } })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Pesanan tidak dapat disimpan.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <PageHead title="Semak & hantar pesanan" description="Permintaan anda disimpan sebagai draf dan dibuka di WhatsApp pembekal. Anda masih perlu menekan Hantar di WhatsApp." />
  <EmptyState v-if="!cart.entries.length" title="Troli anda kosong" description="Tambah barangan sebelum meneruskan pesanan.">
    <RouterLink :to="{ name: 'catalogue' }" class="btn-primary">Lihat katalog</RouterLink>
  </EmptyState>
  <form v-else class="mx-auto max-w-[590px]" novalidate @submit.prevent="submit">
    <div class="panel">
      <h2 class="mb-4 text-[15px] font-extrabold">Maklumat kedai</h2>
      <CustomerFields v-model="draft.customer" prefix="checkout-" :address-required="draft.fulfilment === 'delivery'" />
      <div class="grid gap-x-3 md:grid-cols-2">
        <div class="field">
          <label for="delivery-method">Kaedah penerimaan</label>
          <select id="delivery-method" v-model="draft.fulfilment">
            <option value="delivery">Penghantaran ke kedai</option>
            <option value="pickup">Ambil sendiri</option>
          </select>
        </div>
        <div class="field">
          <label for="delivery-date">Tarikh diminta</label>
          <input id="delivery-date" v-model="draft.requestedDate" type="date" required :min="minDate" />
        </div>
      </div>
      <p class="hint -mt-2 mb-3">Tarikh ialah permintaan sahaja, tertakluk pengesahan pembekal.</p>
      <div class="field">
        <label for="payment-method">Kaedah bayaran pilihan</label>
        <select id="payment-method" v-model="draft.paymentMethod">
          <option v-for="p in config.ordering.paymentOptions" :key="p">{{ p }}</option>
        </select>
      </div>
      <div class="field">
        <label for="order-notes">Nota pesanan (pilihan)</label>
        <textarea id="order-notes" v-model="draft.notes" maxlength="500" placeholder="Contoh: Sila hubungi sebelum sampai." />
      </div>
      <label class="check-label"><input v-model="draft.saveProfile" type="checkbox" /> Simpan maklumat kedai untuk pesanan akan datang</label>
      <div class="my-4 rounded-xl bg-[#f6f8f1] p-[15px]">
        <OrderSummary :subtotal="cart.subtotal" :savings="cart.savings" :fee="fee" />
      </div>
      <label class="check-label"><input v-model="agree" type="checkbox" required /> Saya faham harga dan stok akhir perlu disahkan oleh pembekal.</label>
      <div v-if="error" class="validation-error" role="alert">{{ error }}</div>
      <button type="submit" class="btn-primary w-full !min-h-[48px]" :disabled="submitting"><AppIcon name="whatsapp" />Simpan &amp; buka WhatsApp</button>
      <p class="hint mt-3">Nombor pembekal: {{ config.contact.whatsappDisplay ?? config.contact.whatsapp }}. Ini tidak menghantar mesej atau memproses bayaran secara automatik. Minimum pesanan {{ money(config.ordering.minimumOrder) }}.</p>
    </div>
  </form>
</template>
