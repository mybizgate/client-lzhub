<script setup lang="ts">
import type { Customer } from '../../types/order'
defineProps<{ prefix: string; addressRequired?: boolean }>()
const model = defineModel<Customer>({ required: true })
</script>

<template>
  <div class="field">
    <label :for="`${prefix}store`">Nama kedai</label>
    <input :id="`${prefix}store`" v-model="model.storeName" required minlength="2" maxlength="80" autocomplete="organization" placeholder="Contoh: Kedai Maju Jaya" />
  </div>
  <div class="grid gap-x-3 md:grid-cols-2">
    <div class="field">
      <label :for="`${prefix}name`">Nama penerima</label>
      <input :id="`${prefix}name`" v-model="model.contactName" required minlength="2" maxlength="80" autocomplete="name" placeholder="Nama anda" />
    </div>
    <div class="field">
      <label :for="`${prefix}phone`">Nombor telefon</label>
      <input :id="`${prefix}phone`" v-model="model.phone" type="tel" required pattern="[+0-9 ()-]{9,20}" maxlength="20" autocomplete="tel" placeholder="Contoh: 019 123 4567" />
    </div>
  </div>
  <div class="field">
    <label :for="`${prefix}address`">Alamat kedai</label>
    <textarea :id="`${prefix}address`" v-model="model.address" maxlength="350" :required="addressRequired" autocomplete="street-address" placeholder="Alamat lengkap termasuk poskod dan negeri" />
  </div>
</template>
