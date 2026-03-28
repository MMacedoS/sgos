<script setup lang="ts">
import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import DropdownMenu from '@/components/ui/dropdown-menu/DropdownMenu.vue';
import DropdownMenuContent from '@/components/ui/dropdown-menu/DropdownMenuContent.vue';
import DropdownMenuItem from '@/components/ui/dropdown-menu/DropdownMenuItem.vue';
import DropdownMenuLabel from '@/components/ui/dropdown-menu/DropdownMenuLabel.vue';
import DropdownMenuSeparator from '@/components/ui/dropdown-menu/DropdownMenuSeparator.vue';
import type { NavItem, SectionId } from '@/types/dashboard'

defineProps<{
  items: NavItem[]
  activeSection: SectionId
}>()

const emit = defineEmits<{
  (e: 'change-section', section?: SectionId): void
}>()
</script>

<template>
  <footer class="mobile-footer mobile-only">
    <dropdown-menu v-for="item in items" :key="item.id"  :class="{ active: activeSection === item.id }" 
      class="footer-item">
      <dropdown-menu-trigger class="w-full h-full content-center text-center grid place-items-center">
        <span><component :is="item.icon" /></span>
        <small class="">{{ item.label }}</small>
      </dropdown-menu-trigger>
      <dropdown-menu-content class="bg-white">
        <dropdown-menu-label>{{ item.label }}</dropdown-menu-label>
        <dropdown-menu-separator />
        <dropdown-menu-item v-for="child in item.children" :key="child.id" @click="emit('change-section', child.id)">
          <span><component :is="child.icon" /></span>
          {{ child.label }}
        </dropdown-menu-item>
        <dropdown-menu-item v-if="!item.children || item.children.length === 0"
        @click="emit('change-section', item.id)">
        {{ item.label }}
        </dropdown-menu-item>
      </dropdown-menu-content>
  </dropdown-menu>
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
