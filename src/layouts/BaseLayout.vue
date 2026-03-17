<script setup lang="ts">
import { useSlots } from 'vue'

defineProps<{
  name?: string
}>()

const slots = useSlots()
</script>

<template>
  <div :class="`layout-${name || 'default'}`">
    <slot />
  </div>
</template>

<style scoped>
.layout-default {
  min-height: 100vh;
}

.layout-blank {
  min-height: 100vh;
}
</style>
