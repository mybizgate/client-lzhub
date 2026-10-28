<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import { useClient } from '../../composables/useClient'
import { whatsappUrl } from '../../utils/whatsapp'

const props = withDefaults(defineProps<{ text: string; label?: string; variant?: 'primary' | 'secondary' | 'ghost' | 'white' | 'plain' }>(), {
  label: 'WhatsApp pembekal',
  variant: 'primary',
})
const { config } = useClient()
const href = computed(() => whatsappUrl(config.value.contact.whatsapp ?? '', props.text))
const cls = computed(() => (props.variant === 'plain' ? '' : `btn-${props.variant}`))
</script>

<template>
  <a v-if="config.contact.whatsapp" :href="href" target="_blank" rel="noopener noreferrer" :class="cls">
    <AppIcon name="whatsapp" />
    <slot>{{ label }}</slot>
  </a>
</template>
