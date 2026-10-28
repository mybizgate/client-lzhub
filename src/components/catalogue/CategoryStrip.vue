<script setup lang="ts">
import AppIcon from '../common/AppIcon.vue'
import ProductArt from '../common/ProductArt.vue'
import { useCatalogueStore } from '../../stores/catalogue'

defineProps<{ activeSlug?: string }>()
const catalogue = useCatalogueStore()
</script>

<template>
  <div class="scrollbar-none md:scrollbar-thin mt-2 flex gap-2 overflow-x-auto px-px pb-2 md:mt-4 md:gap-[9px]" aria-label="Kategori produk">
    <RouterLink
      :to="{ name: 'catalogue' }"
      class="flex min-h-[99px] min-w-[73px] flex-[0_0_73px] flex-col items-center justify-center gap-[2px] rounded-xl border bg-white px-[5px] pb-2 pt-1 text-center text-[9px] font-extrabold leading-[1.3] text-ink transition-colors md:min-h-[108px] md:flex-[1_0_77px] md:rounded-[14px] md:text-[10px] xl:flex-1"
      :class="!activeSlug ? 'border-brand bg-brand-soft' : 'border-line hover:border-brand hover:bg-brand-soft'"
    >
      <span class="grid h-[54px] w-12 place-items-center text-brand md:h-[58px]"><AppIcon name="grid" class="h-6 w-6 md:h-7 md:w-7" /></span>
      <span class="grid min-h-[27px] place-items-center">Semua<br />produk</span>
    </RouterLink>
    <RouterLink
      v-for="c in catalogue.categories"
      :key="c.id"
      :to="{ name: 'category', params: { slug: c.slug } }"
      class="flex min-h-[99px] min-w-[73px] flex-[0_0_73px] flex-col items-center justify-center gap-[2px] rounded-xl border bg-white px-[5px] pb-2 pt-1 text-center text-[9px] font-extrabold leading-[1.3] text-ink transition-colors md:min-h-[108px] md:flex-[1_0_77px] md:rounded-[14px] md:text-[10px] xl:flex-1"
      :class="activeSlug === c.slug ? 'border-brand bg-brand-soft' : 'border-line hover:border-brand hover:bg-brand-soft'"
    >
      <span class="grid h-[54px] w-[49px] place-items-center md:h-[58px] md:w-[53px]">
        <img v-if="c.image" :src="c.image" :alt="c.name" class="h-[53px] w-[42px] object-contain" />
        <ProductArt v-else-if="catalogue.sampleFor(c.id)" :product="catalogue.sampleFor(c.id)!" img-class="h-[53px] w-[42px] md:h-[58px] md:w-[45px]" />
      </span>
      <span class="grid min-h-[27px] place-items-center">{{ c.name }}</span>
    </RouterLink>
  </div>
</template>
