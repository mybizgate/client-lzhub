import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const toastText = ref('')
  const toastVisible = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  function toast(text: string, duration = 4000) {
    toastText.value = text
    toastVisible.value = true
    clearTimeout(timer)
    timer = setTimeout(() => {
      toastVisible.value = false
    }, duration)
  }

  return { toastText, toastVisible, toast }
})
