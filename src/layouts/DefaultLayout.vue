<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '../components/common/AppIcon.vue'
import type { IconName } from '../components/common/AppIcon.vue'
import ToastHost from '../components/common/ToastHost.vue'
import LocationSection from '../components/common/LocationSection.vue'
import { useClient } from '../composables/useClient'
import { useCartStore } from '../stores/cart'
import { useClientStore } from '../stores/client'
import { useOrderStore } from '../stores/order'
import { whatsappUrl } from '../utils/whatsapp'

const { config, money } = useClient()
const client = useClientStore()
const cart = useCartStore()
const orders = useOrderStore()
const route = useRoute()

type NavItem = { name: string; label: string; icon: IconName }
const sidebarNav: NavItem[] = [
  { name: 'home', label: 'Utama', icon: 'home' },
  { name: 'catalogue', label: 'Katalog borong', icon: 'grid' },
  { name: 'deals', label: 'Promosi', icon: 'tag' },
  { name: 'favorites', label: 'Kegemaran', icon: 'heart' },
  { name: 'orders', label: 'Pesanan saya', icon: 'bag' },
  { name: 'account', label: 'Akaun kedai', icon: 'store' },
]
const mobileNav: NavItem[] = [
  { name: 'home', label: 'Utama', icon: 'home' },
  { name: 'catalogue', label: 'Katalog', icon: 'grid' },
  { name: 'cart', label: 'Troli', icon: 'bag' },
  { name: 'orders', label: 'Pesanan', icon: 'box' },
  { name: 'account', label: 'Akaun', icon: 'store' },
]
const catalogueRoutes = ['catalogue', 'category']
const isActive = (name: string) => route.name === name || (name === 'catalogue' && catalogueRoutes.includes(String(route.name))) || (name === 'orders' && route.name === 'order')
const breadcrumb = computed(() => sidebarNav.find((n) => isActive(n.name))?.label ?? (route.name === 'cart' ? 'Troli pesanan' : route.name === 'checkout' ? 'Semak pesanan' : route.name === 'product' ? 'Produk' : ''))
const storeName = computed(() => orders.profile?.storeName || orders.draft.customer.storeName || '')
const initials = computed(() => (storeName.value || 'Kedai Anda').split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase())
const showFloatingCart = computed(() => cart.count > 0 && !['cart', 'checkout', 'orders', 'order', 'account'].includes(String(route.name)))
const helpHref = computed(() => whatsappUrl(config.value.contact.whatsapp ?? '', `${config.value.copy.whatsappGreeting} Saya perlukan bantuan pesanan borong.`))
</script>

<template>
  <a href="#main-content" class="fixed left-4 top-[-80px] z-[100] rounded-[9px] bg-brand p-[14px] text-white focus:top-3">Terus ke kandungan</a>
  <div class="flex min-h-screen">
    <aside class="fixed inset-y-0 left-0 z-[15] hidden w-[208px] flex-col border-r border-line bg-white px-[17px] pb-[22px] pt-[29px] lg:flex xl:w-[238px]" aria-label="Menu utama">
      <RouterLink :to="{ name: 'home' }" class="block px-[7px]" :aria-label="`${config.businessName} halaman utama`">
        <img :src="config.logo" :alt="`${config.businessName} - ${config.tagline}`" width="720" height="240" decoding="async" class="block w-full max-w-[220px]" />
      </RouterLink>
      <div class="mx-[11px] mb-[11px] mt-6 text-[9px] font-extrabold uppercase tracking-[1.7px] text-[#7d8b7f]">Menu utama</div>
      <nav class="flex flex-col gap-[5px]">
        <RouterLink
          v-for="n in sidebarNav"
          :key="n.name"
          :to="{ name: n.name }"
          class="flex min-h-[46px] w-full items-center gap-[10px] rounded-xl px-[10px] py-3 text-[11px] font-bold transition-colors xl:gap-3 xl:px-[13px] xl:text-[12px]"
          :class="isActive(n.name) ? 'bg-brand-soft text-brand' : 'text-[#74817b] hover:bg-brand-soft hover:text-brand'"
          :aria-current="isActive(n.name) ? 'page' : undefined"
        >
          <AppIcon :name="n.icon" class="h-[19px] w-[19px]" />{{ n.label }}
          <span v-if="n.name === 'favorites' && cart.count === 0 && false" />
        </RouterLink>
      </nav>
      <div class="mt-auto pt-7">
        <div class="rounded-[15px] bg-brand-soft px-[14px] py-[17px]">
          <strong class="block text-[12px]">{{ config.copy.sidebarHelpTitle }}</strong>
          <p class="mt-[9px] text-[11px] leading-[1.6] text-[#6e8075]">{{ config.copy.sidebarHelpText }}</p>
          <a v-if="config.contact.whatsapp" :href="helpHref" target="_blank" rel="noopener noreferrer" class="mt-3 flex items-center gap-[7px] text-[11px] font-extrabold text-brand">
            <AppIcon name="whatsapp" class="h-[17px] w-[17px]" />{{ config.contact.whatsappDisplay ?? config.contact.whatsapp }}
          </a>
        </div>
      </div>
    </aside>

    <div class="min-w-0 flex-1 lg:ml-[208px] xl:ml-[238px]">
      <header class="sticky top-0 z-10 flex min-h-[65px] items-center justify-between gap-3 border-b border-line bg-white/95 px-4 py-[10px] backdrop-blur-xl md:min-h-[70px] md:px-6 md:py-[13px] lg:min-h-[79px] lg:px-[34px] lg:py-4">
        <RouterLink :to="{ name: 'home' }" class="flex items-center lg:hidden" :aria-label="`${config.businessName} utama`">
          <img :src="config.logo" :alt="config.businessName" width="720" height="240" decoding="async" class="h-[34px] w-auto" />
        </RouterLink>
        <div class="hidden items-center gap-[9px] text-[12px] text-muted lg:flex">
          <span>{{ config.shortName }}</span><span>/</span><strong class="text-ink">{{ breadcrumb }}</strong>
        </div>
        <div class="flex items-center gap-[9px] lg:gap-[11px]">
          <RouterLink :to="{ name: 'cart' }" class="icon-btn h-10 w-10 md:h-[41px] md:w-[41px] lg:h-[43px] lg:w-[43px]" aria-label="Buka troli">
            <AppIcon name="bag" />
            <span v-if="cart.count" class="absolute -right-[3px] -top-[3px] grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-white bg-[#da713d] text-[9px] font-extrabold text-white">{{ cart.count }}</span>
          </RouterLink>
          <RouterLink :to="{ name: 'account' }" class="hidden min-h-[44px] items-center gap-[10px] border-l border-line pl-3 lg:flex" aria-label="Akaun kedai">
            <span class="grid h-10 w-10 place-items-center rounded-xl bg-[#eef3e7] text-[11px] font-black text-brand">{{ initials }}</span>
            <span><strong class="block text-[12px]">{{ storeName || 'Kedai anda' }}</strong><small class="text-[10px] text-muted">Pelanggan borong</small></span>
          </RouterLink>
        </div>
      </header>
      <div v-if="!client.storageAvailable" role="alert" class="border-b border-[#efd5ac] bg-[#fff0dc] px-4 py-[11px] text-[11px] leading-[1.6] text-[#926127] md:px-6 md:text-[12px]">
        Storan browser tidak tersedia. Troli dan draf pesanan hanya kekal sehingga halaman ditutup.
      </div>
      <main id="main-content" tabindex="-1" class="mx-auto max-w-[1470px] px-[15px] pb-[106px] pt-[22px] md:px-6 md:pb-[115px] md:pt-6 lg:px-[34px] lg:pb-[95px] lg:pt-7" :class="showFloatingCart ? 'pb-[165px] lg:pb-[95px]' : ''">
        <slot />
      </main>
      <LocationSection />
      <footer class="px-5 pb-[88px] text-center text-[9px] leading-[1.7] text-[#82907d] md:text-[10px] lg:px-[25px] lg:pb-[23px]">
        {{ config.businessName }} &bull; {{ config.tagline }}<br />
        Powered by <a href="https://www.mybizgate.com/" target="_blank" rel="noopener noreferrer" class="font-bold underline">MyBizGate</a>
      </footer>
    </div>
  </div>

  <nav class="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-line bg-white/95 px-2 pb-[calc(7px+env(safe-area-inset-bottom))] pt-[9px] backdrop-blur-lg lg:hidden" aria-label="Navigasi mudah alih">
    <RouterLink
      v-for="n in mobileNav"
      :key="n.name"
      :to="{ name: n.name }"
      class="relative flex min-h-[47px] min-w-[54px] flex-col items-center justify-center gap-1 text-[9px] font-bold md:text-[10px]"
      :class="isActive(n.name) ? 'text-brand before:absolute before:-top-[9px] before:h-[2px] before:w-[26px] before:rounded before:bg-brand' : 'text-[#86947d]'"
      :aria-current="isActive(n.name) ? 'page' : undefined"
    >
      <span class="relative grid place-items-center">
        <AppIcon :name="n.icon" class="h-[21px] w-[21px]" />
        <b v-if="n.name === 'cart' && cart.count" class="absolute -right-[11px] -top-[7px] h-[17px] min-w-[17px] rounded-full border-2 border-white bg-brand px-[3px] text-center text-[8px] leading-[13px] text-white">{{ cart.count }}</b>
      </span>
      {{ n.label }}
    </RouterLink>
  </nav>

  <RouterLink
    v-if="showFloatingCart"
    :to="{ name: 'cart' }"
    class="fixed inset-x-[14px] bottom-[calc(77px+env(safe-area-inset-bottom))] z-[14] flex min-h-[50px] items-center justify-between rounded-[13px] bg-brand px-[17px] py-[14px] text-[11px] font-extrabold text-white shadow-[0_9px_24px_#1c4b3429] md:inset-x-5 md:text-[12px] lg:inset-x-auto lg:bottom-[23px] lg:right-[25px] lg:gap-9 lg:px-5 lg:py-4"
    aria-label="Lihat troli"
  >
    <span class="flex items-center gap-[10px]"><AppIcon name="bag" class="h-[17px] w-[17px]" /> {{ cart.count }} unit borong</span>
    <strong class="flex items-center gap-[10px]">{{ money(cart.subtotal) }} <AppIcon name="arrow" class="h-[17px] w-[17px]" /></strong>
  </RouterLink>
  <ToastHost />
</template>
