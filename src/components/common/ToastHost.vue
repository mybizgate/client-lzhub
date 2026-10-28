<script setup lang="ts">
import { useUiStore } from '../../stores/ui'
const ui = useUiStore()
</script>

<template>
  <div
    role="status"
    aria-live="polite"
    class="pointer-events-none fixed inset-x-4 bottom-[calc(140px+env(safe-area-inset-bottom))] z-[60] mx-auto max-w-[450px] rounded-xl border border-[#496c54] bg-[#1c3b30] px-[15px] py-3 text-center text-[12px] font-bold leading-[1.6] text-white shadow-[0_9px_35px_#17372945] transition-all duration-200 md:inset-x-auto md:bottom-[23px] md:right-[23px] md:max-w-[370px] md:text-left"
    :class="ui.toastVisible ? 'translate-y-0 opacity-100' : 'translate-y-[140px] opacity-0'"
  >
    {{ ui.toastText }}
  </div>
</template>
