<script setup lang="ts">
import DefaultLayout from './layouts/DefaultLayout.vue'
</script>

<template>
  <DefaultLayout>
    <RouterView v-slot="{ Component }">
      <component :is="Component" />
    </RouterView>
  </DefaultLayout>
</template>
