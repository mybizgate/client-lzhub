<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '../../types/product'
import type { OrderItem } from '../../types/order'
import { packshotDataUri } from '../../utils/packshot'
import { useClient } from '../../composables/useClient'

/** Renders a real product photo when available, otherwise a generated illustrative packshot. */
const props = defineProps<{
  product: Pick<Product, 'name' | 'size' | 'art'> & { images?: string[]; image?: string }
  imgClass?: string
  eager?: boolean
}>()

const { config } = useClient()
const photo = computed(() => props.product.images?.[0] || (props.product as Partial<OrderItem>).image || '')
const src = computed(() =>
  photo.value ? photo.value : packshotDataUri(props.product.art, props.product.name, props.product.size, config.value.branding.packshotBrand ?? config.value.shortName),
)
const alt = computed(() => (photo.value ? props.product.name : `Ilustrasi produk ${props.product.name}`))
</script>

<template>
  <img
    :src="src"
    :alt="alt"
    :loading="eager ? 'eager' : 'lazy'"
    decoding="async"
    width="200"
    height="264"
    :class="['max-w-full object-contain', photo ? 'p-2' : '', imgClass]"
  />
</template>
