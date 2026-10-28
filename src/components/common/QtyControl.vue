<script setup lang="ts">
defineProps<{ qty: number; max: number; name: string; size?: 'sm' | 'md' }>()
const emit = defineEmits<{ increment: []; decrement: [] }>()
</script>

<template>
  <div class="flex min-h-[44px] items-center justify-between gap-1 rounded-[9px] border border-line bg-white p-[2px] md:min-h-[41px]">
    <button type="button" class="grid h-[40px] w-[39px] place-items-center rounded-md bg-brand-soft text-[18px] font-black text-brand md:h-8 md:w-8 md:text-base" :aria-label="`Kurangkan ${name}`" @click="emit('decrement')">&minus;</button>
    <strong class="min-w-[20px] text-center text-[13px]">{{ qty }}</strong>
    <button type="button" class="grid h-[40px] w-[39px] place-items-center rounded-md bg-brand-soft text-[18px] font-black text-brand md:h-8 md:w-8 md:text-base" :aria-label="`Tambah ${name}`" :disabled="qty >= max" @click="emit('increment')">+</button>
  </div>
</template>
