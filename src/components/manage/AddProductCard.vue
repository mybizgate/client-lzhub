<script setup lang="ts">
const emit = defineEmits<{ add: [] }>()
</script>

<template>
  <button
    type="button"
    class="product-card relative min-h-[330px] min-w-0 overflow-hidden rounded-[13px] border border-line bg-white text-brand shadow-[0_2px_4px_#34432702] transition-[box-shadow,border-color] hover:border-[#bfd1c1] hover:shadow-lift md:rounded-2xl"
    @click="emit('add')"
  >
    <span class="product-stage grid h-[158px] place-items-center p-4 md:h-[183px]">
      <span class="grid h-full w-full place-items-center rounded-xl border-2 border-dashed border-brand/35">
        <span><strong class="block text-[30px] leading-none">[+]</strong><span class="mt-2 block text-[12px] font-extrabold">Tambah produk</span></span>
      </span>
    </span>
    <span class="block min-h-[170px]" />
  </button>
</template>
