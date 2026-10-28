<script setup lang="ts">
import { computed } from 'vue'

export type IconName =
  | 'home' | 'grid' | 'box' | 'bell' | 'bag' | 'truck' | 'search' | 'arrow' | 'check' | 'heart' | 'close'
  | 'chart' | 'edit' | 'tag' | 'repeat' | 'send' | 'store' | 'whatsapp' | 'trash' | 'shield' | 'info'
  | 'download' | 'copy' | 'phone' | 'mail' | 'map'

const props = defineProps<{ name: IconName }>()

const stroke = (d: string, w = 1.8, extra = '') => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`

const ICONS: Record<IconName, string> = {
  home: stroke('m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z'),
  grid: ['3 3', '14 3', '3 14', '14 14'].map((xy) => { const [x, y] = xy.split(' '); return `<rect x="${x}" y="${y}" width="7" height="7" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/>` }).join(''),
  box: stroke('m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10'),
  bell: stroke('M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9M10 21h4'),
  bag: stroke('M4 8h16l-1 13H5L4 8zM9 9V6a3 3 0 0 1 6 0v3'),
  truck: stroke('M2 5h12v12H2zM14 9h4l4 5v3h-8zM7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4M18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4'),
  search: '<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/>' + stroke('m16 16 5 5'),
  arrow: stroke('M5 12h14m-6-6 6 6-6 6', 2),
  check: stroke('m4 12 5 5L20 6', 2),
  heart: stroke('M20.8 8.5c0 4-8.8 10-8.8 10s-8.8-6-8.8-10a4.6 4.6 0 0 1 8.8-1.7 4.6 4.6 0 0 1 8.8 1.7z'),
  close: stroke('m5 5 14 14M19 5 5 19', 2),
  chart: stroke('M4 20V9m6 11V4m6 16v-8m4 8V6', 3),
  edit: stroke('m4 16 12-12 4 4-12 12-5 1zM14 6l4 4'),
  tag: stroke('M3 4h9l9 9-8 8-10-10zM7 8h.01'),
  repeat: stroke('M20 11a8 8 0 0 0-14-5L3 9m0-5v5h5M4 13a8 8 0 0 0 14 5l3-3m0 5v-5h-5'),
  send: stroke('m3 11 18-8-8 18-3-7zM10 14l11-11'),
  store: stroke('M3 10V5h18v5l-2 3h-2l-3-3-2 3h-2l-3-3-2 3H3zM5 13v8h14v-8M10 21v-6h4v6'),
  whatsapp: stroke('M20.5 11.7a8.5 8.5 0 0 1-12.7 7.4L3 20.5l1.4-4.6a8.5 8.5 0 1 1 16.1-4.2Z', 1.7) + stroke('M8.2 7.1c-.4-.3-1.2.8-1.1 1.8.3 2.8 3.8 6.4 6.8 6.4 1 0 1.9-1 1.6-1.4l-2-1.3-1 1c-1.3-.4-3.1-2.1-3.5-3.3l.9-1z', 1.7),
  trash: stroke('M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7', 1.7),
  shield: stroke('m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6', 1.7),
  info: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/>' + stroke('M12 11v6M12 7v.5', 1.7),
  download: stroke('M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5', 1.7),
  copy: '<rect x="8" y="8" width="13" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/>' + stroke('M16 8V3H3v13h5', 1.7),
  phone: stroke('M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2', 1.7),
  mail: '<rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/>' + stroke('m3 7 9 6 9-6', 1.7),
  map: stroke('M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z', 1.7) + '<circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/>',
}

const markup = computed(() => ICONS[props.name] ?? '')
</script>

<template>
  <svg viewBox="0 0 24 24" aria-hidden="true" class="h-5 w-5" v-html="markup" />
</template>
