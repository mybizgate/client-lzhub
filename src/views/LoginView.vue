<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHead from '../components/common/PageHead.vue'
import AppIcon from '../components/common/AppIcon.vue'
import { useAuthStore } from '../stores/auth'
import { useHead } from '../composables/useHead'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const form = reactive({ email: '', password: '' })
const error = ref('')
const saving = ref(false)

useHead({ title: 'Log masuk pengurusan' })

watch(
  () => auth.user,
  (user) => {
    if (user) void router.replace({ name: 'account' })
  },
  { immediate: true },
)

async function submit() {
  error.value = ''
  if (!form.email.trim() || !form.password) {
    error.value = 'Sila isi e-mel dan kata laluan.'
    return
  }
  saving.value = true
  try {
    await auth.login(form.email, form.password)
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
      ? route.query.redirect
      : '/catalogue'
    await router.replace(redirect)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Log masuk tidak berjaya.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <PageHead title="Log masuk pengurusan" description="Untuk pemilik dan staf kedai." />
  <form class="panel mx-auto max-w-[520px] !p-[22px] md:!p-[25px]" novalidate @submit.prevent="submit">
    <div class="field">
      <label for="staff-email">E-mel</label>
      <input id="staff-email" v-model.trim="form.email" type="email" autocomplete="username" inputmode="email" placeholder="pemilik@lzhub.test" />
    </div>
    <div class="field">
      <label for="staff-password">Kata laluan</label>
      <input id="staff-password" v-model="form.password" type="password" autocomplete="current-password" />
    </div>
    <div v-if="error" class="validation-error" role="alert">{{ error }}</div>
    <button type="submit" class="btn-primary w-full" :disabled="saving">
      <AppIcon name="store" />{{ saving ? 'Log masuk…' : 'Log masuk' }}
    </button>
    <p class="mt-4 text-center text-[12px] text-muted">
      <RouterLink :to="{ name: 'forgot-password', state: { email: form.email } }" class="font-extrabold text-brand underline-offset-2 hover:underline">Lupa kata laluan?</RouterLink>
    </p>
  </form>
</template>
