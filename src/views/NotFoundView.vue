<script setup lang="ts">
import EmptyState from '../components/common/EmptyState.vue'
import { useHead } from '../composables/useHead'
useHead({ title: 'Halaman tidak ditemui' })
</script>

<template>
  <EmptyState title="Halaman tidak ditemui" description="Pautan ini tidak wujud. Kembali ke katalog untuk meneruskan pesanan.">
    <RouterLink :to="{ name: 'home' }" class="btn-primary">Kembali ke utama</RouterLink>
  </EmptyState>
</template>
