<script setup lang="ts">
import AppIcon from './AppIcon.vue'
defineProps<{ id: string; placeholder: string }>()
const model = defineModel<string>({ default: '' })
</script>

<template>
  <div class="flex h-12 items-center gap-[9px] rounded-xl border border-line bg-white px-3 text-[#91a09a] shadow-[0_3px_8px_#34412203] focus-within:border-brand focus-within:shadow-[0_0_0_3px_rgba(23,111,81,.06)] md:h-[49px]">
    <AppIcon name="search" class="h-5 w-5 text-[#89988b]" />
    <input
      :id="id"
      v-model="model"
      type="search"
      :placeholder="placeholder"
      :aria-label="placeholder"
      autocomplete="off"
      class="h-full w-full min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-[16px] text-ink placeholder:text-[12px] focus:ring-0 md:text-[14px]"
    />
    <span class="hidden rounded-[5px] border border-line px-[6px] text-[12px] text-[#86918a] md:inline">/</span>
  </div>
</template>
