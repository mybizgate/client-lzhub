<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import type { Customer } from '../types/order'
import AppIcon from '../components/common/AppIcon.vue'
import PageHead from '../components/common/PageHead.vue'
import CustomerFields from '../components/checkout/CustomerFields.vue'
import WhatsAppLink from '../components/common/WhatsAppLink.vue'
import { useOrderStore } from '../stores/order'
import { useUiStore } from '../stores/ui'
import { useClient } from '../composables/useClient'
import { useHead } from '../composables/useHead'
import { validateCustomer } from '../services/order.service'
import { enquiryMessage } from '../services/whatsapp-message'
import { useAuthStore } from '../stores/auth'

const orders = useOrderStore()
const ui = useUiStore()
const auth = useAuthStore()
const { config } = useClient()
useHead({ title: 'Akaun kedai' })

let form = reactive<Customer>({ storeName: '', contactName: '', phone: '', address: '' })
const error = ref('')
onMounted(async () => {
  await orders.loadProfile()
  Object.assign(form, orders.profile ?? orders.draft.customer)
})
watch(
  () => orders.profile,
  (p) => p && Object.assign(form, p),
)
async function save() {
  error.value = validateCustomer(form, false)
  if (error.value) return
  await orders.saveProfile({ ...form })
  ui.toast('Maklumat kedai disimpan.')
}
const tel = (p: string) => `tel:${p.replace(/[^+\d]/g, '')}`
const roleLabel = () => auth.user?.role === 'owner' ? 'Pemilik' : 'Staf'
</script>

<template>
  <PageHead title="Akaun kedai" description="Maklumat kedai anda untuk pesanan yang lebih pantas." />
  <div class="grid items-start gap-[18px] md:grid-cols-2 md:gap-[22px] xl:grid-cols-[1.15fr_1fr]">
    <form class="panel !p-[22px] md:!p-[25px]" novalidate @submit.prevent="save">
      <h3 class="mb-4 text-[15px] font-extrabold">Maklumat kedai</h3>
      <CustomerFields v-model="form" prefix="profile-" />
      <div v-if="error" class="validation-error" role="alert">{{ error }}</div>
      <button type="submit" class="btn-primary"><AppIcon name="check" />Simpan profil</button>
      <p class="hint mt-3">Maklumat ini disimpan pada browser ini sahaja. Elakkan data sensitif pada peranti yang dikongsi.</p>
    </form>
    <div>
      <section class="rounded-[18px] bg-brand-dark p-[26px] text-white md:p-7">
        <div class="mb-5 grid h-12 w-12 place-items-center rounded-[14px] bg-white/10"><AppIcon name="whatsapp" class="h-[27px] w-[27px]" /></div>
        <p class="eyebrow !text-[#c6d3bd]">RAKAN BEKALAN ANDA</p>
        <h2 class="mb-3 mt-2 text-[23px] font-extrabold leading-[1.3] tracking-[-.7px] md:text-[24px]">Kami sedia membantu.</h2>
        <p class="max-w-[340px] text-[12px] leading-[1.8] text-[#c9d6c7]">Perlukan produk lain atau kuantiti yang lebih besar? Bincang terus dengan pembekal.</p>
        <b class="mb-[14px] mt-[22px] block text-[19px]">{{ config.contact.whatsappDisplay ?? config.contact.whatsapp }}</b>
        <WhatsAppLink :text="enquiryMessage(config)" label="Chat di WhatsApp" variant="white" class="flex w-full !min-h-[46px] !text-[12px]" />
        <a v-if="config.contact.phone" class="block pt-[13px] text-center text-[11px] text-[#d8e1d4] underline" :href="tel(config.contact.phone)">Telefon pembekal</a>
        <a v-if="config.contact.email" class="block pt-2 text-center text-[11px] text-[#d8e1d4] underline" :href="`mailto:${config.contact.email}`">{{ config.contact.email }}</a>
      </section>
      <section class="panel mt-[18px]">
        <h3 class="mb-3 text-[15px] font-extrabold">Pintasan</h3>
        <RouterLink :to="{ name: 'orders' }" class="btn-ghost mt-[10px] w-full"><AppIcon name="bag" /> Pesanan saya</RouterLink>
        <RouterLink :to="{ name: 'favorites' }" class="btn-ghost mt-[10px] w-full"><AppIcon name="heart" /> Barang kegemaran</RouterLink>
        <RouterLink :to="{ name: 'deals' }" class="btn-ghost mt-[10px] w-full"><AppIcon name="tag" /> Promosi semasa</RouterLink>
      </section>
    </div>
  </div>
  <section class="panel mt-[18px] md:mt-[22px]">
    <h3 class="mb-3 text-[15px] font-extrabold">Pengurusan kedai</h3>
    <template v-if="!auth.user">
      <p class="mb-4 text-[12px] text-muted">Untuk pemilik dan staf.</p>
      <RouterLink :to="{ name: 'login' }" class="btn-secondary"><AppIcon name="store" />Log masuk pengurusan</RouterLink>
    </template>
    <template v-else>
      <p class="text-[12px] leading-[1.7] text-muted"><strong class="text-ink">{{ auth.user.name }}</strong><br />{{ roleLabel() }} &bull; {{ auth.user.email }}</p>
      <label class="check-label mt-4">
        <input v-model="auth.editMode" type="checkbox" />
        <span><strong class="block text-ink">Mod edit</strong><small class="text-muted">Tambah dan sunting produk terus dalam katalog.</small></span>
      </label>
      <button type="button" class="btn-ghost" @click="auth.logout"><AppIcon name="close" />Log keluar</button>
    </template>
  </section>
</template>
