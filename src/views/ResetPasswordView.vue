<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHead from '../components/common/PageHead.vue'
import AppIcon from '../components/common/AppIcon.vue'
import { authService } from '../services/auth.service'
import { useAuthStore } from '../stores/auth'
import { useUiStore } from '../stores/ui'
import { useHead } from '../composables/useHead'
import { HttpError } from '../services/http'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const query = (key: string) => (typeof route.query[key] === 'string' ? (route.query[key] as string) : '')
const token = computed(() => query('token'))
const form = reactive({ email: query('email'), password: '', passwordConfirmation: '' })
const error = ref('')
const saving = ref(false)
const linkMissing = computed(() => !token.value || !form.email)

useHead({ title: 'Tetapkan kata laluan baharu' })

async function submit() {
  error.value = ''
  if (form.password.length < 8) {
    error.value = 'Kata laluan mesti sekurang-kurangnya 8 aksara.'
    return
  }
  if (form.password !== form.passwordConfirmation) {
    error.value = 'Pengesahan kata laluan tidak sepadan.'
    return
  }
  saving.value = true
  try {
    const message = await authService.resetPassword({ email: form.email, token: token.value, password: form.password, passwordConfirmation: form.passwordConfirmation })
    if (auth.user) await auth.logout()
    ui.toast(message)
    await router.replace({ name: 'login' })
  } catch (caught) {
    error.value = messageFor(caught)
  } finally {
    saving.value = false
  }
}

function messageFor(caught: unknown): string {
  if (caught instanceof HttpError && caught.body && typeof caught.body === 'object') {
    const body = caught.body as { errors?: Record<string, string[]>; message?: string }
    const first = body.errors ? Object.values(body.errors).flat()[0] : undefined
    return first ?? body.message ?? caught.message
  }
  return caught instanceof Error ? caught.message : 'Kata laluan tidak dapat ditetapkan.'
}
</script>

<template>
  <PageHead title="Tetapkan kata laluan baharu" description="Pilih kata laluan baharu untuk akaun pengurusan anda." />
  <div class="panel mx-auto max-w-[520px] !p-[22px] md:!p-[25px]">
    <div v-if="linkMissing" class="text-[13px] leading-[1.7]">
      <p class="validation-error !my-0 !mb-4" role="alert">Pautan tetapan semula tidak lengkap. Sila buka pautan daripada e-mel sekali lagi, atau minta pautan baharu.</p>
      <RouterLink :to="{ name: 'forgot-password' }" class="btn-secondary">Minta pautan baharu</RouterLink>
    </div>
    <form v-else novalidate @submit.prevent="submit">
      <div class="field">
        <label for="reset-email">E-mel</label>
        <input id="reset-email" v-model.trim="form.email" type="email" autocomplete="username" inputmode="email" readonly />
      </div>
      <div class="field">
        <label for="reset-password">Kata laluan baharu</label>
        <input id="reset-password" v-model="form.password" type="password" autocomplete="new-password" minlength="8" placeholder="Sekurang-kurangnya 8 aksara" />
      </div>
      <div class="field">
        <label for="reset-password-confirmation">Sahkan kata laluan baharu</label>
        <input id="reset-password-confirmation" v-model="form.passwordConfirmation" type="password" autocomplete="new-password" minlength="8" />
      </div>
      <div v-if="error" class="validation-error" role="alert">{{ error }}</div>
      <button type="submit" class="btn-primary w-full" :disabled="saving">
        <AppIcon name="shield" />{{ saving ? 'Menyimpan…' : 'Simpan kata laluan baharu' }}
      </button>
      <p class="mt-4 text-center text-[12px] text-muted">
        <RouterLink :to="{ name: 'forgot-password' }" class="font-extrabold text-brand underline-offset-2 hover:underline">Pautan tamat tempoh? Minta yang baharu</RouterLink>
      </p>
    </form>
  </div>
</template>
