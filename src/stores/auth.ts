import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AuthUser } from '../types/auth'
import { authService } from '../services/auth.service'
import { clearStaffToken, getStaffToken, setStaffToken } from '../services/session'
import { usePersistedRef } from './persist'
import { useUiStore } from './ui'

type AuthStatus = 'idle' | 'loading' | 'ready' | 'error'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const status = ref<AuthStatus>('idle')
  const editMode = usePersistedRef<boolean>('edit-mode', () => false, (value): value is boolean => typeof value === 'boolean')
  const ui = useUiStore()

  const isStaff = computed(() => user.value?.role === 'owner' || user.value?.role === 'staff')
  const canEdit = computed(() => isStaff.value && editMode.value)

  async function restore(): Promise<void> {
    if (!getStaffToken()) {
      status.value = 'ready'
      return
    }
    status.value = 'loading'
    try {
      user.value = await authService.me()
      if (!user.value) {
        clearStaffToken()
        editMode.value = false
      }
      status.value = 'ready'
    } catch {
      status.value = 'error'
    }
  }

  async function login(email: string, password: string): Promise<void> {
    status.value = 'loading'
    try {
      const result = await authService.login(email, password)
      setStaffToken(result.accessToken)
      user.value = result.user
      editMode.value = true
      status.value = 'ready'
      ui.toast(`Selamat datang, ${result.user.name}.`)
    } catch (error) {
      status.value = 'error'
      throw error
    }
  }

  async function logout(): Promise<void> {
    try {
      await authService.logout()
    } catch {
      // The local session must still be cleared when the network is unavailable.
    }
    clearStaffToken()
    user.value = null
    editMode.value = false
    status.value = 'ready'
  }

  return { user, status, editMode, isStaff, canEdit, restore, login, logout }
})
