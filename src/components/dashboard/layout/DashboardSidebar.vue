<script setup lang="ts">
import type { NavItem, SectionId } from '@/types/dashboard'

defineProps<{
  items: NavItem[]
  activeSection: SectionId
}>()

const emit = defineEmits<{
  (e: 'change-section', section: SectionId): void
  (e: 'logout'): void
}>()
</script>

<template>
  <aside class="sidebar desktop-only">
    <div class="brand">
      <h1>SGOS</h1>
      <p>Painel de Gestão</p>
    </div>

    <nav class="side-nav">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="nav-item space-x-2"
        :class="{ active: activeSection === item.id }"
        @click="emit('change-section', item.id)"
      >
        <span class="icon"><component :is="item.icon" /></span>
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <button type="button" class="btn-logout side-logout" @click="emit('logout')">Sair</button>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 280px;
  background: linear-gradient(180deg, #4f46e5 0%, #3730a3 100%);
  color: #fff;
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.brand h1 {
  margin: 0;
}

.brand p {
  margin: 0.2rem 0 0;
  opacity: 0.8;
}

.side-nav {
  display: grid;
  gap: 0.45rem;
}

.nav-item {
  border: 0;
  background: transparent;
  color: #fff;
  text-align: left;
  border-radius: 10px;
  padding: 0.65rem 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  cursor: pointer;
}

.nav-item.active,
.nav-item:hover {
  background: rgba(255, 255, 255, 0.18);
}

.icon {
  width: 18px;
  text-align: center;
}

.btn-logout {
  border: 0;
  border-radius: 9px;
  padding: 0.7rem 1rem;
  background: #ef4444;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.side-logout {
  margin-top: auto;
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }
}
</style>
