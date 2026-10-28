<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/common/AppIcon.vue'
import SearchBox from '../components/common/SearchBox.vue'
import ProductArt from '../components/common/ProductArt.vue'
import WhatsAppLink from '../components/common/WhatsAppLink.vue'
import CategoryStrip from '../components/catalogue/CategoryStrip.vue'
import CatalogueSection from '../components/catalogue/CatalogueSection.vue'
import { useCatalogueStore } from '../stores/catalogue'
import { useOrderStore } from '../stores/order'
import { useClient } from '../composables/useClient'
import { useHead } from '../composables/useHead'
import { applyProductQuery } from '../services/product-query'
import { enquiryMessage } from '../services/whatsapp-message'

const { config } = useClient()
const catalogue = useCatalogueStore()
const orders = useOrderStore()
const router = useRouter()
useHead({ title: '' })

const search = ref('')
const heroArt = computed(() => catalogue.featured.slice(0, 3))
const list = computed(() => applyProductQuery(catalogue.activeProducts, { search: search.value }))
const storeName = computed(() => orders.profile?.storeName || orders.draft.customer.storeName)
const heroLines = computed(() => config.value.copy.heroText.split('\n'))
function submitSearch() {
  router.push({ name: 'catalogue', query: search.value ? { q: search.value } : {} })
}
</script>

<template>
  <div class="mb-[17px] flex items-center justify-between gap-3 md:mb-5">
    <div>
      <p class="eyebrow !mb-[7px] !text-[8px] !tracking-[1.1px] md:!text-[9px] md:!tracking-[1.7px]">SELAMAT DATANG, {{ (storeName || config.copy.welcomeFallback).toUpperCase() }}</p>
      <h1 class="mb-[6px] max-w-[280px] text-[22px] font-extrabold leading-[1.24] tracking-[-.7px] md:max-w-none md:text-[27px] md:tracking-[-.8px]">{{ config.copy.welcomeHeadline }}</h1>
      <p class="max-w-[280px] text-[11px] leading-[1.65] text-muted md:max-w-none md:text-[12px]">{{ config.copy.welcomeText }}</p>
    </div>
    <RouterLink :to="{ name: 'orders' }" class="btn-secondary hidden whitespace-nowrap !px-[15px] !py-[10px] !text-[11px] md:inline-flex"><AppIcon name="repeat" />Pesan semula</RouterLink>
  </div>
  <form class="mb-4 md:mb-[21px]" role="search" @submit.prevent="submitSearch">
    <SearchBox id="search-input" v-model="search" placeholder="Cari barang, jenama atau kod produk..." />
  </form>

  <section class="hero-rings relative isolate flex min-h-[192px] items-center overflow-hidden rounded-[17px] bg-gradient-to-r from-hero-from to-hero-to px-[18px] py-[21px] text-white md:min-h-[270px] md:rounded-[22px] md:px-[34px] md:py-[31px]">
    <div class="relative z-[3] max-w-[70%] md:max-w-[56%]">
      <span class="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-[7px] py-[5px] text-[6.5px] font-extrabold tracking-[.55px] md:gap-[7px] md:px-[10px] md:py-[6px] md:text-[9px] md:tracking-[1.1px]"><AppIcon name="tag" class="h-[10px] w-[10px] md:h-[13px] md:w-[13px]" /> {{ config.copy.heroPill }}</span>
      <h2 class="mb-[17px] mt-[13px] text-[25px] font-extrabold leading-[1.18] tracking-[-.85px] md:mb-[10px] md:mt-4 md:text-[34px] md:leading-[1.2] md:tracking-[-1px]">{{ config.copy.heroHeadline }}<br /><em class="not-italic text-accent">{{ config.copy.heroHeadlineAccent }}</em></h2>
      <p class="mb-[19px] hidden text-[12px] leading-[1.75] text-[#e5f4e9] md:block"><template v-for="(l, i) in heroLines" :key="i">{{ l }}<br v-if="i < heroLines.length - 1" /></template></p>
      <RouterLink :to="{ name: 'deals' }" class="btn-white !min-h-[40px] !gap-2 !px-3 !py-[9px] !text-[10px] md:!min-h-[42px] md:!px-[18px] md:!text-[11px]">Lihat promosi <AppIcon name="arrow" class="!h-[14px] !w-[14px]" /></RouterLink>
    </div>
    <div class="pointer-events-none absolute -right-[7px] bottom-0 z-[2] h-[238px] w-[250px] origin-bottom-right scale-[.64] md:right-[26px] md:h-[275px] md:w-[380px] md:scale-[.87] xl:scale-100" aria-hidden="true">
      <div v-for="(p, i) in heroArt" :key="p.id" class="absolute bottom-[5px] h-[235px] w-[150px]" :class="[['left-0 -rotate-[12deg] md:left-[15px] md:bottom-3 md:-rotate-[11deg]', 'left-[42px] -bottom-[23px] z-[2] rotate-[3deg] md:left-[112px] md:-bottom-[13px]', 'left-[133px] bottom-0 rotate-[10deg] md:left-[218px] md:bottom-[7px]'][i]]">
        <ProductArt :product="p" eager img-class="h-[212px] w-[163px] max-w-none drop-shadow-[5px_15px_15px_#052b2845] md:h-[245px] md:w-[185px]" />
      </div>
      <div class="absolute right-[19px] top-[18px] z-[3] flex h-[58px] w-[58px] rotate-12 flex-col items-center justify-center rounded-full border border-dashed border-[#927e52] bg-[#efd8a1] text-center text-[6px] leading-[1.25] tracking-[1px] text-[#27563e] outline outline-[5px] outline-[#efd8a1] md:right-[5px] md:top-4 md:h-[66px] md:w-[66px] md:text-[7px]">UNTUK<br /><strong class="text-[10px] tracking-[.7px] md:text-[12px]">KEDAI</strong><br />ANDA</div>
    </div>
  </section>
  <div class="flex justify-between gap-[6px] border-b border-line px-px pb-[14px] pt-[13px] text-[8px] text-[#596e5e] md:gap-[10px] md:px-[14px] md:pb-[17px] md:pt-4 md:text-[11px]">
    <span class="flex items-center gap-1 md:gap-2"><AppIcon name="box" class="h-[13px] w-[13px] text-brand md:h-[17px] md:w-[17px]" /> Pesanan pukal</span>
    <span class="flex items-center gap-1 md:gap-2"><AppIcon name="tag" class="h-[13px] w-[13px] text-brand md:h-[17px] md:w-[17px]" /> Harga terkini</span>
    <span class="flex items-center gap-1 md:gap-2"><AppIcon name="whatsapp" class="h-[13px] w-[13px] text-brand md:h-[17px] md:w-[17px]" /> Terus ke pembekal</span>
  </div>

  <div class="mb-[9px] mt-[18px] flex items-center justify-between md:mb-[15px] md:mt-6">
    <h2 class="text-[16px] font-extrabold tracking-[-.5px] md:text-[17px]">Beli ikut kategori</h2>
    <RouterLink :to="{ name: 'catalogue' }" class="btn-link !min-h-[38px] !gap-1 !text-[9px] md:!gap-2 md:!text-[11px]">Lihat semua <AppIcon name="arrow" class="h-[13px] w-[13px] md:h-4 md:w-4" /></RouterLink>
  </div>
  <CategoryStrip />
  <CatalogueSection :products="list" :loading="catalogue.status === 'loading'" title="Pilihan untuk kedai anda" />

  <section class="mt-[26px] rounded-2xl border border-line bg-[#eef3e8] p-[17px] md:mt-[31px] md:flex md:items-center md:justify-between md:gap-[15px] md:px-[25px] md:py-[23px]">
    <div class="flex items-center gap-[10px] md:gap-4">
      <AppIcon name="whatsapp" class="h-[25px] w-[25px] shrink-0 text-brand md:h-[30px] md:w-[30px]" />
      <div>
        <h3 class="mb-1 text-[14px] font-extrabold leading-[1.45] md:text-[15px]">{{ config.copy.helpTitle }}</h3>
        <p class="text-[10px] leading-[1.8] text-muted md:text-[11px]">{{ config.copy.helpText }}</p>
      </div>
    </div>
    <WhatsAppLink :text="enquiryMessage(config)" label="Hubungi pembekal" variant="ghost" class="mt-4 w-full !text-[11px] md:mt-0 md:w-auto md:whitespace-nowrap" />
  </section>
</template>
