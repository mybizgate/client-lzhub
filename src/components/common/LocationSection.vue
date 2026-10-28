<script setup lang="ts">
import { computed } from 'vue'
import { useClient } from '../../composables/useClient'

const { config } = useClient()
const contact = computed(() => config.value.contact)
const coords = computed(() => (contact.value.map ? `${contact.value.map.lat},${contact.value.map.lng}` : ''))
const encoded = computed(() => encodeURIComponent(coords.value))
const tel = (p: string) => `tel:${p.replace(/[^+\d]/g, '')}`
</script>

<template>
  <section v-if="contact.map || contact.addressLines?.length" id="location" aria-labelledby="location-title" class="mx-[14px] mb-[22px] mt-2 max-w-[1468px] md:mx-[25px] md:mb-[30px] md:mt-3 xl:mx-9 xl:mb-[34px]">
    <div class="grid items-center gap-7 rounded-[20px] border border-line bg-white p-[22px] shadow-card md:p-[30px] lg:grid-cols-[minmax(260px,.72fr)_minmax(0,1.28fr)]">
      <div>
        <p class="eyebrow !mb-2 !text-[10px] !font-black !tracking-[1.5px]">FIND US / CARI KAMI</p>
        <h2 id="location-title" class="mb-[10px] text-[23px] font-extrabold tracking-[-.8px] md:text-[28px]">{{ config.copy.locationHeadline }}</h2>
        <p class="leading-[1.7] text-muted">{{ config.copy.locationText }}</p>
        <address class="my-[18px] not-italic font-extrabold leading-[1.7] text-ink">
          <strong>{{ config.businessName }}</strong>
          <template v-for="line in contact.addressLines" :key="line"><br />{{ line }}</template>
          <template v-if="contact.phone">
            <br />Tel : <a class="text-brand underline underline-offset-2" :href="tel(contact.phone)">{{ contact.phone }}</a>
            <template v-if="contact.phoneSecondary"> / <a class="text-brand underline underline-offset-2" :href="tel(contact.phoneSecondary)">{{ contact.phoneSecondary }}</a></template>
          </template>
          <template v-if="contact.email"><br />Mail: <a class="text-brand underline underline-offset-2" :href="`mailto:${contact.email}`">{{ contact.email }}</a></template>
          <template v-if="contact.openingHours"><br />Waktu: {{ contact.openingHours }}</template>
        </address>
        <a v-if="coords" class="btn-secondary" :href="`https://www.google.com/maps/search/?api=1&query=${encoded}`" target="_blank" rel="noopener">Buka di Google Maps</a>
      </div>
      <div v-if="coords" class="relative min-h-[290px] overflow-hidden rounded-2xl border border-line bg-brand-soft md:min-h-[320px] lg:min-h-[370px]">
        <iframe
          :title="`Peta ke ${config.businessName} di ${config.copy.locationHeadline}`"
          :src="`https://www.google.com/maps?q=${coords}&z=${contact.map?.zoom ?? 16}&output=embed`"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          allowfullscreen
          class="block min-h-[290px] w-full border-0 md:min-h-[320px] lg:min-h-[370px]"
        />
        <a class="btn-primary absolute bottom-[10px] right-[10px] md:bottom-[14px] md:right-[14px]" :href="`https://www.google.com/maps/dir/?api=1&destination=${encoded}`" target="_blank" rel="noopener">Dapatkan arah</a>
      </div>
    </div>
  </section>
</template>
