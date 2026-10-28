<script setup lang="ts">
defineProps<{ eyebrow?: string; title: string; description?: string }>()
</script>

<template>
  <div class="mb-[21px] flex items-start justify-between gap-[9px] md:items-end">
    <div>
      <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
      <h1 class="text-[23px] font-extrabold leading-[1.25] tracking-[-.7px] md:text-[27px]">{{ title }}</h1>
      <p v-if="description" class="mt-[6px] text-[11px] leading-[1.6] text-muted md:text-[12px]">{{ description }}</p>
    </div>
    <div v-if="$slots.default" class="shrink-0"><slot /></div>
  </div>
</template>
