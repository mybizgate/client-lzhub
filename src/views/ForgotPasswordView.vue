<script setup lang="ts">
import { reactive, ref } from 'vue'
import PageHead from '../components/common/PageHead.vue'
import AppIcon from '../components/common/AppIcon.vue'
import { authService } from '../services/auth.service'
import { useHead } from '../composables/useHead'

// Prefilled from the login form via history state so the address never lands in a URL.
const prefill = typeof history.state?.email === 'string' ? (history.state.email as string) : ''
const form = reactive({ email: prefill })
const error = ref('')
const sent = ref('')
const saving = ref(false)

useHead({ title: 'Lupa kata laluan' })

async function submit() {
  error.value = ''
  if (!form.email.trim()) {
    error.value = 'Sila masukkan e-mel akaun pengurusan anda.'
    return
  }
  saving.value = true
  try {
    sent.value = await authService.forgotPassword(form.email.trim())
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Permintaan tidak dapat dihantar.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <PageHead title="Lupa kata laluan" description="Kami akan e-melkan pautan untuk menetapkan kata laluan baharu." />
  <div class="panel mx-auto max-w-[520px] !p-[22px] md:!p-[25px]">
    <div v-if="sent" class="text-[13px] leading-[1.7]">
      <p class="mb-4 rounded-[10px] border border-[#cfe3d3] bg-[#eef7f0] px-[14px] py-3 text-brand" role="status">{{ sent }}</p>
      <p class="mb-4 text-[12px] text-muted">Pautan sah selama 60 minit. Tidak menerimanya? Semak folder spam atau cuba sekali lagi.</p>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn-secondary" @click="sent = ''">Hantar semula</button>
        <RouterLink :to="{ name: 'login' }" class="btn-ghost">Kembali ke log masuk</RouterLink>
      </div>
    </div>
    <form v-else novalidate @submit.prevent="submit">
      <div class="field">
        <label for="forgot-email">E-mel akaun pengurusan</label>
        <input id="forgot-email" v-model.trim="form.email" type="email" autocomplete="username" inputmode="email" placeholder="pemilik@lzhub.test" />
      </div>
      <div v-if="error" class="validation-error" role="alert">{{ error }}</div>
      <button type="submit" class="btn-primary w-full" :disabled="saving">
        <AppIcon name="mail" />{{ saving ? 'Menghantar…' : 'Hantar pautan tetapan semula' }}
      </button>
      <p class="mt-4 text-center text-[12px] text-muted">
        <RouterLink :to="{ name: 'login' }" class="font-extrabold text-brand underline-offset-2 hover:underline">Kembali ke log masuk</RouterLink>
      </p>
    </form>
  </div>
</template>
