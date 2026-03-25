<script setup lang="ts">
import type { NavItem, SectionId } from '@/types/dashboard'

defineProps<{
  items: NavItem[]
  activeSection: SectionId
}>()

const emit = defineEmits<{
  (e: 'change-section', section: SectionId): void
}>()
</script>

<template>
  <footer class="mobile-footer mobile-only">
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      class="footer-item"
      :class="{ active: activeSection === item.id }"
      @click="emit('change-section', item.id)"
    >
      <span><component :is="item.icon" /></span>
      <small>{{ item.label }}</small>
    </button>
  </footer>
</template>

<style scoped>
.mobile-only {
  display: none;
}

.mobile-footer {
  display: none;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  height: 68px;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.footer-item {
  border: 0;
  background: transparent;
  display: grid;
  place-items: center;
  color: #6b7280;
}

.footer-item.active {
  color: #4338ca;
}

.footer-item small {
  font-size: 0.68rem;
}

@media (max-width: 768px) {
  .mobile-footer {
    display: grid;
  }
}
</style>
