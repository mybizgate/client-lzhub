<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import type { IconName } from './AppIcon.vue'
defineProps<{ title: string; description?: string; icon?: IconName }>()
</script>

<template>
  <div class="rounded-[18px] border border-dashed border-line bg-white px-5 py-[42px] text-center text-muted md:py-[55px]">
    <AppIcon :name="icon ?? 'bag'" class="mx-auto h-10 w-10 text-brand" />
    <strong class="mb-1 mt-3 block text-[16px] text-ink">{{ title }}</strong>
    <p v-if="description" class="mx-auto mb-[22px] mt-[10px] max-w-[370px] text-[12px] leading-[1.8]">{{ description }}</p>
    <slot />
  </div>
</template>
